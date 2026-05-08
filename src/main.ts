import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import { initI18n } from '$lib/i18n';
import { getProfile } from '$lib/db/db';

async function boot() {
  const initialProfile = await getProfile();
  await initI18n(initialProfile?.language ?? 'nb');
  const app = mount(App, { target: document.getElementById('app')! });
  registerSW({ immediate: true });
  return app;
}

void boot();
