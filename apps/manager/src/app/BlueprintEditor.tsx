import React from 'react';

export const BlueprintEditor: React.FC<{ entityId: string | null }> = ({ entityId }) => {
  if (!entityId) return <div style={{ opacity: 0.5 }}>Select an entity to view its blueprint.</div>;

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: '#151515', 
      backgroundImage: 'radial-gradient(#333 1px, transparent 0)', 
      backgroundSize: '24px 24px',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 8
    }}>
      {/* Example Node */}
      <div style={{
        position: 'absolute',
        top: 50,
        left: 50,
        width: 150,
        background: '#222',
        border: '1px solid #444',
        borderRadius: 4,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '4px 8px', background: '#34495e', fontSize: 10, fontWeight: 'bold' }}>EVENT ON TICK</div>
        <div style={{ padding: 10, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5 }}>
            Exec <div style={{ width: 8, height: 8, background: '#fff', rotate: '45deg' }} />
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 150,
        left: 250,
        width: 180,
        background: '#222',
        border: '1px solid #444',
        borderRadius: 4,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '4px 8px', background: '#27ae60', fontSize: 10, fontWeight: 'bold' }}>SET POSITION</div>
        <div style={{ padding: 10, fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, background: '#fff', rotate: '45deg' }} /> In
          </div>
          <div style={{ marginTop: 8 }}>
            Target: [Self]
          </div>
          <div style={{ marginTop: 4 }}>
            Value: (0, 0, 0)
          </div>
        </div>
      </div>

      {/* Connection Line Simulation */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path d="M 190 90 C 220 90, 220 170, 258 170" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
      </svg>
      
      <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: 10, opacity: 0.4 }}>
        Right-click to add nodes. Use drag to move.
      </div>
    </div>
  );
};
