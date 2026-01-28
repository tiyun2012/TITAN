import type { Module } from "../core/module";
import { asModuleId } from "../core/id";
import type { CoreEvent, RpcCall, RpcResponse } from "../core/rpc";

type Entity = {
  id: string;
  name: string;
  parentId: string | null;
};

type Transform = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
};

type ViewportItem = { id: string; label: string; x: number; y: number; w: number; h: number };

function hash32(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mkEntities(): Entity[] {
  return [
    { id: "e.root", name: "Root", parentId: null },
    { id: "e.cam", name: "Camera", parentId: "e.root" },
    { id: "e.light", name: "Light", parentId: "e.root" },
    { id: "e.cube", name: "Cube", parentId: "e.root" },
    { id: "e.sphere", name: "Sphere", parentId: "e.root" },
  ];
}

function defaultTransform(): Transform {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };
}

export const EngineMockModule: Module = {
  id: asModuleId("module.engine"),
  init(ctx) {
    const entities = mkEntities();
    const transforms = new Map<string, Transform>();
    entities.forEach((e) => transforms.set(e.id, defaultTransform()));

    const unsub = ctx.bus.on("rpc/call", (e) => {
      const msg = e as RpcCall;
      if (msg.target !== EngineMockModule.id) return;

      // world.list -> Entity[]
      if (msg.op === "world.list") {
        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: true, result: entities };
        ctx.bus.emit(res as CoreEvent);
        return;
      }

      // entity.get -> { entity, transform }
      if (msg.op === "entity.get") {
        const p = msg.payload as any;
        const id = String(p?.id ?? "");
        const ent = entities.find((x) => x.id === id);
        if (!ent) {
          const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: false, error: `Entity not found: ${id}` };
          ctx.bus.emit(res as CoreEvent);
          return;
        }
        const t = transforms.get(id) ?? defaultTransform();
        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: true, result: { entity: ent, transform: t } };
        ctx.bus.emit(res as CoreEvent);
        return;
      }

      // entity.setTransform -> { ok: true }
      if (msg.op === "entity.setTransform") {
        const p = msg.payload as any;
        const id = String(p?.id ?? "");
        if (!transforms.has(id)) {
          const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: false, error: `Entity not found: ${id}` };
          ctx.bus.emit(res as CoreEvent);
          return;
        }
        const t = p?.transform as Transform;
        transforms.set(id, t);
        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: true, result: { id } };
        ctx.bus.emit(res as CoreEvent);
        return;
      }

      // world.viewportItems -> ViewportItem[]
      if (msg.op === "world.viewportItems") {
        const items: ViewportItem[] = entities
          .filter((x) => x.id !== "e.root")
          .map((x, idx) => {
            const h = hash32(x.id);
            const x0 = 40 + ((h % 400) / 400) * 520;
            const y0 = 40 + (((h >>> 8) % 200) / 200) * 280;
            const w = 60 + ((h >>> 16) % 80);
            const hgt = 40 + ((h >>> 24) % 60);
            return { id: x.id, label: x.name, x: x0, y: y0, w, h: hgt };
          });

        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: true, result: items };
        ctx.bus.emit(res as CoreEvent);
        return;
      }

      // blueprint.get -> dummy graph text
      if (msg.op === "blueprint.get") {
        const p = msg.payload as any;
        const id = String(p?.id ?? "");
        const ent = entities.find((x) => x.id === id);
        if (!ent) {
          const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: false, error: `Entity not found: ${id}` };
          ctx.bus.emit(res as CoreEvent);
          return;
        }
        const res: RpcResponse = {
          type: "rpc/response",
          requestId: msg.requestId,
          ok: true,
          result: {
            id,
            nodes: [
              { id: "n1", type: "Start" },
              { id: "n2", type: "Update" },
              { id: "n3", type: "End" },
            ],
            edges: [
              { from: "n1", to: "n2" },
              { from: "n2", to: "n3" },
            ],
          },
        };
        ctx.bus.emit(res as CoreEvent);
        return;
      }

      const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: false, error: `Unknown op: ${msg.op}` };
      ctx.bus.emit(res as CoreEvent);
    });

    (EngineMockModule as any)._unsub = unsub;
    ctx.api.log("info", "EngineMockModule ready", { id: EngineMockModule.id });
  },
  dispose() {
    (EngineMockModule as any)._unsub?.();
  },
};
