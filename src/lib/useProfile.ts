"use client";

import { useSyncExternalStore } from "react";
import { getProfile } from "./db";
import type { Profile } from "./types";

// undefined: leyendo datos locales · null: todavía no hay perfil
let snapshot: Profile | null | undefined;
let loading = false;
const listeners = new Set<() => void>();

export async function refreshProfile() {
  if (loading) return;
  loading = true;
  try {
    snapshot = (await getProfile()) ?? null;
  } catch {
    snapshot = null;
  } finally {
    loading = false;
    listeners.forEach((l) => l());
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (snapshot === undefined) void refreshProfile();
  return () => {
    listeners.delete(listener);
  };
}

export function useProfile(): Profile | null | undefined {
  return useSyncExternalStore(subscribe, () => snapshot, () => undefined);
}
