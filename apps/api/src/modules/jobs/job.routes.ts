import { Router, Response, NextFunction } from 'express';
import { jobRepository } from '../../database/repositories/job.repository.js';
import { AuthenticatedRequest, requireAuth } from '../../middleware/auth.middleware.js';

export class JobController {
  async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await jobRepository.findById(req.params.jobId);
      if (!job) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });
        return;
      }
      if (job.userId !== req.user!.id) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
        return;
      }

      res.status(200).json({
        success: true,
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const jobController = new JobController();

const router = Router();
router.get('/:jobId', requireAuth, (req, res, next) => jobController.getStatus(req as any, res, next));

export default router;
