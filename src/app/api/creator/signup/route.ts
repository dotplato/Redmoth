import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { creatorSignupPayload, fieldErrors } from "@/lib/admin-schema";
import { setCreatorCookie, uniqueSlug } from "@/lib/creator-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const parsed = creatorSignupPayload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  if (await prisma.creator.findUnique({ where: { email } })) {
    return NextResponse.json({ errors: { email: "An account with this email already exists. Log in instead." } }, { status: 409 });
  }

  const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.creator.findUnique({ where: { slug: s } })));
  const creator = await prisma.creator.create({
    data: {
      name,
      slug,
      email,
      passwordHash: await hash(password, 10),
      bio: "Independent maker on redmoth.",
    },
  });

  await setCreatorCookie({ sub: creator.id, slug: creator.slug });
  return NextResponse.json({ creator: { slug: creator.slug } }, { status: 201 });
}
