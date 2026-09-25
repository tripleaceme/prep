"use server";

import { revalidatePath } from "next/cache";
import { ApiError, callApi } from "@/lib/api";
import { readSession } from "@/lib/session";

export interface ProfileResult {
  ok?: boolean;
  error?: string;
  avatarUrl?: string;
}

/** Absolute URL for a file stored by the API, e.g. an avatar. */
export async function assetUrl(relative: string | null): Promise<string | null> {
  if (!relative) return null;
  const base = process.env.PREP_API_URL?.replace(/\/+$/, "");
  return base ? `${base}/${relative.replace(/^\/+/, "")}` : null;
}

export async function updateDisplayName(name: string): Promise<ProfileResult> {
  const session = await readSession();
  if (!session) return { error: "Your session expired. Please sign in again." };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Enter a name." };
  if (trimmed.length > 120) return { error: "That name is too long." };

  try {
    await callApi("profile/name", {
      method: "POST",
      body: { display_name: trimmed },
      userId: session.userId,
    });
    // The sidebar shows the name on every page, so refresh the whole shell.
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        error:
          "The server doesn't have the profile endpoint yet — re-upload the api/ folder to go54.",
      };
    }
    return {
      error:
        error instanceof ApiError ? error.message : "Could not save that name.",
    };
  }
}

/**
 * `image` is a data URL the browser produced after resizing to a small square.
 * Sending base64 inside JSON rather than multipart keeps the request signed
 * the same way as every other call.
 */
export async function updateAvatar(image: string): Promise<ProfileResult> {
  const session = await readSession();
  if (!session) return { error: "Your session expired. Please sign in again." };

  if (!image.startsWith("data:image/")) {
    return { error: "That file isn't an image." };
  }

  try {
    const result = await callApi<{ avatar_url: string }>("profile/avatar", {
      method: "POST",
      body: { image },
      userId: session.userId,
    });
    revalidatePath("/", "layout");
    return { ok: true, avatarUrl: (await assetUrl(result.avatar_url)) ?? undefined };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      // The route exists in this repo but not on the server yet.
      return {
        error:
          "The server doesn't have the avatar endpoint yet — re-upload the api/ folder to go54, and run the avatar_url migration in db/migrations/.",
      };
    }
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Could not upload that picture.",
    };
  }
}
