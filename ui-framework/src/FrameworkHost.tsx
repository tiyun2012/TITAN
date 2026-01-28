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

  const showSidebar = panels.length > 1;

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: showSidebar ? "240px 1fr" : "1fr" }}>
      {showSidebar ? (
        <aside style={{ borderRight: "1px solid rgba(255,255,255,0.10)", padding: 12, background: "#121212" }}>
          <div style={{ fontWeight: 900, marginBottom: 10, color: "#eaeaea" }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10, color: "#cfcfcf" }}>
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
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: active?.id === p.id ? "rgba(255,255,255,0.08)" : "transparent",
                  cursor: "pointer",
                  color: "#eaeaea",
                }}
              >
                {p.title}
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <main style={{ padding: 0, overflow: "hidden", background: "#0b0b0b" }}>
        <div style={{ height: "100%", borderRadius: 0, border: "none", padding: 0, overflow: "hidden" }}>
          {active ? active.render() : <div style={{ opacity: 0.75, padding: 12 }}>No panels registered.</div>}
        </div>
      </main>
    </div>
  );
}
