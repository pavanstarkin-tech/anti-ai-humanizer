import { Request, Response, NextFunction } from 'express';
import { NVIDIAModelDiscoveryService } from './discovery.service.js';
import { nvidiaClient } from './nvidia.client.js';
import { nvidiaOrchestrator } from './nvidia.orchestrator.js';
import { aiRequestRepository } from '../../../database/repositories/ai_request.repository.js';

export class ModelController {
  private discoveryService: NVIDIAModelDiscoveryService;

  constructor() {
    this.discoveryService = new NVIDIAModelDiscoveryService(nvidiaClient);
  }

  async listModels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const models = await this.discoveryService.getAvailableModels(false);
      const assignments = nvidiaOrchestrator.modelRegistry.getAllMappings();
      res.status(200).json({
        success: true,
        data: {
          provider: 'NVIDIA',
          endpoint: nvidiaClient.getBaseUrl(),
          totalDiscovered: models.length,
          models,
          roleAssignments: assignments,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refreshModels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const models = await this.discoveryService.getAvailableModels(true);
      res.status(200).json({
        success: true,
        data: {
          refreshed: true,
          total: models.length,
          models,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await nvidiaClient.healthCheck();
      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await aiRequestRepository.getMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRoleAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, primaryModelId, fallbackModelIds } = req.body;
      if (!role || !primaryModelId) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'role and primaryModelId are required.' },
        });
        return;
      }

      nvidiaOrchestrator.modelRegistry.setMapping(role, primaryModelId, fallbackModelIds || []);
      res.status(200).json({
        success: true,
        data: {
          updated: true,
          mapping: nvidiaOrchestrator.modelRegistry.getMapping(role),
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const modelController = new ModelController();
