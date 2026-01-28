import type { LogItem, LogLevel, Unsub } from "./types";

export type LogForwarder = (level: LogLevel, message: string, data?: unknown) => void;

export class UiLogger {
  private logs: LogItem[] = [];
  private listeners = new Set<() => void>();

  constructor(private forward?: LogForwarder) {}

  subscribe(cb: () => void): Unsub {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  getLogs(): LogItem[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
    this.emit();
  }

  log(level: LogLevel, message: string, data?: unknown) {
    const item: LogItem = { ts: Date.now(), level, message, data };
    this.logs = [...this.logs, item].slice(-2000);
    // forward to host app if desired
    this.forward?.(level, message, data);
    this.emit();
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}