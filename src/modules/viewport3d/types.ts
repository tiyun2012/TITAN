export type NavMode = "maya" | "game";

export type ViewportInputEvent =
  | { type: "pointerDown"; x: number; y: number; button: number; alt: boolean }
  | { type: "pointerMove"; x: number; y: number; alt: boolean }
  | { type: "pointerUp"; x: number; y: number }
  | { type: "wheel"; deltaY: number };

export type ViewportStats = {
  fps: number;
  drawCalls: number;
};

export type Renderable = {
  id: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
};
