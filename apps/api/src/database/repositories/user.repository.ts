import { prisma, isDatabaseConnected } from '../prisma.js';
import { Role, User } from '@prisma/client';
import { inMemoryStore } from '../in_memory.store.js';
import crypto from 'crypto';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    if (!isDatabaseConnected) {
      return inMemoryStore.users.get(id) || null;
    }
    try {
      return await prisma.user.findUnique({ where: { id } });
    } catch {
      return inMemoryStore.users.get(id) || null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!isDatabaseConnected) {
      return inMemoryStore.users.get(email.toLowerCase()) || null;
    }
    try {
      return await prisma.user.findUnique({ where: { email } });
    } catch {
      return inMemoryStore.users.get(email.toLowerCase()) || null;
    }
  }

  async create(data: { email: string; passwordHash: string; name: string; role?: Role }): Promise<User> {
    const userFallback: User = {
      id: crypto.randomUUID(),
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      name: data.name,
      role: data.role || ('USER' as any),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isDatabaseConnected) {
      inMemoryStore.users.set(userFallback.id, userFallback);
      inMemoryStore.users.set(userFallback.email, userFallback);
      return userFallback;
    }

    try {
      return await prisma.user.create({ data });
    } catch {
      inMemoryStore.users.set(userFallback.id, userFallback);
      inMemoryStore.users.set(userFallback.email, userFallback);
      return userFallback;
    }
  }

  async count(): Promise<number> {
    if (!isDatabaseConnected) {
      return inMemoryStore.users.size;
    }
    try {
      return await prisma.user.count();
    } catch {
      return inMemoryStore.users.size;
    }
  }
}

export const userRepository = new UserRepository();
