import React, { useMemo, useState, useSyncExternalStore } from "react";
import type { PanelRegistry } from "./panels";

export function FrameworkHost({
  title = "UI Framework",
  registry,
}: {
  title?: string;
  registry: PanelRegistry;
}) {
  const panels = useSyncExternalStore(
    (cb) => registry.subscribe(cb),
    () => registry.getSnapshot()
  );

  const [activeId, setActiveId] = useState<string>(() => panels[0]?.id ?? "");
  const active = useMemo(() => registry.get(activeId) ?? panels[0], [registry, activeId, panels]);

  // keep active valid if panels change
  React.useEffect(() => {
    if (!activeId && panels[0]?.id) setActiveId(panels[0].id);
    if (activeId && !registry.get(activeId) && panels[0]?.id) setActiveId(panels[0].id);
  }, [activeId, panels, registry]);

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "240px 1fr" }}>
      <aside style={{ borderRight: "1px solid rgba(0,0,0,0.12)", padding: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
          Tabs/panels driven by a registry.
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          {panels.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              style={{
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.12)",
                background: active?.id === p.id ? "rgba(0,0,0,0.06)" : "white",
                cursor: "pointer",
              }}
            >
              {p.title}
            </button>
          ))}
        </div>
      </aside>

      <main style={{ padding: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", padding: 12, overflow: "hidden" }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>{active?.title ?? "No panel"}</div>
          <div style={{ height: "calc(100% - 34px)" }}>
            {active ? active.render() : <div style={{ opacity: 0.75 }}>No panels registered.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
