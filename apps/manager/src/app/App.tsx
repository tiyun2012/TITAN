import React from "react";
import type { Api } from "../core/rpc";
import { MainWindow } from "./MainWindow";

export function App({ api }: { api: Api }) {
  return <MainWindow api={api} />;
}
