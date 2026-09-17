// ============================================================
// Process-level error handlers (P9 prod-deploy ticket)
// ============================================================
// Без слушателя unhandledRejection Node 22 (default
// --unhandled-rejections=throw) роняет процесс без явного лога
// причины. Под `restart: always` в compose это выглядит как
// невидимые рестарты. Явный обработчик печатает причину в
// `docker logs` и выходит с кодом 1, поэтому RestartCount
// остаётся честным счётчиком падений, а причина — видимой.

export const handleUnhandledRejection = (reason: unknown): never => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  return process.exit(1);
};

export function registerProcessErrorHandlers(): void {
  process.on('unhandledRejection', handleUnhandledRejection);
}
