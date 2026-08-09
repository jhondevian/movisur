import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const passwordHash = await bcrypt.hash("Te201225Leo", 12);

await prisma.user.upsert({
  where: { email: "movisur@admin.com" },
  create: {
    firstName: "Jhon",
    lastName: "Admin",
    email: "movisur@admin.com",
    passwordHash,
    role: "admin",
  },
  update: {
    firstName: "Jhon",
    lastName: "Admin",
    passwordHash,
    role: "admin",
  },
});

await prisma.$disconnect();
await pool.end();

console.log("Admin listo: movisur@admin.com / Te201225Leo");
