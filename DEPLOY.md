# Firebase Studio / Google Studio Cloud

If you see:

> Failed to resolve module specifier "@/engine/api/EngineProvider"

It means you opened the project with a **static file preview**.
Browsers do not understand aliases like `@/...` — only Vite does.

## Correct way (recommended)
This repo includes `.idx/dev.nix` so Firebase Studio Web Preview runs Vite.

Steps:
1) Rebuild environment (so `.idx/dev.nix` is applied)
2) Open **Web Preview**
3) It will run:
   `npm run dev -- --host 0.0.0.0 --port $PORT`

## Manual fallback
```bash
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```
Then open the Web Preview / Ports UI for that port.
