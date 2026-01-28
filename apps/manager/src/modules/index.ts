import type { ModuleRegistry } from "../core/registry";
import { createModuleManager } from "./moduleManager";
import { ExamplePingModule } from "./examplePing";
import { ExampleMathModule } from "./exampleMath";
import { EngineModule } from "./engineModule";
import { Viewport3dModule } from "./viewport3d";

export function registerModules(registry: ModuleRegistry) {
  registry.register(createModuleManager(registry));
  registry.register(ExamplePingModule);
  registry.register(ExampleMathModule);

  // New: engine + viewport as modules (UI talks via ModuleId)
  registry.register(EngineModule);
  registry.register(Viewport3dModule);
}
