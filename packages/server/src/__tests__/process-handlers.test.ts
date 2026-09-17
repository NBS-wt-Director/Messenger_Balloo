/**
 * P9 (prod-deploy ticket): на сервере не было обработчика
 * unhandledRejection. Node 22 роняет процесс по умолчанию без
 * различимого лога причины, а `restart: always` в compose делает
 * такие падения невидимыми. Обработчик обязан: (1) напечатать
 * причину, (2) выйти с кодом 1 — тогда RestartCount остаётся
 * честным счётчиком, а причина видна в `docker logs`.
 */
import { handleUnhandledRejection, registerProcessErrorHandlers } from '../process-handlers';

describe('unhandledRejection handler (P9)', () => {
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    // Снимаем и слушателя, и моки: слушатель с process.exit(1) не
    // должен пережить свой тест и влиять на соседние файлы (jest
    // переиспользует worker-процессы).
    process.off('unhandledRejection', handleUnhandledRejection);
    jest.restoreAllMocks();
  });

  it('регистрирует ровно один слушатель на событии', () => {
    const before = process.listenerCount('unhandledRejection');
    registerProcessErrorHandlers();
    expect(process.listenerCount('unhandledRejection')).toBe(before + 1);
  });

  it('логирует причину и выходит с кодом 1', () => {
    const reason = new Error('db connection dropped');
    handleUnhandledRejection(reason);
    expect(errorSpy).toHaveBeenCalledWith('[FATAL] Unhandled Rejection:', reason);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('корректно работает с не-Error причиной (throw 42, reject строкой)', () => {
    handleUnhandledRejection('string reason');
    expect(errorSpy).toHaveBeenCalledWith('[FATAL] Unhandled Rejection:', 'string reason');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
