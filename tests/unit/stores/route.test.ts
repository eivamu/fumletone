import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { route, navigate, back, reset, _resetRouteForTests, _peekStackForTests } from '$lib/stores/route';

beforeEach(() => {
  _resetRouteForTests();
});

describe('route store', () => {
  it('starts at splash', () => {
    expect(get(route)).toEqual({ name: 'splash' });
  });

  it('navigate pushes a new route', () => {
    navigate({ name: 'onboarding/pickLanguage' });
    expect(get(route).name).toBe('onboarding/pickLanguage');
  });

  it('back returns to the previous route', () => {
    navigate({ name: 'onboarding/pickLanguage' });
    navigate({ name: 'onboarding/pickKidName' });
    back();
    expect(get(route).name).toBe('onboarding/pickLanguage');
  });

  it('back is a no-op at the root', () => {
    back();
    back();
    expect(get(route).name).toBe('splash');
  });

  it('reset replaces the stack with a single entry', () => {
    navigate({ name: 'onboarding/pickLanguage' });
    navigate({ name: 'onboarding/pickKidName' });
    reset({ name: 'hub' });
    expect(get(route)).toEqual({ name: 'hub' });
    expect(_peekStackForTests()).toEqual([{ name: 'hub' }]);
    back();
    expect(get(route).name).toBe('hub');
  });

  it('reset with no argument returns to splash', () => {
    navigate({ name: 'hub' });
    reset();
    expect(get(route)).toEqual({ name: 'splash' });
  });
});
