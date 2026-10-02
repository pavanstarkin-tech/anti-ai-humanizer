import { NvidiaAIClient, NvidiaModelInfo } from './nvidia.client.js';
import { aiRequestRepository } from '../../../database/repositories/ai_request.repository.js';

export interface NormalizedNvidiaModel {
  id: string;
  name: string;
  provider: 'NVIDIA';
  available: boolean;
  capabilities: {
    chat: boolean;
    structuredOutput: boolean;
    multimodal: boolean;
  };
  discoveredAt: Date;
}

export class NVIDIAModelDiscoveryService {
  private cachedModels: NormalizedNvidiaModel[] = [];
  private lastFetchedAt: number = 0;
  private cacheTtlMs: number = 10 * 60 * 1000; // 10 minutes cache

  constructor(private client: NvidiaAIClient) {}

  async getAvailableModels(forceRefresh = false): Promise<NormalizedNvidiaModel[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedModels.length > 0 && now - this.lastFetchedAt < this.cacheTtlMs) {
      return this.cachedModels;
    }

    try {
      const rawList = await this.client.listModels();
      const normalized: NormalizedNvidiaModel[] = rawList.map((m) => {
        const idLower = m.id.toLowerCase();
        return {
          id: m.id,
          name: m.id.split('/').pop() || m.id,
          provider: 'NVIDIA',
          available: true,
          capabilities: {
            chat: true,
            structuredOutput: true,
            multimodal: idLower.includes('vlm') || idLower.includes('vision') || idLower.includes('fuyu') || idLower.includes('neva'),
          },
          discoveredAt: new Date(),
        };
      });

      this.cachedModels = normalized;
      this.lastFetchedAt = now;

      // Persist discovered models in MySQL for audit and admin settings
      await aiRequestRepository.upsertDiscoveredModels(
        normalized.map((n) => ({
          modelId: n.id,
          displayName: n.name,
          capabilities: n.capabilities,
        }))
      );

      return normalized;
    } catch (err) {
      console.warn('⚠️ NVIDIA Model Discovery warning:', err);
      // If error occurs and cache exists, return cache
      if (this.cachedModels.length > 0) {
        return this.cachedModels;
      }
      // Return safe fallback list
      return [
        {
          id: 'meta/llama-3.3-70b-instruct',
          name: 'llama-3.3-70b-instruct',
          provider: 'NVIDIA',
          available: true,
          capabilities: { chat: true, structuredOutput: true, multimodal: false },
          discoveredAt: new Date(),
        },
      ];
    }
  }

  isModelAvailable(modelId: string): boolean {
    if (this.cachedModels.length === 0) return true;
    return this.cachedModels.some((m) => m.id === modelId && m.available);
  }
}
