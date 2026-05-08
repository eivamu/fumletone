import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { route, navigate, back, _resetRouteForTests } from '$lib/stores/route';

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
});
