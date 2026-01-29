import React, { useEffect, useMemo, useRef, useState } from "react";
import { Api, ModuleRegistry } from "../core/rpc";
import { logStore } from "../core/log";

import { ManagerModule } from "../modules/managerModule";
import { EngineModule } from "../modules/engineModule";
import { Viewport3dModule } from "../modules/viewport3d/Viewport3dModule";

import { ViewportPanel } from "./ViewportPanel";
import { ConsolePanel } from "./ConsolePanel";

export const App: React.FC = () => {
  const registry = useMemo(() => new ModuleRegistry(), []);
  const api = useMemo(() => new Api(registry, "ui"), [registry]);

  const [ready, setReady] = useState(false);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    // register modules (ModuleId is the integration contract)
    const manager = new ManagerModule();
    const engine = new EngineModule();
    const viewport = new Viewport3dModule();

    registry.register(manager);
    registry.register(engine);
    registry.register(viewport);

    manager.onStart?.(api);
    engine.onStart?.(api);
    viewport.onStart?.(api);

    setReady(true);

    return () => {
      registry.stopAll();
      didInitRef.current = false;
    };
  }, [api, registry]);

  if (!ready) return <div style={{ padding: 12, color: "#ddd" }}>Booting…</div>;

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateRows: "44px 1fr 220px", background: "#0f1115", color: "#eaeaea" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontWeight: 800 }}>TI3D Editor (placeholder)</div>
        <div style={{ marginLeft: 12, opacity: 0.7, fontSize: 12 }}>ModuleId RPC • UI-only framework • No external 3D libs</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 320px" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", padding: 10, fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Manager</div>
          <div style={{ opacity: 0.8, lineHeight: 1.6 }}>
            <div>Registered modules:</div>
            <ul style={{ margin: "6px 0 0 18px" }}>
              {registry.listIds().map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
            This is a clean placeholder. Add back features as separate modules and UI panels.
          </div>
        </div>

        <ViewportPanel api={api} />

        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", padding: 10, fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Inspector</div>
          <div style={{ opacity: 0.7 }}>Placeholder. Selection + properties will come from modules.</div>
        </div>
      </div>

      <ConsolePanel api={api} />
    </div>
  );
};
