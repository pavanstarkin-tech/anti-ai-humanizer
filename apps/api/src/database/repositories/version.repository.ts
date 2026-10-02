import { prisma, isDatabaseConnected } from '../prisma.js';
import { PageVersion, Prisma, SourceType } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class VersionRepository {
  async findById(id: string): Promise<PageVersion | null> {
    if (!isDatabaseConnected) {
      const v = inMemoryStore.versions.get(id);
      if (!v) return null;
      const user = inMemoryStore.users.get(v.userId || '');
      const candidate = inMemoryStore.candidates.get(v.candidateId || '');
      const evals = Array.from(inMemoryStore.evaluations.values()).filter((e) => e.pageVersionId === id);
      return { ...v, user, candidate, evaluations: evals } as any;
    }
    try {
      return await prisma.pageVersion.findUnique({
        where: { id },
        include: { evaluations: true, user: true, candidate: true },
      });
    } catch {
      const v = inMemoryStore.versions.get(id);
      if (!v) return null;
      const user = inMemoryStore.users.get(v.userId || '');
      const candidate = inMemoryStore.candidates.get(v.candidateId || '');
      const evals = Array.from(inMemoryStore.evaluations.values()).filter((e) => e.pageVersionId === id);
      return { ...v, user, candidate, evaluations: evals } as any;
    }
  }

  async findByPageId(pageId: string): Promise<PageVersion[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.versions.values())
        .filter((v) => v.pageId === pageId)
        .sort((a, b) => b.iterationNumber - a.iterationNumber)
        .map((v) => {
          const user = inMemoryStore.users.get(v.userId || '');
          const evals = Array.from(inMemoryStore.evaluations.values()).filter((e) => e.pageVersionId === v.id);
          return { ...v, user, evaluations: evals };
        }) as any;
    }
    try {
      return await prisma.pageVersion.findMany({
        where: { pageId },
        orderBy: { iterationNumber: 'desc' },
        include: { evaluations: true, user: true },
      });
    } catch {
      return Array.from(inMemoryStore.versions.values())
        .filter((v) => v.pageId === pageId)
        .sort((a, b) => b.iterationNumber - a.iterationNumber)
        .map((v) => {
          const user = inMemoryStore.users.get(v.userId || '');
          const evals = Array.from(inMemoryStore.evaluations.values()).filter((e) => e.pageVersionId === v.id);
          return { ...v, user, evaluations: evals };
        }) as any;
    }
  }

  async create(data: {
    pageId: string;
    userId?: string | null;
    candidateId?: string | null;
    sourceType: SourceType;
    iterationNumber: number;
    text: string;
    overallScore?: number | null;
    evaluationSummary?: Prisma.InputJsonValue;
    diffFromOriginal?: string | null;
  }): Promise<PageVersion> {
    const versionFallback: PageVersion = {
      id: crypto.randomUUID(),
      pageId: data.pageId,
      userId: data.userId || null,
      candidateId: data.candidateId || null,
      sourceType: data.sourceType,
      iterationNumber: data.iterationNumber,
      text: data.text,
      overallScore: data.overallScore || null,
      evaluationSummary: (data.evaluationSummary as any) || null,
      diffFromOriginal: data.diffFromOriginal || null,
      createdAt: new Date(),
    };

    if (!isDatabaseConnected) {
      inMemoryStore.versions.set(versionFallback.id, versionFallback);
      return versionFallback;
    }

    try {
      return await prisma.pageVersion.create({ data });
    } catch {
      inMemoryStore.versions.set(versionFallback.id, versionFallback);
      return versionFallback;
    }
  }
}

export const versionRepository = new VersionRepository();
