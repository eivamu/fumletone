<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<section class="frame">
  {@render children()}
</section>

<style>
  .frame {
    height: 100dvh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: max(env(safe-area-inset-top), var(--space-3))
            max(env(safe-area-inset-right), var(--space-3))
            max(env(safe-area-inset-bottom), var(--space-3))
            max(env(safe-area-inset-left), var(--space-3));
    text-align: center;
  }
</style>
