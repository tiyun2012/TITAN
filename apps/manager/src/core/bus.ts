export type Unsubscribe = () => void;

export interface EventBase {
  type: string;
}

export interface Bus<E extends EventBase> {
  emit(e: E): void;
  on<T extends E["type"]>(
    type: T,
    cb: (e: Extract<E, { type: T }>) => void
  ): Unsubscribe;
  onAny(cb: (e: E) => void): Unsubscribe;
}

export function createBus<E extends EventBase>(): Bus<E> {
  const handlers = new Map<string, Set<(e: E) => void>>();
  const anyHandlers = new Set<(e: E) => void>();

  function emit(e: E) {
    anyHandlers.forEach((h) => h(e));
    const set = handlers.get(e.type);
    if (!set) return;
    set.forEach((h) => h(e));
  }

  function on(type: string, cb: (e: E) => void): Unsubscribe {
    let set = handlers.get(type);
    if (!set) {
      set = new Set();
      handlers.set(type, set);
    }
    set.add(cb);
    return () => set!.delete(cb);
  }

  function onAny(cb: (e: E) => void): Unsubscribe {
    anyHandlers.add(cb);
    return () => anyHandlers.delete(cb);
  }

  return { emit, on: on as any, onAny };
}
