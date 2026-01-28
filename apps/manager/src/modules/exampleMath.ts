import type { Module } from "../core/module";
import { asModuleId } from "../core/id";
import type { CoreEvent, RpcCall, RpcResponse } from "../core/rpc";
import { Vec3, Vec3Utils } from "../core/math";

export const ExampleMathModule: Module = {
  id: asModuleId("module.math"),
  init(ctx) {
    const unsub = ctx.bus.on("rpc/call", (e) => {
      const msg = e as RpcCall;
      if (msg.target !== ExampleMathModule.id) return;

      if (msg.op === "v3.add") {
        const p = msg.payload as any;
        const a = p?.a ?? { x: 0, y: 0, z: 0 };
        const b = p?.b ?? { x: 0, y: 0, z: 0 };
        const out = Vec3.add(a, b);
        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: true, result: out };
        ctx.bus.emit(res as CoreEvent);
        return;
      }

      // Zero-GC style using your math utils (if available in math.ts)
      if (msg.op === "v3.add.out") {
        const p = msg.payload as any;
        const a = p?.a ?? { x: 0, y: 0, z: 0 };
        const b = p?.b ?? { x: 0, y: 0, z: 0 };
        const out = Vec3Utils.create();
        Vec3Utils.add(a, b, out);
        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: true, result: out };
        ctx.bus.emit(res as CoreEvent);
        return;
      }

      const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok: false, error: `Unknown op: ${msg.op}` };
      ctx.bus.emit(res as CoreEvent);
    });

    (ExampleMathModule as any)._unsub = unsub;
  },
  dispose() {
    (ExampleMathModule as any)._unsub?.();
  },
};
