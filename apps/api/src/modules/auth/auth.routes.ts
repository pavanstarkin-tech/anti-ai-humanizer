import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { RegisterUserSchema, LoginUserSchema } from '@humanizer/shared';

const router = Router();

router.post('/register', validateBody(RegisterUserSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', validateBody(LoginUserSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.get('/me', requireAuth, (req, res, next) =>
  authController.me(req as any, res, next)
);

export default router;
