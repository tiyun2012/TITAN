import type { Module } from "./module";
import type { ModuleId } from "./id";
import type { Bus } from "./bus";
import type { Api, CoreEvent } from "./rpc";

export class ModuleRegistry {
  private modules = new Map<ModuleId, Module>();

  constructor(private bus: Bus<CoreEvent>, private api: Api) {}

  register(module: Module) {
    if (this.modules.has(module.id)) {
      this.api.log("warn", `Module already registered: ${module.id}`);
      return;
    }
    this.modules.set(module.id, module);
    module.init({ bus: this.bus, api: this.api, moduleId: module.id });
    this.bus.emit({ type: "module/registered", id: module.id });
    this.api.log("info", `Module loaded: ${module.id}`);
  }

  unregister(id: ModuleId) {
    const m = this.modules.get(id);
    if (!m) return false;
    try { m.dispose(); } finally {
      this.modules.delete(id);
      this.bus.emit({ type: "module/unregistered", id });
      this.api.log("info", `Module unloaded: ${id}`);
    }
    return true;
  }

  list(): ModuleId[] {
    return [...this.modules.keys()];
  }
}
