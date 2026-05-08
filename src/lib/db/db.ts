import Dexie, { type Table } from 'dexie';
import type { KidProfile } from './schema';
import { DEFAULT_PROFILE } from './schema';

class FumletoneDB extends Dexie {
  profile!: Table<KidProfile, number>;

  constructor() {
    super('fumletone');
    this.version(1).stores({
      profile: 'id',
    });
  }
}

export const db = new FumletoneDB();

export async function getProfile(): Promise<KidProfile | null> {
  const row = await db.profile.get(1);
  return row ?? null;
}

export async function saveProfile(patch: Partial<KidProfile>): Promise<KidProfile> {
  const now = new Date();
  const existing = await db.profile.get(1);
  const next: KidProfile = existing
    ? { ...existing, ...patch, id: 1, updatedAt: now }
    : { ...DEFAULT_PROFILE, ...patch, id: 1, createdAt: now, updatedAt: now };
  await db.profile.put(next);
  return next;
}

export async function resetProfile(): Promise<void> {
  await db.profile.clear();
}
