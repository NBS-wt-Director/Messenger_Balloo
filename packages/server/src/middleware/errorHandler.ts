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
  const message = err.message || 'Внутренняя ошибка сервера';

  // Логирование ошибки (в продакшене — в систему мониторинга)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${statusCode} - ${message}`);
    console.error(err.stack);
  } else {
    console.error(`[ERROR] ${statusCode} - ${message}`);
  }

  // BigInt JSON serializer
  const jsonBody = JSON.parse(JSON.stringify({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  }), (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
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
