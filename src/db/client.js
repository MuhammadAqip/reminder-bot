const { PrismaClient } = require('@prisma/client');

// Singleton supaya tidak buka banyak koneksi database
const prisma = new PrismaClient();

module.exports = prisma;
