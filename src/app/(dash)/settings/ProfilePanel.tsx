"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, Lock, User } from "lucide-react";
import { updateAvatar, updateDisplayName } from "@/lib/profileActions";

/** Avatars are stored at this size; anything larger is wasted bytes. */
const AVATAR_PX = 256;

/**
 * Shrinks and re-encodes the chosen picture in the browser.
 *
 * Doing it here rather than server-side means we never upload a 6MB phone
 * photo, the request stays small enough to sign as JSON, and re-encoding
 * through a canvas drops every EXIF field — including the GPS coordinates
 * phones attach by default.
 */
function toSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("That file isn't a valid image."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_PX;
        canvas.height = AVATAR_PX;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Your browser could not process that image."));
          return;
        }
        // Centre-crop to a square so faces aren't squashed by a rectangle.
        const side = Math.min(img.width, img.height);
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          AVATAR_PX,
          AVATAR_PX,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProfilePanel({
  initialName,
  initialAvatar,
  email,
}: {
  initialName: string;
  initialAvatar: string | null;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [error, setError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const fileRef = useRef<HTMLInputElement>(null);

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateDisplayName(name);
      if (result.error) setError(result.error);
      else {
        setSavedName(true);
        setTimeout(() => setSavedName(false), 2500);
      }
    });
  }

  async function pickAvatar(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const dataUrl = await toSquareDataUrl(file);
      const result = await updateAvatar(dataUrl);
      if (result.error) setError(result.error);
      else if (result.avatarUrl) setAvatar(result.avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that image.");
    }
    setUploading(false);
  }

  return (
    <section className="flex h-full flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-lg font-bold">Your profile</h2>
      <p className="mt-1.5 text-sm text-[var(--text-muted)]">
        This is the name and picture shown in the sidebar.
      </p>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="group relative size-16 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)]"
          aria-label="Change your picture"
        >
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              width={AVATAR_PX}
              height={AVATAR_PX}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center">
              <User className="size-7 text-[var(--text-faint)]" />
            </span>
          )}

          <span className="absolute inset-0 grid place-items-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 className="size-5 animate-spin text-white" />
            ) : (
              <Camera className="size-5 text-white" />
            )}
          </span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => void pickAvatar(e.target.files?.[0])}
        />

        <div className="text-sm text-[var(--text-muted)]">
          <p className="font-semibold text-[var(--text)]">Profile picture</p>
          <p className="mt-1 max-w-[42ch] leading-relaxed">
            Click the circle to upload one.
          </p>
        </div>
      </div>

      <form onSubmit={saveName} className="mt-5">
        <label htmlFor="displayName" className="mb-2 block text-sm font-semibold">
          Display name
        </label>
        <div className="flex gap-2.5">
          <input
            id="displayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className="min-w-0 flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 outline-none focus:border-[var(--brand-bright)]"
          />
          <button
            type="submit"
            disabled={pending || !name.trim() || name === initialName}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-5 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : savedName ? (
              <Check className="size-4" />
            ) : null}
            {savedName ? "Saved" : "Save"}
          </button>
        </div>
      </form>

      {/*
        Email is shown but not editable, on purpose. It is the identity the
        account is keyed on, so letting someone change it freely is how one
        account quietly becomes a different person's. Doing it safely would
        need confirmation sent to both the old and the new address.
      */}
      <div className="mt-5">
        <label
          htmlFor="accountEmail"
          className="mb-2 block text-sm font-semibold"
        >
          Email
        </label>
        <div className="relative">
          <input
            id="accountEmail"
            value={email}
            readOnly
            disabled
            className="w-full cursor-not-allowed rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 pr-11 text-[var(--text-muted)]"
          />
          <Lock className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-faint)]" />
        </div>
        <p className="mt-2 text-xs text-[var(--text-faint)]">
          Your account is identified by this address, so it can&apos;t be
          changed here.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 text-sm leading-relaxed text-[var(--danger)]"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
