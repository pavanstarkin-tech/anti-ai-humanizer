import { prisma, isDatabaseConnected } from '../prisma.js';
import { Document, DocumentStatus, Prisma } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class DocumentRepository {
  async findById(id: string, includePages = false): Promise<any | null> {
    if (!isDatabaseConnected) {
      const doc = inMemoryStore.documents.get(id);
      if (!doc) return null;
      if (includePages) {
        const pages = Array.from(inMemoryStore.pages.values())
          .filter((p) => p.documentId === id)
          .sort((a, b) => a.pageNumber - b.pageNumber)
          .map((p) => {
            const elements = Array.from(inMemoryStore.elements.values()).filter((e) => e.pageId === p.id);
            const approvals = Array.from(inMemoryStore.approvals.values()).filter((a) => a.pageId === p.id);
            return { ...p, elements, approvals };
          });
        return { ...doc, pages };
      }
      return doc;
    }
    try {
      return await prisma.document.findUnique({
        where: { id },
        include: includePages
          ? {
              pages: {
                orderBy: { pageNumber: 'asc' },
                include: { elements: true, approvals: true },
              },
            }
          : undefined,
      });
    } catch {
      const doc = inMemoryStore.documents.get(id);
      if (!doc) return null;
      if (includePages) {
        const pages = Array.from(inMemoryStore.pages.values())
          .filter((p) => p.documentId === id)
          .sort((a, b) => a.pageNumber - b.pageNumber)
          .map((p) => {
            const elements = Array.from(inMemoryStore.elements.values()).filter((e) => e.pageId === p.id);
            const approvals = Array.from(inMemoryStore.approvals.values()).filter((a) => a.pageId === p.id);
            return { ...p, elements, approvals };
          });
        return { ...doc, pages };
      }
      return doc;
    }
  }

  async findByUserId(userId: string): Promise<Document[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.documents.values())
        .filter((d) => d.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    try {
      return await prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return Array.from(inMemoryStore.documents.values())
        .filter((d) => d.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async create(data: {
    userId: string;
    title: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    filePath: string;
    totalPages?: number;
    status?: DocumentStatus;
  }): Promise<Document> {
    const docFallback: Document = {
      id: crypto.randomUUID(),
      userId: data.userId,
      title: data.title,
      originalFilename: data.originalFilename,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      filePath: data.filePath,
      totalPages: data.totalPages || 0,
      approvedPages: 0,
      status: data.status || ('DRAFT' as any),
      reconstructedPath: null,
      reconstructedMimeType: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isDatabaseConnected) {
      inMemoryStore.documents.set(docFallback.id, docFallback);
      return docFallback;
    }

    try {
      return await prisma.document.create({ data });
    } catch {
      inMemoryStore.documents.set(docFallback.id, docFallback);
      return docFallback;
    }
  }

  async update(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
    if (!isDatabaseConnected) {
      const existing = inMemoryStore.documents.get(id) || {};
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      inMemoryStore.documents.set(id, updated);
      return updated as Document;
    }
    try {
      return await prisma.document.update({
        where: { id },
        data,
      });
    } catch {
      const existing = inMemoryStore.documents.get(id) || {};
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      inMemoryStore.documents.set(id, updated);
      return updated as Document;
    }
  }

  async delete(id: string): Promise<Document> {
    if (!isDatabaseConnected) {
      const doc = inMemoryStore.documents.get(id);
      inMemoryStore.documents.delete(id);
      return doc;
    }
    try {
      return await prisma.document.delete({
        where: { id },
      });
    } catch {
      const doc = inMemoryStore.documents.get(id);
      inMemoryStore.documents.delete(id);
      return doc;
    }
  }
}

export const documentRepository = new DocumentRepository();
