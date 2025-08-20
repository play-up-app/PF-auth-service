import { PrismaClient } from "../generated/prisma/index.js"

export const prismaClient = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: ['query', 'info', 'warn', 'error']
})