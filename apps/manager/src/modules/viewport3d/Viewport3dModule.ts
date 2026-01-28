import type { Module } from "../../core/module";
import { asModuleId } from "../../core/id";
import type { CoreEvent, RpcCall, RpcResponse } from "../../core/rpc";
import type { ViewportInputEvent } from "./types";
import { getCanvas } from "../../ui/canvasRegistry";
import { WebGLRenderer } from "./WebGLRenderer";
import { ViewportInstance } from "./ViewportInstance";

export const Viewport3dModule: Module = {
  id: asModuleId("module.viewport3d"),
  init(ctx) {
    const instances = new Map<string, ViewportInstance>();

    const attachCanvas = (viewportId: string, canvasHandle: string) => {
      const canvas = getCanvas(canvasHandle);
      if (!canvas) throw new Error(`Canvas handle not found: ${canvasHandle}`);

      const gl = canvas.getContext("webgl2", { antialias: true }) as WebGL2RenderingContext | null;
      if (!gl) throw new Error("WebGL2 not available");

      // Replace existing instance
      const prev = instances.get(viewportId);
      if (prev) prev.stop();

      const renderer = new WebGLRenderer(gl);
      const inst = new ViewportInstance({ viewportId, canvasHandle, canvas, gl, renderer });
      instances.set(viewportId, inst);
      inst.start(ctx.api);
    };

    const detachCanvas = (viewportId: string) => {
      const v = instances.get(viewportId);
      if (!v) return;
      v.stop();
      instances.delete(viewportId);
    };

    const unsub = ctx.bus.on("rpc/call", (e) => {
      const msg = e as RpcCall;
      if (msg.target !== Viewport3dModule.id) return;

      const reply = (ok: boolean, result?: unknown, error?: string) => {
        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok, result, error };
        ctx.bus.emit(res as CoreEvent);
      };

      try {
        const p = (msg.payload ?? {}) as any;

        if (msg.op === "viewport.attachCanvas") {
          const viewportId = String(p.viewportId ?? "scene");
          const canvasHandle = String(p.canvasHandle ?? "");
          if (!canvasHandle) return reply(false, null, "payload.canvasHandle required");
          attachCanvas(viewportId, canvasHandle);
          return reply(true, { ok: true });
        }

        if (msg.op === "viewport.detachCanvas") {
          const viewportId = String(p.viewportId ?? "scene");
          detachCanvas(viewportId);
          return reply(true, { ok: true });
        }

        if (msg.op === "viewport.input") {
          const viewportId = String(p.viewportId ?? "scene");
          const v = instances.get(viewportId);
          if (!v) return reply(true, { ok: false });

          v.handleInput(p as ViewportInputEvent);
          return reply(true, { ok: true });
        }

if (msg.op === "viewport.setNavMode") {
  const viewportId = String(p.viewportId ?? "scene");
  const v = instances.get(viewportId);
  if (!v) return reply(true, { ok: false });
  const mode = String(p.mode ?? "maya");
  if (mode !== "maya" && mode !== "game") return reply(false, null, "mode must be 'maya' or 'game'");
  v.setNavMode(mode as any);
  return reply(true, { ok: true, mode });
}

if (msg.op === "viewport.getNavMode") {
  const viewportId = String(p.viewportId ?? "scene");
  const v = instances.get(viewportId);
  if (!v) return reply(true, null);
  return reply(true, { mode: (v as any).navMode ?? "maya" });
}

        if (msg.op === "viewport.setSelection") {
          const viewportId = String(p.viewportId ?? "scene");
          const v = instances.get(viewportId);
          if (v) v.setSelection(p.selectedId ? String(p.selectedId) : null);
          return reply(true, { ok: true });
        }

        if (msg.op === "viewport.getStats") {
          const viewportId = String(p.viewportId ?? "scene");
          const v = instances.get(viewportId);
          if (!v) return reply(true, null);
          return reply(true, { fps: v.stats.fps, drawCalls: v.stats.drawCalls });
        }

        reply(false, null, `Unknown op: ${msg.op}`);
      } catch (err: any) {
        reply(false, null, String(err?.message ?? err));
      }
    });

    (Viewport3dModule as any)._unsub = unsub;
    (Viewport3dModule as any)._detachAll = () => {
      for (const [id] of instances) detachCanvas(id);
    };
  },
  dispose() {
    (Viewport3dModule as any)._detachAll?.();
    (Viewport3dModule as any)._unsub?.();
  },
};
