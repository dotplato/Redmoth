"use client";

import { FormEvent, useEffect, useState } from "react";
import { uploadImage } from "@/lib/upload-client";
import { ScreenshotPicker, type PickedShot } from "../forms/ScreenshotPicker";

export type AiFillFields = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  body: string;
  websiteUrl: string;
  creatorId: string;
  categoryId: string;
  scenarioUser: string;
  scenarioProblem: string;
  scenarioHow: string;
  scenarioResult: string;
  seoKeywords: string;
};

export type AiFillApply = {
  fields: AiFillFields;
  pricing: string | null;
  logoUrl: string | null;
  screenshots: PickedShot[];
};

const SOURCE_LABEL = {
  search: "Web search",
  "third-party": "Wikipedia / DuckDuckGo / official site",
  description: "Your summary",
} as const;

export function AiFillPanel({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (data: AiFillApply) => void;
}) {
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<PickedShot[]>([]);
  const [description, setDescription] = useState("");
  const [needsDescription, setNeedsDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function pickLogo(file: File | null) {
    setLogo(file);
    setLogoUrl(null);
    setLogoPreview(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const form = new FormData();
    form.set("name", name);
    form.set("websiteUrl", websiteUrl);
    form.set("description", description);

    try {
      // Logo is stored on the first run; don't re-upload it when retrying with a summary.
      let storedLogo = logoUrl;
      if (logo && !storedLogo) {
        storedLogo = await uploadImage(logo, "logos", "/api/admin/uploads");
        setLogoUrl(storedLogo);
      }

      const res = await fetch("/api/admin/ai-fill", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "AI fill failed.");
        return;
      }
      if (json.status === "need_description") {
        setNeedsDescription(true);
        setError(json.reason);
        return;
      }

      onApply({ fields: json.fields, pricing: json.pricing ?? null, logoUrl: storedLogo, screenshots });
      const notes = [
        `Filled from ${SOURCE_LABEL[json.source as keyof typeof SOURCE_LABEL]}.`,
        json.suggestedCreator ? `Creator “${json.suggestedCreator}” isn't in your list yet — add it under Creators.` : "",
        json.suggestedCategory ? `Suggested category “${json.suggestedCategory}” isn't in your list.` : "",
        json.pricing ? "" : "Pricing couldn't be determined — choose it manually.",
        "Review the form, then save.",
      ];
      setMessage(notes.filter(Boolean).join(" "));
      setNeedsDescription(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div inert={!open} className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[rgba(22,20,15,0.32)] backdrop-blur-[2px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-fill-title"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-[var(--surface)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          open ? "translate-x-0 shadow-[var(--shadow-lg)]" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-[var(--ink)]">✦</span>
            <div>
              <h2 id="ai-fill-title" className="">
                AI data entry
              </h2>
              <p className="text-xs text-[var(--muted)]">Web search → other sources → your summary</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost h-8 w-8 px-0">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 content-start gap-5 overflow-y-auto px-6 py-6">
            <label className="field">
              Tool name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Excalidraw"
                className="input"
              />
            </label>

            <label className="field">
              <span>
                Website <span className="field-hint">· optional, improves accuracy</span>
              </span>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://"
                className="input"
              />
            </label>

            <div className="field">
              Logo
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="" className="h-12 w-12 shrink-0 rounded-[14px] object-cover ring-1 ring-[var(--line)]" />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-dashed border-[var(--line-strong)] text-[var(--faint)]">
                    +
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*,.svg"
                  aria-label="Logo"
                  onChange={(e) => pickLogo(e.target.files?.[0] ?? null)}
                  className="input"
                />
              </div>
            </div>

            <div className="field">
              Screenshots
              {/* Labels can't wrap the picker: a click anywhere would re-open the file dialog. */}
              <ScreenshotPicker id="ai-screenshots" shots={screenshots} onChange={setScreenshots} allowSvg compact />
              {screenshots.length ? (
                <span className="text-xs font-normal text-[var(--muted)]">Uploaded when you save the tool</span>
              ) : null}
            </div>

            {needsDescription ? (
              <label className="field">
                Short summary of the tool
                <textarea
                  required
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What it does, who it's for, key features, who makes it…"
                  className="input min-h-32"
                />
              </label>
            ) : null}

            {error ? (
              <p role="alert" className="rounded-xl bg-[var(--warn-soft)] px-4 py-3 text-sm leading-6 text-[var(--warn)]">
                {error}
              </p>
            ) : null}
            {message ? (
              <p role="status" className="rounded-xl bg-[var(--ok-soft)] px-4 py-3 text-sm leading-6 text-[var(--ok)]">
                {message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 border-t border-[var(--line)] px-6 py-4">
            {message ? (
              <button type="button" onClick={onClose} className="btn btn-outline">
                Done
              </button>
            ) : null}
            <button disabled={loading} className="btn btn-accent flex-1">
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Researching…
                </>
              ) : needsDescription ? (
                "Generate from summary"
              ) : message ? (
                "Run again"
              ) : (
                "Fill the form"
              )}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
