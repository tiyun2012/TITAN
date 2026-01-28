const _map = new Map<string, HTMLCanvasElement>();

export function registerCanvas(handle: string, canvas: HTMLCanvasElement) {
  _map.set(handle, canvas);
}

export function unregisterCanvas(handle: string) {
  _map.delete(handle);
}

export function getCanvas(handle: string): HTMLCanvasElement | undefined {
  return _map.get(handle);
}
