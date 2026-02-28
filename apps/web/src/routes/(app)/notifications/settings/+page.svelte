<script lang="ts">
  import { getGlobalPrefs, setGlobalPref, getEventPrefs, setEventPref, subscribeToPush, unsubscribeFromPush } from '$lib/api/notifications.js';
  import type { GlobalPref, EventPref, NotificationChannel } from '$lib/api/notifications.js';
  import { listEvents } from '$lib/api/events.js';
  import type { Event } from '$lib/api/events.js';
  import Card from '$components/ui/Card.svelte';
  import Toggle from '$components/ui/Toggle.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import Button from '$components/ui/Button.svelte';
  import { DAY_SHORT } from '$lib/api/events.js';
  import { formatTime } from '$lib/utils.js';

  const CHANNELS: { key: NotificationChannel; icon: string; label: string }[] = [
    { key: 'inapp', icon: '📱', label: 'In-App' },
    { key: 'push', icon: '🔔', label: 'Push (background)' },
    { key: 'discord', icon: '💬', label: 'Discord' },
    { key: 'telegram', icon: '✈️', label: 'Telegram' },
    { key: 'email', icon: '📧', label: 'Email' },
  ];

  let globalPrefs = $state<GlobalPref[]>([]);
  let eventPrefs = $state<EventPref[]>([]);
  let events = $state<Event[]>([]);
  let loading = $state(true);
  let pushSubscribed = $state(false);
  let pushLoading = $state(false);
  let pushError = $state('');

  $effect(() => {
    Promise.all([getGlobalPrefs(), getEventPrefs(), listEvents()])
      .then(([g, e, ev]) => { globalPrefs = g; eventPrefs = e; events = ev; loading = false; })
      .catch(() => { loading = false; });

    // Check current push subscription state
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => { pushSubscribed = !!sub; })
      );
    }
  });

  async function togglePush() {
    pushLoading = true;
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush();
        pushSubscribed = false;
      } else {
        const ok = await Notification.requestPermission().then(p => p === 'granted');
        if (!ok) { pushError = 'Please allow notifications in your browser settings.'; return; }
        pushSubscribed = await subscribeToPush();
      }
    } finally {
      pushLoading = false;
    }
  }

  function getGlobalPref(channel: NotificationChannel): boolean {
    const p = globalPrefs.find(g => g.channel === channel);
    return p ? p.enabled : true; // default enabled
  }

  function getEventPref(eventId: string, channel: NotificationChannel): EventPref | undefined {
    return eventPrefs.find(p => p.eventId === eventId && p.channel === channel);
  }

  function isChannelGloballyEnabled(channel: NotificationChannel): boolean {
    return getGlobalPref(channel);
  }

  async function toggleGlobal(channel: NotificationChannel, enabled: boolean) {
    await setGlobalPref(channel, enabled);
    const existing = globalPrefs.findIndex(p => p.channel === channel);
    if (existing >= 0) {
      globalPrefs[existing] = { ...globalPrefs[existing], enabled };
    } else {
      globalPrefs = [...globalPrefs, { id: '', userId: '', channel, enabled }];
    }
  }

  async function toggleEventChannel(event: Event, channel: NotificationChannel, enabled: boolean) {
    const existing = getEventPref(event.id, channel);
    const updated = await setEventPref({
      eventId: event.id,
      channel,
      enabled,
      notifyAt10Min: existing?.notifyAt10Min ?? true,
      notifyAt5Min: existing?.notifyAt5Min ?? true,
      notifyAtStart: existing?.notifyAtStart ?? true,
      customMinutesBefore: existing?.customMinutesBefore ?? null,
    });
    const idx = eventPrefs.findIndex(p => p.eventId === event.id && p.channel === channel);
    if (idx >= 0) eventPrefs[idx] = updated as EventPref;
    else eventPrefs = [...eventPrefs, updated as EventPref];
  }

  async function toggleEventTiming(event: Event, channel: NotificationChannel, timing: 'notifyAt10Min' | 'notifyAt5Min' | 'notifyAtStart', value: boolean) {
    const existing = getEventPref(event.id, channel);
    await setEventPref({
      eventId: event.id, channel, enabled: existing?.enabled ?? true,
      notifyAt10Min: timing === 'notifyAt10Min' ? value : (existing?.notifyAt10Min ?? true),
      notifyAt5Min: timing === 'notifyAt5Min' ? value : (existing?.notifyAt5Min ?? true),
      notifyAtStart: timing === 'notifyAtStart' ? value : (existing?.notifyAtStart ?? true),
      customMinutesBefore: existing?.customMinutesBefore ?? null,
    });
    const idx = eventPrefs.findIndex(p => p.eventId === event.id && p.channel === channel);
    if (idx >= 0) {
      eventPrefs[idx] = { ...eventPrefs[idx], [timing]: value };
    }
  }
