"use client";

import { useSyncExternalStore } from "react";
import { getAllIdeas, putIdea } from "./db";
import type { Idea } from "./types";

let snapshot: Idea[] | null = null;
let loading = false;
const listeners = new Set<() => void>();

export async function refreshIdeas() {
  if (loading) return;
  loading = true;
  try {
    snapshot = (await getAllIdeas()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    snapshot = [];
  } finally {
    loading = false;
    listeners.forEach((l) => l());
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (snapshot === null) void refreshIdeas();
  return () => {
    listeners.delete(listener);
  };
}

/** Devuelve null mientras se leen los datos locales. */
export function useIdeas(): Idea[] | null {
  return useSyncExternalStore(subscribe, () => snapshot, () => null);
}

export async function setIdeaStatus(idea: Idea, status: Idea["status"]) {
  await putIdea({ ...idea, status });
  await refreshIdeas();
}
