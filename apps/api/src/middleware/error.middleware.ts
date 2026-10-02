import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (err.status >= 400 && err.status < 600 ? err.status : 500);
  const correlationId = (req.headers['x-correlation-id'] as string) || `req_${Date.now()}`;

  // Log internal error with correlation ID
  console.error(`[ERROR] [${correlationId}] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR'),
      message: statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please contact support.'
        : err.message || 'Unknown error occurred.',
      details: err.details || undefined,
    },
    meta: {
      correlationId,
      timestamp: new Date().toISOString(),
    },
  });
}
