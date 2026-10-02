import { prisma, isDatabaseConnected } from '../prisma.js';
import { DocumentPage, PageState, Prisma } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class PageRepository {
  async findById(id: string, includeFullTree = false): Promise<any | null> {
    if (!isDatabaseConnected) {
      const page = inMemoryStore.pages.get(id);
      if (!page) return null;

      const doc = inMemoryStore.documents.get(page.documentId);
      const elements = Array.from(inMemoryStore.elements.values())
        .filter((e) => e.pageId === id)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      if (includeFullTree) {
        const candidates = Array.from(inMemoryStore.candidates.values())
          .filter((c) => c.pageId === id)
          .map((c) => {
            const evals = Array.from(inMemoryStore.evaluations.values()).filter((ev) => ev.candidateId === c.id);
            return { ...c, evaluations: evals };
          });

        const versions = Array.from(inMemoryStore.versions.values())
          .filter((v) => v.pageId === id)
          .map((v) => {
            const user = inMemoryStore.users.get(v.userId || '');
            return { ...v, user };
          });

        const approvals = Array.from(inMemoryStore.approvals.values())
          .filter((a) => a.pageId === id)
          .map((a) => {
            const user = inMemoryStore.users.get(a.userId || '');
            return { ...a, user };
          });

        return {
          ...page,
          document: doc,
          elements,
          candidates,
          versions,
          approvals,
        };
      }

      return {
        ...page,
        document: doc,
        elements,
      };
    }

    try {
      return await prisma.documentPage.findUnique({
        where: { id },
        include: includeFullTree
          ? {
              document: true,
              elements: { orderBy: { orderIndex: 'asc' } },
              candidates: {
                orderBy: { createdAt: 'desc' },
                include: { evaluations: true },
              },
              versions: {
                orderBy: { createdAt: 'desc' },
                include: { user: true },
              },
              approvals: {
                orderBy: { approvedAt: 'desc' },
                include: { user: true },
              },
            }
          : {
              document: true,
              elements: true,
            },
      });
    } catch {
      const page = inMemoryStore.pages.get(id);
      if (!page) return null;

      const doc = inMemoryStore.documents.get(page.documentId);
      const elements = Array.from(inMemoryStore.elements.values())
        .filter((e) => e.pageId === id)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      return {
        ...page,
        document: doc,
        elements,
      };
    }
  }

  async findByDocumentId(documentId: string): Promise<DocumentPage[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.pages.values())
        .filter((p) => p.documentId === documentId)
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map((p) => {
          const elements = Array.from(inMemoryStore.elements.values()).filter((e) => e.pageId === p.id);
          const approvals = Array.from(inMemoryStore.approvals.values()).filter((a) => a.pageId === p.id);
          return { ...p, elements, approvals };
        });
    }
    try {
      return await prisma.documentPage.findMany({
        where: { documentId },
        orderBy: { pageNumber: 'asc' },
        include: {
          approvals: true,
          elements: true,
        },
      });
    } catch {
      return Array.from(inMemoryStore.pages.values())
        .filter((p) => p.documentId === documentId)
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map((p) => {
          const elements = Array.from(inMemoryStore.elements.values()).filter((e) => e.pageId === p.id);
          const approvals = Array.from(inMemoryStore.approvals.values()).filter((a) => a.pageId === p.id);
          return { ...p, elements, approvals };
        });
    }
  }

  async findByPageNumber(documentId: string, pageNumber: number): Promise<DocumentPage | null> {
    if (!isDatabaseConnected) {
      return (
        Array.from(inMemoryStore.pages.values()).find(
          (p) => p.documentId === documentId && p.pageNumber === pageNumber
        ) || null
      );
    }
    try {
      return await prisma.documentPage.findUnique({
        where: {
          documentId_pageNumber: { documentId, pageNumber },
        },
      });
    } catch {
      return (
        Array.from(inMemoryStore.pages.values()).find(
          (p) => p.documentId === documentId && p.pageNumber === pageNumber
        ) || null
      );
    }
  }

  async create(data: {
    documentId: string;
    pageNumber: number;
    originalText: string;
    state?: PageState;
    domainConfidence?: Prisma.InputJsonValue;
    selectedExperts?: Prisma.InputJsonValue;
  }): Promise<DocumentPage> {
    const pageFallback: DocumentPage = {
      id: crypto.randomUUID(),
      documentId: data.documentId,
      pageNumber: data.pageNumber,
      state: data.state || ('PENDING' as any),
      originalText: data.originalText,
      currentApprovedVersionId: null,
      activeCandidateId: null,
      domainConfidence: (data.domainConfidence as any) || null,
      selectedExperts: (data.selectedExperts as any) || null,
      totalIterations: 0,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isDatabaseConnected) {
      inMemoryStore.pages.set(pageFallback.id, pageFallback);
      return pageFallback;
    }

    try {
      return await prisma.documentPage.create({ data });
    } catch {
      inMemoryStore.pages.set(pageFallback.id, pageFallback);
      return pageFallback;
    }
  }

  async update(id: string, data: Prisma.DocumentPageUpdateInput): Promise<DocumentPage> {
    if (!isDatabaseConnected) {
      const existing = inMemoryStore.pages.get(id) || {};
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      inMemoryStore.pages.set(id, updated);
      return updated as DocumentPage;
    }
    try {
      return await prisma.documentPage.update({
        where: { id },
        data,
      });
    } catch {
      const existing = inMemoryStore.pages.get(id) || {};
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      inMemoryStore.pages.set(id, updated);
      return updated as DocumentPage;
    }
  }
}

export const pageRepository = new PageRepository();
