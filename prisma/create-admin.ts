import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

// Creates (or resets the password of) the admin from ADMIN_EMAIL / ADMIN_PASSWORD.
// Safe for production, unlike seed.ts, which wipes every table first.

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");

  const passwordHash = await hash(password, 10);
  await prisma.user.upsert({ where: { email }, update: { passwordHash }, create: { email, passwordHash } });
  console.log(`Admin ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
