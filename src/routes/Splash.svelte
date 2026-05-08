<script lang="ts">
  import ScreenFrame from '$lib/components/ScreenFrame.svelte';
  import FumlingAvatar from '$lib/components/FumlingAvatar.svelte';
  import { navigate } from '$lib/stores/route';
  import { unlock } from '$lib/audio/engine';

  async function begin() {
    await unlock();
    navigate({ name: 'onboarding/pickLanguage' });
  }
</script>

<ScreenFrame>
  <h1 class="brand">Fumletone</h1>
  <button class="tap" onclick={begin} aria-label="Start">
    <FumlingAvatar color="sage" features={['hat']} instrument="violin" size={280} />
  </button>
  <p class="tap-hint">
    <span>Trykk for å begynne</span>
    <span>·</span>
    <span>Tap to begin</span>
  </p>
</ScreenFrame>

<style>
  .brand {
    font-size: 3rem;
    margin: 0;
    letter-spacing: -0.02em;
    color: var(--color-fg);
  }
  .tap {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
  }
  .tap-hint {
    display: flex;
    gap: var(--space-2);
    color: var(--color-fg);
    opacity: 0.7;
    margin: 0;
    font-size: 1.1rem;
  }
</style>
