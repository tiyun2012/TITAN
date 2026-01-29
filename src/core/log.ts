export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  ts: number;
  level: LogLevel;
  channel: string;
  message: string;
};

type Listener = () => void;

export class LogStore {
  private entries: LogEntry[] = [];
  private listeners = new Set<Listener>();
  readonly maxEntries = 5000;

  add(level: LogLevel, channel: string, message: string) {
    const e: LogEntry = { ts: Date.now(), level, channel, message };
    this.entries.push(e);
    if (this.entries.length > this.maxEntries) this.entries.splice(0, this.entries.length - this.maxEntries);
    for (const l of this.listeners) l();
  }

  list(): LogEntry[] {
    return this.entries;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const logStore = new LogStore();

export function logInfo(channel: string, msg: string) { logStore.add("info", channel, msg); }
export function logWarn(channel: string, msg: string) { logStore.add("warn", channel, msg); }
export function logError(channel: string, msg: string) { logStore.add("error", channel, msg); }
export function logDebug(channel: string, msg: string) { logStore.add("debug", channel, msg); }
