import React, { useState, useEffect } from 'react';
import { useEngine } from '../../../../engine/api/EngineProvider';

export const Inspector: React.FC<{ entityId: string | null }> = ({ entityId }) => {
  const { world, tick } = useEngine();
  const [localTransform, setLocalTransform] = useState<any>(null);

  useEffect(() => {
    if (entityId) {
      const t = world.getComponent<any>(entityId, "transform");
      if (t) setLocalTransform({ ...t });
    }
  }, [entityId, world]);

  if (!entityId) return <div style={{ opacity: 0.5 }}>Select an entity to inspect.</div>;

  const transform = world.getComponent<any>(entityId, "transform");
  const mesh = world.getComponent<any>(entityId, "mesh");

  const updatePos = (axis: 'x' | 'y' | 'z', val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && transform) {
      transform.position[axis] = n;
    }
  };

  return (
    <div style={{ display: 'grid', gap: 15 }}>
      <section>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #444', marginBottom: 8, paddingBottom: 4 }}>Transform</div>
        {transform ? (
          <div style={{ display: 'grid', gap: 8 }}>
             <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ width: 60, fontSize: 12 }}>Position</span>
                <input type="number" step="0.1" defaultValue={transform.position.x} onChange={e => updatePos('x', e.target.value)} style={inputStyle} />
                <input type="number" step="0.1" defaultValue={transform.position.y} onChange={e => updatePos('y', e.target.value)} style={inputStyle} />
                <input type="number" step="0.1" defaultValue={transform.position.z} onChange={e => updatePos('z', e.target.value)} style={inputStyle} />
             </div>
          </div>
        ) : <div style={{ fontSize: 11, opacity: 0.5 }}>No Transform</div>}
      </section>

      <section>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #444', marginBottom: 8, paddingBottom: 4 }}>Mesh Renderer</div>
        {mesh ? (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ width: 60, fontSize: 12 }}>Color</span>
            <input type="color" value={mesh.color} onChange={e => mesh.color = e.target.value} style={{ border: 'none', padding: 0, width: 40 }} />
          </div>
        ) : <div style={{ fontSize: 11, opacity: 0.5 }}>No Mesh</div>}
      </section>
    </div>
  );
};

const inputStyle = {
  background: '#111',
  border: '1px solid #444',
  color: '#00ffff',
  padding: '2px 4px',
  width: 50,
  fontSize: 11,
  borderRadius: 2
};
