import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

// Matches ADMIN_ROLE in src/lib/auth.ts and Better Auth's email + password provider id.
const ADMIN_ROLE = "admin";
const CREDENTIAL_PROVIDER = "credential";

/**
 * Creates the admin login, or resets its password if it exists. Written straight to the database
 * (not through Better Auth's sign-up) so it's verified, has the admin role, and gets no creator profile.
 */
export async function upsertAdmin(prisma: PrismaClient, email: string, password: string) {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: ADMIN_ROLE, emailVerified: true },
    create: { id: randomUUID(), name: "Admin", email, emailVerified: true, role: ADMIN_ROLE },
  });

  const account = await prisma.account.findFirst({ where: { userId: user.id, providerId: CREDENTIAL_PROVIDER } });
  if (account) {
    await prisma.account.update({ where: { id: account.id }, data: { password: passwordHash } });
    // A new password signs the admin out everywhere.
    await prisma.session.deleteMany({ where: { userId: user.id } });
  } else {
    await prisma.account.create({
      data: { id: randomUUID(), accountId: user.id, providerId: CREDENTIAL_PROVIDER, userId: user.id, password: passwordHash },
    });
  }
  return user;
}
