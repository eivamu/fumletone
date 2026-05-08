import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { tick } from 'svelte';
import { addMessages } from 'svelte-i18n';
import { _, locale, initI18n } from '$lib/i18n';

beforeEach(async () => {
  await initI18n('en');
});

describe('i18n', () => {
  it('exposes English by default', () => {
    expect(get(locale)).toBe('en');
    expect(get(_)('app.title')).toBe('Fumletone');
  });

  it('switches to Norwegian when locale changes', async () => {
    locale.set('nb');
    await tick();
    expect(get(_)('onboarding.pickLanguage.prompt')).toBe('Velg språk');
  });

  it('falls back to en for keys missing from nb', async () => {
    // simulate a key only present in en — nb should fall back to it
    addMessages('en', { _testOnlyEn: 'english only' });
    locale.set('nb');
    await tick();
    expect(get(_)('_testOnlyEn')).toBe('english only');
  });

  it('interpolates {name} placeholders', async () => {
    locale.set('en');
    await tick();
    expect(get(_)('hub.greetingNamed', { values: { name: 'Sara' } })).toBe('Hi, Sara!');
  });
});
