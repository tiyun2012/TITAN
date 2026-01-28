import React, { useEffect, useMemo, useState } from "react";
import type { Api, CoreEvent } from "../core/rpc";
import type { ModuleId } from "../core/id";

type LogItem = { ts: number; level: string; message: string; data?: unknown };
type EventItem = { ts: number; type: string; payload: unknown };

const MANAGER_ID = "module.manager";

function safe(v: unknown) {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

export function MainConsole({
  api,
  busOnAny,
}: {
  api: Api;
  busOnAny: (cb: (e: CoreEvent) => void) => () => void;
}) {
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [target, setTarget] = useState<string>(MANAGER_ID);
  const [op, setOp] = useState<string>("modules.list");
  const [payload, setPayload] = useState<string>("{}");
  const [result, setResult] = useState<string>("");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showEvents, setShowEvents] = useState<boolean>(true);

  async function refreshModules() {
    try {
      const list = await api.call<ModuleId[]>(MANAGER_ID as any, "modules.list", {});
      const asStrings = (list as any[]).map(String);
      setModuleIds(asStrings);
      if (asStrings.length && !asStrings.includes(target)) {
        setTarget(asStrings.includes(MANAGER_ID) ? MANAGER_ID : asStrings[0]);
      }
    } catch (e: any) {
      api.log("error", "Failed to refresh modules", { error: String(e?.message ?? e) });
    }
  }

  useEffect(() => {
    refreshModules();
    return busOnAny((e) => {
      setEvents((prev) => [{ ts: Date.now(), type: e.type, payload: e }, ...prev].slice(0, 500));
      if (e.type === "log") {
        const le = e as any;
        setLogs((prev) => [...prev, { ts: Date.now(), level: le.level, message: le.message, data: le.data }].slice(-1000));
      }
      if (e.type === "module/registered" || e.type === "module/unregistered") refreshModules();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prettyLogs = useMemo(() => logs.slice(-200).reverse(), [logs]);

  async function run() {
    try {
      const parsed = payload.trim() ? JSON.parse(payload) : null;
      const res = await api.call<any>(target as any, op, parsed);
      setResult(safe(res));
      api.log("info", `rpc ok: ${target}.${op}`);
    } catch (err: any) {
      setResult(String(err?.message ?? err));
      api.log("error", `rpc failed: ${target}.${op}`, { error: String(err?.message ?? err) });
    }
  }

  async function unloadSelected() {
    if (!target || target === MANAGER_ID) return;
    await api.call<any>(MANAGER_ID as any, "modules.unload", { id: target });
  }

  function preset(p: { target: string; op: string; payload: any }) {
    setTarget(p.target);
    setOp(p.op);
    setPayload(JSON.stringify(p.payload, null, 2));
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12, height: "100%" }}>
      <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr auto", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 900 }}>Main Console</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setLogs([])}>Clear logs</button>
            <button onClick={() => setEvents([])}>Clear events</button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Module</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ flex: 1 }}>
              {!moduleIds.includes(MANAGER_ID) ? <option value={MANAGER_ID}>{MANAGER_ID}</option> : null}
              {moduleIds.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Op</label>
            <input value={op} onChange={(e) => setOp(e.target.value)} style={{ flex: 1 }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Payload (JSON)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={refreshModules}>Refresh</button>
              <button onClick={unloadSelected} disabled={!target || target === MANAGER_ID}>Unload</button>
              <button onClick={run}>Call</button>
            </div>
          </div>

          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            spellCheck={false}
            style={{ width: "100%", height: 120, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
          />

          <div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Result</div>
            <pre style={{ background: "#0b1220", color: "#d7e2ff", padding: 10, borderRadius: 8, overflow: "auto", maxHeight: 220 }}>
              {result || "(no result yet)"}
            </pre>
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Presets</div>
          <button onClick={() => preset({ target: MANAGER_ID, op: "modules.list", payload: {} })}>modules.list</button>
          <button onClick={() => preset({ target: "module.ping", op: "ping", payload: { text: "hello" } })}>ping</button>
          <button onClick={() => preset({ target: "module.math", op: "v3.add", payload: { a:{x:1,y:2,z:3}, b:{x:10,y:20,z:30} } })}>math v3.add</button>
          <button onClick={() => preset({ target: MANAGER_ID, op: "modules.unload", payload: { id: "module.ping" } })}>unload module.ping</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 12, minWidth: 0 }}>
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 8, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Logs (latest first)</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{logs.length}</div>
          </div>
          <div style={{ overflow: "auto", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8 }}>
            {prettyLogs.map((l, idx) => (
              <div key={idx} style={{ padding: "8px 10px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{String(l.level).toUpperCase()}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{new Date(l.ts).toLocaleTimeString()}</div>
                </div>
                <div style={{ fontSize: 13 }}>{l.message}</div>
                {l.data !== undefined ? (
                  <pre style={{ fontSize: 12, opacity: 0.9, marginTop: 6, whiteSpace: "pre-wrap" }}>{safe(l.data)}</pre>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 8, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Event stream</div>
            <label style={{ fontSize: 12, opacity: 0.8 }}>
              <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} /> show
            </label>
          </div>
          <div style={{ overflow: "auto", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8 }}>
            {!showEvents ? (
              <div style={{ padding: 10, fontSize: 12, opacity: 0.75 }}>Hidden</div>
            ) : (
              events.map((it, idx) => (
                <div key={idx} style={{ padding: "8px 10px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{it.type}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{new Date(it.ts).toLocaleTimeString()}</div>
                  </div>
                  <pre style={{ fontSize: 12, opacity: 0.9, marginTop: 6, whiteSpace: "pre-wrap" }}>{safe(it.payload)}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
