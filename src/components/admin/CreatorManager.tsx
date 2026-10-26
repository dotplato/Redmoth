"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hostname } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { ToolLogo } from "../ToolLogo";
import { Spinner } from "../Spinner";
import { EmptyRow } from "./PageHeader";

type Creator = {
  id: string;
  name: string;
  slug: string;
  bio: string;
  website: string | null;
  avatarUrl: string | null;
  _count: { tools: number };
};

export function CreatorManager({ creators }: { creators: Creator[] }) {
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
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/admin/creators", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data, name, slug: slug || slugify(name) }),
    });
    if (!res.ok) {
      setFetching(false);
      setError("Could not add creator. Check the website URL and that the bio is at least 8 characters.");
      return;
    }
    form.reset();
    setName("");
    setSlug("");
    setSlugTouched(false);
    setFetching(false);
    refresh();
  }

  async function remove(creator: Creator) {
    setError("");
    if (busy) return;
    if (!confirm(`Remove ${creator.name}?`)) return;
    setAction({ type: "remove", id: creator.id });
    setFetching(true);
    const res = await fetch(`/api/admin/creators/${creator.id}`, { method: "DELETE" });
    if (!res.ok) {
      setFetching(false);
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Could not remove creator.");
      return;
    }
    setFetching(false);
    refresh();
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="card overflow-hidden">
        {creators.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {creators.map((creator) => (
              <li key={creator.id} className="flex items-start gap-4 px-5 py-4">
                <ToolLogo src={creator.avatarUrl} name={creator.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="font-bold">{creator.name}</p>
                    <p className="text-xs text-[var(--faint)]">/{creator.slug}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-[var(--muted)]">{creator.bio}</p>
                  <p className="mt-1.5 text-xs text-[var(--faint)]">
                    {creator._count.tools} {creator._count.tools === 1 ? "tool" : "tools"}
                    {creator.website ? ` · ${hostname(creator.website)}` : ""}
                  </p>
                </div>
                <button onClick={() => remove(creator)} disabled={busy} className="btn btn-danger btn-sm">
                  {removingId === creator.id ? <Spinner /> : null}
                  {removingId === creator.id ? "Removing…" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>No creators yet.</EmptyRow>
        )}
      </div>

      <form onSubmit={onSubmit} className="card grid gap-4 p-5 lg:sticky lg:top-6">
        <h2 className="">Add creator</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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
        </div>
        <label className="field">
          <span>
            Website <span className="field-hint">· optional</span>
          </span>
          <input name="website" type="url" placeholder="https://" className="input" />
        </label>
        <label className="field">
          Bio
          <textarea name="bio" required minLength={8} placeholder="One or two sentences about the maker." className="input" />
        </label>
        {error ? <p role="alert" className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button disabled={busy} className="btn btn-primary">
          {adding ? <Spinner /> : null}
          {adding ? "Adding…" : "Add creator"}
        </button>
      </form>
    </div>
  );
}
