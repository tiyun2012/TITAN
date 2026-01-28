import type { Api } from "../../core/rpc";
import type { Renderable, ViewportInputEvent, ViewportStats } from "./types";
import { WebGLRenderer } from "./WebGLRenderer";

const ENGINE_ID = "module.engine";

export class ViewportInstance {
  readonly viewportId: string;
  readonly canvasHandle: string;
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext;
  readonly renderer: WebGLRenderer;

  // Orbit camera state
  yaw: number = Math.PI + 0.9;
  pitch: number = 0.35;
  distance: number = 10;

  // Input state
  dragging: boolean = false;
  lastX: number = 0;
  lastY: number = 0;

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

  setSelection(id: string | null) {
    this.selectedId = id;
  }

  handleInput(ev: ViewportInputEvent) {
    if (ev.type === "pointerDown") {
      this.dragging = true;
      this.lastX = ev.x;
      this.lastY = ev.y;
      return;
    }
    if (ev.type === "pointerUp") {
      this.dragging = false;
      return;
    }
    if (ev.type === "pointerMove" && this.dragging) {
      const dx = ev.x - this.lastX;
      const dy = ev.y - this.lastY;
      this.lastX = ev.x;
      this.lastY = ev.y;
      this.yaw += dx * 0.01;
      this.pitch -= dy * 0.01;
      this.pitch = Math.max(-1.4, Math.min(1.2, this.pitch));
      return;
    }
    if (ev.type === "wheel") {
      const d = ev.deltaY;
      this.distance *= d > 0 ? 1.08 : 0.92;
      this.distance = Math.max(1.5, Math.min(80, this.distance));
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
