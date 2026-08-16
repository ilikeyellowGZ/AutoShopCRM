import type { DemoState } from "../domain/models";
import { migrateDemoState } from "./migrations";
import { createSeedState } from "./seed";

export const STORAGE_KEY = "weelee-employee-demo-v1";

export function saveDemoState(storage: Storage, state: DemoState): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Browser storage can be unavailable or full; the in-memory repository remains usable.
  }
}

export function loadDemoState(storage: Storage): DemoState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const migrated = migrateDemoState(JSON.parse(raw));
      if (migrated) { saveDemoState(storage, migrated); return migrated; }
    }
  } catch {
    // Fall through to a deterministic, recoverable seed state.
  }

  const seed = createSeedState();
  saveDemoState(storage, seed);
  return seed;
}
