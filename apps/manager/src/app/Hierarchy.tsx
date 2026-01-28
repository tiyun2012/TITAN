import React from 'react';
import { useEngine } from '../../../../engine/api/EngineProvider';

export const Hierarchy: React.FC<{ onSelect: (id: string) => void, selectedId: string | null }> = ({ onSelect, selectedId }) => {
  const { world } = useEngine();
  const entities = world.listEntities();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {entities.map(id => (
        <div 
          key={id} 
          onClick={() => onSelect(id)}
          style={{
            padding: '8px 12px',
            backgroundColor: selectedId === id ? '#2d2d2d' : 'transparent',
            border: '1px solid #333',
            borderRadius: 4,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>Entity: <b>{id}</b></span>
          <span style={{ fontSize: 10, opacity: 0.5 }}>#obj</span>
        </div>
      ))}
      <button 
        style={{ marginTop: 10, padding: 8, background: '#444', border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer' }}
        onClick={() => {
          const id = world.createEntity();
          world.addComponent(id, {
            type: "transform",
            position: { x: (Math.random()-0.5)*2, y: (Math.random()-0.5)*2, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 0.5, y: 0.5, z: 0.5 }
          });
          world.addComponent(id, { type: "mesh", primitive: "cube", color: "#e74c3c" });
          onSelect(id);
        }}
      >
        + Add Entity
      </button>
    </div>
  );
};
