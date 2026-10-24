// Test setup — load environment variables for tests
import dotenv from 'dotenv';
import path from 'path';

// packages/server/.env — must be loaded HERE, before anything imports
// @prisma/client: the generated client runs its own dotenv at import time and
// walks up to the monorepo ROOT .env, whose JWT_REFRESH_EXPIRES_IN="30d"
// breaks env.ts's /^\d+$/ schema (dotenv never overwrites, so whoever loads
// first wins). Previous path ('../.env' = src/.env) never existed — the real
// load happened later in src/config/env.ts, only by import-order luck.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Ensure NODE_ENV is test
process.env.NODE_ENV = 'test';

// Cap the Prisma pool for tests: every server module creates its own
// `new PrismaClient()` (36 sites in src/) and Jest resets the module registry
// per test file, so a full `--runInBand` run leaks hundreds of pools and
// exhausts Postgres `max_connections` (100):
// "remaining connection slots are reserved for SUPERUSER" mid-run, suites
// green in isolation and red in the full run. Default pool is (cores*2+1)=33
// per client on this 16-core host; CI (2–4 cores) fits only by luck.
// Tests are serial, so a tiny pool is sufficient and deterministic everywhere.
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !/[?&]connection_limit=/.test(dbUrl)) {
  process.env.DATABASE_URL =
    dbUrl + (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=2';
}

// Additionally, make every `new PrismaClient()` in the test process return
// ONE shared instance. `globalThis` survives Jest's per-file module-registry
// resets, so leaked clients from earlier suites stop accumulating connections
// (a full 45-suite run peaked at 97/100 Postgres slots without this).
// setupFiles execute before the test file and its imports, in the same module
// registry, so patching the export here covers every module loaded afterwards.
// `$disconnect()` in an afterAll closes the pool; Prisma reconnects lazily on
// the next query — the same semantics tests already rely on.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prismaModule = require('@prisma/client');
const g = globalThis as { __ballooSharedTestPrisma?: unknown };

if (!prismaModule.__ballooSharedPatch) {
  const Actual = prismaModule.PrismaClient;
  // A function returning an object overrides `new` semantics — all
  // constructions collapse into the one shared client (one pool).
  function SharedPrismaClient(this: unknown, ...args: unknown[]) {
    if (!g.__ballooSharedTestPrisma) {
      g.__ballooSharedTestPrisma = new (Actual as new (...a: unknown[]) => unknown)(...args);
    }
    return g.__ballooSharedTestPrisma;
  }
  SharedPrismaClient.prototype = Actual.prototype;
  Object.setPrototypeOf(SharedPrismaClient, Actual);
  prismaModule.PrismaClient = SharedPrismaClient;
  prismaModule.__ballooSharedPatch = true;
}
