"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import { Spinner } from "../Spinner";
import { EmptyRow } from "./PageHeader";

type Category = { id: string; name: string; slug: string; _count: { tools: number } };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  // Busy until the request is done and the refreshed list has arrived; `action` labels the button.
  const [action, setAction] = useState<{ type: "add" } | { type: "remove"; id: string } | null>(null);
  const [fetching, setFetching] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const busy = fetching || refreshing;
  const adding = busy && action?.type === "add";
  const removingId = busy && action?.type === "remove" ? action.id : null;
  const refresh = () => startRefresh(() => router.refresh());

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setAction({ type: "add" });
    setFetching(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, slug: slug || slugify(name) }),
    });
    if (!res.ok) {
      setFetching(false);
      setError("Could not add it. The slug may already exist.");
      return;
    }
    setName("");
    setSlug("");
    setSlugTouched(false);
    setFetching(false);
    refresh();
  }

  async function remove(category: Category) {
    setError("");
    if (busy) return;
    if (!confirm(`Remove “${category.name}”?`)) return;
    setAction({ type: "remove", id: category.id });
    setFetching(true);
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    if (!res.ok) {
      setFetching(false);
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Could not remove it.");
      return;
    }
    setFetching(false);
    refresh();
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
                <button onClick={() => remove(category)} disabled={busy} className="btn btn-danger btn-sm">
                  {removingId === category.id ? <Spinner /> : null}
                  {removingId === category.id ? "Removing…" : "Remove"}
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
        <button disabled={busy} className="btn btn-primary">
          {adding ? <Spinner /> : null}
          {adding ? "Adding…" : "Add category"}
        </button>
      </form>
    </div>
  );
}
