import { Response, NextFunction } from 'express';
import { pageService } from './page.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class PageController {
  async listPages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pageService.getPagesForDocument(req.params.documentId, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = await pageService.getPageById(req.params.pageId, req.user!.id);
      res.status(200).json({ success: true, data: page });
    } catch (err) {
      next(err);
    }
  }

  async humanize(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pageService.startHumanization(
        req.params.pageId,
        req.user!.id,
        req.body
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getCandidates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidates = await pageService.getCandidates(req.params.pageId, req.user!.id);
      res.status(200).json({ success: true, data: candidates });
    } catch (err) {
      next(err);
    }
  }

  async getReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewData = await pageService.getReviewData(req.params.pageId, req.user!.id);
      res.status(200).json({ success: true, data: reviewData });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pageService.approvePage(
        req.params.pageId,
        req.user!.id,
        req.body.notes
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async edit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pageService.editPage(
        req.params.pageId,
        req.user!.id,
        req.body.text,
        req.body.editSummary
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getVersions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const versions = await pageService.getVersions(req.params.pageId, req.user!.id);
      res.status(200).json({ success: true, data: versions });
    } catch (err) {
      next(err);
    }
  }
}

export const pageController = new PageController();
