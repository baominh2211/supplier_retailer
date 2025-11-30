import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

// Create Prisma client with logging based on environment
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.isDev 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    datasources: {
      db: {
        url: config.database.url,
      },
    },
  });
};

// Prevent multiple instances during hot reload in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (config.isDev) {
  globalThis.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
