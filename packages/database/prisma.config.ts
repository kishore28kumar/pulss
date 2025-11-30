// Prisma 7+ Configuration
// This file replaces the url property in schema.prisma
// DATABASE_URL should be set in .env file in packages/database/ or root directory
// Falls back to default connection string if .env is not found

export default {
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/pulss_db?schema=public',
  },
};

