"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, User } from "lucide-react";
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
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-lg font-bold">Your profile</h2>
      <p className="mt-1.5 text-sm text-[var(--text-muted)]">
        This is the name and picture shown in the sidebar. {email}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="group relative size-20 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)]"
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
              <User className="size-8 text-[var(--text-faint)]" />
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
            Click the circle to upload one. It&apos;s cropped to a square and
            shrunk in your browser before it&apos;s sent, so nothing large — or
            location data from your phone — ever leaves your machine.
          </p>
        </div>
      </div>

      <form onSubmit={saveName} className="mt-7">
        <label htmlFor="displayName" className="mb-2 block text-sm font-semibold">
          Display name
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="displayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className="flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 outline-none focus:border-[var(--brand-bright)]"
          />
          <button
            type="submit"
            disabled={pending || !name.trim() || name === initialName}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--brand)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : savedName ? (
              <Check className="size-4" />
            ) : null}
            {savedName ? "Saved" : "Save name"}
          </button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
