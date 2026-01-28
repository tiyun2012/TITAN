import React, { useState } from "react";
import type { Api } from "../core/rpc";
import { ViewportPanel } from "./ViewportPanel";

export function MainWindow({ api }: { api: Api }) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "44px 1fr 26px",
        background: "#0b0b0b",
        color: "#eaeaea",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          background: "#101010",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 900 }}>Titan Editor</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Main Window</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => api.log("info", "Toolbar: Save (stub)")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "transparent",
              color: "#eaeaea",
              cursor: "pointer",
            }}
          >
            Save
          </button>
          <button
            onClick={() => api.log("info", "Toolbar: Play (stub)")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "transparent",
              color: "#eaeaea",
              cursor: "pointer",
            }}
          >
            Play
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ minHeight: 0, height: "100%", padding: 10 }}>
        <div
          style={{
            height: "100%",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "#0f0f0f",
          }}
        >
          <ViewportPanel api={api} selectedId={selectedEntity} onSelect={setSelectedEntity} />
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          background: "#101010",
          fontSize: 12,
          opacity: 0.85,
        }}
      >
        <div>Selected: {selectedEntity ?? "—"}</div>
        <div>Scene Viewport</div>
      </div>
    </div>
  );
}
