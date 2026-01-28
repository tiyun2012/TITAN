export type Transform = {
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
};

export type Mesh = { color: string };

export type Renderable = {
  id: string;
  transform: Transform;
  mesh: Mesh;
};

export type ViewportStats = {
  fps: number;
  drawCalls: number;
};

export type ViewportInputEvent =
  | { type: "pointerDown"; x: number; y: number; button?: number; shift?: boolean; alt?: boolean; ctrl?: boolean; meta?: boolean }
  | { type: "pointerMove"; x: number; y: number; buttons?: number; shift?: boolean; alt?: boolean; ctrl?: boolean; meta?: boolean }
  | { type: "pointerUp"; x: number; y: number; button?: number }
  | { type: "wheel"; deltaY: number };
