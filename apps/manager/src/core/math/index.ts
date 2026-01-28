/**
 * Export your math library from a single entrypoint.
 * This keeps imports stable across modules.
 */
export * from "./math";

// Back-compat helpers (optional)
import type { Vec3 as Vec3Type } from "./math";
import { Vec3Utils } from "./math";

export const Vec3 = {
  create: (x = 0, y = 0, z = 0): Vec3Type => Vec3Utils.create(x, y, z),
  add: (a: Vec3Type, b: Vec3Type): Vec3Type => {
    const out = Vec3Utils.create();
    return Vec3Utils.add(a, b, out);
  },
};
