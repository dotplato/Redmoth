export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

/** `slugify(name)`, suffixed -2, -3… until `taken` says it's free. */
export async function uniqueSlug(name: string, taken: (slug: string) => Promise<boolean>) {
  const base = slugify(name) || "item";
  let slug = base;
  for (let n = 2; await taken(slug); n++) slug = `${base}-${n}`;
  return slug;
}
