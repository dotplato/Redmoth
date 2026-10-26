"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FlowMark, StackRow } from "../FlowMark";
import { ToolLogo } from "../ToolLogo";
import { FLOW_LIMITS } from "@/lib/flow-limits";
import { uploadFormFiles } from "@/lib/upload-client";

export type PickableApp = { id: string; name: string; tagline: string; logoUrl: string | null; category: string };

export type ExistingFlow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categoryId: string;
  logoUrl: string | null;
  stack: string[];
  steps: { toolId: string; title: string; description: string }[];
};

type Step = { key: number; toolId: string; title: string; description: string };
type Errors = Record<string, string>;

const SUGGESTED = 12;
let nextKey = 1;
const newStep = (toolId = ""): Step => ({ key: nextKey++, toolId, title: "", description: "" });

/** Create / edit a Flow: pick a stack of apps, write the steps, then name it. Publishes straight away. */
export function FlowForm({
  apps,
  categories,
  existing,
  initialStack = [],
}: {
  /** Published apps, most visited first. */
  apps: PickableApp[];
  categories: { id: string; name: string }[];
  existing?: ExistingFlow;
  /** App ids to start a new flow's stack with (each gets a step). */
  initialStack?: string[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [stack, setStack] = useState<string[]>(existing?.stack ?? initialStack);
  const [steps, setSteps] = useState<Step[]>(
    () => existing?.steps.map((step) => ({ ...newStep(step.toolId), ...step })) ?? initialStack.map((id) => newStep(id)),
  );
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [logoPreview, setLogoPreview] = useState<string | null>(existing?.logoUrl ?? null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const byId = new Map(apps.map((app) => [app.id, app]));
  const stackApps = stack.map((id) => byId.get(id)).filter((app): app is PickableApp => Boolean(app));
  const term = query.trim().toLowerCase();
  const results = term
    ? apps.filter((app) => [app.name, app.tagline, app.category].some((value) => value.toLowerCase().includes(term)))
    : apps.slice(0, SUGGESTED);

  function clear(...keys: string[]) {
    if (!keys.some((key) => errors[key]) && !errors.form) return;
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of keys) delete next[key];
      delete next.form;
      return next;
    });
  }

  function addApp(id: string) {
    if (stack.includes(id) || stack.length >= FLOW_LIMITS.maxStack) return;
    setStack((prev) => [...prev, id]);
    // Start a step for the new app, so the steps follow the stack without extra clicks.
    if (!steps.some((step) => step.toolId === id) && steps.length < FLOW_LIMITS.maxSteps) setSteps((prev) => [...prev, newStep(id)]);
    clear("stack", "steps");
  }

  function removeApp(id: string) {
    setStack((prev) => prev.filter((item) => item !== id));
    // Drop this app's untouched steps; keep written ones so nothing typed is lost (they'll ask for another app).
    setSteps((prev) =>
      prev.filter((step) => step.toolId !== id || step.title || step.description).map((step) => (step.toolId === id ? { ...step, toolId: "" } : step)),
    );
  }

  function updateStep(index: number, patch: Partial<Step>) {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, ...patch } : step)));
    clear(...Object.keys(patch).map((key) => `step-${index}-${key}`));
  }

  function moveStep(index: number, by: number) {
    setSteps((prev) => {
      const next = [...prev];
      const [step] = next.splice(index, 1);
      next.splice(index + by, 0, step);
      return next;
    });
    // Per-step errors are keyed by position, so they no longer line up after a move.
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith("step-"))));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith("step-"))));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    const body = new FormData(event.currentTarget);
    body.set("stack", JSON.stringify(stack));
    body.set("steps", JSON.stringify(steps.map(({ toolId, title, description }) => ({ toolId, title, description }))));
    if (removeLogo) body.set("removeLogo", "yes");
    try {
      await uploadFormFiles(body, { logo: "logos" });
    } catch (err) {
      setSaving(false);
      setErrors({ logo: err instanceof Error ? err.message : "Could not upload the icon." });
      return;
    }
    const res = await fetch(existing ? `/api/flows/${existing.id}` : "/api/flows", { method: existing ? "PATCH" : "POST", body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSaving(false);
      const next: Errors = json.errors ?? { form: "Something went wrong. Please try again." };
      setErrors(next);
      const first = Object.keys(next)[0];
      const el = document.getElementById(`f-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true });
      return;
    }
    router.push(`/flows/${json.flow.slug}${existing ? "" : "?created=1"}`);
    router.refresh();
  }

  const err = (key: string) => (errors[key] ? <p className="text-xs font-bold text-[var(--danger)]">{errors[key]}</p> : null);
  const stepErrors = Object.keys(errors).some((key) => key.startsWith("step-"));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <form ref={formRef} onSubmit={onSubmit} noValidate className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
        {/* 1 — Stack */}
        <Section step={1} title="Build your stack" description={`Pick the apps this flow uses (${FLOW_LIMITS.minStack}–${FLOW_LIMITS.maxStack}).`}>
          <div id="f-stack" tabIndex={-1} className="grid grid-cols-[minmax(0,1fr)] gap-3 outline-none">
            {stackApps.length ? (
              <ol className="flex flex-wrap gap-2">
                {stackApps.map((app, i) => (
                  <li key={app.id} className="flex max-w-full items-center gap-2 rounded-full border border-[var(--ink)] bg-[var(--accent-soft)] py-1 pl-1 pr-1.5 text-sm font-bold">
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[var(--ink)] px-1 text-[11px] text-white">{i + 1}</span>
                    <MiniLogo app={app} />
                    <span className="truncate">{app.name}</span>
                    <button
                      type="button"
                      onClick={() => removeApp(app.id)}
                      aria-label={`Remove ${app.name} from the stack`}
                      className="grid h-6 w-6 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--danger)]"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-xl border border-dashed border-[var(--line-strong)] px-4 py-3 text-sm text-[var(--muted)]">
                Your stack is empty. Add apps from the list below.
              </p>
            )}
            {err("stack")}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${apps.length} apps on redmoth…`}
              aria-label="Search apps to add"
              className="input"
            />
            <p className="eyebrow">{term ? `${results.length} match${results.length === 1 ? "" : "es"}` : "Popular apps"}</p>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
              {results.map((app) => {
                const added = stack.includes(app.id);
                const full = !added && stack.length >= FLOW_LIMITS.maxStack;
                return (
                  <li key={app.id}>
                    <button
                      type="button"
                      onClick={() => (added ? removeApp(app.id) : addApp(app.id))}
                      disabled={full}
                      aria-pressed={added}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-50 ${
                        added ? "border-[var(--ink)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--ink)]"
                      }`}
                    >
                      <ToolLogo src={app.logoUrl} name={app.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{app.name}</span>
                        <span className="block truncate text-xs text-[var(--muted)]">{app.tagline}</span>
                      </span>
                      <span
                        aria-hidden
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                          added ? "bg-[var(--ink)] text-[var(--accent)]" : "border border-[var(--line-strong)] text-[var(--muted)]"
                        }`}
                      >
                        {added ? "✓" : "+"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!results.length ? <p className="text-sm text-[var(--muted)]">No app matches “{query}”.</p> : null}
          </div>
        </Section>

        {/* 2 — Steps */}
        <Section step={2} title="Write the steps" description="What happens at each step, and which app does it. Add, remove or reorder steps.">
          <div id="f-steps" tabIndex={-1} className="grid grid-cols-[minmax(0,1fr)] gap-4 outline-none">
            {steps.length ? (
              <ol className="grid grid-cols-[minmax(0,1fr)] gap-4">
                {steps.map((step, i) => {
                  const app = byId.get(step.toolId);
                  return (
                    <li key={step.key} className="relative rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent)] font-display text-sm text-[var(--accent-ink)] ring-1 ring-[var(--ink)]">
                          {i + 1}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-sm font-bold">Step {i + 1}{app ? ` · ${app.name}` : ""}</p>
                        <div className="flex gap-1">
                          <IconButton label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => moveStep(i, -1)}>
                            ↑
                          </IconButton>
                          <IconButton label={`Move step ${i + 1} down`} disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)}>
                            ↓
                          </IconButton>
                          <IconButton label={`Remove step ${i + 1}`} danger onClick={() => removeStep(i)}>
                            ✕
                          </IconButton>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                        <label className="field">
                          <span>App</span>
                          <div className="flex items-center gap-2">
                            {app ? <MiniLogo app={app} /> : null}
                            <select
                              id={`f-step-${i}-toolId`}
                              value={step.toolId}
                              onChange={(event) => updateStep(i, { toolId: event.target.value })}
                              className="input min-w-0 flex-1"
                            >
                              <option value="" disabled>
                                {stackApps.length ? "Choose an app" : "Add apps to your stack first"}
                              </option>
                              {stackApps.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          {err(`step-${i}-toolId`)}
                        </label>
                        <label className="field">
                          <span>Title</span>
                          <input
                            id={`f-step-${i}-title`}
                            value={step.title}
                            onChange={(event) => updateStep(i, { title: event.target.value })}
                            maxLength={FLOW_LIMITS.stepTitle[1]}
                            placeholder={app ? `e.g. Draft the outline in ${app.name}` : "e.g. Draft the outline"}
                            className="input"
                          />
                          {err(`step-${i}-title`)}
                        </label>
                      </div>
                      <label className="field mt-4">
                        <span>Description</span>
                        <textarea
                          id={`f-step-${i}-description`}
                          value={step.description}
                          onChange={(event) => updateStep(i, { description: event.target.value })}
                          maxLength={FLOW_LIMITS.stepDescription[1]}
                          rows={3}
                          placeholder="What do you do here, and what comes out of it for the next step?"
                          className="input min-h-24 py-2.5"
                        />
                        {err(`step-${i}-description`)}
                      </label>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="rounded-xl border border-dashed border-[var(--line-strong)] px-4 py-3 text-sm text-[var(--muted)]">
                No steps yet. Adding an app to your stack starts a step for it, or add one below.
              </p>
            )}
            {err("steps")}
            <button
              type="button"
              onClick={() => {
                setSteps((prev) => [...prev, newStep(stack.length === 1 ? stack[0] : "")]);
                clear("steps");
              }}
              disabled={steps.length >= FLOW_LIMITS.maxSteps}
              className="btn btn-outline justify-self-start"
            >
              + Add step
            </button>
          </div>
        </Section>

        {/* 3 — Details */}
        <Section step={3} title="Name your flow" description="How it appears on Discover.">
          <label className="field">
            <span>Title</span>
            <input
              id="f-title"
              name="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clear("title");
              }}
              maxLength={FLOW_LIMITS.title[1]}
              placeholder="e.g. Blog post from idea to published in an afternoon"
              className="input"
            />
            {err("title")}
          </label>
          <label className="field">
            <span>
              Description<span className="field-hint"> · 1–2 sentences</span>
            </span>
            <textarea
              id="f-summary"
              name="summary"
              defaultValue={existing?.summary}
              onChange={() => clear("summary")}
              maxLength={FLOW_LIMITS.summary[1]}
              rows={2}
              placeholder="Who it's for and what it gets done."
              className="input min-h-20 py-2.5"
            />
            {err("summary")}
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="field">
              <span>Category</span>
              <select id="f-categoryId" name="categoryId" defaultValue={existing?.categoryId ?? ""} onChange={() => clear("categoryId")} className="input">
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {err("categoryId")}
            </label>
            <div className="field">
              <span>
                Icon<span className="field-hint"> · optional</span>
              </span>
              <div className="flex items-center gap-3">
                <FlowMark logoUrl={removeLogo ? null : logoPreview} title={title || "Flow"} stack={stackApps} />
                <input
                  id="f-logo"
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setRemoveLogo(false);
                    setLogoPreview(file ? URL.createObjectURL(file) : (existing?.logoUrl ?? null));
                    clear("logo");
                  }}
                  className="input min-w-0 flex-1"
                />
              </div>
              <span className="field-hint">
                Without one, your stack&rsquo;s logos are used.
                {existing?.logoUrl && !removeLogo ? (
                  <>
                    {" "}
                    <button type="button" onClick={() => setRemoveLogo(true)} className="font-bold underline underline-offset-2">
                      Remove current icon
                    </button>
                  </>
                ) : null}
              </span>
              {err("logo")}
            </div>
          </div>
        </Section>

        <div className="flex flex-wrap items-center gap-4">
          <button disabled={saving} className="btn btn-accent btn-lg">
            {saving ? "Publishing…" : existing ? "Save changes" : "Publish Flow"}
          </button>
          <p className="text-sm text-[var(--muted)]">Flows go live right away. You can edit or delete yours any time.</p>
          {errors.form ? (
            <p role="alert" className="basis-full text-sm font-bold text-[var(--danger)]">
              {errors.form}
            </p>
          ) : Object.keys(errors).length ? (
            <p role="alert" className="basis-full text-sm font-bold text-[var(--danger)]">
              Please fix the highlighted {stepErrors ? "steps and fields" : "fields"} above.
            </p>
          ) : null}
        </div>
      </form>

      <aside className="card hidden p-5 lg:sticky lg:top-24 lg:block">
        <p className="eyebrow">Preview</p>
        <div className="mt-4 flex items-start gap-3">
          <FlowMark logoUrl={removeLogo ? null : logoPreview} title={title || "Flow"} stack={stackApps} />
          <div className="min-w-0">
            <p className="font-bold leading-6">{title || <span className="text-[var(--faint)]">Your flow&rsquo;s title</span>}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {steps.length} {steps.length === 1 ? "step" : "steps"} · {stackApps.length} {stackApps.length === 1 ? "app" : "apps"}
            </p>
          </div>
        </div>
        {stackApps.length ? (
          <div className="mt-4">
            <StackRow apps={stackApps} max={8} />
          </div>
        ) : null}
        {steps.length ? (
          <ol className="mt-5 grid gap-2 border-t border-[var(--line)] pt-4">
            {steps.map((step, i) => (
              <li key={step.key} className="flex items-center gap-2 text-sm">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-[10px] font-bold text-white">{i + 1}</span>
                <span className={`truncate ${step.title ? "" : "text-[var(--faint)]"}`}>{step.title || "Untitled step"}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </aside>
    </div>
  );
}

function MiniLogo({ app }: { app: { name: string; logoUrl: string | null } }) {
  return app.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={app.logoUrl} alt="" className="h-6 w-6 shrink-0 rounded-md bg-white object-contain ring-1 ring-[var(--line)]" />
  ) : (
    <span aria-hidden className="font-display grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--accent-soft)] text-[11px] text-[var(--accent-ink)] ring-1 ring-[var(--line)]">
      {app.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] text-sm transition disabled:opacity-30 ${
        danger ? "hover:border-[var(--danger)] hover:text-[var(--danger)]" : "hover:border-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ step, title, description, children }: { step: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-xs font-bold text-white">{step}</span>
        <div>
          <h2 className="text-xl">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-[var(--muted)]">{description}</p> : null}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5">{children}</div>
    </section>
  );
}
