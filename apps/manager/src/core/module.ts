import type { Bus } from "./bus";
import type { Api, CoreEvent } from "./rpc";
import type { ModuleId } from "./id";

export interface ModuleContext {
  bus: Bus<CoreEvent>;
  api: Api;
  moduleId: ModuleId;
}

export interface Module {
  id: ModuleId;
  init(ctx: ModuleContext): void;
  dispose(): void;
}
