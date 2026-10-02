import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export let isDatabaseConnected = false;

export function setDatabaseConnected(status: boolean) {
  isDatabaseConnected = status;
}

export async function withTransaction<T>(
  action: (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => Promise<T>
): Promise<T> {
  if (!isDatabaseConnected) {
    throw new Error('Database not connected');
  }
  return prisma.$transaction(action);
}
