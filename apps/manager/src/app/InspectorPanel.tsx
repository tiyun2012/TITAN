import React, { useEffect, useState } from "react";
import type { Api } from "../core/rpc";

const ENGINE_ID = "module.engine";

const inputStyle: React.CSSProperties = {
  width: 70,
  padding: "6px 8px",
  background: "#111",
  border: "1px solid #333",
  borderRadius: 6,
  color: "#e0e0e0",
  outline: "none",
};

type Transform = { position: { x: number; y: number; z: number }; rotation: any; scale: { x: number; y: number; z: number } };
type Mesh = { primitive: string; color: string };

export const InspectorPanel: React.FC<{ api: Api; entityId: string | null }> = ({ api, entityId }) => {
  const [data, setData] = useState<{ transform?: Transform; mesh?: Mesh } | null>(null);

  async function load() {
    if (!entityId) return setData(null);
    try {
      const res = await api.call<any>(ENGINE_ID as any, "world.getEntity", { id: entityId });
      setData(res ?? null);
    } catch (e: any) {
      api.log("error", "Inspector load failed", { error: String(e?.message ?? e) });
      setData(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  if (!entityId) return <div style={{ opacity: 0.6 }}>Select an entity to inspect.</div>;
  if (!data) return <div style={{ opacity: 0.6 }}>Loading...</div>;

  const t = data.transform;

  const setPos = async (axis: "x" | "y" | "z", val: string) => {
    const n = parseFloat(val);
    if (Number.isNaN(n)) return;
    await api.call(ENGINE_ID as any, "world.setPositionAxis", { id: entityId, axis, value: n });
    load();
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section>
        <div style={{ fontWeight: 800, borderBottom: "1px solid #333", marginBottom: 8, paddingBottom: 6 }}>
          Transform
        </div>

        {t ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ width: 70, fontSize: 12, opacity: 0.8 }}>Position</span>
              <input type="number" step="0.1" defaultValue={t.position.x} onChange={(e) => setPos("x", e.target.value)} style={inputStyle} />
              <input type="number" step="0.1" defaultValue={t.position.y} onChange={(e) => setPos("y", e.target.value)} style={inputStyle} />
              <input type="number" step="0.1" defaultValue={t.position.z} onChange={(e) => setPos("z", e.target.value)} style={inputStyle} />
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.6 }}>No transform</div>
        )}
      </section>

      <section>
        <div style={{ fontWeight: 800, borderBottom: "1px solid #333", marginBottom: 8, paddingBottom: 6 }}>
          Mesh
        </div>
        {data.mesh ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>Primitive: <b>{data.mesh.primitive}</b></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, background: data.mesh.color, borderRadius: 3, display: "inline-block" }} />
              <span style={{ opacity: 0.8 }}>{data.mesh.color}</span>
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.6 }}>No mesh</div>
        )}
      </section>

      <button
        style={{ padding: 10, background: "#333", border: "1px solid #444", color: "#fff", borderRadius: 8, cursor: "pointer" }}
        onClick={load}
      >
        Reload
      </button>
    </div>
  );
};
