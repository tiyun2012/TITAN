import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './apps/manager/src/app/App';
import { EngineProvider } from './engine/api/EngineProvider';
import { createBus } from './apps/manager/src/core/bus';
import { createApi } from './apps/manager/src/core/rpc';
import "./apps/manager/src/app/styles.css";

const bus = createBus<any>();
const api = createApi(bus);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <EngineProvider>
      <App api={api} busOnAny={bus.onAny} />
    </EngineProvider>
  </React.StrictMode>
);
