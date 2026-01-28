import { Vec3, Quat } from "../../apps/manager/src/core/math";

export type Entity = string;

export interface Component {
  type: string;
}

export interface TransformComponent extends Component {
  type: "transform";
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
}

export interface MeshComponent extends Component {
  type: "mesh";
  primitive: "cube" | "sphere" | "plane";
  color: string;
}

export interface ScriptComponent extends Component {
  type: "script";
  nodes: any[];
}

export type AllComponents = TransformComponent | MeshComponent | ScriptComponent;

export class World {
  private entities = new Set<Entity>();
  private components = new Map<Entity, Map<string, AllComponents>>();
  private systems: ((world: World, dt: number) => void)[] = [];

  createEntity(): Entity {
    const id = Math.random().toString(36).substr(2, 9);
    this.entities.add(id);
    this.components.set(id, new Map());
    return id;
  }

  addComponent(entity: Entity, component: AllComponents) {
    this.components.get(entity)?.set(component.type, component);
  }

  getComponent<T extends AllComponents>(entity: Entity, type: string): T | undefined {
    return this.components.get(entity)?.get(type) as T;
  }

  getEntitiesWith(types: string[]): Entity[] {
    return Array.from(this.entities).filter(entity => {
      const entityComps = this.components.get(entity);
      return types.every(type => entityComps?.has(type));
    });
  }

  addSystem(system: (world: World, dt: number) => void) {
    this.systems.push(system);
  }

  update(dt: number) {
    for (const system of this.systems) {
      system(this, dt);
    }
  }

  listEntities() {
    return Array.from(this.entities);
  }

  destroyEntity(entity: Entity) {
    this.entities.delete(entity);
    this.components.delete(entity);
  }
}
