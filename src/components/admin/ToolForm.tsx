"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ToolLogo } from "../ToolLogo";
import { SCENARIO_STEPS } from "@/lib/scenario";
import { PricingSelect } from "../forms/PricingSelect";
import { KeywordsInput } from "../forms/KeywordsInput";
import { YesNo } from "../forms/YesNo";
import { uploadImage } from "@/lib/upload-client";
import { MAX_SCREENSHOTS } from "@/lib/upload-limits";
import { ScreenshotPicker, type PickedShot } from "../forms/ScreenshotPicker";
import { AiFillApply, AiFillPanel } from "./AiFillPanel";

type Option = { id: string; name: string };
type Shot = { id: string; imageUrl: string; alt: string };
type Tool = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  body: string;
  websiteUrl: string;
  logoUrl?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REJECTED";
  featured: boolean;
  pricing: string;
  exampleScenario?: string | null;
  scenarioUser?: string | null;
  scenarioProblem?: string | null;
  scenarioHow?: string | null;
  scenarioResult?: string | null;
  releaseDate?: Date | null;
  seoKeywords?: string | null;
  affiliateProgram: boolean;
  affiliateSignupUrl?: string | null;
  affiliateLink?: string | null;
  submitterEmail?: string | null;
  submittedAt?: Date | null;
  creatorId: string;
  categoryId: string;
  screenshots?: Shot[];
};

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  slug: "Slug",
  tagline: "Tagline",
  description: "Description",
  body: "Body",
  websiteUrl: "Website URL",
  creatorId: "Creator",
  categoryId: "Category",
  pricing: "Pricing model",
};

