import { prisma, isDatabaseConnected } from '../prisma.js';
import { JobStatus, Prisma, ProcessingJob } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class JobRepository {
  async findById(id: string): Promise<ProcessingJob | null> {
    if (!isDatabaseConnected) {
      return inMemoryStore.jobs.get(id) || null;
    }
    try {
      return await prisma.processingJob.findUnique({ where: { id } });
    } catch {
      return inMemoryStore.jobs.get(id) || null;
    }
  }

  async findActiveByPageId(pageId: string): Promise<ProcessingJob | null> {
    if (!isDatabaseConnected) {
      return (
        Array.from(inMemoryStore.jobs.values())
          .filter((j) => j.pageId === pageId && (j.status === 'QUEUED' || j.status === 'RUNNING'))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] || null
      );
    }
    try {
      return await prisma.processingJob.findFirst({
        where: {
          pageId,
          status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return (
        Array.from(inMemoryStore.jobs.values())
          .filter((j) => j.pageId === pageId && (j.status === 'QUEUED' || j.status === 'RUNNING'))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] || null
      );
    }
  }

  async create(data: {
    documentId: string;
    pageId?: string | null;
    userId: string;
    jobType: string;
    status?: JobStatus;
    progressPercent?: number;
    currentStep?: string | null;
  }): Promise<ProcessingJob> {
    const jobFallback: ProcessingJob = {
      id: crypto.randomUUID(),
      documentId: data.documentId,
      pageId: data.pageId || null,
      userId: data.userId,
      jobType: data.jobType,
      status: data.status || ('QUEUED' as any),
      progressPercent: data.progressPercent || 0,
      currentStep: data.currentStep || null,
      resultPayload: null,
      errorPayload: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isDatabaseConnected) {
      inMemoryStore.jobs.set(jobFallback.id, jobFallback);
      return jobFallback;
    }

    try {
      return await prisma.processingJob.create({ data });
    } catch {
      inMemoryStore.jobs.set(jobFallback.id, jobFallback);
      return jobFallback;
    }
  }

  async update(id: string, data: Prisma.ProcessingJobUpdateInput): Promise<ProcessingJob> {
    if (!isDatabaseConnected) {
      const existing = inMemoryStore.jobs.get(id) || {};
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      inMemoryStore.jobs.set(id, updated);
      return updated as ProcessingJob;
    }
    try {
      return await prisma.processingJob.update({
        where: { id },
        data,
      });
    } catch {
      const existing = inMemoryStore.jobs.get(id) || {};
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      inMemoryStore.jobs.set(id, updated);
      return updated as ProcessingJob;
    }
  }
}

export const jobRepository = new JobRepository();
