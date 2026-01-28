import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Api } from "../core/rpc";
import { registerCanvas, unregisterCanvas } from "../ui/canvasRegistry";

const VIEWPORT_ID = "module.viewport3d";

export const ViewportPanel: React.FC<{
  api: Api;
  onSelect: (id: string) => void;
  selectedId: string | null;
}> = ({ api, selectedId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const canvasHandle = useMemo(() => "canvas:viewport:scene", []);

  // Attach/detach canvas to viewport module
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    registerCanvas(canvasHandle, canvas);

    let alive = true;

    (async () => {
      try {
        await api.call<any>(VIEWPORT_ID as any, "viewport.attachCanvas", {
          viewportId: "scene",
          canvasHandle,
        });
        setLastError(null);
      } catch (e: any) {
        setLastError(String(e?.message ?? e));
      }
    })();

    // poll stats occasionally (optional)
    const t = window.setInterval(async () => {
      if (!alive) return;
      try {
        const s = await api.call<any>(VIEWPORT_ID as any, "viewport.getStats", { viewportId: "scene" });
        setStats(s ?? null);
      } catch {
        // ignore
      }
    }, 500);

    return () => {
      alive = false;
      window.clearInterval(t);
      unregisterCanvas(canvasHandle);
      // best-effort detach
      void api.call<any>(VIEWPORT_ID as any, "viewport.detachCanvas", { viewportId: "scene" });
    };
  }, [api, canvasHandle]);

  // Inform module about selection (optional highlight later)
  useEffect(() => {
    void api.call<any>(VIEWPORT_ID as any, "viewport.setSelection", { viewportId: "scene", selectedId }).catch(() => {});
  }, [api, selectedId]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          background: "#101010",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const r = canvas.getBoundingClientRect();
          void api.call<any>(VIEWPORT_ID as any, "viewport.input", {
            viewportId: "scene",
            type: "pointerDown",
            x: e.clientX - r.left,
            y: e.clientY - r.top,
            button: e.button,
            shift: e.shiftKey,
            alt: e.altKey,
            ctrl: e.ctrlKey,
            meta: e.metaKey,
          }).catch(() => {});
        }}
        onPointerMove={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const r = canvas.getBoundingClientRect();
          void api.call<any>(VIEWPORT_ID as any, "viewport.input", {
            viewportId: "scene",
            type: "pointerMove",
            x: e.clientX - r.left,
            y: e.clientY - r.top,
            buttons: e.buttons,
            shift: e.shiftKey,
            alt: e.altKey,
            ctrl: e.ctrlKey,
            meta: e.metaKey,
          }).catch(() => {});
        }}
        onPointerUp={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const r = canvas.getBoundingClientRect();
          void api.call<any>(VIEWPORT_ID as any, "viewport.input", {
            viewportId: "scene",
            type: "pointerUp",
            x: e.clientX - r.left,
            y: e.clientY - r.top,
            button: e.button,
          }).catch(() => {});
        }}
        onWheel={(e) => {
          void api.call<any>(VIEWPORT_ID as any, "viewport.input", {
            viewportId: "scene",
            type: "wheel",
            deltaY: e.deltaY,
          }).catch(() => {});
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.55)",
          padding: 10,
          borderRadius: 10,
          fontSize: 11,
          border: "1px solid rgba(255,255,255,0.10)",
          maxWidth: 480,
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: 800 }}>Scene Viewport (WebGL)\nDrag: orbit • Wheel: zoom</div>
        <div style={{ opacity: 0.85, marginTop: 4 }}>
          {stats?.fps ? `fps: ${stats.fps.toFixed(1)}` : "fps: —"} • draws: {stats?.drawCalls ?? "—"}
        </div>
        {lastError ? (
          <div style={{ marginTop: 8, color: "#ffb3b3", fontFamily: "monospace" }}>{lastError}</div>
        ) : null}
      </div>
    </div>
  );
};
