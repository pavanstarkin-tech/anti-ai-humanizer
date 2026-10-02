import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { prisma, setDatabaseConnected } from './database/prisma.js';

const app = createApp();

async function startServer() {
  try {
    // Check DB connection
    await prisma.$connect();
    setDatabaseConnected(true);
    console.log('✅ Connected to MySQL database via Prisma');
  } catch (err: any) {
    setDatabaseConnected(false);
    console.warn('⚠️ MySQL connection warning (using mock/offline mode if DB is not ready):', err.message);
  }

  app.listen(ENV.PORT, () => {
    console.log(`🚀 HumanizePro API server running at http://localhost:${ENV.PORT}`);
    console.log(`📖 Swagger API Docs available at http://localhost:${ENV.PORT}/docs`);
    console.log(`🤖 AI Provider: NVIDIA NIM (${ENV.NVIDIA_API_BASE_URL})`);
    console.log(`🎯 Primary General Model: ${ENV.NVIDIA_GENERAL_WRITER_MODEL}`);
  });
}

startServer();
