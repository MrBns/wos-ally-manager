<script lang="ts">
  import '../app.css';
  import AppShell from '$components/layout/AppShell.svelte';
  import { authStore } from '$lib/stores/auth.svelte.js';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  $effect(() => {
    authStore.initialize();
  });
</script>

<AppShell>
  {@render children()}
</AppShell>
