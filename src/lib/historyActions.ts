"use server";

import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { HistoryEntry } from "@/app/(dash)/interview/HistoryRail";

export async function fetchAiHistory(): Promise<HistoryEntry[]> {
  const session = await readSession();
  if (!session) return [];

  try {
    const { history } = await callApi<{ history: HistoryEntry[] }>("history", {
      userId: session.userId,
    });
    return history ?? [];
  } catch {
    // The rail is a convenience — an unreachable API must not block the
    // interview itself.
    return [];
  }
}

export async function clearAiHistory(): Promise<{ ok: boolean }> {
  const session = await readSession();
  if (!session) return { ok: false };

  try {
    await callApi("history/clear", {
      method: "POST",
      body: {},
      userId: session.userId,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
