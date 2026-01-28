
import type { Module } from "../core/module";
import { asModuleId } from "../core/id";
import type { CoreEvent, RpcCall, RpcResponse } from "../core/rpc";
import { getCanvas } from "../ui/canvasRegistry";
import { Mat4Utils, type Mat4, type Vec3 } from "../core/math/math";

const ENGINE_ID = "module.engine";

type Transform = { position: { x: number; y: number; z: number }; scale: { x: number; y: number; z: number } };
type Mesh = { color: string };
type Renderable = { id: string; transform: Transform; mesh: Mesh };

type ViewportInstance = {
  viewportId: string;
  canvasHandle: string;
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vaoCube: WebGLVertexArrayObject;
  vboCube: WebGLBuffer;
  vaoGrid: WebGLVertexArrayObject;
  vboGrid: WebGLBuffer;
  gridVertexCount: number;

  // uniforms
  u_viewProj: WebGLUniformLocation;
  u_model: WebGLUniformLocation;
  u_color: WebGLUniformLocation;

  // camera
  yaw: number;
  pitch: number;
  distance: number;
  dragging: boolean;
  lastX: number;
  lastY: number;

  // stats
  lastT: number;
  fps: number;
  frameCount: number;
  fpsT: number;
  drawCalls: number;

  // selection (future use)
  selectedId: string | null;

  // cached renderables
  cached: Renderable[];
  lastFetch: number;

  raf: number | null;
  disposed: boolean;
};

function createShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const msg = gl.getShaderInfoLog(sh) || "shader compile error";
    gl.deleteShader(sh);
    throw new Error(msg);
  }
  return sh;
}

function createProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  if (!prog) throw new Error("createProgram failed");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const msg = gl.getProgramInfoLog(prog) || "program link error";
    gl.deleteProgram(prog);
    throw new Error(msg);
  }
  return prog;
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, dpr: number) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h };
}

function makeGrid(step = 1, count = 20) {
  // lines on XZ plane
  const verts: number[] = [];
  const half = count * step;
  for (let i = -count; i <= count; i++) {
    const x = i * step;
    // line parallel to Z
    verts.push(x, 0, -half,  x, 0, half);
    const z = i * step;
    // line parallel to X
    verts.push(-half, 0, z,  half, 0, z);
  }
  return new Float32Array(verts);
}

function makeCube() {
  // 36 vertices (12 triangles), unit cube centered at origin
  const p = [
    // +X
    0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
    0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
    // -X
   -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
   -0.5, -0.5,  0.5,  -0.5,  0.5, -0.5,  -0.5, -0.5, -0.5,
    // +Y
   -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
   -0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    // -Y
   -0.5, -0.5,  0.5,  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,
   -0.5, -0.5,  0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
    // +Z
   -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
   -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
    // -Z
    0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,
    0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
  ];
  return new Float32Array(p);
}

function parseHexColor(hex: string): [number, number, number, number] {
  const s = (hex || "").trim();
  const h = s.startsWith("#") ? s.slice(1) : s;
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return [r, g, b, 1];
  }
  return [0.8, 0.8, 0.8, 1];
}

function getEye(yaw: number, pitch: number, dist: number): Vec3 {
  // yaw around Y, pitch up/down
  const cp = Math.cos(pitch);
  return {
    x: dist * cp * Math.sin(yaw),
    y: dist * Math.sin(pitch),
    z: dist * cp * Math.cos(yaw),
  };
}

