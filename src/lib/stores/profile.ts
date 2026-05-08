import { writable, get } from 'svelte/store';
import type { KidProfile } from '$lib/db/schema';
import { getProfile, saveProfile, resetProfile } from '$lib/db/db';

export const profile = writable<KidProfile | null>(null);

export async function loadProfile(): Promise<void> {
  profile.set(await getProfile());
}

export async function updateProfile(patch: Partial<KidProfile>): Promise<void> {
  const next = await saveProfile(patch);
  profile.set(next);
}

export async function clearProfile(): Promise<void> {
  await resetProfile();
  profile.set(null);
}

export function getProfileSnapshot(): KidProfile | null {
  return get(profile);
}
