
import type { Module } from "../core/module";
import { asModuleId } from "../core/id";
import type { CoreEvent, RpcCall, RpcResponse } from "../core/rpc";
import { World } from "../../../../engine/core/World";

type Transform = { position: { x: number; y: number; z: number }; rotation: any; scale: { x: number; y: number; z: number } };
type Mesh = { primitive: "cube" | "sphere" | "plane"; color: string };

type Renderable = { id: string; transform: Transform; mesh: Mesh };

export const EngineModule: Module = {
  id: asModuleId("module.engine"),
  init(ctx) {
    const world = new World();

    // Run update loop
    let running = true;
    let last = performance.now();
    const loop = (t: number) => {
      if (!running) return;
      const dt = (t - last) / 1000;
      last = t;
      world.update(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    const emitEntitiesChanged = () => ctx.bus.emit({ type: "engine/entitiesChanged" } as any);

    const unsub = ctx.bus.on("rpc/call", (e) => {
      const msg = e as RpcCall;
      if (msg.target !== EngineModule.id) return;

      const reply = (ok: boolean, result?: unknown, error?: string) => {
        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok, result, error };
        ctx.bus.emit(res as CoreEvent);
      };

      try {
        if (msg.op === "world.listEntities") {
          reply(true, world.listEntities());
          return;
        }

        if (msg.op === "world.getEntity") {
          const id = (msg.payload as any)?.id as string;
          if (!id) return reply(false, null, "payload.id required");
          const transform = world.getComponent<any>(id, "transform");
          const mesh = world.getComponent<any>(id, "mesh");
          reply(true, { transform, mesh });
          return;
        }

        if (msg.op === "world.setPositionAxis") {
          const { id, axis, value } = (msg.payload ?? {}) as any;
          const t = world.getComponent<any>(id, "transform");
          if (!t) return reply(false, null, "entity has no transform");
          t.position[axis] = value;
          reply(true, { ok: true });
          return;
        }

        if (msg.op === "world.createCube") {
          const id = world.createEntity();
          world.addComponent(id, {
            type: "transform",
            position: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 2, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          } as any);
          world.addComponent(id, { type: "mesh", primitive: "cube", color: "#e67e22" } as any);
          emitEntitiesChanged();
          reply(true, { id });
          return;
        }

        if (msg.op === "world.listRenderables") {
          const entities = world.getEntitiesWith(["transform", "mesh"]);
          const out: Renderable[] = entities.map((id) => ({
            id,
            transform: world.getComponent<any>(id, "transform"),
            mesh: world.getComponent<any>(id, "mesh"),
          }));
          reply(true, out);
          return;
        }

        reply(false, null, `Unknown op: ${msg.op}`);
      } catch (err: any) {
        reply(false, null, String(err?.message ?? err));
      }
    });

    (EngineModule as any)._unsub = unsub;
    (EngineModule as any)._world = world;
  },
  dispose() {
    (EngineModule as any)._unsub?.();
  },
};
