import React, { useMemo, useState } from "react";
import { FrameworkHost, PanelRegistry, UiConsole, UiLogger } from "../../../../ui-framework/src";
import type { Api, CoreEvent } from "../core/rpc";
import { MainConsole } from "../ui/MainConsole";
import { useEngine } from "../../../../engine/api/EngineProvider";
import { Viewport } from "./Viewport";
import { Hierarchy } from "./Hierarchy";
import { Inspector } from "./Inspector";
import { BlueprintEditor } from "./BlueprintEditor";

export function App({
  api,
  busOnAny,
}: {
  api: Api;
  busOnAny: (cb: (e: CoreEvent) => void) => () => void;
}) {
  const { world } = useEngine();
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const uiLogger = useMemo(() => new UiLogger((level, message, data) => {
    api.log(level as any, `[ui] ${message}`, { source: "ui-framework", ...((data as any) ?? {}) });
  }), [api]);

  const registry = useMemo(() => {
    const r = new PanelRegistry();

    r.register({
      id: "viewport",
      title: "Scene Viewport",
      render: () => <Viewport onSelect={setSelectedEntity} selectedId={selectedEntity} />
    });

    r.register({
      id: "hierarchy",
      title: "Hierarchy",
      render: () => <Hierarchy onSelect={setSelectedEntity} selectedId={selectedEntity} />
    });

    r.register({
      id: "inspector",
      title: "Inspector",
      render: () => <Inspector entityId={selectedEntity} />
    });

    r.register({
      id: "blueprints",
      title: "Blueprint Editor",
      render: () => <BlueprintEditor entityId={selectedEntity} />
    });

    r.register({
      id: "console.main",
      title: "Log Console",
      render: () => <MainConsole api={api} busOnAny={busOnAny} />
    });

    return r;
  }, [api, busOnAny, selectedEntity]);

  return (
    <div style={{ height: "100vh", backgroundColor: "#0f0f0f", color: "#e0e0e0" }}>
      <FrameworkHost title="TITAN ENGINE EDITOR" registry={registry} />
    </div>
  );
}
