import { Router } from 'express';
import { modelController } from './model.controller.js';
import { requireAuth } from '../../../middleware/auth.middleware.js';

const router = Router();

router.get('/', (req, res, next) => modelController.listModels(req, res, next));
router.post('/refresh', requireAuth, (req, res, next) => modelController.refreshModels(req, res, next));
router.get('/health', (req, res, next) => modelController.healthCheck(req, res, next));
router.get('/metrics', requireAuth, (req, res, next) => modelController.getMetrics(req, res, next));
router.post('/assignments', requireAuth, (req, res, next) => modelController.updateRoleAssignment(req, res, next));

export default router;
