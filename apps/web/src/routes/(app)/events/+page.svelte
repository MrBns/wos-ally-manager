<script lang="ts">
  import { listEvents } from '$lib/api/events.js';
  import type { Event } from '$lib/api/events.js';
  import { DAY_NAMES } from '$lib/api/events.js';
  import { formatTime, timeUntil } from '$lib/utils.js';
  import Card from '$components/ui/Card.svelte';
  import Badge from '$components/ui/Badge.svelte';

  let events = $state<Event[]>([]);
  let loading = $state(true);
  let selectedDay = $state<number | null>(null);

  $effect(() => {
    listEvents().then(e => { events = e; loading = false; }).catch(() => { loading = false; });
  });

  let filtered = $derived(
    selectedDay === null ? events : events.filter(e => e.dayOfWeek === selectedDay)
  );
</script>

<svelte:head><title>Events — WOS Ally Manager</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Weekly Events</h1>

  <!-- Day filter -->
  <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
    <button
      onclick={() => selectedDay = null}
      class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors {selectedDay === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}"
    >
      All
    </button>
    {#each DAY_NAMES as day, i (day)}
      <button
        onclick={() => selectedDay = i}
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors {selectedDay === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}"
      >
        {day.slice(0, 3)}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="text-center py-12 text-muted-foreground">Loading events...</div>
  {:else if filtered.length === 0}
    <Card class="p-8 text-center text-muted-foreground">
      {selectedDay !== null ? `No events on ${DAY_NAMES[selectedDay]}` : 'No events scheduled yet.'}
    </Card>
  {:else}
    <div class="space-y-3">
      {#each filtered as event (event.id)}
        <Card class="p-4 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold">{event.name}</h3>
                {#if !event.isActive}
                  <Badge variant="secondary">Inactive</Badge>
                {/if}
              </div>
              {#if event.description}
                <p class="text-sm text-muted-foreground">{event.description}</p>
              {/if}
            </div>
            <div class="shrink-0 text-right space-y-1">
              <div class="text-sm font-semibold text-primary">{timeUntil(event.dayOfWeek, event.startTime)}</div>
              <div class="text-xs text-muted-foreground">until start</div>
            </div>
          </div>
          <div class="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
            <span>📅 {DAY_NAMES[event.dayOfWeek]}</span>
            <span>🕐 {formatTime(event.startTime)}</span>
            <span>⏱ {event.durationMinutes}min</span>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>
