import { Router } from 'express';
import multer from 'multer';
import { documentController } from './document.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { DocumentReconstructRequestSchema } from '@humanizer/shared';
import { ENV } from '../../config/env.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    cb(null, true);
  },
});

const router = Router();

router.post('/', requireAuth, upload.single('file'), (req, res, next) =>
  documentController.upload(req as any, res, next)
);

router.get('/', requireAuth, (req, res, next) =>
  documentController.list(req as any, res, next)
);

router.get('/:documentId', requireAuth, (req, res, next) =>
  documentController.getById(req as any, res, next)
);

router.post(
  '/:documentId/reconstruct',
  requireAuth,
  validateBody(DocumentReconstructRequestSchema),
  (req, res, next) => documentController.reconstruct(req as any, res, next)
);

router.get('/:documentId/download', requireAuth, (req, res, next) =>
  documentController.download(req as any, res, next)
);

router.delete('/:documentId', requireAuth, (req, res, next) =>
  documentController.delete(req as any, res, next)
);

export default router;
