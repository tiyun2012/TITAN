import type { ModuleRegistry } from "../core/registry";
import { createModuleManager } from "./moduleManager";
import { ExamplePingModule } from "./examplePing";
import { ExampleMathModule } from "./exampleMath";

export function registerModules(registry: ModuleRegistry) {
  registry.register(createModuleManager(registry));
  registry.register(ExamplePingModule);
  registry.register(ExampleMathModule);
}
