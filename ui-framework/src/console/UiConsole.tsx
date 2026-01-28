import React, { useMemo, useSyncExternalStore } from "react";
import type { UiLogger } from "../logger";
import type { LogItem } from "../types";

function safe(v: unknown) {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

export function UiConsole({ logger, title = "UI Console" }: { logger: UiLogger; title?: string }) {
  const logs = useSyncExternalStore(
    (cb) => logger.subscribe(cb),
    () => logger.getLogs()
  );

  const view = useMemo(() => logs.slice(-300).reverse(), [logs]);

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 10, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => logger.clear()}>Clear</button>
        </div>
      </div>

      <div style={{ overflow: "auto", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10 }}>
        {view.map((l: LogItem, idx: number) => (
          <div key={idx} style={{ padding: "8px 10px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{l.level.toUpperCase()}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{new Date(l.ts).toLocaleTimeString()}</div>
            </div>
            <div style={{ fontSize: 13 }}>{l.message}</div>
            {l.data !== undefined ? (
              <pre style={{ fontSize: 12, opacity: 0.9, marginTop: 6, whiteSpace: "pre-wrap" }}>{safe(l.data)}</pre>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
