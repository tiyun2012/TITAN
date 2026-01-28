import React, { useRef, useEffect } from 'react';
import { useEngine } from '../../../../engine/api/EngineProvider';

export const Viewport: React.FC<{ onSelect: (id: string) => void, selectedId: string | null }> = ({ onSelect, selectedId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { world, tick } = useEngine();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    for(let i=0; i<canvas.width; i+=40) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
    for(let i=0; i<canvas.height; i+=40) { ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); }
    ctx.stroke();

    const entities = world.getEntitiesWith(["transform", "mesh"]);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (const ent of entities) {
      const transform = world.getComponent<any>(ent, "transform");
      const mesh = world.getComponent<any>(ent, "mesh");
      
      const x = centerX + transform.position.x * 100;
      const y = centerY - transform.position.y * 100;
      const size = 50 * transform.scale.x;

      ctx.fillStyle = mesh.color;
      if (ent === selectedId) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - size/2, y - size/2, size, size);
      }
      ctx.fillRect(x - size/2, y - size/2, size, size);
      
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(ent, x - size/2, y - size/2 - 5);
    }
  }, [world, tick, selectedId]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        style={{ width: '100%', height: '100%', cursor: 'crosshair' }} 
        onClick={() => onSelect("")}
      />
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 4, fontSize: 10 }}>
        FPS: 60 | Entities: {world.listEntities().length}
      </div>
    </div>
  );
};
