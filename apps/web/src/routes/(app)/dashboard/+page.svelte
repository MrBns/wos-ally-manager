<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte.js';
  import { notificationsStore } from '$lib/stores/notifications.svelte.js';
  import { listEvents } from '$lib/api/events.js';
  import type { Event } from '$lib/api/events.js';
  import { DAY_SHORT } from '$lib/api/events.js';
  import { timeUntil, formatTime } from '$lib/utils.js';
  import Card from '$components/ui/Card.svelte';
  import Badge from '$components/ui/Badge.svelte';

  let events = $state<Event[]>([]);
  let loadingEvents = $state(true);

  $effect(() => {
    listEvents().then(e => { events = e; loadingEvents = false; }).catch(() => { loadingEvents = false; });
    notificationsStore.load();
  });

  const roleLabel: Record<string, string> = {
    r1: 'Member', r2: 'Member', r3: 'Member', r4: 'Moderator', r5: 'Commander'
  };
  const roleVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
    r1: 'secondary', r2: 'secondary', r3: 'secondary', r4: 'warning', r5: 'success'
  };
</script>

<svelte:head><title>Dashboard — WOS Ally Manager</title></svelte:head>

<div class="space-y-6">
  <!-- Welcome -->
  <div class="space-y-1">
    <h1 class="text-2xl font-bold">
      Welcome, {authStore.user?.nickname ?? `Player ${authStore.user?.gameUserId}`} 👋
    </h1>
    <div class="flex items-center gap-2">
      <Badge variant={roleVariant[authStore.user?.role ?? 'r1']}>
        {roleLabel[authStore.user?.role ?? 'r1']}
      </Badge>
      <span class="text-sm text-muted-foreground">ID: {authStore.user?.gameUserId}</span>
    </div>
  </div>

  <!-- Stats row -->
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
    <Card class="p-4 text-center">
      <div class="text-2xl font-bold text-primary">{events.filter(e => e.isActive).length}</div>
      <div class="text-xs text-muted-foreground mt-1">Active Events</div>
    </Card>
    <Card class="p-4 text-center">
      <div class="text-2xl font-bold text-primary">{notificationsStore.unreadCount}</div>
      <div class="text-xs text-muted-foreground mt-1">Unread Alerts</div>
    </Card>
    <Card class="col-span-2 sm:col-span-1 p-4 text-center">
      <div class="text-2xl font-bold text-primary">{authStore.user?.role?.toUpperCase() ?? 'R1'}</div>
      <div class="text-xs text-muted-foreground mt-1">Your Rank</div>
    </Card>
  </div>

  <!-- Upcoming events -->
  <div class="space-y-3">
    <h2 class="text-lg font-semibold">Upcoming Events</h2>
    {#if loadingEvents}
      <div class="text-center py-8 text-muted-foreground">Loading events...</div>
    {:else if events.length === 0}
      <Card class="p-8 text-center text-muted-foreground">
        No events scheduled yet.
      </Card>
    {:else}
      <div class="space-y-2">
        {#each events.filter(e => e.isActive).slice(0, 5) as event (event.id)}
          <a href="/events" class="block">
            <Card class="p-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-medium truncate">{event.name}</div>
                  <div class="text-sm text-muted-foreground">
                    {DAY_SHORT[event.dayOfWeek]} · {formatTime(event.startTime)}
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <div class="text-sm font-semibold text-primary">{timeUntil(event.dayOfWeek, event.startTime)}</div>
                  <div class="text-xs text-muted-foreground">remaining</div>
                </div>
              </div>
            </Card>
          </a>
        {/each}
        {#if events.length > 5}
          <a href="/events" class="block text-center text-sm text-primary hover:underline py-2">
            View all {events.length} events →
          </a>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Recent notifications -->
  {#if notificationsStore.items.length > 0}
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Recent Alerts</h2>
        <a href="/notifications" class="text-sm text-primary hover:underline">View all</a>
      </div>
      <div class="space-y-2">
        {#each notificationsStore.items.slice(0, 3) as n (n.id)}
          <Card class="p-4 {n.read ? 'opacity-60' : ''}">
            <div class="font-medium text-sm">{n.title}</div>
            <div class="text-xs text-muted-foreground mt-1">{n.body}</div>
          </Card>
        {/each}
      </div>
    </div>
  {/if}
</div>
