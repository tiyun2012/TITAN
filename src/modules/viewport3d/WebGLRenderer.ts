import { Mat4Utils, type Mat4, type Vec3 } from "../../core/math";
import type { Renderable, ViewportStats } from "./types";
import { VS, FS } from "./shaders";

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh) || "shader compile failed";
    gl.deleteShader(sh);
    throw new Error(info);
  }
  return sh;
}
function link(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(p) || "program link failed";
    gl.deleteProgram(p);
    throw new Error(info);
  }
  return p;
}

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private vbo: WebGLBuffer;

  private uMVP: WebGLUniformLocation;
  private uColor: WebGLUniformLocation;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;

    const vs = compile(gl, gl.VERTEX_SHADER, VS);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
    this.program = link(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    this.uMVP = gl.getUniformLocation(this.program, "uMVP")!;
    this.uColor = gl.getUniformLocation(this.program, "uColor")!;

    this.vao = gl.createVertexArray()!;
    this.vbo = gl.createBuffer()!;

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteBuffer(this.vbo);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }

  private setBuffer(data: Float32Array) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  }

  render(params: {
    canvas: HTMLCanvasElement;
    yaw: number;
    pitch: number;
    distance: number;
    target: Vec3;
    renderables: Renderable[];
    statsOut: ViewportStats;
  }) {
    const { canvas, yaw, pitch, distance, target, renderables, statsOut } = params;
    const gl = this.gl;

    // Resize
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.05, 0.06, 0.07, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const proj = Mat4Utils.create();
    const view = Mat4Utils.create();
    const viewProj = Mat4Utils.create();

    Mat4Utils.perspective(Math.PI / 3, w / Math.max(1, h), 0.1, 2000, proj);

    // Orbit camera around target
    const cx = Math.cos(yaw);
    const sx = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);

    const eye: Vec3 = { x: target.x + cx * cp * distance, y: target.y + sp * distance, z: target.z + sx * cp * distance };
    const up: Vec3 = { x: 0, y: 1, z: 0 };
    Mat4Utils.lookAt(eye, target, up, view);

    Mat4Utils.multiply(proj, view, viewProj);

    // Grid lines (simple)
    const grid = this.buildGrid(20, 1);
    this.setBuffer(grid);
    gl.uniformMatrix4fv(this.uMVP, false, viewProj);
    gl.uniform4f(this.uColor, 0.25, 0.28, 0.32, 1.0);
    gl.drawArrays(gl.LINES, 0, grid.length / 3);
    let draws = 1;

    // Draw simple cubes as wireframe (optional). If empty, still show grid.
    for (const r of renderables) {
      const cube = this.buildUnitCubeLines(r.position, r.scale);
      this.setBuffer(cube);
      gl.uniformMatrix4fv(this.uMVP, false, viewProj);
      gl.uniform4f(this.uColor, 0.85, 0.85, 0.85, 1.0);
      gl.drawArrays(gl.LINES, 0, cube.length / 3);
      draws++;
    }

    statsOut.drawCalls = draws;
  }

  private buildGrid(half: number, step: number): Float32Array {
    const pts: number[] = [];
    for (let i = -half; i <= half; i += step) {
      pts.push(-half, 0, i, half, 0, i);
      pts.push(i, 0, -half, i, 0, half);
    }
    return new Float32Array(pts);
  }

  private buildUnitCubeLines(pos: {x:number;y:number;z:number}, sc: {x:number;y:number;z:number}): Float32Array {
    const sx = sc.x, sy = sc.y, sz = sc.z;
    const x0 = pos.x - sx * 0.5, x1 = pos.x + sx * 0.5;
    const y0 = pos.y - sy * 0.5, y1 = pos.y + sy * 0.5;
    const z0 = pos.z - sz * 0.5, z1 = pos.z + sz * 0.5;

    const e = [
      // bottom
      x0,y0,z0,  x1,y0,z0,  x1,y0,z0,  x1,y0,z1,
      x1,y0,z1,  x0,y0,z1,  x0,y0,z1,  x0,y0,z0,
      // top
      x0,y1,z0,  x1,y1,z0,  x1,y1,z0,  x1,y1,z1,
      x1,y1,z1,  x0,y1,z1,  x0,y1,z1,  x0,y1,z0,
      // verticals
      x0,y0,z0,  x0,y1,z0,  x1,y0,z0,  x1,y1,z0,
      x1,y0,z1,  x1,y1,z1,  x0,y0,z1,  x0,y1,z1,
    ];
    return new Float32Array(e);
  }
}
