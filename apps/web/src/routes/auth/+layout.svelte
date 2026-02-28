<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte.js';
  import { goto } from '$app/navigation';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  $effect(() => {
    if (authStore.initialized && authStore.isAuthenticated) {
      goto('/dashboard');
    }
  });
</script>

<div class="flex items-center justify-center min-h-[80vh] px-4">
  {@render children()}
</div>
