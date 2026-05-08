import { describe, it, expect, beforeEach } from 'vitest';
import { getProfile, saveProfile, resetProfile, db } from '$lib/db/db';
import type { KidProfile } from '$lib/db/schema';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('profile storage', () => {
  it('returns null when no profile exists', async () => {
    const p = await getProfile();
    expect(p).toBeNull();
  });

  it('persists and reads back a profile', async () => {
    const partial = {
      kidName: 'Sara',
      language: 'nb',
      fumlingColor: 'rose',
      instrument: 'cello',
    } as Partial<KidProfile>;
    await saveProfile(partial);
    const got = await getProfile();
    expect(got).not.toBeNull();
    expect(got!.kidName).toBe('Sara');
    expect(got!.language).toBe('nb');
    expect(got!.fumlingColor).toBe('rose');
    expect(got!.instrument).toBe('cello');
    expect(got!.fumlingName).toBe('Fumly');
    expect(got!.createdAt).toBeInstanceOf(Date);
    expect(got!.updatedAt).toBeInstanceOf(Date);
  });

  it('preserves createdAt and bumps updatedAt on second save', async () => {
    await saveProfile({ kidName: 'Sara' });
    const first = await getProfile();
    await new Promise((r) => setTimeout(r, 5));
    await saveProfile({ fumlingName: 'Lull' });
    const second = await getProfile();
    expect(second!.createdAt.getTime()).toBe(first!.createdAt.getTime());
    expect(second!.updatedAt.getTime()).toBeGreaterThan(first!.updatedAt.getTime());
    expect(second!.kidName).toBe('Sara');
    expect(second!.fumlingName).toBe('Lull');
  });

  it('resetProfile wipes the row', async () => {
    await saveProfile({ kidName: 'Sara' });
    await resetProfile();
    expect(await getProfile()).toBeNull();
  });
});
