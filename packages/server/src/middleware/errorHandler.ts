import { Request, Response, NextFunction } from 'express';

// Типизированная ошибка
interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Глобальный обработчик ошибок
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  // Неоперационная ошибка с 5xx → клиенту только общий текст, детали остаются
  // в логе (тик. «исправить-errorHandler-раскрывает-message-в-проде»): сообщения
  // упавшего Prisma/драйвера содержат имена таблиц, SQL, пути и версии библиотек.
  const isOperational = err.isOperational !== false; // по умолчанию считаем операционной
  const message = isOperational || statusCode < 500
    ? (err.message || 'Внутренняя ошибка сервера')
    : 'Внутренняя ошибка сервера';

  // Логирование ошибки (в продакшене — в систему мониторинга).
  // В лог всегда идёт исходное сообщение: клиенту оно может не отдаваться
  // (не-операционные 5xx), но диагностировать проблему надо по полным деталям.
  const logMessage = err.message || 'Внутренняя ошибка сервера';
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${statusCode} - ${logMessage}`);
    console.error(err.stack);
  } else {
    console.error(`[ERROR] ${statusCode} - ${logMessage}`);
  }

  // BigInt JSON serializer.
  // Исправлено 30.09.2026 (тикеты 1790479490-08 / В-93): replacer был привязан к
  // JSON.parse вместо JSON.stringify, поэтому любое bigint-значение (createdAt/
  // BigInt-ид из Prisma) роняло сам обработчик ошибок с «TypeError: Do not know how
  // to serialize a BigInt» вместо ответа клиенту.
  const jsonBody = JSON.parse(
    JSON.stringify(
      {
        error: err.name || 'Error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
    ),
  );

  // Ответ клиенту
  res.status(statusCode).json(jsonBody);
};

// Middleware для обработки 404
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Маршрут ${req.method} ${req.path} не найден`,
  });
};

// Обёртка для асинхронных контроллеров
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
