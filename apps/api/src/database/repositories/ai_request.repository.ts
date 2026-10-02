import { prisma, isDatabaseConnected } from '../prisma.js';
import { AIRequestLog, AIModel, AIExpert, AITaskAssignment, Prisma } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';

export class AIRequestRepository {
  async logRequest(data: {
    requestId: string;
    documentId?: string | null;
    pageId?: string | null;
    candidateId?: string | null;
    iteration?: number;
    task: string;
    expertId?: string | null;
    modelId: string;
    provider?: string;
    promptVersion?: string;
    durationMs: number;
    status: string;
    fallbackUsed?: boolean;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    errorMessage?: string | null;
  }): Promise<AIRequestLog> {
    const fallbackLog: AIRequestLog = {
      id: data.requestId || 'mock-log-id',
      createdAt: new Date(),
      ...data,
      provider: 'NVIDIA',
      documentId: data.documentId || null,
      pageId: data.pageId || null,
      candidateId: data.candidateId || null,
      iteration: data.iteration || 1,
      expertId: data.expertId || null,
      fallbackUsed: data.fallbackUsed || false,
      inputTokens: data.inputTokens || null,
      outputTokens: data.outputTokens || null,
      totalTokens: data.totalTokens || null,
      errorMessage: data.errorMessage || null,
    } as any;

    if (!isDatabaseConnected) {
      inMemoryStore.aiLogs.set(fallbackLog.id, fallbackLog);
      return fallbackLog;
    }

    try {
      return await prisma.aIRequestLog.create({
        data: {
          ...data,
          provider: 'NVIDIA',
        },
      });
    } catch {
      inMemoryStore.aiLogs.set(fallbackLog.id, fallbackLog);
      return fallbackLog;
    }
  }

  async getRecentLogs(limit = 50): Promise<AIRequestLog[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.aiLogs.values()).slice(0, limit);
    }
    try {
      return await prisma.aIRequestLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return Array.from(inMemoryStore.aiLogs.values()).slice(0, limit);
    }
  }

  async getMetrics(): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    fallbackRequests: number;
    avgDurationMs: number;
    modelUsage: Record<string, number>;
  }> {
    const logs = Array.from(inMemoryStore.aiLogs.values());

    const total = logs.length;
    const successful = logs.filter((l) => l.status === 'SUCCESS').length;
    const failed = logs.filter((l) => l.status === 'FAILED').length;
    const fallback = logs.filter((l) => l.fallbackUsed).length;
    const avgDuration = total > 0 ? Math.round(logs.reduce((acc, l) => acc + (l.durationMs || 0), 0) / total) : 0;

    const modelUsage: Record<string, number> = {};
    for (const log of logs) {
      modelUsage[log.modelId] = (modelUsage[log.modelId] || 0) + 1;
    }

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      fallbackRequests: fallback,
      avgDurationMs: avgDuration,
      modelUsage,
    };
  }

  // Model & Assignment helpers
  async upsertDiscoveredModels(models: Array<{ modelId: string; displayName: string; capabilities?: any }>) {
    if (!isDatabaseConnected) return;
    try {
      for (const m of models) {
        await prisma.aIModel.upsert({
          where: { modelId: m.modelId },
          update: {
            displayName: m.displayName,
            capabilities: m.capabilities,
            provider: 'NVIDIA',
          },
          create: {
            modelId: m.modelId,
            displayName: m.displayName,
            capabilities: m.capabilities,
            provider: 'NVIDIA',
            enabled: true,
          },
        });
      }
    } catch {
      // safe fallback
    }
  }

  async getModels(): Promise<AIModel[]> {
    if (!isDatabaseConnected) return [];
    try {
      return await prisma.aIModel.findMany({
        where: { provider: 'NVIDIA' },
        orderBy: { modelId: 'asc' },
      });
    } catch {
      return [];
    }
  }
}

export const aiRequestRepository = new AIRequestRepository();
