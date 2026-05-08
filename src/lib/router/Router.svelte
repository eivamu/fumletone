<script lang="ts">
  import { route } from '$lib/stores/route';
  import Splash from '$routes/Splash.svelte';
  import PickLanguage from '$routes/onboarding/PickLanguage.svelte';
  import PickKidName from '$routes/onboarding/PickKidName.svelte';
  import CustomizeFumling from '$routes/onboarding/CustomizeFumling.svelte';
  import PickInstrument from '$routes/onboarding/PickInstrument.svelte';
  import NameFumling from '$routes/onboarding/NameFumling.svelte';
  import Hub from '$routes/Hub.svelte';
  import Settings from '$routes/Settings.svelte';
</script>

{#if $route.name === 'splash'}
  <Splash />
{:else if $route.name === 'onboarding/pickLanguage'}
  <PickLanguage />
{:else if $route.name === 'onboarding/pickKidName'}
  <PickKidName />
{:else if $route.name === 'onboarding/customizeFumling'}
  <CustomizeFumling />
{:else if $route.name === 'onboarding/pickInstrument'}
  <PickInstrument />
{:else if $route.name === 'onboarding/nameFumling'}
  <NameFumling />
{:else if $route.name === 'hub'}
  <Hub />
{:else if $route.name === 'settings'}
  <Settings />
{/if}
