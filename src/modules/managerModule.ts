import type { Api, Module, RpcRequest, RpcResponse } from "../core/rpc";
import { logInfo } from "../core/log";

export class ManagerModule implements Module {
  id = "module.manager";
  private api: Api | null = null;

  onStart(api: Api) {
    this.api = api;
    logInfo(this.id, "started");
  }

  onRequest(req: RpcRequest): RpcResponse {
    if (req.op === "manager.ping") return { id: req.id, ok: true, result: { ok: true } };
    if (req.op === "manager.about") return { id: req.id, ok: true, result: { name: "TI3D Manager (placeholder)" } };
    return { id: req.id, ok: false, error: `Unknown op: ${req.op}` };
  }
}
