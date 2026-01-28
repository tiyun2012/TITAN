import { Mat4Utils, type Mat4, type Vec3 } from "../../core/math/math";
import { FS, VS } from "./shaders";
import type { Renderable, ViewportStats } from "./types";

type Uniforms = {
  u_viewProj: WebGLUniformLocation;
  u_model: WebGLUniformLocation;
  u_color: WebGLUniformLocation;
};

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error("createShader failed");
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(s) || "unknown";
    gl.deleteShader(s);
    throw new Error(info);
  }
  return s;
}

function createProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  if (!p) throw new Error("createProgram failed");
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, "a_pos");
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(p) || "unknown";
    gl.deleteProgram(p);
    throw new Error(info);
  }
  return p;
}

function parseHexColor(hex: string): [number, number, number, number] {
  const h = (hex || "#999999").replace("#", "").trim();
  const val = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = ((val >> 16) & 255) / 255;
  const g = ((val >> 8) & 255) / 255;
  const b = (val & 255) / 255;
  return [r, g, b, 1];
}

function makeCube(): Float32Array {
  // 12 triangles, positions only (36 verts)
  return new Float32Array([
    // +X
    0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,
    0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,
    // -X
   -0.5, -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5,
   -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5,
    // +Y
   -0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
   -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,
    // -Y
   -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5,
   -0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
    // +Z
   -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,
   -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
    // -Z
   -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,
   -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,
  ]);
}

function makeGrid(step: number, halfExtent: number): { data: Float32Array; lineCount: number } {
  // Grid in XZ plane (y=0)
  const verts: number[] = [];
  for (let i = -halfExtent; i <= halfExtent; i++) {
    // lines parallel to X (varying Z)
    verts.push(-halfExtent * step, 0, i * step,  halfExtent * step, 0, i * step);
    // lines parallel to Z (varying X)
    verts.push(i * step, 0, -halfExtent * step,  i * step, 0, halfExtent * step);
  }
  return { data: new Float32Array(verts), lineCount: verts.length / 3 };
}

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private u: Uniforms;

  private vaoCube: WebGLVertexArrayObject;
  private vboCube: WebGLBuffer;

  private vaoGrid: WebGLVertexArrayObject;
  private vboGrid: WebGLBuffer;
  private gridVerts: number;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;

    this.program = createProgram(gl, VS, FS);

    const u_viewProj = gl.getUniformLocation(this.program, "u_viewProj");
    const u_model = gl.getUniformLocation(this.program, "u_model");
    const u_color = gl.getUniformLocation(this.program, "u_color");
    if (!u_viewProj || !u_model || !u_color) throw new Error("Missing uniforms");
    this.u = { u_viewProj, u_model, u_color };

    // Cube VAO
    const vaoCube = gl.createVertexArray();
    const vboCube = gl.createBuffer();
    if (!vaoCube || !vboCube) throw new Error("VAO/VBO create failed");
    this.vaoCube = vaoCube;
    this.vboCube = vboCube;

    gl.bindVertexArray(this.vaoCube);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboCube);
    gl.bufferData(gl.ARRAY_BUFFER, makeCube(), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    gl.bindVertexArray(null);

    // Grid VAO
    const grid = makeGrid(1, 30);
    const vaoGrid = gl.createVertexArray();
    const vboGrid = gl.createBuffer();
    if (!vaoGrid || !vboGrid) throw new Error("Grid VAO/VBO create failed");
    this.vaoGrid = vaoGrid;
    this.vboGrid = vboGrid;
    this.gridVerts = grid.lineCount;

    gl.bindVertexArray(this.vaoGrid);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboGrid);
    gl.bufferData(gl.ARRAY_BUFFER, grid.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteBuffer(this.vboCube);
    gl.deleteVertexArray(this.vaoCube);
    gl.deleteBuffer(this.vboGrid);
    gl.deleteVertexArray(this.vaoGrid);
    gl.deleteProgram(this.program);
  }

  render(params: {
    canvas: HTMLCanvasElement;
    renderables: Renderable[];
    yaw: number;
    pitch: number;
    distance: number;
    target: { x: number; y: number; z: number };
    statsOut: ViewportStats;
  }) {
    const { canvas, renderables, yaw, pitch, distance, target, statsOut } = params;
    const gl = this.gl;

    const w = Math.max(1, Math.floor(canvas.clientWidth));
    const h = Math.max(1, Math.floor(canvas.clientHeight));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.06, 0.06, 0.06, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);

    const proj: Mat4 = Mat4Utils.create();
    Mat4Utils.perspective((60 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 2000, proj);

    // Orbit camera around target (Maya-style pivot)
    const cx = Math.cos(yaw);
    const sx = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);

    const eye: Vec3 = { x: target.x + cx * cp * distance, y: target.y + sp * distance, z: target.z + sx * cp * distance } as any;
    const center: Vec3 = { x: target.x, y: target.y, z: target.z } as any;
    const up: Vec3 = { x: 0, y: 1, z: 0 } as any;
    const view: Mat4 = Mat4Utils.create();
    Mat4Utils.lookAt(eye, center, up, view);

    const viewProj: Mat4 = Mat4Utils.create();
    
    // Correct order for clip-space: viewProj = proj * view
    // Since multiply(a,b) = a*b, we do multiply(proj, view, viewProj).
    Mat4Utils.multiply(proj, view, viewProj);

    gl.uniformMatrix4fv(this.u.u_viewProj, false, viewProj);

    let drawCalls = 0;

    // Draw grid
    gl.bindVertexArray(this.vaoGrid);
    const gridModel: Mat4 = Mat4Utils.create();
    Mat4Utils.identity(gridModel);
    gl.uniformMatrix4fv(this.u.u_model, false, gridModel);
    gl.uniform4f(this.u.u_color, 0.25, 0.25, 0.25, 1);
    gl.drawArrays(gl.LINES, 0, this.gridVerts);
    drawCalls++;

    // Draw renderables
    gl.bindVertexArray(this.vaoCube);

    for (const r of renderables) {
      const pos = r.transform?.position ?? { x: 0, y: 0, z: 0 };
      const sc = r.transform?.scale ?? { x: 1, y: 1, z: 1 };

      const modelT: Mat4 = Mat4Utils.create();
      const modelS: Mat4 = Mat4Utils.create();
      Mat4Utils.fromTranslation([pos.x, pos.y, pos.z] as any, modelT);
      Mat4Utils.fromScaling([sc.x, sc.y, sc.z] as any, modelS);
      
      // model = T * S
      Mat4Utils.multiply(modelT, modelS, modelT);

      gl.uniformMatrix4fv(this.u.u_model, false, modelT);

      const col = parseHexColor(r.mesh?.color ?? "#999999");
      gl.uniform4f(this.u.u_color, col[0], col[1], col[2], col[3]);

      gl.drawArrays(gl.TRIANGLES, 0, 36);
      drawCalls++;
    }

    gl.bindVertexArray(null);

    statsOut.drawCalls = drawCalls;
  }
}