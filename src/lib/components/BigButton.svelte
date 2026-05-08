<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    onclick,
    disabled = false,
    variant = 'primary',
    children,
  }: {
    onclick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'ghost';
    children: Snippet;
  } = $props();
</script>

<button class="big {variant}" {disabled} onclick={onclick}>
  {@render children()}
</button>

<style>
  .big {
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border-radius: var(--radius-lg);
    border: none;
    font-size: 1.4rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 80ms ease;
  }
  .big:active { transform: scale(0.97); }
  .primary { background: var(--color-accent); color: var(--color-bg); }
  .ghost { background: transparent; color: var(--color-fg); }
  .big:disabled { opacity: 0.4; cursor: default; }
</style>
