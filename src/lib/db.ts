import { PrismaClient } from "@prisma/client";

// Reaproveita o cliente em desenvolvimento para não abrir conexões a cada hot reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
