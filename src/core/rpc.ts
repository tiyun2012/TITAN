export type ModuleId = string;

export type RpcRequest = {
  id: string;
  from: ModuleId;
  to: ModuleId;
  op: string;
  payload: any;
};

export type RpcResponse = {
  id: string;
  ok: boolean;
  result?: any;
  error?: string;
};

export type Module = {
  id: ModuleId;
  onRequest(req: RpcRequest): Promise<RpcResponse> | RpcResponse;
  onStart?: (api: Api) => void;
  onStop?: () => void;
};

export class ModuleRegistry {
  private modules = new Map<ModuleId, Module>();

  register(mod: Module) {
    if (this.modules.has(mod.id)) throw new Error(`Module already registered: ${mod.id}`);
    this.modules.set(mod.id, mod);
  }

  get(id: ModuleId) {
    return this.modules.get(id) ?? null;
  }

  listIds(): ModuleId[] {
    return Array.from(this.modules.keys());
  }

  stopAll() {
for (const m of this.modules.values()) {
      try {
        m.onStop?.();
      } catch {}
    }
    // Allow re-mount/re-register in React dev StrictMode
    this.modules.clear();
  }

  /** Clear all registered modules (useful for React StrictMode double-mount in dev). */
  clear() {
    this.modules.clear();
  }
}

export class Api {
  constructor(private registry: ModuleRegistry, public callerId: ModuleId = "ui") {}

  async call<T = any>(to: ModuleId, op: string, payload: any): Promise<T> {
    const mod = this.registry.get(to);
    if (!mod) throw new Error(`Missing module: ${to}`);

    const req: RpcRequest = {
      id: crypto.randomUUID(),
      from: this.callerId,
      to,
      op,
      payload,
    };

    const res = await mod.onRequest(req);
    if (!res.ok) throw new Error(res.error ?? `RPC failed: ${to}.${op}`);
    return res.result as T;
  }
}
