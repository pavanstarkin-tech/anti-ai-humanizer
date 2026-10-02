import { prisma, isDatabaseConnected } from '../prisma.js';
import { Evaluation, Prisma } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class EvaluationRepository {
  async findByCandidateId(candidateId: string): Promise<Evaluation[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.evaluations.values())
        .filter((e) => e.candidateId === candidateId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    try {
      return await prisma.evaluation.findMany({
        where: { candidateId },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return Array.from(inMemoryStore.evaluations.values())
        .filter((e) => e.candidateId === candidateId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async findByPageVersionId(pageVersionId: string): Promise<Evaluation[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.evaluations.values())
        .filter((e) => e.pageVersionId === pageVersionId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    try {
      return await prisma.evaluation.findMany({
        where: { pageVersionId },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return Array.from(inMemoryStore.evaluations.values())
        .filter((e) => e.pageVersionId === pageVersionId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async create(data: {
    candidateId?: string | null;
    pageVersionId?: string | null;
    naturalness: number;
    clarity: number;
    sentenceVariety: number;
    repetitionReduction: number;
    styleConsistency: number;
    meaningPreservation: number;
    factualConsistency: number;
    terminologyPreservation: number;
    citationPreservation: number;
    protectedElementIntegrity: number;
    overallScore: number;
    passedGates: boolean;
    failedReasons?: Prisma.InputJsonValue;
    rawFeedback?: Prisma.InputJsonValue;
    evaluatorModel: string;
    evaluatorPromptVersion: string;
  }): Promise<Evaluation> {
    const evFallback: Evaluation = {
      id: crypto.randomUUID(),
      candidateId: data.candidateId || null,
      pageVersionId: data.pageVersionId || null,
      naturalness: data.naturalness,
      clarity: data.clarity,
      sentenceVariety: data.sentenceVariety,
      repetitionReduction: data.repetitionReduction,
      styleConsistency: data.styleConsistency,
      meaningPreservation: data.meaningPreservation,
      factualConsistency: data.factualConsistency,
      terminologyPreservation: data.terminologyPreservation,
      citationPreservation: data.citationPreservation,
      protectedElementIntegrity: data.protectedElementIntegrity,
      overallScore: data.overallScore,
      passedGates: data.passedGates,
      failedReasons: (data.failedReasons as any) || null,
      rawFeedback: (data.rawFeedback as any) || null,
      evaluatorModel: data.evaluatorModel,
      evaluatorPromptVersion: data.evaluatorPromptVersion,
      createdAt: new Date(),
    };

    if (!isDatabaseConnected) {
      inMemoryStore.evaluations.set(evFallback.id, evFallback);
      return evFallback;
    }

    try {
      return await prisma.evaluation.create({ data });
    } catch {
      inMemoryStore.evaluations.set(evFallback.id, evFallback);
      return evFallback;
    }
  }
}

export const evaluationRepository = new EvaluationRepository();
