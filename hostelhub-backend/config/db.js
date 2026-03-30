const prisma = require("../prismaClient");

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected successfully via Prisma");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log("🔌 Database disconnected");
};

module.exports = { prisma, connectDB, disconnectDB };
