import type { Bus } from "./bus";
import type { ModuleId, RequestId } from "./id";
import { createRequestId } from "./id";

export type RpcCall = {
  type: "rpc/call";
  requestId: RequestId;
  target: ModuleId;
  op: string;
  payload: unknown;
};

export type RpcResponse = {
  type: "rpc/response";
  requestId: RequestId;
  ok: boolean;
  result?: unknown;
  error?: string;
};

export type LogEvent = {
  type: "log";
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: unknown;
};

export type ModuleRegisteredEvent = { type: "module/registered"; id: ModuleId };
export type ModuleUnregisteredEvent = { type: "module/unregistered"; id: ModuleId };

export type EngineEntitiesChangedEvent = { type: "engine/entitiesChanged" };

export type CoreEvent = RpcCall | RpcResponse | LogEvent | ModuleRegisteredEvent | ModuleUnregisteredEvent | EngineEntitiesChangedEvent;

export interface Api {
  call<T = unknown>(target: ModuleId, op: string, payload?: unknown): Promise<T>;
  log(level: LogEvent["level"], message: string, data?: unknown): void;
}

export function createApi(bus: Bus<CoreEvent>): Api {
  function log(level: LogEvent["level"], message: string, data?: unknown) {
    bus.emit({ type: "log", level, message, data });
  }

  async function call<T = unknown>(target: ModuleId, op: string, payload?: unknown): Promise<T> {
    const requestId = createRequestId();
    const msg: RpcCall = { type: "rpc/call", requestId, target, op, payload: payload ?? null };

    return await new Promise<T>((resolve, reject) => {
      const unsub = bus.on("rpc/response", (e) => {
        if (e.requestId !== requestId) return;
        unsub();
        if (e.ok) resolve(e.result as T);
        else reject(new Error(e.error ?? "RPC failed"));
      });
      bus.emit(msg);
    });
  }

  return { call, log };
}
