import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { openApiSpec } from './docs/swagger.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import pageRoutes from './modules/pages/page.routes.js';
import jobRoutes from './modules/jobs/job.routes.js';
import expertRoutes from './modules/experts/expert.routes.js';
import modelRoutes from './modules/ai/nvidia/model.routes.js';

export function createApp(): Express {
  const app = express();

  // Security & Logging
  app.use(
    helmet({
      contentSecurityPolicy: false, // For Swagger UI
    })
  );

  app.use(
    cors({
      origin: [ENV.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );

  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate Limiter
  const limiter = rateLimit({
    windowMs: ENV.RATE_LIMIT_WINDOW_MS,
    max: ENV.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    },
  });
  app.use('/api/', limiter);

  // Health Endpoints
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: ENV.NODE_ENV,
        provider: 'NVIDIA',
        nvidiaBaseUrl: ENV.NVIDIA_API_BASE_URL,
      },
    });
  };
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Swagger Documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api', pageRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/experts', expertRoutes);
  app.use('/api/models', modelRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
      },
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
