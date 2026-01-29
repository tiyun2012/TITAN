import type { Api, Module, RpcRequest, RpcResponse } from "../core/rpc";
import { logInfo, logWarn } from "../core/log";

export type Renderable = {
  id: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
};

export type SceneInfo = {
  id: string;
  name: string;
  createdAt: number;
};

export class EngineModule implements Module {
  id = "module.engine";
  private api: Api | null = null;

  private scenes = new Map<string, SceneInfo>();
  private activeSceneId = "";
  private sceneRenderables = new Map<string, Renderable[]>();

  onStart(api: Api) {
    this.api = api;
    const s = this.createSceneInternal("Default");
    this.activeSceneId = s.id;
    logInfo(this.id, `started (multi-scene placeholder). active=${this.activeSceneId}`);
  }

  private createSceneInternal(name: string): SceneInfo {
    const id = `scene-${Math.random().toString(16).slice(2, 8)}-${Date.now().toString(16).slice(-4)}`;
    const scene: SceneInfo = { id, name: name || id, createdAt: Date.now() };
    this.scenes.set(id, scene);
    this.sceneRenderables.set(id, []);
    return scene;
  }

  onRequest(req: RpcRequest): RpcResponse {
    const p = req.payload ?? {};
    const ok = (result: any) => ({ id: req.id, ok: true, result } as RpcResponse);
    const bad = (error: string) => ({ id: req.id, ok: false, error } as RpcResponse);

    // Scene management
    if (req.op === "scene.list") {
      return ok(Array.from(this.scenes.values()));
    }
    if (req.op === "scene.getActive") {
      return ok(this.scenes.get(this.activeSceneId) ?? null);
    }
    if (req.op === "scene.create") {
      const name = String(p.name ?? "Untitled");
      const s = this.createSceneInternal(name);
      logInfo(this.id, `scene created: ${s.id} (${s.name})`);
      return ok(s);
    }
    if (req.op === "scene.setActive") {
      const sceneId = String(p.sceneId ?? "");
      if (!this.scenes.has(sceneId)) return bad(`Unknown sceneId: ${sceneId}`);
      this.activeSceneId = sceneId;
      logInfo(this.id, `active scene set: ${sceneId}`);
      return ok({ ok: true, sceneId });
    }

    // World queries (scene-aware)
    if (req.op === "world.listRenderables") {
      const sceneId = String(p.sceneId ?? this.activeSceneId);
      const list = this.sceneRenderables.get(sceneId);
      if (!list) return bad(`Unknown sceneId: ${sceneId}`);
      return ok(list);
    }

    // Legacy placeholders
    if (req.op === "world.listEntities") return ok([]);
    if (req.op === "world.getEntity") return ok(null);

    logWarn(this.id, `unknown op: ${req.op}`);
    return bad(`Unknown op: ${req.op}`);
  }
}
