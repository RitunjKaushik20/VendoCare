
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connection established');
    return prisma;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { prisma, connectDatabase };
