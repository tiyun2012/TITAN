export type Vec3 = { x: number; y: number; z: number };
export type Mat4 = Float32Array;

export const Mat4Utils = {
  create(): Mat4 {
    const m = new Float32Array(16);
    m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
    return m;
  },

  identity(out: Mat4) {
    out.fill(0);
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
  },

  perspective(fovyRad: number, aspect: number, near: number, far: number, out: Mat4) {
    const f = 1.0 / Math.tan(fovyRad / 2);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[11] = -1;
    if (far !== Infinity) {
      const nf = 1 / (near - far);
      out[10] = (far + near) * nf;
      out[14] = (2 * far * near) * nf;
    } else {
      out[10] = -1;
      out[14] = -2 * near;
    }
    out[15] = 0;
  },

  lookAt(eye: Vec3, center: Vec3, up: Vec3, out: Mat4) {
    // gl-matrix compatible view matrix (World -> Camera), column-major layout
    let x0: number, x1: number, x2: number, y0: number, y1: number, y2: number, z0: number, z1: number, z2: number;
    let len: number;

    z0 = eye.x - center.x;
    z1 = eye.y - center.y;
    z2 = eye.z - center.z;

    len = Math.hypot(z0, z1, z2);
    if (len === 0) {
      z2 = 1;
    } else {
      z0 /= len; z1 /= len; z2 /= len;
    }

    x0 = up.y * z2 - up.z * z1;
    x1 = up.z * z0 - up.x * z2;
    x2 = up.x * z1 - up.y * z0;
    len = Math.hypot(x0, x1, x2);
    if (len === 0) {
      x0 = 0; x1 = 0; x2 = 0;
    } else {
      x0 /= len; x1 /= len; x2 /= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
    out[12] = -(x0 * eye.x + x1 * eye.y + x2 * eye.z);
    out[13] = -(y0 * eye.x + y1 * eye.y + y2 * eye.z);
    out[14] = -(z0 * eye.x + z1 * eye.y + z2 * eye.z);
    out[15] = 1;
  },

  multiply(a: Mat4, b: Mat4, out: Mat4) {
    // out = a * b (column-major)
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

    out[0]  = a00*b00 + a10*b01 + a20*b02 + a30*b03;
    out[1]  = a01*b00 + a11*b01 + a21*b02 + a31*b03;
    out[2]  = a02*b00 + a12*b01 + a22*b02 + a32*b03;
    out[3]  = a03*b00 + a13*b01 + a23*b02 + a33*b03;

    out[4]  = a00*b10 + a10*b11 + a20*b12 + a30*b13;
    out[5]  = a01*b10 + a11*b11 + a21*b12 + a31*b13;
    out[6]  = a02*b10 + a12*b11 + a22*b12 + a32*b13;
    out[7]  = a03*b10 + a13*b11 + a23*b12 + a33*b13;

    out[8]  = a00*b20 + a10*b21 + a20*b22 + a30*b23;
    out[9]  = a01*b20 + a11*b21 + a21*b22 + a31*b23;
    out[10] = a02*b20 + a12*b21 + a22*b22 + a32*b23;
    out[11] = a03*b20 + a13*b21 + a23*b22 + a33*b23;

    out[12] = a00*b30 + a10*b31 + a20*b32 + a30*b33;
    out[13] = a01*b30 + a11*b31 + a21*b32 + a31*b33;
    out[14] = a02*b30 + a12*b31 + a22*b32 + a32*b33;
    out[15] = a03*b30 + a13*b31 + a23*b32 + a33*b33;
  },

  fromTranslation(v: Vec3, out: Mat4) {
    this.identity(out);
    out[12] = v.x;
    out[13] = v.y;
    out[14] = v.z;
  },

  fromScaling(v: Vec3, out: Mat4) {
    out.fill(0);
    out[0] = v.x;
    out[5] = v.y;
    out[10] = v.z;
    out[15] = 1;
  },
};
