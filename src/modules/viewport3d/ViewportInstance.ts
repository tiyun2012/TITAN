import type { Api } from "../../core/rpc";
import type { NavMode, Renderable, ViewportInputEvent, ViewportStats } from "./types";
import { WebGLRenderer } from "./WebGLRenderer";
import type { Vec3 } from "../../core/math";

const ENGINE_ID = "module.engine";
type DragAction = "none" | "orbit" | "pan" | "dolly" | "look";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export class ViewportInstance {
  sceneId: string = "active";
  readonly viewportId: string;
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext;
  readonly renderer: WebGLRenderer;

  navMode: NavMode = "maya";

  yaw: number = Math.PI + 0.9;
  pitch: number = 0.35;
  distance: number = 10;
  target: Vec3 = { x: 0, y: 0, z: 0 };

  private dragging = false;
  private action: DragAction = "none";
  private lastX = 0;
  private lastY = 0;

  stats: ViewportStats = { fps: 0, drawCalls: 0 };
  private fpsT = performance.now();
  private frameCount = 0;

  private renderables: Renderable[] = [];
  private lastFetch = 0;

  private raf: number | null = null;
  private alive = true;

  constructor(opts: { viewportId: string; canvas: HTMLCanvasElement; gl: WebGL2RenderingContext; sceneId?: string }) {
    this.viewportId = opts.viewportId;
    this.sceneId = opts.sceneId ?? "active";
    this.canvas = opts.canvas;
    this.gl = opts.gl;
    this.renderer = new WebGLRenderer(opts.gl);
  }

  setScene(sceneId: string) {
    this.sceneId = sceneId;
  }

  setNavMode(mode: NavMode) {
    this.navMode = mode;
    this.dragging = false;
    this.action = "none";
  }

  handleInput(ev: ViewportInputEvent) {
    if (ev.type === "pointerDown") {
      this.dragging = true;
      this.lastX = ev.x;
      this.lastY = ev.y;

      if (this.navMode === "maya") {
        if (!ev.alt) { this.action = "none"; return; }
        if (ev.button === 0) this.action = "orbit";
        else if (ev.button === 1) this.action = "pan";
        else if (ev.button === 2) this.action = "dolly";
        else this.action = "none";
        return;
      }

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
      const panSpeed = 0.0025 * this.distance;
      if (this.navMode === "maya") {
        if (!ev.alt) { this.action = "none"; return; }

        if (this.action === "orbit") {
          // Maya-style: right drag -> yaw increases, down drag -> pitch increases
          this.yaw += dx * orbitSpeed;
          this.pitch += dy * orbitSpeed;
          this.pitch = clamp(this.pitch, -1.4, 1.2);
          return;
        }

        if (this.action === "pan") {
          // Simple pan in camera plane
          // Approximate basis from yaw/pitch
          const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
          // right axis (XZ plane)
          const rx = -sy, rz = cy;
          // up axis (world up)
          const ux = 0, uy = 1, uz = 0;
          this.target = {
            x: this.target.x + rx * dx * panSpeed + ux * (-dy) * panSpeed,
            y: this.target.y + uy * (-dy) * panSpeed,
            z: this.target.z + rz * dx * panSpeed + uz * (-dy) * panSpeed,
          };
          return;
        }

        if (this.action === "dolly") {
          const factor = Math.pow(1.01, dy);
          this.distance = clamp(this.distance * factor, 1.5, 500);
          return;
        }
        return;
      }

      if (this.navMode === "game") {
        if (this.action === "look") {
          this.yaw += dx * orbitSpeed;
          this.pitch += dy * orbitSpeed;
          this.pitch = clamp(this.pitch, -1.55, 1.55);
        }
      }
    }

    if (ev.type === "wheel") {
      this.distance *= ev.deltaY > 0 ? 1.08 : 0.92;
      this.distance = clamp(this.distance, 1.5, 500);
    }
  }

  start(api: Api) {
    this.alive = true;
    const tick = async () => {
      if (!this.alive) return;
      const now = performance.now();

      // Throttle engine fetch (10Hz)
      if (now - this.lastFetch > 100) {
        this.lastFetch = now;
        try {
          this.renderables = await api.call<Renderable[]>(ENGINE_ID, "world.listRenderables", this.sceneId === "active" ? {} : { sceneId: this.sceneId });
        } catch {
          // keep last list
        }
      }

      this.renderer.render({
        canvas: this.canvas,
        yaw: this.yaw,
        pitch: this.pitch,
        distance: this.distance,
        target: this.target,
        renderables: this.renderables,
        statsOut: this.stats,
      });

      // fps
      this.frameCount++;
      if (now - this.fpsT >= 500) {
        this.stats.fps = (this.frameCount * 1000) / (now - this.fpsT);
        this.frameCount = 0;
        this.fpsT = now;
      }

      this.raf = requestAnimationFrame(() => void tick());
    };
    this.raf = requestAnimationFrame(() => void tick());
  }

  stop() {
    this.alive = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.renderer.dispose();
  }
}