export function ToolForm({
  tool,
  creators,
  categories,
}: {
  tool?: Tool;
  creators: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [pendingShots, setPendingShots] = useState<PickedShot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [shotError, setShotError] = useState("");
  const savedShots = tool?.screenshots?.length ?? 0;
  const room = Math.max(MAX_SCREENSHOTS - savedShots, 0);
  const [values, setValues] = useState({
    name: tool?.name ?? "",
    slug: tool?.slug ?? "",
    tagline: tool?.tagline ?? "",
    description: tool?.description ?? "",
    body: tool?.body ?? "",
    websiteUrl: tool?.websiteUrl ?? "",
    logoUrl: tool?.logoUrl ?? "",
    creatorId: tool?.creatorId ?? creators[0]?.id ?? "",
    categoryId: tool?.categoryId ?? categories[0]?.id ?? "",
    exampleScenario: tool?.exampleScenario ?? "",
    scenarioUser: tool?.scenarioUser ?? "",
    scenarioProblem: tool?.scenarioProblem ?? "",
    scenarioHow: tool?.scenarioHow ?? "",
    scenarioResult: tool?.scenarioResult ?? "",
    releaseDate: tool?.releaseDate ? new Date(tool.releaseDate).toISOString().slice(0, 10) : "",
    seoKeywords: tool?.seoKeywords ?? "",
    affiliateSignupUrl: tool?.affiliateSignupUrl ?? "",
    affiliateLink: tool?.affiliateLink ?? "",
  });
  // New tools start unselected, so a pricing the AI couldn't determine is visible rather than a silent "Paid".
  const [pricing, setPricing] = useState<string>(tool?.pricing ?? "");
  const [affiliateProgram, setAffiliateProgram] = useState(tool?.affiliateProgram ?? false);
  const isEdit = Boolean(tool?.id);

  function set(name: keyof typeof values) {
    return (value: string) => setValues((prev) => ({ ...prev, [name]: value }));
  }

  function applyAi({ fields, logoUrl, screenshots, pricing: aiPricing }: AiFillApply) {
    if (aiPricing) setPricing(aiPricing);
    // Only overwrite scenario steps (and keywords) the AI actually wrote.
    const scenario = Object.fromEntries(
      SCENARIO_STEPS.map((step) => [step.key, fields[step.key]?.trim() ? fields[step.key] : values[step.key]]),
    );
    setValues((prev) => ({
      ...prev,
      ...fields,
      ...scenario,
      seoKeywords: fields.seoKeywords?.trim() ? fields.seoKeywords : prev.seoKeywords,
      creatorId: fields.creatorId || prev.creatorId,
      categoryId: fields.categoryId || prev.categoryId,
      logoUrl: logoUrl ?? prev.logoUrl,
    }));
    // Merge with anything already picked in the side panel, within the per-tool limit.
    setPendingShots((prev) => [...prev, ...screenshots].slice(0, room));
    setAiFilled(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      ...values,
      logoUrl: values.logoUrl || null,
      status: form.get("status"),
      featured: form.get("featured") === "on",
      pricing,
      affiliateProgram,
      // Turning the program off also stops Visit from using the affiliate link.
      affiliateSignupUrl: affiliateProgram ? values.affiliateSignupUrl : "",
      affiliateLink: affiliateProgram ? values.affiliateLink : "",
    };
    const res = await fetch(isEdit ? `/api/admin/tools/${tool!.id}` : "/api/admin/tools", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const fields = Object.keys(json?.error?.fieldErrors ?? {}).map((key) => FIELD_LABELS[key] ?? key);
      setError(
        fields.length
          ? `Check these fields: ${fields.join(", ")}.`
          : "Could not save the tool. Is the slug already taken?",
      );
      setSaving(false);
      return;
    }
    const json = await res.json();
    await uploadPending(json.tool.id);
    setSaving(false);
    setAiFilled(false);
    router.push(`/admin/tools/${json.tool.id}`);
    router.refresh();
  }

  async function onDelete() {
    if (!tool?.id || !confirm(`Delete ${tool.name}? This also removes its screenshots and analytics.`)) return;
    await fetch(`/api/admin/tools/${tool.id}`, { method: "DELETE" });
    router.push("/admin/tools");
    router.refresh();
  }

  /** Uploads picked screenshots one by one; keeps any that fail so they can be retried. */
  async function uploadPending(toolId: string) {
    setShotError("");
    const failed: PickedShot[] = [];
    for (const shot of pendingShots) {
      try {
        const body = new FormData();
        body.set("url", await uploadImage(shot.file, "screenshots", "/api/admin/uploads"));
        body.set("alt", `${values.name} screenshot`);
        const res = await fetch(`/api/admin/tools/${toolId}/screenshots`, { method: "POST", body });
        if (!res.ok) failed.push(shot);
      } catch {
        failed.push(shot);
      }
    }
    setPendingShots(failed);
    if (failed.length) setShotError(`${failed.length} screenshot${failed.length === 1 ? "" : "s"} could not be uploaded.`);
  }

  async function uploadNow() {
    if (!tool?.id || !pendingShots.length) return;
    setUploading(true);
    await uploadPending(tool.id);
    setUploading(false);
    router.refresh();
  }

  async function removeShot(id: string) {
    await fetch(`/api/admin/screenshots/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <AiFillPanel open={aiOpen} onClose={() => setAiOpen(false)} onApply={applyAi} />

      <button
        type="button"
        onClick={() => setAiOpen(true)}
        className="group mb-6 flex w-full items-center gap-4 rounded-[1.25rem] border border-[var(--accent)]/25 bg-gradient-to-r from-[var(--accent-soft)] to-[var(--surface)] p-4 text-left transition hover:border-[var(--accent)]/60 sm:p-5"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-lg text-[var(--accent-ink)]">✦</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{aiFilled ? "Filled with AI — review and save" : "Fill this form with AI"}</span>
          <span className="block text-sm text-[var(--muted)]">
            Give a tool name, logo and screenshots. The AI researches the rest.
          </span>
        </span>
        <span className="hidden text-sm font-bold text-[var(--accent-ink)] transition group-hover:translate-x-0.5 sm:block">
          Open →
        </span>
      </button>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={onSubmit} className="grid gap-6">

          <Section title="Basics" description="How the tool appears in lists and search.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={values.name} onChange={set("name")} required />
              <Field label="Slug" value={values.slug} onChange={set("slug")} hint="URL: /tools/slug" required mono />
            </div>
            <Field label="Tagline" value={values.tagline} onChange={set("tagline")} hint="4–10 words" required />
            <Field
              label="Website URL"
              value={values.websiteUrl}
              onChange={set("websiteUrl")}
              hint="used by Visit unless an affiliate link is set"
              placeholder="https://"
              required
            />
            <div className="flex items-end gap-3">
              <ToolLogo src={values.logoUrl || null} name={values.name || "?"} />
              <div className="flex-1">
                <Field label="Logo URL" value={values.logoUrl} onChange={set("logoUrl")} placeholder="https://…" />
              </div>
            </div>
          </Section>

          <Section title="Content" description="Shown on the tool's detail page.">
            <label className="field">
              <span>
                Description <span className="field-hint">· one or two sentences</span>
              </span>
              <textarea
                required
                value={values.description}
                onChange={(e) => set("description")(e.target.value)}
                className="input"
              />
            </label>
            <label className="field">
              <span>
                Body <span className="field-hint">· blank line between paragraphs</span>
              </span>
              <textarea
                required
                value={values.body}
                onChange={(e) => set("body")(e.target.value)}
                className="input min-h-44"
              />
            </label>
            <div className="field">
              <span>
                SEO keywords <span className="field-hint">· up to 15 · meta keywords and search</span>
              </span>
              <KeywordsInput value={values.seoKeywords} onChange={set("seoKeywords")} placeholder="e.g. ai writing assistant, long-form editor" />
            </div>
          </Section>


          <Section title="Example scenario" description="One real user, their problem, how the app helps, and the result.">
            {SCENARIO_STEPS.map((step, index) => (
              <label key={step.key} className="field">
                <span>
                  {index + 1}. {step.label} <span className="field-hint">· {step.hint}</span>
                </span>
                <textarea
                  rows={2}
                  value={values[step.key]}
                  onChange={(e) => set(step.key)(e.target.value)}
                  placeholder={step.placeholder}
                  className="input !min-h-0"
                />
              </label>
            ))}
            {values.exampleScenario && !SCENARIO_STEPS.some((step) => values[step.key].trim()) ? (
              <p className="rounded-xl bg-[var(--bg)] p-3 text-sm leading-6 text-[var(--muted)]">
                <span className="font-bold text-[var(--ink)]">Current single-paragraph scenario:</span> {values.exampleScenario}
                <span className="mt-1 block text-xs">Fill in the four steps above to replace it with the interactive version.</span>
              </p>
            ) : null}
          </Section>

          <Section title="Pricing & affiliate">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="field">
                Pricing model
                <PricingSelect value={pricing} onChange={setPricing} />
              </div>
              <div className="field">
                Affiliate program?
                <YesNo name="affiliateToggle" value={affiliateProgram} onChange={setAffiliateProgram} />
              </div>
            </div>
            {affiliateProgram ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Program signup link"
                  value={values.affiliateSignupUrl}
                  onChange={set("affiliateSignupUrl")}
                  hint="from the maker"
                  placeholder="https://"
                />
                <Field
                  label="Our affiliate link"
                  value={values.affiliateLink}
                  onChange={set("affiliateLink")}
                  hint="Visit uses this"
                  placeholder="https://"
                />
              </div>
            ) : null}
          </Section>

          <Section title="Classification">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                Creator
                <select value={values.creatorId} onChange={(e) => set("creatorId")(e.target.value)} className="input">
                  {creators.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Category
                <select value={values.categoryId} onChange={(e) => set("categoryId")(e.target.value)} className="input">
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field sm:max-w-[50%]">
              <span>
                Release date <span className="field-hint">· optional</span>
              </span>
              <input
                type="date"
                value={values.releaseDate}
                onChange={(e) => set("releaseDate")(e.target.value)}
                className="input"
              />
            </label>
          </Section>

          <div className="card sticky bottom-3 z-10 flex flex-wrap items-center gap-3 p-3 pl-4 shadow-[var(--shadow-lg)] sm:bottom-5">
            <select name="status" defaultValue={tool?.status ?? "DRAFT"} aria-label="Status" className="input h-10 w-auto">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={tool?.featured} className="h-4 w-4 accent-[var(--accent)]" />
              Featured
            </label>
            {error ? (
              <p role="alert" className="basis-full text-sm text-[var(--danger)] sm:order-none sm:basis-auto">
                {error}
              </p>
            ) : null}
            <div className="ml-auto flex items-center gap-2">
              {isEdit ? (
                <button type="button" onClick={onDelete} className="btn btn-danger">
                  Delete
                </button>
              ) : null}
              <button disabled={saving} className="btn btn-primary">
                {saving ? "Saving…" : isEdit ? "Save changes" : "Create tool"}
              </button>
            </div>
          </div>
        </form>

        <aside className="card p-5 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <h2 className="">Screenshots</h2>
            <span className="text-xs text-[var(--faint)]">
              {savedShots}/{MAX_SCREENSHOTS} saved
            </span>
          </div>

          {tool?.screenshots?.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-2.5">
              {tool.screenshots.map((shot) => (
                <li key={shot.id} className="group relative overflow-hidden rounded-xl border border-[var(--line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shot.imageUrl} alt={shot.alt} className="aspect-[16/10] w-full bg-[var(--bg-deep)] object-cover" />
                  <button
                    type="button"
                    onClick={() => removeShot(shot.id)}
                    aria-label="Remove screenshot"
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-sm text-[var(--danger)] shadow opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4">
            {room > 0 ? (
              <ScreenshotPicker id="admin-screenshots" shots={pendingShots} onChange={setPendingShots} max={room} allowSvg compact />
            ) : (
              <p className="text-xs text-[var(--muted)]">This tool has the maximum of {MAX_SCREENSHOTS} screenshots. Remove one to add another.</p>
            )}
          </div>
          {pendingShots.length ? (
            isEdit ? (
              <button type="button" onClick={uploadNow} disabled={uploading} className="btn btn-primary mt-3 w-full">
                {uploading ? "Uploading…" : `Upload ${pendingShots.length} now`}
              </button>
            ) : (
              <p className="mt-3 text-xs text-[var(--muted)]">Uploaded when you create the tool.</p>
            )
          ) : null}
          {shotError ? <p role="alert" className="mt-2 text-xs font-bold text-[var(--danger)]">{shotError}</p> : null}
        </aside>
      </div>
    </>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="">{title}</h2>
      {description ? <p className="mt-0.5 text-sm text-[var(--muted)]">{description}</p> : null}
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <label className="field">
      <span>
        {props.label}
        {props.hint ? <span className="field-hint"> · {props.hint}</span> : null}
      </span>
      <input
        value={props.value}
        required={props.required}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className={`input ${props.mono ? "text-[13px]" : ""}`}
      />
    </label>
  );
}
