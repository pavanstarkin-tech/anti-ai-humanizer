import { prisma, isDatabaseConnected } from '../prisma.js';
import { Approval } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class ApprovalRepository {
  async findByPageId(pageId: string): Promise<Approval | null> {
    if (!isDatabaseConnected) {
      return (
        Array.from(inMemoryStore.approvals.values())
          .filter((a) => a.pageId === pageId)
          .sort((a, b) => b.approvedAt.getTime() - a.approvedAt.getTime())[0] || null
      );
    }
    try {
      return await prisma.approval.findFirst({
        where: { pageId },
        orderBy: { approvedAt: 'desc' },
      });
    } catch {
      return (
        Array.from(inMemoryStore.approvals.values())
          .filter((a) => a.pageId === pageId)
          .sort((a, b) => b.approvedAt.getTime() - a.approvedAt.getTime())[0] || null
      );
    }
  }

  async create(data: {
    pageId: string;
    pageVersionId: string;
    userId: string;
    notes?: string | null;
  }): Promise<Approval> {
    const approvalFallback: Approval = {
      id: crypto.randomUUID(),
      pageId: data.pageId,
      pageVersionId: data.pageVersionId,
      userId: data.userId,
      notes: data.notes || null,
      approvedAt: new Date(),
    };

    if (!isDatabaseConnected) {
      inMemoryStore.approvals.set(approvalFallback.id, approvalFallback);
      return approvalFallback;
    }

    try {
      return await prisma.approval.create({ data });
    } catch {
      inMemoryStore.approvals.set(approvalFallback.id, approvalFallback);
      return approvalFallback;
    }
  }
}

export const approvalRepository = new ApprovalRepository();
