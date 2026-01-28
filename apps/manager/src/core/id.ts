export type Brand<K, T> = K & { readonly __brand: T };

export type ModuleId = Brand<string, "ModuleId">;
export type RequestId = Brand<string, "RequestId">;
export type PanelId = Brand<string, "PanelId">;

export function asModuleId(v: string): ModuleId {
  return v as ModuleId;
}
export function asPanelId(v: string): PanelId {
  return v as PanelId;
}

export function createRequestId(): RequestId {
  const s = Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
  return s as RequestId;
}
