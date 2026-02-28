<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte.js';
  import { goto } from '$app/navigation';
  import Button from '$components/ui/Button.svelte';

  $effect(() => {
    if (authStore.initialized && authStore.isAuthenticated) {
      goto('/dashboard');
    }
  });
</script>

<svelte:head>
  <title>WOS Ally Manager</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-[70vh] text-center gap-8 px-4">
  <div class="space-y-4">
    <div class="text-6xl">❄️</div>
    <h1 class="text-4xl font-bold tracking-tight">WOS Ally Manager</h1>
    <p class="text-muted-foreground text-lg max-w-md">
      Manage your Whiteout Survival alliance — events, notifications, gift codes, and more.
    </p>
  </div>

  <div class="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
    <Button class="flex-1" onclick={() => goto('/auth/signup')}>Get Started</Button>
    <Button variant="outline" class="flex-1" onclick={() => goto('/auth/login')}>Sign In</Button>
  </div>

  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mt-8">
    {#each [
      { icon: '📅', title: 'Events', desc: 'Weekly schedule' },
      { icon: '🔔', title: 'Alerts', desc: 'Multi-channel' },
      { icon: '🎁', title: 'Gift Codes', desc: 'Auto-claim' },
      { icon: '📢', title: 'Broadcasts', desc: 'Alliance news' },
    ] as feature (feature.title)}
      <div class="rounded-xl border border-border bg-card p-4 text-center space-y-1">
        <div class="text-2xl">{feature.icon}</div>
        <div class="font-semibold text-sm">{feature.title}</div>
        <div class="text-xs text-muted-foreground">{feature.desc}</div>
      </div>
    {/each}
  </div>
</div>
