import type { Api } from "../../core/rpc";
import type { NavMode, Renderable, ViewportInputEvent, ViewportStats } from "./types";
import { WebGLRenderer } from "./WebGLRenderer";

const ENGINE_ID = "module.engine";

type Vec3 = { x: number; y: number; z: number };

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function mul(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}
function dot(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function len(a: Vec3) {
  return Math.sqrt(dot(a, a));
}
function norm(a: Vec3): Vec3 {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}

type DragAction = "none" | "orbit" | "pan" | "dolly" | "look";

export class ViewportInstance {
  readonly viewportId: string;
  readonly canvasHandle: string;
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext;
  readonly renderer: WebGLRenderer;

  // Navigation mode:
  // - "maya": Alt+LMB orbit, Alt+MMB pan, Alt+RMB dolly, wheel zoom
  // - "game": RMB look (placeholder), wheel zoom
  navMode: NavMode = "maya";

  // Orbit camera state (Editor/Maya)
  yaw: number = Math.PI + 0.9;
  pitch: number = 0.35;
  distance: number = 10;
  target: Vec3 = { x: 0, y: 0, z: 0 };

  // Game camera state (placeholder)
  gamePos: Vec3 = { x: 0, y: 2, z: 10 };

  // Input state
  private dragging = false;
  private action: DragAction = "none";
  private lastX = 0;
  private lastY = 0;

  // Selection (optional)
  selectedId: string | null = null;

  // Stats
  stats: ViewportStats = { fps: 0, drawCalls: 0 };
  private fpsT = performance.now();
  private frameCount = 0;

  // Renderables cache
  private renderables: Renderable[] = [];
  private lastFetch = 0;

  private raf: number | null = null;
  private alive = true;

  constructor(opts: {
    viewportId: string;
    canvasHandle: string;
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    renderer: WebGLRenderer;
  }) {
    this.viewportId = opts.viewportId;
    this.canvasHandle = opts.canvasHandle;
    this.canvas = opts.canvas;
    this.gl = opts.gl;
    this.renderer = opts.renderer;
  }

  setNavMode(mode: NavMode) {
    this.navMode = mode;
    // Reset drag state when switching
    this.dragging = false;
    this.action = "none";
  }

  setSelection(id: string | null) {
    this.selectedId = id;
  }

  private getCameraBasis(): { forward: Vec3; right: Vec3; up: Vec3 } {
    // Compute forward from yaw/pitch (orbit camera looking at target)
    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);

    // Eye offset from target (same convention as renderer)
    const eyeOffset: Vec3 = { x: cy * cp * this.distance, y: sp * this.distance, z: sy * cp * this.distance };
    const eye = add(this.target, eyeOffset);
    const forward = norm(sub(this.target, eye)); // eye -> target
    const worldUp: Vec3 = { x: 0, y: 1, z: 0 };
    const right = norm(cross(forward, worldUp));
    const up = norm(cross(right, forward));
    return { forward, right, up };
  }

  handleInput(ev: ViewportInputEvent) {
    if (ev.type === "pointerDown") {
      this.dragging = true;
      this.lastX = ev.x;
      this.lastY = ev.y;

      // Decide action based on mode + modifiers like Maya
      if (this.navMode === "maya") {
        if (!ev.alt) {
          this.action = "none";
          return;
        }
        if (ev.button === 0) this.action = "orbit";
        else if (ev.button === 1) this.action = "pan";
        else if (ev.button === 2) this.action = "dolly";
        else this.action = "none";
        return;
      }

      // game mode (simple mouselook on RMB)
      if (this.navMode === "game") {
        if (ev.button === 2) this.action = "look";
        else this.action = "none";
        return;
      }
      return;
    }

    if (ev.type === "pointerUp") {
      this.dragging = false;
      this.action = "none";
      return;
    }

    if (ev.type === "pointerMove" && this.dragging) {
      const dx = ev.x - this.lastX;
      const dy = ev.y - this.lastY;
      this.lastX = ev.x;
      this.lastY = ev.y;

      const orbitSpeed = 0.01;
      const panSpeed = 0.0025 * this.distance; // scale with distance feels like Maya
      const dollySpeed = 0.01;

      if (this.navMode === "maya") {
        // If Alt is released mid-drag, stop (matches Maya feel)
        if (!ev.alt) {
          this.action = "none";
          return;
        }

        if (this.action === "orbit") {
          // Inverted from previous to match Maya standard:
          // Drag Right (dx > 0) -> Camera rotates CCW around target (Yaw Increases) -> Object appears to rotate Left?
          // Actually Maya: Drag Right -> Object rotates Y-axis (like spinning it).
          // To spin object right, Camera must go Left (CW). Yaw Decreases.
          // Wait, if Previous was "Opposite to Maya", then Previous (Yaw Decreases) was wrong?
          // Let's try Yaw Increases.
          
          this.yaw += dx * orbitSpeed;
          this.pitch += dy * orbitSpeed; // Also invert pitch for "Drag Down -> Look Down" (Camera Up) vs "Drag Down -> Camera Down"
          
          this.pitch = clamp(this.pitch, -1.4, 1.2);
          return;
        }

        if (this.action === "pan") {
          const { right, up } = this.getCameraBasis();
          // Drag right moves camera/target right (so world appears to slide left) => target shifts +right
          // Drag up (dy negative) pans up => target shifts +up
          // Invert pan drag to match "grabbing the world" feel if needed, but standard is Camera Move.
          // If I drag mouse right, I expect the view to move right? No, usually Pan means "Move Camera Right".
          // So objects move left.
          this.target = add(this.target, add(mul(right, -dx * panSpeed), mul(up, dy * panSpeed)));
          return;
        }

        if (this.action === "dolly") {
          // Changed to horizontal drag for zoom based on user request "left to right should zoom in"
          // Right (dx > 0) -> Zoom In (distance smaller) -> factor < 1
          // Left (dx < 0) -> Zoom Out (distance larger) -> factor > 1
          const factor = Math.pow(1.01, -dx);
          this.distance = clamp(this.distance * factor, 1.5, 500);
          return;
        }

        return;
      }

      if (this.navMode === "game") {
        if (this.action === "look") {
          // Typical FPS mouselook
          this.yaw -= dx * orbitSpeed;
          this.pitch -= dy * orbitSpeed;
          this.pitch = clamp(this.pitch, -1.55, 1.55);
        }
      }
      return;
    }

    if (ev.type === "wheel") {
      // Maya-like: wheel forward (deltaY < 0) zoom in
      const d = ev.deltaY;
      this.distance *= d > 0 ? 1.08 : 0.92;
      this.distance = clamp(this.distance, 1.5, 500);
    }
  }

  start(api: Api) {
    this.alive = true;
    const tick = async () => {
      if (!this.alive) return;

      // Throttle renderable fetch (performance): 10Hz is enough for UI responsiveness.
      const now = performance.now();
      if (now - this.lastFetch > 100) {
        this.lastFetch = now;
        try {
          this.renderables = await api.call<Renderable[]>(ENGINE_ID as any, "world.listRenderables", {});
        } catch {
          // ignore; keep last cache
        }
      }

      // Render
      this.renderer.render({
        canvas: this.canvas,
        renderables: this.renderables,
        yaw: this.yaw,
        pitch: this.pitch,
        distance: this.distance,
        target: this.target,
        statsOut: this.stats,
      });

      // FPS
      this.frameCount++;
      if (now - this.fpsT >= 500) {
        this.stats.fps = (this.frameCount * 1000) / (now - this.fpsT);
        this.frameCount = 0;
        this.fpsT = now;
      }

      this.raf = requestAnimationFrame(() => {
        void tick();
      });
    };

    this.raf = requestAnimationFrame(() => {
      void tick();
    });
  }

  stop() {
    this.alive = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.renderer.dispose();
  }
}