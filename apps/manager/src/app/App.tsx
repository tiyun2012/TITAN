import React from "react";
import type { Api, CoreEvent } from "../core/rpc";
import type { Bus } from "../core/bus";
import { MainWindow } from "./MainWindow";

export function App({ api, bus }: { api: Api; bus: Bus<CoreEvent> }) {
  return <MainWindow api={api} bus={bus} />;
}