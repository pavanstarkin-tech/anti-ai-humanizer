import { prisma, isDatabaseConnected } from '../prisma.js';
import { AuditLog, Prisma } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class AuditRepository {
  async log(data: {
    userId?: string | null;
    documentId?: string | null;
    pageId?: string | null;
    action: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string | null;
  }): Promise<AuditLog> {
    const logFallback: AuditLog = {
      id: crypto.randomUUID(),
      userId: data.userId || null,
      documentId: data.documentId || null,
      pageId: data.pageId || null,
      action: data.action,
      metadata: (data.metadata as any) || null,
      ipAddress: data.ipAddress || null,
      createdAt: new Date(),
    };

    if (!isDatabaseConnected) {
      inMemoryStore.auditLogs.set(logFallback.id, logFallback);
      return logFallback;
    }

    try {
      return await prisma.auditLog.create({ data });
    } catch {
      inMemoryStore.auditLogs.set(logFallback.id, logFallback);
      return logFallback;
    }
  }

  async findByDocumentId(documentId: string): Promise<AuditLog[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.auditLogs.values())
        .filter((l) => l.documentId === documentId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    try {
      return await prisma.auditLog.findMany({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      });
    } catch {
      return Array.from(inMemoryStore.auditLogs.values())
        .filter((l) => l.documentId === documentId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }
}

export const auditRepository = new AuditRepository();