</script>

<svelte:head><title>Notification Settings — WOS Ally Manager</title></svelte:head>

<div class="space-y-8">
  <div>
    <a href="/notifications" class="text-sm text-muted-foreground hover:text-foreground">← Back</a>
    <h1 class="text-2xl font-bold mt-2">Notification Settings</h1>
    <p class="text-sm text-muted-foreground">Control which channels you receive notifications on. Global settings override per-event settings.</p>
  </div>

  {#if loading}
    <div class="text-center py-12 text-muted-foreground">Loading settings...</div>
  {:else}
    <!-- Web Push subscription (battery-safe: server pushes, no polling) -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Background Push Notifications</h2>
      <Card class="p-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="font-medium text-sm">🔔 Enable Push Notifications</div>
            <div class="text-xs text-muted-foreground mt-0.5">
              Receive alerts even when the app is closed. Uses Web Push — zero battery drain.
            </div>
          </div>
          <Button
            variant={pushSubscribed ? 'destructive' : 'default'}
            size="sm"
            loading={pushLoading}
            onclick={togglePush}
          >
            {pushSubscribed ? 'Disable' : 'Enable'}
          </Button>
        </div>
        {#if pushSubscribed}
          <p class="text-xs text-success mt-3">✓ Push notifications are active on this device.</p>
        {/if}
      </Card>
    </section>
    <!-- Global Settings -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Global Channels</h2>
      <p class="text-xs text-muted-foreground">Turning off a channel here disables it for ALL events.</p>
      <Card class="divide-y divide-border">
        {#each CHANNELS as ch (ch.key)}
          <div class="flex items-center justify-between p-4">
            <div class="flex items-center gap-3">
              <span class="text-xl">{ch.icon}</span>
              <div>
                <div class="font-medium text-sm">{ch.label}</div>
                <div class="text-xs text-muted-foreground">{ch.key}</div>
              </div>
            </div>
            <Toggle
              checked={getGlobalPref(ch.key)}
              label={`Toggle ${ch.label} globally`}
              onchange={(v) => toggleGlobal(ch.key, v)}
            />
          </div>
        {/each}
      </Card>
    </section>

    <!-- Per-Event Settings -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Per-Event Preferences</h2>
      <p class="text-xs text-muted-foreground">Customize notification timing and channels per event.</p>
      {#if events.length === 0}
        <Card class="p-6 text-center text-muted-foreground text-sm">No events yet.</Card>
      {:else}
        <div class="space-y-4">
          {#each events as event (event.id)}
            <Card class="p-4 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-semibold">{event.name}</div>
                  <div class="text-xs text-muted-foreground">{DAY_SHORT[event.dayOfWeek]} · {formatTime(event.startTime)}</div>
                </div>
                {#if !event.isActive}
                  <Badge variant="secondary">Inactive</Badge>
                {/if}
              </div>

              <div class="space-y-2">
                {#each CHANNELS as ch (ch.key)}
                  {@const pref = getEventPref(event.id, ch.key)}
                  {@const globalEnabled = isChannelGloballyEnabled(ch.key)}
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span>{ch.icon}</span>
                        <span class="text-sm font-medium {!globalEnabled ? 'text-muted-foreground' : ''}">{ch.label}</span>
                        {#if !globalEnabled}
                          <Badge variant="secondary" class="text-[10px]">disabled globally</Badge>
                        {/if}
                      </div>
                      <Toggle
                        checked={pref?.enabled ?? true}
                        disabled={!globalEnabled}
                        label={`Toggle ${ch.label} for ${event.name}`}
                        onchange={(v) => toggleEventChannel(event, ch.key, v)}
                      />
                    </div>

                    {#if (pref?.enabled ?? true) && globalEnabled}
                      <div class="ml-6 flex flex-wrap gap-x-4 gap-y-2">
                        {#each [
                          { key: 'notifyAt10Min' as const, label: '10 min before' },
                          { key: 'notifyAt5Min' as const, label: '5 min before' },
                          { key: 'notifyAtStart' as const, label: 'At start' },
                        ] as timing (timing.key)}
                          <label class="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pref?.[timing.key] ?? true}
                              onchange={(e) => toggleEventTiming(event, ch.key, timing.key, (e.target as HTMLInputElement).checked)}
                              class="rounded border-border"
                            />
                            {timing.label}
                          </label>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </Card>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>
