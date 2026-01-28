import React, { useEffect, useState } from "react";
import type { Api, CoreEvent } from "../core/rpc";

const ENGINE_ID = "module.engine";

export const HierarchyPanel: React.FC<{
  api: Api;
  busOnAny: (cb: (e: CoreEvent) => void) => () => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}> = ({ api, busOnAny, onSelect, selectedId }) => {
  const [entities, setEntities] = useState<string[]>([]);

  async function refresh() {
    try {
      const list = await api.call<string[]>(ENGINE_ID as any, "world.listEntities", {});
      setEntities(list.map(String));
    } catch (e: any) {
      api.log("error", "Hierarchy refresh failed", { error: String(e?.message ?? e) });
    }
  }

  useEffect(() => {
    refresh();
    // refresh when engine changes structure
    return busOnAny((e) => {
      if ((e as any)?.type === "engine/entitiesChanged") refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontWeight: 800 }}>Entities</div>
        <button onClick={refresh}>Refresh</button>
      </div>

      {entities.map((id) => (
        <div
          key={id}
          onClick={() => onSelect(id)}
          style={{
            padding: "8px 12px",
            backgroundColor: selectedId === id ? "#2d2d2d" : "transparent",
            border: "1px solid #333",
            borderRadius: 6,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            userSelect: "none",
          }}
        >
          <span>
            Entity: <b>{id}</b>
          </span>
          <span style={{ fontSize: 10, opacity: 0.5 }}>#obj</span>
        </div>
      ))}

      <button
        style={{
          marginTop: 10,
          padding: 10,
          background: "#444",
          border: "none",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
        }}
        onClick={async () => {
          try {
            const created = await api.call<{ id: string }>(ENGINE_ID as any, "world.createCube", {});
            onSelect(String(created.id));
            refresh();
          } catch (e: any) {
            api.log("error", "Create entity failed", { error: String(e?.message ?? e) });
          }
        }}
      >
        + Create Cube
      </button>
    </div>
  );
};
