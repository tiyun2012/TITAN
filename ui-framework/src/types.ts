export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogItem = {
  ts: number;
  level: LogLevel;
  message: string;
  data?: unknown;
};

export type Unsub = () => void;