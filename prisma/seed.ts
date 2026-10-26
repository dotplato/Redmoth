import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function frame(title: string, color: string, caption: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <rect width="1600" height="1000" fill="#eef1f6"/>
  <rect x="80" y="60" width="1440" height="880" rx="28" fill="#ffffff"/>
  <rect x="80" y="60" width="1440" height="64" rx="28" fill="${color}"/>
  <rect x="80" y="92" width="1440" height="32" fill="${color}"/>
  <circle cx="126" cy="92" r="8" fill="#fff" opacity=".7"/>
  <circle cx="154" cy="92" r="8" fill="#fff" opacity=".5"/>
  <circle cx="182" cy="92" r="8" fill="#fff" opacity=".35"/>
  <text x="120" y="200" font-family="system-ui,sans-serif" font-size="42" font-weight="700" fill="#111318">${title}</text>
  <text x="120" y="252" font-family="system-ui,sans-serif" font-size="22" fill="#5c6573">${caption}</text>
  <rect x="120" y="310" width="720" height="18" rx="9" fill="#e8ecf3"/>
  <rect x="120" y="350" width="540" height="18" rx="9" fill="#e8ecf3"/>
  <rect x="120" y="420" width="1360" height="430" rx="20" fill="#f4f6fa"/>
  <rect x="160" y="460" width="380" height="350" rx="16" fill="#ffffff"/>
  <rect x="580" y="460" width="380" height="350" rx="16" fill="#ffffff"/>
  <rect x="1000" y="460" width="440" height="350" rx="16" fill="#ffffff"/>
</svg>`;
}

function logo(letter: string, color: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="${color}"/>
  <text x="64" y="82" text-anchor="middle" font-family="system-ui,sans-serif" font-size="52" font-weight="700" fill="#fff">${letter}</text>
</svg>`;
}

async function writePublic(rel: string, contents: string) {
  const full = path.join(process.cwd(), "public", rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, contents);
}

async function main() {
  await prisma.event.deleteMany();
  await prisma.screenshot.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.creator.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash(process.env.ADMIN_PASSWORD ?? "admin1234", 10);
  await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL ?? "admin@redmoth.local",
      passwordHash,
    },
  });

  const [writing, research, image, ops] = await Promise.all([
    prisma.category.create({ data: { name: "Writing", slug: "writing" } }),
    prisma.category.create({ data: { name: "Research", slug: "research" } }),
    prisma.category.create({ data: { name: "Image", slug: "image" } }),
    prisma.category.create({ data: { name: "Ops", slug: "ops" } }),
  ]);

  const [nova, kiln, atlas] = await Promise.all([
    prisma.creator.create({
      data: {
        name: "Nova Labs",
        slug: "nova-labs",
        bio: "Small studio shipping focused AI products for writers and operators.",
        website: "https://example.com",
      },
    }),
    prisma.creator.create({
      data: {
        name: "Kiln Studio",
        slug: "kiln-studio",
        bio: "Design-led tools for image and research workflows.",
        website: "https://example.com",
      },
    }),
    prisma.creator.create({
      data: {
        name: "Atlas Field",
        slug: "atlas-field",
        bio: "Independent builders of data and support assistants.",
        website: "https://example.com",
      },
    }),
  ]);

  const tools = [
    {
      name: "Northline",
      slug: "northline",
      tagline: "Long-form drafting with a quiet, precise editor.",
      description: "Northline keeps research, outline, and draft in one surface so writers can ship without a cluttered AI sidebar.",
      body: "Use it for essays, product docs, and weekly briefs. Models stay in the background. You stay in the text.",
      websiteUrl: "https://example.com/northline",
      color: "#3b5bff",
      letter: "N",
      creatorId: nova.id,
      categoryId: writing.id,
      featured: true,
    },
    {
      name: "PulseQuery",
      slug: "pulsequery",
      tagline: "Ask your tables in plain language.",
      description: "PulseQuery turns warehouse questions into saved answers your team can trust.",
      body: "Connect a database, pin metrics, and share a live answer instead of a screenshot in Slack.",
      websiteUrl: "https://example.com/pulsequery",
      color: "#0f9f6e",
      letter: "P",
      creatorId: atlas.id,
      categoryId: research.id,
      featured: true,
    },
    {
      name: "Stillframe",
      slug: "stillframe",
      tagline: "Product shots from a short brief.",
      description: "Stillframe generates campaign stills that stay on-brand across aspect ratios.",
      body: "Upload a kit, lock a palette, and export a set that looks like a shoot — not a random prompt dump.",
      websiteUrl: "https://example.com/stillframe",
      color: "#c2410c",
      letter: "S",
      creatorId: kiln.id,
      categoryId: image.id,
      featured: false,
    },
    {
      name: "Forgekit",
      slug: "forgekit",
      tagline: "A copilot that stays in your repo.",
      description: "Forgekit reviews diffs, writes tests, and never leaves your git remote unless you say so.",
      body: "Built for teams that want AI in CI, not in a chat tab that forgets the codebase.",
      websiteUrl: "https://example.com/forgekit",
      color: "#111318",
      letter: "F",
      creatorId: nova.id,
      categoryId: ops.id,
      featured: false,
    },
    {
      name: "Orbitmail",
      slug: "orbitmail",
      tagline: "Inbox triage that sounds like you.",
      description: "Orbitmail drafts replies from your sent history and labels what actually needs a human.",
      body: "Connect one mailbox. Keep the tone. Skip the generic assistant voice.",
      websiteUrl: "https://example.com/orbitmail",
      color: "#6d28d9",
      letter: "O",
      creatorId: atlas.id,
      categoryId: writing.id,
      featured: false,
    },
    {
      name: "Lumenboard",
      slug: "lumenboard",
      tagline: "Research boards that cite themselves.",
      description: "Lumenboard turns PDFs and links into a board with quotes you can trace.",
      body: "Made for analysts who need a trail, not a summary that erases the source.",
      websiteUrl: "https://example.com/lumenboard",
      color: "#0369a1",
      letter: "L",
      creatorId: kiln.id,
      categoryId: research.id,
      featured: false,
    },
  ];

  for (const item of tools) {
    const logoPath = `uploads/logos/${item.slug}.svg`;
    await writePublic(logoPath, logo(item.letter, item.color));
    const tool = await prisma.tool.create({
      data: {
        name: item.name,
        slug: item.slug,
        tagline: item.tagline,
        description: item.description,
        body: item.body,
        websiteUrl: item.websiteUrl,
        logoUrl: `/${logoPath}`,
        status: "PUBLISHED",
        featured: item.featured,
        pricing: ({ northline: "FREEMIUM", pulsequery: "FREE_TRIAL", lumenboard: "FREE", stillframe: "PAID", forgekit: "CONTACT" } as const)[item.slug as string] ?? "PAID",
        creatorId: item.creatorId,
        categoryId: item.categoryId,
      },
    });

    for (const [index, caption] of ["Home", "Workspace", "Export"].entries()) {
      const shotPath = `uploads/screenshots/${item.slug}-${index + 1}.svg`;
      await writePublic(shotPath, frame(`${item.name} · ${caption}`, item.color, item.tagline));
      await prisma.screenshot.create({
        data: {
          toolId: tool.id,
          imageUrl: `/${shotPath}`,
          alt: `${item.name} ${caption.toLowerCase()} screenshot`,
          sortOrder: index,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