export const Viewport3dModule: Module = {
  id: asModuleId("module.viewport3d"),
  init(ctx) {
    const instances = new Map<string, ViewportInstance>();

    const VS = `#version 300 es
layout(location=0) in vec3 a_pos;
uniform mat4 u_viewProj;
uniform mat4 u_model;
void main() {
  gl_Position = u_viewProj * u_model * vec4(a_pos, 1.0);
}`;
    const FS = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  outColor = u_color;
}`;

    function destroy(v: ViewportInstance) {
      v.disposed = true;
      if (v.raf) cancelAnimationFrame(v.raf);
      const gl = v.gl;
      gl.deleteBuffer(v.vboCube);
      gl.deleteVertexArray(v.vaoCube);
      gl.deleteBuffer(v.vboGrid);
      gl.deleteVertexArray(v.vaoGrid);
      gl.deleteProgram(v.program);
      instances.delete(v.viewportId);
    }

    async function fetchRenderables(v: ViewportInstance) {
      // throttle to reduce rpc
      const now = performance.now();
      if (now - v.lastFetch < 150) return;
      v.lastFetch = now;
      try {
        v.cached = await ctx.api.call<Renderable[]>(ENGINE_ID as any, "world.listRenderables", {});
      } catch {
        // ignore
      }
    }

    function renderFrame(v: ViewportInstance) {
      if (v.disposed) return;

      const gl = v.gl;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { w, h } = resizeCanvasToDisplaySize(v.canvas, dpr);
      gl.viewport(0, 0, w, h);

      // camera matrices
      const eye = getEye(v.yaw, v.pitch, v.distance);
      const view: Mat4 = Mat4Utils.create();
      const proj: Mat4 = Mat4Utils.create();
      const viewProj: Mat4 = Mat4Utils.create();
      Mat4Utils.lookAt(eye, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, view);
      Mat4Utils.perspective((60 * Math.PI) / 180, w / h, 0.1, 2000, proj);
      
      // FIX: Multiply Proj * View. Previous code did View * Proj.
      Mat4Utils.multiply(proj, view, viewProj);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clearColor(0.07, 0.07, 0.07, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(v.program);

      gl.uniformMatrix4fv(v.u_viewProj, false, viewProj);

      let drawCalls = 0;

      // grid
      const modelI: Mat4 = Mat4Utils.create();
      Mat4Utils.identity(modelI);
      gl.uniformMatrix4fv(v.u_model, false, modelI);
      gl.uniform4f(v.u_color, 0.20, 0.20, 0.20, 1.0);

      gl.bindVertexArray(v.vaoGrid);
      gl.drawArrays(gl.LINES, 0, v.gridVertexCount);
      drawCalls++;

      // cubes
      gl.bindVertexArray(v.vaoCube);

      for (const r of v.cached) {
        const pos = r.transform?.position ?? { x: 0, y: 0, z: 0 };
        const sc = r.transform?.scale ?? { x: 1, y: 1, z: 1 };
        const modelT: Mat4 = Mat4Utils.create();
        const modelS: Mat4 = Mat4Utils.create();
        Mat4Utils.fromTranslation(pos as any, modelT);
        Mat4Utils.fromScaling(sc as any, modelS);
        
        // FIX: model = T * S. Previous code did S * T which scaled translation.
        Mat4Utils.multiply(modelT, modelS, modelT);

        gl.uniformMatrix4fv(v.u_model, false, modelT);

        const col = parseHexColor(r.mesh?.color ?? "#999999");
        gl.uniform4f(v.u_color, col[0], col[1], col[2], col[3]);

        gl.drawArrays(gl.TRIANGLES, 0, 36);
        drawCalls++;
      }

      // stats
      const t = performance.now();
      v.frameCount++;
      if (t - v.fpsT >= 500) {
        v.fps = (v.frameCount * 1000) / (t - v.fpsT);
        v.frameCount = 0;
        v.fpsT = t;
      }
      v.drawCalls = drawCalls;

      // schedule next frame
      v.raf = requestAnimationFrame(() => {
        void fetchRenderables(v);
        renderFrame(v);
      });
    }

    function attachCanvas(viewportId: string, canvasHandle: string) {
      const canvas = getCanvas(canvasHandle);
      if (!canvas) throw new Error(`Canvas handle not found: ${canvasHandle}`);
      const gl = canvas.getContext("webgl2", { antialias: true }) as WebGL2RenderingContext | null;
      if (!gl) throw new Error("WebGL2 not available");

      const program = createProgram(gl, VS, FS);

      const u_viewProj = gl.getUniformLocation(program, "u_viewProj");
      const u_model = gl.getUniformLocation(program, "u_model");
      const u_color = gl.getUniformLocation(program, "u_color");
      if (!u_viewProj || !u_model || !u_color) throw new Error("Missing uniforms");

      // cube vao/vbo
      const vaoCube = gl.createVertexArray();
      const vboCube = gl.createBuffer();
      if (!vaoCube || !vboCube) throw new Error("VAO/VBO create failed");

      gl.bindVertexArray(vaoCube);
      gl.bindBuffer(gl.ARRAY_BUFFER, vboCube);
      gl.bufferData(gl.ARRAY_BUFFER, makeCube(), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
      gl.bindVertexArray(null);

      // grid vao/vbo
      const grid = makeGrid(1, 30);
      const vaoGrid = gl.createVertexArray();
      const vboGrid = gl.createBuffer();
      if (!vaoGrid || !vboGrid) throw new Error("Grid VAO/VBO create failed");

      gl.bindVertexArray(vaoGrid);
      gl.bindBuffer(gl.ARRAY_BUFFER, vboGrid);
      gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
      gl.bindVertexArray(null);

      // dispose previous instance if exists
      const prev = instances.get(viewportId);
      if (prev) destroy(prev);

      const v: ViewportInstance = {
        viewportId,
        canvasHandle,
        canvas,
        gl,
        program,
        vaoCube,
        vboCube,
        vaoGrid,
        vboGrid,
        gridVertexCount: grid.length / 3,
        u_viewProj,
        u_model,
        u_color,
        yaw: Math.PI + 0.9,
        pitch: 0.35,
        distance: 6,
        dragging: false,
        lastX: 0,
        lastY: 0,
        lastT: performance.now(),
        fps: 0,
        frameCount: 0,
        fpsT: performance.now(),
        drawCalls: 0,
        selectedId: null,
        cached: [],
        lastFetch: 0,
        raf: null,
        disposed: false,
      };

      instances.set(viewportId, v);
      void fetchRenderables(v);
      renderFrame(v);
    }

    const unsub = ctx.bus.on("rpc/call", (e) => {
      const msg = e as RpcCall;
      if (msg.target !== Viewport3dModule.id) return;

      const reply = (ok: boolean, result?: unknown, error?: string) => {
        const res: RpcResponse = { type: "rpc/response", requestId: msg.requestId, ok, result, error };
        ctx.bus.emit(res as CoreEvent);
      };

      try {
        const p = (msg.payload ?? {}) as any;

        if (msg.op === "viewport.attachCanvas") {
          const viewportId = String(p.viewportId ?? "scene");
          const canvasHandle = String(p.canvasHandle ?? "");
          if (!canvasHandle) return reply(false, null, "payload.canvasHandle required");
          attachCanvas(viewportId, canvasHandle);
          return reply(true, { ok: true });
        }

        if (msg.op === "viewport.detachCanvas") {
          const viewportId = String(p.viewportId ?? "scene");
          const v = instances.get(viewportId);
          if (v) destroy(v);
          return reply(true, { ok: true });
        }

        if (msg.op === "viewport.input") {
          const viewportId = String(p.viewportId ?? "scene");
          const v = instances.get(viewportId);
          if (!v) return reply(true, { ok: false });

          if (p.type === "pointerDown") {
            v.dragging = true;
            v.lastX = Number(p.x ?? 0);
            v.lastY = Number(p.y ?? 0);
          }
          if (p.type === "pointerUp") {
            v.dragging = false;
          }
          if (p.type === "pointerMove" && v.dragging) {
            const x = Number(p.x ?? 0);
            const y = Number(p.y ?? 0);
            const dx = x - v.lastX;
            const dy = y - v.lastY;
            v.lastX = x; v.lastY = y;
            v.yaw += dx * 0.01;
            v.pitch -= dy * 0.01;
            v.pitch = Math.max(-1.4, Math.min(1.2, v.pitch));
          }
          if (p.type === "wheel") {
            const d = Number(p.deltaY ?? 0);
            v.distance *= (d > 0) ? 1.08 : 0.92;
            v.distance = Math.max(1.5, Math.min(80, v.distance));
          }

          return reply(true, { ok: true });
        }

        if (msg.op === "viewport.setSelection") {
          const viewportId = String(p.viewportId ?? "scene");
          const v = instances.get(viewportId);
          if (v) v.selectedId = p.selectedId ? String(p.selectedId) : null;
          return reply(true, { ok: true });
        }

        if (msg.op === "viewport.getStats") {
          const viewportId = String(p.viewportId ?? "scene");
          const v = instances.get(viewportId);
          if (!v) return reply(true, null);
          return reply(true, { fps: v.fps, drawCalls: v.drawCalls });
        }

        reply(false, null, `Unknown op: ${msg.op}`);
      } catch (err: any) {
        reply(false, null, String(err?.message ?? err));
      }
    });

    (Viewport3dModule as any)._unsub = unsub;
  },
  dispose() {
    (Viewport3dModule as any)._unsub?.();
  },
};
