"use client";

import { useSyncExternalStore } from "react";
import { getAllItems } from "./db";
import type { Item } from "./types";

let snapshot: Item[] | null = null;
let loading = false;
const listeners = new Set<() => void>();

export async function refreshItems() {
  if (loading) return;
  loading = true;
  try {
    snapshot = await getAllItems();
  } catch {
    snapshot = [];
  } finally {
    loading = false;
    listeners.forEach((l) => l());
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (snapshot === null) void refreshItems();
  return () => {
    listeners.delete(listener);
  };
}

/** Devuelve null mientras se leen los datos locales. */
export function useItems(): Item[] | null {
  return useSyncExternalStore(subscribe, () => snapshot, () => null);
}
