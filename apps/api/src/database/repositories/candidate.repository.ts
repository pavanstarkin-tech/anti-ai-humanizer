import { prisma, isDatabaseConnected } from '../prisma.js';
import { Candidate, Prisma } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class CandidateRepository {
  async findById(id: string): Promise<Candidate | null> {
    if (!isDatabaseConnected) {
      const c = inMemoryStore.candidates.get(id);
      if (!c) return null;
      const evals = Array.from(inMemoryStore.evaluations.values()).filter((e) => e.candidateId === id);
      return { ...c, evaluations: evals } as any;
    }
    try {
      return await prisma.candidate.findUnique({
        where: { id },
        include: { evaluations: true },
      });
    } catch {
      const c = inMemoryStore.candidates.get(id);
      if (!c) return null;
      const evals = Array.from(inMemoryStore.evaluations.values()).filter((e) => e.candidateId === id);
      return { ...c, evaluations: evals } as any;
    }
  }

  async findByPageId(pageId: string, iterationNumber?: number): Promise<Candidate[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.candidates.values())
        .filter((c) => c.pageId === pageId && (iterationNumber === undefined || c.iterationNumber === iterationNumber))
        .map((c) => {
          const evals = Array.from(inMemoryStore.evaluations.values()).filter((e) => e.candidateId === c.id);
          return { ...c, evaluations: evals };
        }) as any;
    }
    try {
      return await prisma.candidate.findMany({
        where: {
          pageId,
          iterationNumber,
        },
        include: { evaluations: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return Array.from(inMemoryStore.candidates.values())
        .filter((c) => c.pageId === pageId && (iterationNumber === undefined || c.iterationNumber === iterationNumber))
        .map((c) => {
          const evals = Array.from(inMemoryStore.evaluations.values()).filter((e) => e.candidateId === c.id);
          return { ...c, evaluations: evals };
        }) as any;
    }
  }

  async create(data: {
    pageId: string;
    iterationNumber?: number;
    expertType: string;
    secondaryExpertType?: string | null;
    model: string;
    provider: string;
    promptVersion: string;
    text: string;
    overallScore?: number | null;
    isValid?: boolean;
    generationConfig: Prisma.InputJsonValue;
  }): Promise<Candidate> {
    const candidateFallback: Candidate = {
      id: crypto.randomUUID(),
      pageId: data.pageId,
      iterationNumber: data.iterationNumber || 1,
      expertType: data.expertType,
      secondaryExpertType: data.secondaryExpertType || null,
      model: data.model,
      provider: data.provider,
      promptVersion: data.promptVersion,
      text: data.text,
      overallScore: data.overallScore || null,
      isValid: data.isValid !== undefined ? data.isValid : true,
      generationConfig: data.generationConfig as any,
      createdAt: new Date(),
    };

    if (!isDatabaseConnected) {
      inMemoryStore.candidates.set(candidateFallback.id, candidateFallback);
      return candidateFallback;
    }

    try {
      return await prisma.candidate.create({ data });
    } catch {
      inMemoryStore.candidates.set(candidateFallback.id, candidateFallback);
      return candidateFallback;
    }
  }
}

export const candidateRepository = new CandidateRepository();
