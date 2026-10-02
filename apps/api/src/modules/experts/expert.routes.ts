import { Router, Request, Response } from 'express';
import { EXPERT_REGISTRY } from '../ai/experts/expert.registry.js';
import { DEFAULT_SCORING_WEIGHTS, DEFAULT_QUALITY_THRESHOLDS } from '@humanizer/shared';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      experts: Object.values(EXPERT_REGISTRY),
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      qualityThresholds: DEFAULT_QUALITY_THRESHOLDS,
    },
  });
});

export default router;
