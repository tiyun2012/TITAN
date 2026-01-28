import React, { useState } from "react";
import type { Api, CoreEvent } from "../core/rpc";
import type { Bus } from "../core/bus";
import { ViewportPanel } from "./ViewportPanel";
import { HierarchyPanel } from "./HierarchyPanel";
import { InspectorPanel } from "./InspectorPanel";
import { BlueprintEditor } from "./BlueprintEditor";

export function MainWindow({ api, bus }: { api: Api; bus: Bus<CoreEvent> }) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"scene" | "blueprint">("scene");

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0b0b0b",
        color: "#eaeaea",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderBottom: "1px solid #1f1f1f",
          background: "#101010",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em" }}>Titan Editor</div>
          
          <div style={{ display: "flex", gap: 2, background: "#1a1a1a", padding: 2, borderRadius: 6 }}>
            <button
              onClick={() => setActiveTab("scene")}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                border: "none",
                background: activeTab === "scene" ? "#333" : "transparent",
                color: activeTab === "scene" ? "#fff" : "#888",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.1s",
              }}
            >
              Scene
            </button>
            <button
              onClick={() => setActiveTab("blueprint")}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                border: "none",
                background: activeTab === "blueprint" ? "#333" : "transparent",
                color: activeTab === "blueprint" ? "#fff" : "#888",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.1s",
              }}
            >
              Blueprint
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => api.log("info", "Toolbar: Save (stub)")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#1a1a1a",
              color: "#ccc",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Save Project
          </button>
          <button
            onClick={() => api.log("info", "Toolbar: Play (stub)")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #2ecc71",
              background: "rgba(46, 204, 113, 0.1)",
              color: "#2ecc71",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ▶ Play
          </button>
        </div>
      </div>

      {/* Main Content (3-column layout) */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 300px", minHeight: 0, overflow: "hidden" }}>
        
        {/* Left: Hierarchy */}
        <div style={{ borderRight: "1px solid #1f1f1f", background: "#111", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Hierarchy
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px 10px" }}>
            <HierarchyPanel
              api={api}
              busOnAny={bus.onAny}
              selectedId={selectedEntity}
              onSelect={setSelectedEntity}
            />
          </div>
        </div>

        {/* Center: Viewport or Blueprint */}
        <div style={{ position: "relative", background: "#080808", overflow: "hidden" }}>
          {activeTab === "scene" ? (
            <ViewportPanel api={api} selectedId={selectedEntity} onSelect={setSelectedEntity} />
          ) : (
            <BlueprintEditor entityId={selectedEntity} />
          )}
        </div>

        {/* Right: Inspector */}
        <div style={{ borderLeft: "1px solid #1f1f1f", background: "#111", display: "flex", flexDirection: "column" }}>
           <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Inspector
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px 12px" }}>
            <InspectorPanel api={api} entityId={selectedEntity} />
          </div>
        </div>

      </div>

      {/* Status bar */}
      <div
        style={{
          height: 24,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderTop: "1px solid #1f1f1f",
          background: "#101010",
          fontSize: 10,
          color: "#666",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
           <span>MODE: {activeTab.toUpperCase()}</span>
           <span>SELECTED: {selectedEntity ? selectedEntity : "NONE"}</span>
        </div>
        <div>TITAN ENGINE v0.2.0</div>
      </div>
    </div>
  );
}