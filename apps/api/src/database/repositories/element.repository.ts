import { prisma, isDatabaseConnected } from '../prisma.js';
import { DocumentElement, ElementType, Prisma } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class ElementRepository {
  async findByPageId(pageId: string): Promise<DocumentElement[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.elements.values())
        .filter((e) => e.pageId === pageId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    }
    try {
      return await prisma.documentElement.findMany({
        where: { pageId },
        orderBy: { orderIndex: 'asc' },
      });
    } catch {
      return Array.from(inMemoryStore.elements.values())
        .filter((e) => e.pageId === pageId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    }
  }

  async findByDocumentId(documentId: string): Promise<DocumentElement[]> {
    if (!isDatabaseConnected) {
      return Array.from(inMemoryStore.elements.values())
        .filter((e) => e.documentId === documentId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    }
    try {
      return await prisma.documentElement.findMany({
        where: { documentId },
        orderBy: { orderIndex: 'asc' },
      });
    } catch {
      return Array.from(inMemoryStore.elements.values())
        .filter((e) => e.documentId === documentId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    }
  }

  async createMany(
    elements: Array<{
      documentId: string;
      pageId: string;
      placeholder: string;
      type: ElementType;
      rawContent: string;
      orderIndex: number;
      metadata?: Prisma.InputJsonValue;
    }>
  ): Promise<void> {
    const storeFallback = () => {
      for (const el of elements) {
        const item: DocumentElement = {
          id: crypto.randomUUID(),
          documentId: el.documentId,
          pageId: el.pageId,
          placeholder: el.placeholder,
          type: el.type,
          rawContent: el.rawContent,
          orderIndex: el.orderIndex,
          metadata: (el.metadata as any) || null,
          isLocked: true,
          createdAt: new Date(),
        };
        inMemoryStore.elements.set(item.id, item);
      }
    };

    if (!isDatabaseConnected) {
      storeFallback();
      return;
    }

    try {
      await prisma.documentElement.createMany({ data: elements });
    } catch {
      storeFallback();
    }
  }
}

export const elementRepository = new ElementRepository();
