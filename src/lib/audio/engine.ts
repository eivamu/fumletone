import * as Tone from 'tone';

let started = false;

export async function unlock(): Promise<void> {
  if (started) return;
  await Tone.start();
  started = true;
}

export function isReady(): boolean {
  return started;
}

export function _resetForTests(): void {
  started = false;
}
