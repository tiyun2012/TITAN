import "./app/styles.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { createBus } from "./core/bus";
import { createApi, type CoreEvent } from "./core/rpc";
import { ModuleRegistry } from "./core/registry";
import { registerModules } from "./modules";

const bus = createBus<CoreEvent>();
const api = createApi(bus);
const registry = new ModuleRegistry(bus, api);

registerModules(registry);

// also log load list
api.log("info", "Manager started", { modules: registry.list().map(String) });

const __rootId = "root";
let __el = document.getElementById(__rootId);
if (!__el) {
  // Cloud/static hosts sometimes serve a different HTML entry by mistake.
  // Create the mount element to avoid a hard crash and still show the UI.
  __el = document.createElement("div");
  __el.id = __rootId;
  document.body.appendChild(__el);
  console.warn(`[ti-manager] Missing #${__rootId} in HTML. Created it automatically.`);
}

ReactDOM.createRoot(__el).render(
  <React.StrictMode>
    <App api={api} />
  </React.StrictMode>
);
