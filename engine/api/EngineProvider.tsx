import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { World } from '../core/World';

const EngineContext = createContext<{
  world: World;
  tick: number;
} | null>(null);

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const worldRef = useRef(new World());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const world = worldRef.current;
    
    // Seed world
    const player = world.createEntity();
    world.addComponent(player, {
      type: "transform",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 }
    });
    world.addComponent(player, {
      type: "mesh",
      primitive: "cube",
      color: "#3498db"
    });

    const light = world.createEntity();
     world.addComponent(light, {
      type: "transform",
      position: { x: 5, y: 10, z: 5 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 }
    });

    // Simple motion system
    world.addSystem((w, dt) => {
      const entities = w.getEntitiesWith(["transform"]);
      for (const ent of entities) {
        const transform = w.getComponent<any>(ent, "transform");
        if (transform && ent === player) {
            transform.position.x += Math.sin(Date.now() / 1000) * 0.01;
        }
      }
    });

    let lastTime = performance.now();
    const frame = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      world.update(dt);
      setTick(t => t + 1);
      requestAnimationFrame(frame);
    };
    const handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, []);

  return (
    <EngineContext.Provider value={{ world: worldRef.current, tick }}>
      {children}
    </EngineContext.Provider>
  );
};

export const useEngine = () => {
  const context = useContext(EngineContext);
  if (!context) throw new Error("useEngine must be used within EngineProvider");
  return context;
};
