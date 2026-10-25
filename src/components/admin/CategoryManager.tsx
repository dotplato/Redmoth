"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import { EmptyRow } from "./PageHeader";

type Category = { id: string; name: string; slug: string; _count: { tools: number } };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, slug: slug || slugify(name) }),
    });
    if (!res.ok) {
      setError("Could not add it. The slug may already exist.");
      return;
    }
    setName("");
    setSlug("");
    setSlugTouched(false);
    router.refresh();
  }

  async function remove(category: Category) {
    setError("");
    if (!confirm(`Remove “${category.name}”?`)) return;
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Could not remove it.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="card overflow-hidden">
        {categories.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{category.name}</p>
                  <p className="text-xs text-[var(--faint)]">/{category.slug}</p>
                </div>
                <span className="text-sm text-[var(--muted)]">
                  {category._count.tools} {category._count.tools === 1 ? "tool" : "tools"}
                </span>
                <button onClick={() => remove(category)} className="btn btn-danger btn-sm">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>No categories yet.</EmptyRow>
        )}
      </div>

      <form onSubmit={onSubmit} className="card grid gap-4 p-5 lg:sticky lg:top-6">
        <h2 className="">Add category</h2>
        <label className="field">
          Name
          <input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className="input"
          />
        </label>
        <label className="field">
          Slug
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className="input text-[13px]"
          />
        </label>
        {error ? <p role="alert" className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button className="btn btn-primary">Add category</button>
      </form>
    </div>
  );
}
