import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { profile, loadProfile, updateProfile } from '$lib/stores/profile';
import { db, getProfile } from '$lib/db/db';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await loadProfile();
});

describe('profile store', () => {
  it('is null before any profile is saved', () => {
    expect(get(profile)).toBeNull();
  });

  it('updateProfile persists to db and updates the store', async () => {
    await updateProfile({ kidName: 'Sara', language: 'nb' });
    expect(get(profile)?.kidName).toBe('Sara');
    const dbRow = await getProfile();
    expect(dbRow?.kidName).toBe('Sara');
  });

  it('loadProfile reads existing db row into the store', async () => {
    await updateProfile({ kidName: 'Mia' });
    await loadProfile();
    expect(get(profile)?.kidName).toBe('Mia');
  });
});
