import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unlock, isReady, _resetForTests } from '$lib/audio/engine';

vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  getContext: () => ({ state: 'running' }),
}));

beforeEach(() => {
  _resetForTests();
});

describe('audio engine', () => {
  it('is not ready before unlock', () => {
    expect(isReady()).toBe(false);
  });

  it('becomes ready after unlock', async () => {
    await unlock();
    expect(isReady()).toBe(true);
  });

  it('is idempotent across multiple unlock calls', async () => {
    await unlock();
    await unlock();
    expect(isReady()).toBe(true);
  });
});
