import type { Module } from "../core/module";
import { asModuleId } from "../core/id";
import type { CoreEvent, RpcCall, RpcResponse } from "../core/rpc";
import type { ModuleRegistry } from "../core/registry";
import type { ModuleId } from "../core/id";

type UnloadPayload = { id: ModuleId };

export function createModuleManager(registry: ModuleRegistry): Module {
  const selfId = asModuleId("module.manager");

  return {
    id: selfId,
    init(ctx) {
      const unsub = ctx.bus.on("rpc/call", (e) => {
        const msg = e as RpcCall;
        if (msg.target !== selfId) return;

        if (msg.op === "modules.list") {
          const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: true, result: registry.list() };
          ctx.bus.emit(res as CoreEvent);
          return;
        }

        if (msg.op === "modules.unload") {
          const p = (msg.payload ?? {}) as UnloadPayload;
          const id = p.id;
          if (!id) {
            const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: false, error: "payload.id is required" };
            ctx.bus.emit(res as CoreEvent);
            return;
          }
          if (id === selfId) {
            const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: false, error: "Refusing to unload module.manager" };
            ctx.bus.emit(res as CoreEvent);
            return;
          }
          const ok = registry.unregister(id);
          const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: true, result: { unloaded: ok, id } };
          ctx.bus.emit(res as CoreEvent);
          return;
        }

        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: false, error: `Unknown op: ${msg.op}` };
        ctx.bus.emit(res as CoreEvent);
      });

      (createModuleManager as any)._unsub = unsub;
    },
    dispose() {
      (createModuleManager as any)._unsub?.();
    },
  };
}
