import type { Api, Module, RpcRequest, RpcResponse } from "../../core/rpc";
import { logInfo, logWarn } from "../../core/log";
import type { NavMode, ViewportInputEvent } from "./types";
import { ViewportInstance } from "./ViewportInstance";

export class Viewport3dModule implements Module {
  id = "module.viewport3d";
  private api: Api | null = null;
  private instances = new Map<string, ViewportInstance>();

  onStart(api: Api) {
    this.api = api;
    logInfo(this.id, "started");
  }

  onStop() {
    for (const v of this.instances.values()) v.stop();
    this.instances.clear();
  }

  async onRequest(req: RpcRequest): Promise<RpcResponse> {
    const p = req.payload ?? {};
    const reply = (ok: boolean, result?: any, error?: string): RpcResponse => ({ id: req.id, ok, result, error });

    if (req.op === "viewport.attachCanvas") {
      const viewportId = String(p.viewportId ?? "scene");
      const canvas = p.canvas as HTMLCanvasElement | null;
      if (!canvas) return reply(false, null, "missing canvas");
      const gl = canvas.getContext("webgl2", { antialias: true });
      if (!gl) return reply(false, null, "WebGL2 not available");

      // Replace existing
      this.instances.get(viewportId)?.stop();
      const sceneId = p.sceneId ? String(p.sceneId) : undefined;
      const inst = new ViewportInstance({ viewportId, canvas, gl, sceneId });
      this.instances.set(viewportId, inst);

      inst.start(this.api!);
      return reply(true, { ok: true });
    }

    if (req.op === "viewport.detachCanvas") {
      const viewportId = String(p.viewportId ?? "scene");
      this.instances.get(viewportId)?.stop();
      this.instances.delete(viewportId);
      return reply(true, { ok: true });
    }

    if (req.op === "viewport.input") {
      const viewportId = String(p.viewportId ?? "scene");
      const v = this.instances.get(viewportId);
      if (!v) return reply(true, { ok: false });
      v.handleInput(p.event as ViewportInputEvent);
      return reply(true, { ok: true });
    }

    if (req.op === "viewport.setNavMode") {
      const viewportId = String(p.viewportId ?? "scene");
      const v = this.instances.get(viewportId);
      if (!v) return reply(true, { ok: false });
      const mode = String(p.mode ?? "maya");
      if (mode !== "maya" && mode !== "game") return reply(false, null, "mode must be 'maya' or 'game'");
      v.setNavMode(mode as NavMode);
      return reply(true, { ok: true, mode });
    }

    
if (req.op === "viewport.setScene") {
  const viewportId = String(p.viewportId ?? "scene");
  const v = this.instances.get(viewportId);
  if (!v) return reply(true, { ok: false });
  const sceneId = String(p.sceneId ?? "active");
  v.setScene(sceneId);
  return reply(true, { ok: true, sceneId });
}

if (req.op === "viewport.getScene") {
  const viewportId = String(p.viewportId ?? "scene");
  const v = this.instances.get(viewportId);
  if (!v) return reply(true, null);
  return reply(true, { sceneId: v.sceneId });
}

if (req.op === "viewport.getStats") {
      const viewportId = String(p.viewportId ?? "scene");
      const v = this.instances.get(viewportId);
      if (!v) return reply(true, null);
      return reply(true, { ...v.stats });
    }

    logWarn(this.id, `unknown op: ${req.op}`);
    return reply(false, null, `Unknown op: ${req.op}`);
  }
}
