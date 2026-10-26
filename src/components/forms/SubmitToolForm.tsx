"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { scoreListing, type ListingInputs } from "@/lib/listing-score";
import { SCENARIO_STEPS, type ScenarioKey } from "@/lib/scenario";
import { UploadFailed, uploadFormFiles } from "@/lib/upload-client";
import { MAX_SCREENSHOTS } from "@/lib/upload-limits";
import { KeywordsInput } from "./KeywordsInput";
import { PricingSelect } from "./PricingSelect";
import { ScenarioGuide } from "./ScenarioGuide";
import { ScoreMeter, ScorePill } from "./ScoreMeter";
import { ScreenshotPicker, type PickedShot } from "./ScreenshotPicker";
import { YesNo } from "./YesNo";

type Option = { id: string; name: string };
type Errors = Record<string, string>;

const EMPTY_SCENARIO = Object.fromEntries(SCENARIO_STEPS.map((step) => [step.key, ""])) as Record<ScenarioKey, string>;

/** Reads the live form into the shape the listing score needs. */
function measure(form: HTMLFormElement): ListingInputs {
  const data = new FormData(form);
  const text = (key: string) => String(data.get(key) ?? "");
  const files = (key: string) => data.getAll(key).filter((value) => value instanceof File && value.size > 0).length;
  const choice = (key: string) => (data.get(key) === "yes" ? true : data.get(key) === "no" ? false : null);
  return {
    name: text("name"),
    tagline: text("tagline"),
    websiteUrl: text("websiteUrl"),
    categoryId: text("categoryId"),
    hasLogo: files("logo") > 0 || /^https?:\/\//.test(text("logoUrl")),
    description: text("description"),
    body: text("body"),
    scenario: Object.fromEntries(SCENARIO_STEPS.map((step) => [step.key, text(step.key)])) as Record<ScenarioKey, string>,
    screenshots: 0, // screenshots live in component state, not the form; the caller fills this in
    releaseDate: text("releaseDate"),
    pricing: text("pricing"),
    affiliate: choice("affiliateProgram"),
    affiliateUrl: text("affiliateSignupUrl"),
  };
}

const EMPTY_INPUTS: ListingInputs = {
  name: "",
  tagline: "",
  websiteUrl: "",
  categoryId: "",
  hasLogo: false,
  description: "",
  body: "",
  scenario: EMPTY_SCENARIO,
  screenshots: 0,
  releaseDate: "",
  pricing: "",
  affiliate: null,
  affiliateUrl: "",
};

/** A listing being edited after review (its current values and the admin's feedback). */
export type ExistingListing = {
  id: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  categoryId: string;
  releaseDate: string; // yyyy-mm-dd or ""
  seoKeywords: string;
  logoUrl: string | null;
  description: string;
  body: string;
  scenario: Record<ScenarioKey, string>;
  pricing: string;
  affiliateProgram: boolean;
  affiliateSignupUrl: string;
  makerName: string;
  screenshots: { id: string; imageUrl: string }[];
  reviewNote: string | null;
};

function inputsFrom(existing: ExistingListing): ListingInputs {
  return {
    name: existing.name,
    tagline: existing.tagline,
    websiteUrl: existing.websiteUrl,
    categoryId: existing.categoryId,
    hasLogo: Boolean(existing.logoUrl),
    description: existing.description,
    body: existing.body,
    scenario: existing.scenario,
    screenshots: existing.screenshots.length,
    releaseDate: existing.releaseDate,
    pricing: existing.pricing,
    affiliate: existing.affiliateProgram,
    affiliateUrl: existing.affiliateSignupUrl,
  };
}

