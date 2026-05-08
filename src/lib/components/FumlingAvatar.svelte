<script lang="ts">
  import type { FumlingColor, FumlingFeature, Instrument } from '$lib/db/schema';

  let {
    color,
    features,
    instrument,
    size = 240,
  }: {
    color: FumlingColor;
    features: FumlingFeature[];
    instrument: Instrument;
    size?: number;
  } = $props();

  const fill = $derived(`var(--color-${color})`);
  const hasHat = $derived(features.includes('hat'));
  const hasStripedSock = $derived(features.includes('stripedSock'));
  const hasRoundEyes = $derived(features.includes('roundEyes'));
  const hasLongEars = $derived(features.includes('longEars'));
</script>

<svg viewBox="0 0 200 220" width={size} height={size} aria-hidden="true">
  {#if hasLongEars}
    <ellipse data-part="ears" cx="65" cy="40" rx="10" ry="28" fill={fill} />
    <ellipse cx="135" cy="40" rx="10" ry="28" fill={fill} />
  {/if}

  <!-- body -->
  <ellipse data-part="body" cx="100" cy="120" rx="70" ry="80" fill={fill} />

  <!-- eyes -->
  {#if hasRoundEyes}
    <circle data-part="eyes" cx="80" cy="100" r="8" fill="#3a2e22" />
    <circle cx="120" cy="100" r="8" fill="#3a2e22" />
  {:else}
    <ellipse data-part="eyes" cx="80" cy="100" rx="3" ry="6" fill="#3a2e22" />
    <ellipse cx="120" cy="100" rx="3" ry="6" fill="#3a2e22" />
  {/if}

  <!-- hat -->
  {#if hasHat}
    <path data-part="hat" d="M 60 60 Q 100 20 140 60 Z" fill="#a8593f" />
  {/if}

  <!-- striped sock -->
  {#if hasStripedSock}
    <g data-part="sock">
      <rect x="80" y="195" width="14" height="20" fill="#fdf6ec" />
      <rect x="80" y="200" width="14" height="3" fill="#a8593f" />
      <rect x="80" y="208" width="14" height="3" fill="#a8593f" />
    </g>
  {/if}

  <!-- instrument -->
  {#if instrument === 'violin'}
    <g data-part="violin">
      <ellipse cx="170" cy="110" rx="14" ry="22" fill="#7a4d2a" />
      <line x1="170" y1="88" x2="190" y2="60" stroke="#3a2e22" stroke-width="2" />
    </g>
  {:else if instrument === 'cello'}
    <g data-part="cello">
      <ellipse cx="170" cy="135" rx="20" ry="38" fill="#5a3818" />
      <line x1="170" y1="97" x2="170" y2="50" stroke="#3a2e22" stroke-width="3" />
    </g>
  {/if}
</svg>
