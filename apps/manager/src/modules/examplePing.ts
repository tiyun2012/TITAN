import type { Module } from "../core/module";
import { asModuleId } from "../core/id";
import type { CoreEvent, RpcCall, RpcResponse } from "../core/rpc";

export const ExamplePingModule: Module = {
  id: asModuleId("module.ping"),
  init(ctx) {
    const unsub = ctx.bus.on("rpc/call", (e) => {
      const msg = e as RpcCall;
      if (msg.target !== ExamplePingModule.id) return;

      if (msg.op === "ping") {
        const res: RpcResponse = {
          type: "rpc/response",
          requestId: msg.requestId,
          ok: true,
          result: { pong: true, payload: msg.payload, at: new Date().toISOString() },
        };
        ctx.bus.emit(res as CoreEvent);
        return;
      }

      const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: false, error: `Unknown op: ${msg.op}` };
      ctx.bus.emit(res as CoreEvent);
    });

    (ExamplePingModule as any)._unsub = unsub;
  },
  dispose() {
    (ExamplePingModule as any)._unsub?.();
  },
};
