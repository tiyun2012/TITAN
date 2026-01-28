import React from "react";
import type { Unsub } from "./types";

export type PanelConfig = {
  id: string;
  title: string;
  render: () => React.ReactNode;
};

/**
 * PanelRegistry (useSyncExternalStore-safe)
 *
 * IMPORTANT: React's useSyncExternalStore requires getSnapshot() to return a
 * stable reference when nothing changed. So we keep a cached `snapshot` array
 * and only replace it when registry content changes.
 */
export class PanelRegistry {
  private panels = new Map<string, PanelConfig>();
  private listeners = new Set<() => void>();
  private snapshot: PanelConfig[] = [];

  register(cfg: PanelConfig) {
    this.panels.set(cfg.id, cfg);
    this.rebuildSnapshotAndEmit();
  }

  unregister(id: string) {
    const ok = this.panels.delete(id);
    if (ok) this.rebuildSnapshotAndEmit();
    return ok;
  }

  get(id: string): PanelConfig | undefined {
    return this.panels.get(id);
  }

  /**
   * Stable snapshot for useSyncExternalStore. Returns the same array reference
   * until the registry actually changes.
   */
  getSnapshot(): PanelConfig[] {
    return this.snapshot;
  }

  /**
   * Convenience method (same as snapshot).
   */
  list(): PanelConfig[] {
    return this.snapshot;
  }

  subscribe(cb: () => void): Unsub {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private rebuildSnapshotAndEmit() {
    this.snapshot = [...this.panels.values()];
    this.listeners.forEach((l) => l());
  }
}