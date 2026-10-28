"use client";

import { FormEvent, useState } from "react";
import { useRouterTransition } from "@/lib/use-router-transition";
import { uploadFormFiles } from "@/lib/upload-client";
import { Spinner } from "../Spinner";
import { ToolLogo } from "../ToolLogo";
import { celebrate } from "@/lib/success";

export function ProfileForm({
  creator,
}: {
  creator: { name: string; bio: string; website: string | null; avatarUrl: string | null };
}) {
  const router = useRouterTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  // Busy until saved and the refreshed profile has arrived.
  const saving = sending || router.pending;
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(creator.avatarUrl);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setSaved(false);
    setErrors({});
    const body = new FormData(event.currentTarget);
    try {
      await uploadFormFiles(body, { avatar: "avatars" });
    } catch (err) {
      setSending(false);
      setErrors({ avatar: err instanceof Error ? err.message : "Could not upload the image." });
      return;
    }
    const res = await fetch("/api/creator/profile", { method: "PATCH", body });
    const json = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setErrors(json.errors ?? { form: json.error ?? "Could not save." });
      return;
    }
    celebrate("Profile saved");
    router.refresh(() => setSaved(true));
  }

  const err = (key: string) => (errors[key] ? <span className="text-xs font-bold text-[var(--danger)]">{errors[key]}</span> : null);

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-5 sm:p-6">
      <h2 className="text-xl">Profile</h2>
      <div className="flex items-center gap-4">
        <ToolLogo src={avatar} name={creator.name} size="lg" />
        <label className="field flex-1">
          Avatar or logo
          <input
            name="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setAvatar(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
          {err("avatar")}
        </label>
      </div>
      <label className="field">
        Name
        <input name="name" defaultValue={creator.name} required className="input" />
        {err("name")}
      </label>
      <label className="field">
        <span>
          Website <span className="field-hint">· optional</span>
        </span>
        <input name="website" type="url" defaultValue={creator.website ?? ""} placeholder="https://" className="input" />
        {err("website")}
      </label>
      <label className="field">
        Bio
        <textarea name="bio" defaultValue={creator.bio} required maxLength={600} className="input" />
        {err("bio")}
      </label>
      {errors.form ? <p className="text-sm text-[var(--danger)]">{errors.form}</p> : null}
      <div className="flex items-center gap-3">
        <button disabled={saving} className="btn btn-primary">
          {saving ? <Spinner /> : null}
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved ? <span role="status" className="text-sm font-bold text-[var(--ok)]">Saved</span> : null}
      </div>
    </form>
  );
}
