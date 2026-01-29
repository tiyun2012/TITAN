# TI3D Editor (Clean Placeholder)

This is a **minimal, clean base** to add back your engine/editor features gradually.

## What is included
- **Manager app UI** (left: module list, center: Scene Viewport, bottom: Console, right: Inspector placeholder)
- **ModuleId RPC** (`src/core/rpc.ts`) – UI talks to modules by `moduleId`
- **Engine module placeholder** (`module.engine`) – currently returns empty renderables (no cubes, no blueprints)
- **Viewport module** (`module.viewport3d`) – WebGL2 grid + optional wireframe renderables
- **Editor navigation**
  - Maya: Alt+LMB orbit, Alt+MMB pan, Alt+RMB dolly, wheel zoom
  - Game: RMB look (placeholder)

## Run
```bash
npm install
npm run dev
```

## Legacy code
Your previous larger codebase is preserved under `legacy/` for reference and gradual migration back in as separate modules/UI panels.


## Command line
Use the console input (bottom bar) to manage scenes.

Examples:
- `help`
- `scene list`
- `scene new MyScene`
- `scene use <sceneId>`
- `viewport scene <sceneId>` (or `viewport scene active`)
