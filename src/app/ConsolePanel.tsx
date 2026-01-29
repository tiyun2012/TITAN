import React, { useEffect, useMemo, useState } from "react";
import type { Api } from "../core/rpc";
import { logStore, logInfo, logWarn, logError } from "../core/log";

function fmtTime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const ConsolePanel: React.FC<{ api: Api }> = ({ api }) => {
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<"all" | "viewport" | "cli">("all");
  const [cmdText, setCmdText] = useState("");

  useEffect(() => logStore.subscribe(() => setTick((t) => t + 1)), []);

  const entries = useMemo(() => {
    const all = logStore.list();
    if (tab === "all") return all;
    if (tab === "viewport") return all.filter((e) => e.channel.includes("viewport"));
    return all.filter((e) => e.channel.startsWith("ui.cli"));
  }, [tick, tab]);

  const runCmd = async (raw: string) => {
    const line = raw.trim();
    if (!line) return;

    logInfo("ui.cli", `> ${line}`);

    const parts = line.split(/\s+/g);
    const cmd = (parts[0] ?? "").toLowerCase();

    try {
      if (cmd === "help" || cmd === "?") {
        logInfo("ui.cli", "Commands:");
        logInfo("ui.cli", "  scene list");
        logInfo("ui.cli", "  scene new <name>");
        logInfo("ui.cli", "  scene use <sceneId>");
        logInfo("ui.cli", "  viewport scene <sceneId|active>");
        return;
      }

      if (cmd === "scene") {
        const sub = (parts[1] ?? "").toLowerCase();
        if (sub === "list") {
          const scenes = await api.call<any[]>("module.engine", "scene.list", {});
          if (!scenes?.length) {
            logInfo("ui.cli", "(no scenes)");
            return;
          }
          for (const s of scenes) {
            logInfo("ui.cli", `${s.id}  name='${s.name}'  created=${new Date(s.createdAt).toLocaleString()}`);
          }
          const active = await api.call<any>("module.engine", "scene.getActive", {});
          if (active?.id) logInfo("ui.cli", `active: ${active.id}`);
          return;
        }
        if (sub === "new" || sub === "create") {
          const name = parts.slice(2).join(" ") || "Untitled";
          const s = await api.call<any>("module.engine", "scene.create", { name });
          logInfo("ui.cli", `created: ${s.id} (${s.name})`);
          return;
        }
        if (sub === "use" || sub === "active") {
          const sceneId = String(parts[2] ?? "");
          if (!sceneId) {
            logWarn("ui.cli", "Missing sceneId");
            return;
          }
          await api.call("module.engine", "scene.setActive", { sceneId });
          logInfo("ui.cli", `active scene -> ${sceneId}`);
          return;
        }
        logWarn("ui.cli", "scene subcommands: list | new <name> | use <sceneId>");
        return;
      }

      if (cmd === "viewport") {
        const sub = (parts[1] ?? "").toLowerCase();
        if (sub === "scene") {
          const sceneId = String(parts[2] ?? "active");
          await api.call("module.viewport3d", "viewport.setScene", { viewportId: "scene", sceneId });
          logInfo("ui.cli", `viewport(scene) sceneId -> ${sceneId}`);
          return;
        }
        logWarn("ui.cli", "viewport subcommands: scene <sceneId|active>");
        return;
      }

      logWarn("ui.cli", `Unknown command: ${cmd}. Try 'help'.`);
    } catch (e: any) {
      logError("ui.cli", String(e?.message ?? e));
    }
  };

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "#0b0d10", display: "grid", gridTemplateRows: "34px 1fr" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px" }}>
        <div style={{ fontWeight: 800, fontSize: 12, opacity: 0.9 }}>Console</div>

        <button onClick={() => setTab("all")} style={btn(tab === "all")}>All</button>
        <button onClick={() => setTab("viewport")} style={btn(tab === "viewport")}>Viewport</button>
        <button onClick={() => setTab("cli")} style={btn(tab === "cli")}>CLI</button>

        <input
          value={cmdText}
          onChange={(e) => setCmdText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = cmdText;
              setCmdText("");
              runCmd(v);
              setTab("cli");
            }
          }}
          placeholder="command… (type 'help' and press Enter)"
          style={{
            flex: 1,
            marginLeft: 8,
            height: 24,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
            color: "#eaeaea",
            padding: "0 10px",
            fontSize: 12,
            outline: "none",
          }}
        />

        <div style={{ marginLeft: "auto", opacity: 0.6, fontSize: 11 }}>{entries.length} lines</div>
      </div>

      <div style={{ overflow: "auto", padding: "6px 10px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>
        {entries.slice(-1000).map((e, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "72px 64px 160px 1fr", gap: 10, padding: "2px 0", opacity: e.level === "debug" ? 0.7 : 1 }}>
            <div style={{ opacity: 0.7 }}>{fmtTime(e.ts)}</div>
            <div style={{ opacity: 0.85 }}>{e.level}</div>
            <div style={{ opacity: 0.9 }}>{e.channel}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{e.message}</div>
          </div>
        ))}
        {entries.length === 0 ? <div style={{ opacity: 0.6 }}>No logs yet.</div> : null}
      </div>
    </div>
  );
};

function btn(active: boolean): React.CSSProperties {
  return {
    padding: "4px 8px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.14)",
    background: active ? "rgba(255,255,255,0.10)" : "transparent",
    color: "#eaeaea",
    cursor: "pointer",
    fontSize: 11,
  };
}