export function SubmitToolForm({
  categories,
  creator,
  existing,
}: {
  categories: Option[];
  creator: { name: string; email: string | null };
  existing?: ExistingListing;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ name: string } | null>(null);

  const [logoMode, setLogoMode] = useState<"upload" | "url">("upload");
  const [logoPreview, setLogoPreview] = useState<string | null>(existing?.logoUrl ?? null);
  const [shots, setShots] = useState<PickedShot[]>([]);
  // Screenshots already saved on the listing that the maker keeps (edit mode only).
  const [kept, setKept] = useState(existing?.screenshots ?? []);
  const [scenario, setScenario] = useState<Record<ScenarioKey, string>>(existing?.scenario ?? EMPTY_SCENARIO);
  const [inputs, setInputs] = useState<ListingInputs>(() => (existing ? inputsFrom(existing) : EMPTY_INPUTS));
  const formRef = useRef<HTMLFormElement>(null);
  const score = scoreListing(inputs);

  // Re-read the form after state-driven changes (logo mode switch, conditional fields) have rendered.
  const remeasure = () =>
    requestAnimationFrame(() => formRef.current && setInputs(withShots(measure(formRef.current))));
  const [pricing, setPricing] = useState(existing?.pricing ?? "");
  const [affiliate, setAffiliate] = useState<boolean | null>(existing ? existing.affiliateProgram : null);
  // The form can't see picked/kept screenshots or a kept logo, so add them to what it measures.
  const withShots = (measured: ListingInputs, picked = shots.length, keptCount = kept.length): ListingInputs => ({
    ...measured,
    screenshots: picked + keptCount,
    hasLogo: measured.hasLogo || Boolean(existing?.logoUrl),
  });

  function preview(files: FileList | null, set: (urls: string[]) => void) {
    const list = Array.from(files ?? []).slice(0, 6);
    Promise.all(
      list.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          }),
      ),
    ).then(set);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    // Validation lives on the server so every field's error comes back in one pass.
    setSubmitting(true);
    setErrors({});
    const body = new FormData(formEl);
    for (const shot of shots) body.append("screenshots", shot.file);
    for (const shot of kept) body.append("keepScreenshot", shot.id);
    try {
      await uploadFormFiles(body, { logo: "logos", screenshots: "screenshots" });
    } catch (err) {
      setSubmitting(false);
      const next = err instanceof UploadFailed ? { [err.field]: err.message } : { form: "Could not upload your images. Please try again." };
      setErrors(next);
      focusFirstError(next);
      return;
    }
    const res = await fetch(existing ? `/api/submit/${existing.id}` : "/api/submit", { method: existing ? "PATCH" : "POST", body });
    const json = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      const next = json.errors ?? { form: "Something went wrong. Please try again." };
      setErrors(next);
      focusFirstError(next);
      return;
    }
    setDone({ name: json.tool.name });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center sm:p-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent)] text-2xl text-[var(--accent-ink)]">✓</span>
        <h2 className="mt-6 text-3xl">
          {existing ? `${done.name} is back in review` : `Thanks — ${done.name} is in review`}
        </h2>
        <p className="mt-3 text-[var(--muted)]">
          {existing
            ? "Thanks for the updates. We'll take another look and email you the outcome."
            : "We check every submission by hand. Once it’s approved it goes live on Discover. You can follow its status in your account."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/account" className="btn btn-primary">
            Go to your account
          </Link>
          {existing ? null : (
            <button type="button" onClick={() => location.reload()} className="btn btn-outline">
              Submit another
            </button>
          )}
        </div>
      </div>
    );
  }

  // Drop a field's error as soon as the user edits it, instead of waiting for the next submit.
  function clearError(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name;
    const key = name === "logoUrl" ? "logo" : name;
    if (!errors[key] && !errors[name] && !errors.form) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next[name];
      delete next.form;
      return next;
    });
  }

  const err = (key: string) => (errors[key] ? <p className="text-xs font-bold text-[var(--danger)]">{errors[key]}</p> : null);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onChange={(event) => {
        clearError(event);
        setInputs(withShots(measure(event.currentTarget)));
      }}
      noValidate
      className="grid min-w-0 gap-6 pb-20 lg:pb-0"
    >
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <input type="text" name="company_site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {existing?.reviewNote ? (
        <div className="rounded-[1.25rem] border border-[var(--danger)] bg-[var(--danger-soft)] p-5">
          <p className="font-bold text-[var(--danger)]">Feedback from our review team</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[var(--ink-soft)]">{existing.reviewNote}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">Update anything below, then resubmit. We&rsquo;ll review it again.</p>
        </div>
      ) : null}

      <Section step={1} title="The basics" description="How your app appears on Discover.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App name" error={err("name")}>
            <input id="f-name" name="name" required defaultValue={existing?.name} className="input" placeholder="e.g. Northline" />
          </Field>
          <Field label="Website" error={err("websiteUrl")}>
            <input id="f-websiteUrl" name="websiteUrl" type="url" required defaultValue={existing?.websiteUrl} className="input" placeholder="https://" />
          </Field>
        </div>
        <Field label="Tagline" hint="4–10 words" error={err("tagline")}>
          <input id="f-tagline" name="tagline" required maxLength={90} defaultValue={existing?.tagline} className="input" placeholder="Long-form drafting with a quiet, precise editor" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" error={err("categoryId")}>
            <select id="f-categoryId" name="categoryId" required defaultValue={existing?.categoryId ?? ""} className="input">
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Release date" hint="optional" error={err("releaseDate")}>
            <input id="f-releaseDate" name="releaseDate" type="date" defaultValue={existing?.releaseDate} className="input" />
          </Field>
        </div>

        <div className="field">
          <div className="flex items-center justify-between gap-3">
            <span>Logo</span>
            <div className="flex gap-1 text-xs font-bold">
              {(["upload", "url"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setLogoMode(mode);
                    setLogoPreview(null);
                    remeasure();
                  }}
                  className={`rounded-full px-2.5 py-1 ${logoMode === mode ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                >
                  {mode === "upload" ? "Upload" : "Paste URL"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[16px] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] text-[var(--faint)]">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="" className="h-full w-full object-contain" />
              ) : (
                "+"
              )}
            </span>
            {logoMode === "upload" ? (
              <input
                id="f-logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => preview(e.target.files, (urls) => setLogoPreview(urls[0] ?? null))}
                className="input"
              />
            ) : (
              <input
                id="f-logo"
                name="logoUrl"
                type="url"
                placeholder="https://…/logo.png"
                onChange={(e) => setLogoPreview(e.target.value || null)}
                className="input"
              />
            )}
          </div>
          <span className="field-hint">
            Square image works best. PNG, JPG, WebP or GIF, up to 5 MB.
            {existing?.logoUrl ? " Leave empty to keep your current logo." : ""}
          </span>
          {err("logo") ?? err("logoUrl")}
        </div>
      </Section>

      <Section step={2} title="Describe it" description="Shown on your app's page.">
        <Field label="Short description" hint="one or two sentences" error={err("description")}>
          <textarea id="f-description" name="description" required maxLength={400} defaultValue={existing?.description} className="input" placeholder="What it does and who it's for." />
        </Field>
        <Field label="Details" hint="features, use cases, pricing" error={err("body")}>
          <textarea id="f-body" name="body" required defaultValue={existing?.body} className="input min-h-40" placeholder="Leave a blank line between paragraphs." />
        </Field>
        <div className="field">
          <span>
            SEO keywords<span className="field-hint"> · optional, up to 15 · what people would search to find your app</span>
          </span>
          <KeywordsInput id="f-seoKeywords" name="seoKeywords" defaultValue={existing?.seoKeywords} placeholder="e.g. cold email software, sales outreach" />
          {err("seoKeywords")}
        </div>
      </Section>

      <Section
        step={3}
        title="Example scenario"
        description="Describe one real user, their problem, how your app solves it, and the result."
      >
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="grid gap-4">
            {SCENARIO_STEPS.map((step, index) => (
              <Field key={step.key} label={`${index + 1}. ${step.label}`} hint={step.hint} error={err(step.key)}>
                <textarea
                  id={`f-${step.key}`}
                  name={step.key}
                  required
                  rows={2}
                  maxLength={300}
                  value={scenario[step.key]}
                  onChange={(e) => setScenario((prev) => ({ ...prev, [step.key]: e.target.value }))}
                  placeholder={step.placeholder}
                  className="input !min-h-0"
                />
              </Field>
            ))}
          </div>
          <ScenarioGuide draft={scenario} />
        </div>
      </Section>

      <Section step={4} title="Pricing & partnership">
        <div className="field">
          <span>Pricing model</span>
          <PricingSelect id="f-pricing" name="pricing" value={pricing} onChange={setPricing} />
          <span className="field-hint">Shown as a coloured tag on your listing and used by the price filter on Discover.</span>
          {err("pricing")}
        </div>

        <div className="field" id="f-affiliateProgram">
          <span>Do you have an affiliate program?</span>
          <YesNo name="affiliateProgram" value={affiliate} onChange={setAffiliate} />
          {err("affiliateProgram")}
        </div>

        {affiliate === true ? (
          <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <Field label="Affiliate program signup link" error={err("affiliateSignupUrl")}>
              <input id="f-affiliateSignupUrl" name="affiliateSignupUrl" type="url" required defaultValue={existing?.affiliateSignupUrl} className="input" placeholder="https://yourapp.com/affiliates" />
            </Field>
            <p className="flex gap-2 text-sm text-[var(--ink-soft)]">
              <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
              Your listing stays free; we simply use our affiliate link to your app.
            </p>
          </div>
        ) : null}
        {affiliate === false ? (
          <div className="flex gap-3 rounded-2xl bg-[var(--accent-soft)] p-4 text-sm leading-6 text-[var(--ink-soft)]">
            <span aria-hidden className="text-base">💡</span>
            <p>
              <span className="font-bold text-[var(--ink)]">We recommend starting one.</span> An affiliate program lets
              directories, newsletters and creators earn from recommending you, which brings more motivated
              traffic at no upfront cost. You can add it to your listing any time.
            </p>
          </div>
        ) : null}
      </Section>

      <Section step={5} title="Screenshots" description={`At least one is required, up to ${MAX_SCREENSHOTS}. Wide 16:10 images look best.`}>
        <p className="flex gap-2.5 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm leading-6 text-[var(--ink-soft)]">
          <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)] ring-1 ring-[var(--ink)]" />
          <span>
            <span className="font-bold text-[var(--ink)]">Use in-app screenshots.</span> Show the real product
            screens people will use, not logos, ads or marketing graphics.
          </span>
        </p>
        {kept.length ? (
          <div>
            <p className="mb-2 text-xs font-bold text-[var(--ink-soft)]">Current screenshots · remove any you want to replace</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {kept.map((shot, index) => (
                <div key={shot.id} className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-deep)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shot.imageUrl} alt={`Current screenshot ${index + 1}`} className="aspect-[16/10] w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const next = kept.filter((item) => item.id !== shot.id);
                      setKept(next);
                      setInputs((prev) => ({ ...prev, screenshots: shots.length + next.length }));
                    }}
                    aria-label={`Remove current screenshot ${index + 1}`}
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-sm text-[var(--danger)] shadow"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <ScreenshotPicker
          shots={shots}
          max={MAX_SCREENSHOTS - kept.length}
          onChange={(next) => {
            setShots(next);
            setInputs((prev) => ({ ...prev, screenshots: next.length + kept.length }));
            setErrors((prev) => {
              const rest = { ...prev };
              delete rest.screenshots;
              return rest;
            });
          }}
        />
        {err("screenshots")}
      </Section>

      <Section step={6} title="Maker" description="Shown on your listing as the company or person behind the app.">
        <Field label="Maker or company name" error={err("makerName")}>
          <input
            id="f-makerName"
            name="makerName"
            required
            maxLength={80}
            defaultValue={existing?.makerName ?? creator.name}
            className="input"
            placeholder="e.g. Nova Labs"
          />
        </Field>
        <p className="text-xs text-[var(--muted)]">
          Submitting as <span className="font-bold text-[var(--ink)]">{creator.name}</span>
          {creator.email ? ` (${creator.email})` : ""}. We&rsquo;ll use your account email for review updates.
        </p>
      </Section>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={submitting} className="btn btn-accent btn-lg">
          {submitting ? "Submitting…" : existing ? "Resubmit for review" : "Submit for review"}
        </button>
        <p className="text-sm text-[var(--muted)]">Listing is free. We review every app before it goes live.</p>
        {errors.form ? <p role="alert" className="basis-full text-sm font-bold text-[var(--danger)]">{errors.form}</p> : null}
        {Object.keys(errors).length && !errors.form ? (
          <p role="alert" className="basis-full text-sm font-bold text-[var(--danger)]">
            Please fix the highlighted fields above.
          </p>
        ) : null}
      </div>
    </form>
    <div className="hidden lg:sticky lg:top-24 lg:block">
      <ScoreMeter result={score} />
    </div>
    <ScorePill result={score} />
    </div>
  );
}

function focusFirstError(errors: Errors) {
  const first = Object.keys(errors)[0];
  const el = document.getElementById(`f-${first === "logoUrl" ? "logo" : first}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true });
}

function Section({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-xs font-bold text-white">{step}</span>
        <div>
          <h2 className="text-xl">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-[var(--muted)]">{description}</p> : null}
        </div>
      </div>
      <div className="mt-6 grid gap-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {hint ? <span className="field-hint"> · {hint}</span> : null}
      </span>
      {children}
      {error}
    </label>
  );
}
