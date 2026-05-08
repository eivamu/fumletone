import { writable, get } from 'svelte/store';
import type { Route } from '$lib/db/schema';

const INITIAL: Route = { name: 'splash' };

const stack = writable<Route[]>([INITIAL]);

export const route = {
  subscribe: (run: (r: Route) => void) =>
    stack.subscribe((s) => run(s[s.length - 1])),
};

export function navigate(next: Route): void {
  stack.update((s) => [...s, next]);
}

export function back(): void {
  stack.update((s) => (s.length > 1 ? s.slice(0, -1) : s));
}

export function reset(to: Route = INITIAL): void {
  stack.set([to]);
}

export function _resetRouteForTests(): void {
  stack.set([INITIAL]);
}

export function _peekStackForTests(): Route[] {
  return get(stack);
}
