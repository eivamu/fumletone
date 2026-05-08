import { addMessages, init, locale, _ } from 'svelte-i18n';
import nb from './nb.json';
import en from './en.json';
import type { Language } from '$lib/db/schema';

export { _, locale };

export async function initI18n(initial: Language): Promise<void> {
  addMessages('en', en);
  addMessages('nb', nb);
  await init({
    fallbackLocale: 'en',
    initialLocale: initial,
  });
}
