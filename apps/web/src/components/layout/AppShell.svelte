<script lang="ts">
  import type { Snippet } from 'svelte';
  import BottomNav from './BottomNav.svelte';
  import TopBar from './TopBar.svelte';
  import { authStore } from '$lib/stores/auth.svelte.js';

  let { children }: { children?: Snippet } = $props();
</script>

<div class="flex flex-col min-h-screen min-h-[100dvh] bg-background safe-top">
  <TopBar />
  <main class="flex-1 overflow-y-auto pb-20 md:pb-0 md:pl-64">
    <div class="container mx-auto px-4 py-6 max-w-2xl md:max-w-4xl">
      {@render children?.()}
    </div>
  </main>
  {#if authStore.isAuthenticated}
    <BottomNav />
  {/if}
</div>
