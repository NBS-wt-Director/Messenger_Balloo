#!/usr/bin/env node
/**
 * Rotate runtime secrets in docker/prod/.env.production (in place).
 *
 * Secret VALUES are generated here and written straight to the file, so they
 * never appear in shell command lines and never land in ~/.bash_history.
 * Only key names and lengths are printed.
 *
 * Usage (on the server, from ~/balloo/docker/prod):
 *   node rotate-secrets.mjs
 *
 * After this script:
 *   1. apply the new postgres password:  sudo bash apply-rotated-secrets.sh
 *   2. recreate the stack:               docker compose -f docker-compose.local.yml \
 *                                          --env-file .env.production up -d --force-recreate
 */
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const ENV_FILE = '.env.production';

if (!existsSync(ENV_FILE)) {
  console.error(`ERROR: ${process.cwd()}/${ENV_FILE} not found. Run from ~/balloo/docker/prod`);
  process.exit(1);
}

let text = readFileSync(ENV_FILE, 'utf8');

function secret(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

// Keys to rotate. DATABASE_URL / REDIS_URL are rebuilt from the new values,
// otherwise the compose file would interpolate the old password into them.
const replacements = [
  ['POSTGRES_PASSWORD', secret(32)],
  ['REDIS_PASSWORD', secret(32)],
  ['JWT_ACCESS_SECRET', secret(32)],
  ['JWT_REFRESH_SECRET', secret(32)],
  ['MINIO_ROOT_PASSWORD', secret(32)],
];

for (const [key, value] of replacements) {
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (!re.test(text)) {
    console.error(`ERROR: key ${key} not found in ${ENV_FILE}. Refusing to continue.`);
    process.exit(1);
  }
  // keep the file's existing style: values in double quotes
  text = text.replace(re, `${key}="${value}"`);
  console.log(`rotated ${key} (${value.length} chars)`);
}

const pg = replacements.find(([k]) => k === 'POSTGRES_PASSWORD')[1];
const rd = replacements.find(([k]) => k === 'REDIS_PASSWORD')[1];

// Existing values in this file are double-quoted; docker compose strips the
// quotes, so we must strip them here too before rebuilding the URLs.
function readKey(key, fallback) {
  const raw = (text.match(new RegExp(`^${key}=(.*)$`, 'm')) || [, ''])[1].trim();
  const unquoted = raw.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
  return unquoted || fallback;
}

const pgUser = readKey('POSTGRES_USER', 'balloo');
const pgDb = readKey('POSTGRES_DB', 'balloo');

text = text.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="postgresql://${pgUser}:${pg}@postgres:5432/${pgDb}"`);
text = text.replace(/^REDIS_URL=.*$/m, `REDIS_URL="redis://:${rd}@redis:6379"`);
console.log('rewritten DATABASE_URL, REDIS_URL');

writeFileSync(ENV_FILE, text, 'utf8');
chmodSync(ENV_FILE, 0o600);
console.log(`saved ${ENV_FILE}, chmod 600`);
console.log('');
console.log('Next: sudo bash apply-rotated-secrets.sh');
