import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import FumlingAvatar from '$lib/components/FumlingAvatar.svelte';

describe('FumlingAvatar', () => {
  it('uses the requested color as a fill', () => {
    const { container } = render(FumlingAvatar, {
      props: { color: 'rose', features: [], instrument: 'violin' },
    });
    const body = container.querySelector('[data-part="body"]');
    expect(body).not.toBeNull();
    expect(body!.getAttribute('fill')).toBe('var(--color-rose)');
  });

  it('renders a hat element when feature includes "hat"', () => {
    const { container } = render(FumlingAvatar, {
      props: { color: 'sage', features: ['hat'], instrument: 'violin' },
    });
    expect(container.querySelector('[data-part="hat"]')).not.toBeNull();
  });

  it('renders a violin when instrument is violin', () => {
    const { container } = render(FumlingAvatar, {
      props: { color: 'sage', features: [], instrument: 'violin' },
    });
    expect(container.querySelector('[data-part="violin"]')).not.toBeNull();
    expect(container.querySelector('[data-part="cello"]')).toBeNull();
  });

  it('renders a cello when instrument is cello', () => {
    const { container } = render(FumlingAvatar, {
      props: { color: 'sage', features: [], instrument: 'cello' },
    });
    expect(container.querySelector('[data-part="cello"]')).not.toBeNull();
    expect(container.querySelector('[data-part="violin"]')).toBeNull();
  });
});
