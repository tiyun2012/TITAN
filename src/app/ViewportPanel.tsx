import React, { useEffect, useRef, useState } from "react";
import type { Api } from "../core/rpc";

const VIEWPORT_ID = "module.viewport3d";

export const ViewportPanel: React.FC<{ api: Api }> = ({ api }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [navMode, setNavMode] = useState<"maya" | "game">("maya");
  const [sceneId, setSceneId] = useState<string>("active");
  const [stats, setStats] = useState<{ fps: number; drawCalls: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let alive = true;

    (async () => {
      try {
        const ss = await api.call<any>(VIEWPORT_ID, "viewport.getScene", { viewportId: "scene" });
        if (ss?.sceneId) setSceneId(String(ss.sceneId));
        await api.call(VIEWPORT_ID, "viewport.attachCanvas", { viewportId: "scene", canvas, sceneId: "active" });
        await api.call(VIEWPORT_ID, "viewport.setNavMode", { viewportId: "scene", mode: "maya" });
        setNavMode("maya");
        setErr(null);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      }
    })();

    const timer = window.setInterval(async () => {
      if (!alive) return;
      try {
        const ss = await api.call<any>(VIEWPORT_ID, "viewport.getScene", { viewportId: "scene" });
        if (ss?.sceneId) setSceneId(String(ss.sceneId));
        const s = await api.call<any>(VIEWPORT_ID, "viewport.getStats", { viewportId: "scene" });
        if (s) setStats({ fps: s.fps ?? 0, drawCalls: s.drawCalls ?? 0 });
      } catch {}
    }, 400);

    return () => {
      alive = false;
      window.clearInterval(timer);
      api.call(VIEWPORT_ID, "viewport.detachCanvas", { viewportId: "scene" }).catch(() => {});
    };
  }, [api]);

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", background: "#000" }}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          api.call(VIEWPORT_ID, "viewport.input", {
            viewportId: "scene",
            event: { type: "pointerDown", x: e.clientX, y: e.clientY, button: e.button, alt: e.altKey },
          }).catch(() => {});
        }}
        onPointerUp={(e) => {
          api.call(VIEWPORT_ID, "viewport.input", {
            viewportId: "scene",
            event: { type: "pointerUp", x: e.clientX, y: e.clientY },
          }).catch(() => {});
        }}
        onPointerMove={(e) => {
          api.call(VIEWPORT_ID, "viewport.input", {
            viewportId: "scene",
            event: { type: "pointerMove", x: e.clientX, y: e.clientY, alt: e.altKey },
          }).catch(() => {});
        }}
        onWheel={(e) => {
          api.call(VIEWPORT_ID, "viewport.input", {
            viewportId: "scene",
            event: { type: "wheel", deltaY: e.deltaY },
          }).catch(() => {});
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          pointerEvents: "none",
          fontSize: 12,
          color: "#eaeaea",
          textShadow: "0 1px 1px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ fontWeight: 800 }}>Scene Viewport</div>
        <div style={{ opacity: 0.8, marginTop: 2 }}>Scene: <b>{sceneId}</b></div>
        <div style={{ opacity: 0.85, marginTop: 4 }}>
          {navMode === "maya" ? (
            <>Maya nav: <b>Alt+LMB</b> orbit • <b>Alt+MMB</b> pan • <b>Alt+RMB</b> dolly • Wheel zoom</>
          ) : (
            <>Game nav: <b>RMB</b> look (WASD later) • Wheel zoom</>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, pointerEvents: "auto" }}>
          <button
            onClick={async () => {
              try {
        const ss = await api.call<any>(VIEWPORT_ID, "viewport.getScene", { viewportId: "scene" });
        if (ss?.sceneId) setSceneId(String(ss.sceneId));
                await api.call(VIEWPORT_ID, "viewport.setNavMode", { viewportId: "scene", mode: "maya" });
                setNavMode("maya");
              } catch {}
            }}
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.14)",
              background: navMode === "maya" ? "rgba(255,255,255,0.10)" : "transparent",
              color: "#eaeaea",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            Editor (Maya)
          </button>
          <button
            onClick={async () => {
              try {
        const ss = await api.call<any>(VIEWPORT_ID, "viewport.getScene", { viewportId: "scene" });
        if (ss?.sceneId) setSceneId(String(ss.sceneId));
                await api.call(VIEWPORT_ID, "viewport.setNavMode", { viewportId: "scene", mode: "game" });
                setNavMode("game");
              } catch {}
            }}
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.14)",
              background: navMode === "game" ? "rgba(255,255,255,0.10)" : "transparent",
              color: "#eaeaea",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            Game
          </button>
        </div>

        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 10 }}>
          fps: {stats ? stats.fps.toFixed(1) : "…"} • draws: {stats ? stats.drawCalls : "…"} {err ? `• error: ${err}` : ""}
        </div>
      </div>
    </div>
  );
};
