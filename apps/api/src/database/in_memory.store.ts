import bcrypt from 'bcryptjs';

export class InMemoryStore {
  public users = new Map<string, any>();
  public documents = new Map<string, any>();
  public pages = new Map<string, any>();
  public elements = new Map<string, any>();
  public candidates = new Map<string, any>();
  public evaluations = new Map<string, any>();
  public versions = new Map<string, any>();
  public approvals = new Map<string, any>();
  public jobs = new Map<string, any>();
  public aiLogs = new Map<string, any>();
  public auditLogs = new Map<string, any>();

  constructor() {
    this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const sanvithHash = await bcrypt.hash('Sanvith@27', 10);

    const defaultAdmin = {
      id: 'default-admin-uuid',
      email: 'admin@humanizepro.com',
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const demoUser = {
      id: 'default-demo-uuid',
      email: 'demo@humanizer.ai',
      passwordHash,
      name: 'Dr. Alex Morgan',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dbUser = {
      id: 'default-db-uuid',
      email: 'u833088220_humanise',
      passwordHash: sanvithHash,
      name: 'Hostinger DB User',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(defaultAdmin.id, defaultAdmin);
    this.users.set(defaultAdmin.email.toLowerCase(), defaultAdmin);

    this.users.set(demoUser.id, demoUser);
    this.users.set(demoUser.email.toLowerCase(), demoUser);

    this.users.set(dbUser.id, dbUser);
    this.users.set(dbUser.email.toLowerCase(), dbUser);
  }
}

export const inMemoryStore = new InMemoryStore();
