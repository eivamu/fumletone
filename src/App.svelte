<script lang="ts">
  import { onMount } from 'svelte';
  import Router from '$lib/router/Router.svelte';
  import { loadProfile, profile } from '$lib/stores/profile';
  import { reset } from '$lib/stores/route';

  let booted = $state(false);

  onMount(async () => {
    await loadProfile();
    if ($profile?.onboardingCompletedAt) {
      reset({ name: 'hub' });
    } else {
      reset({ name: 'splash' });
    }
    booted = true;
  });
</script>

{#if booted}
  <Router />
{/if}
