import { Router } from 'express';
import { pageController } from './page.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  PageHumanizeRequestSchema,
  PageEditRequestSchema,
  PageApproveRequestSchema,
} from '@humanizer/shared';

const router = Router();

// Page direct endpoints
router.get('/pages/:pageId', requireAuth, (req, res, next) =>
  pageController.getById(req as any, res, next)
);

router.post(
  '/pages/:pageId/humanize',
  requireAuth,
  validateBody(PageHumanizeRequestSchema),
  (req, res, next) => pageController.humanize(req as any, res, next)
);

router.post(
  '/pages/:pageId/retry',
  requireAuth,
  (req, res, next) => pageController.humanize(req as any, res, next)
);

router.get('/pages/:pageId/candidates', requireAuth, (req, res, next) =>
  pageController.getCandidates(req as any, res, next)
);

router.get('/pages/:pageId/review', requireAuth, (req, res, next) =>
  pageController.getReview(req as any, res, next)
);

router.post(
  '/pages/:pageId/approve',
  requireAuth,
  validateBody(PageApproveRequestSchema),
  (req, res, next) => pageController.approve(req as any, res, next)
);

router.post(
  '/pages/:pageId/edit',
  requireAuth,
  validateBody(PageEditRequestSchema),
  (req, res, next) => pageController.edit(req as any, res, next)
);

router.get('/pages/:pageId/versions', requireAuth, (req, res, next) =>
  pageController.getVersions(req as any, res, next)
);

// Document-nested page endpoints
router.get('/documents/:documentId/pages', requireAuth, (req, res, next) =>
  pageController.listPages(req as any, res, next)
);

export default router;
