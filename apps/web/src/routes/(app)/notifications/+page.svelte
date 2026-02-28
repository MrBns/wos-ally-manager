<script lang="ts">
  import { notificationsStore } from '$lib/stores/notifications.svelte.js';
  import { markRead } from '$lib/api/notifications.js';
  import Card from '$components/ui/Card.svelte';
  import Button from '$components/ui/Button.svelte';
  import Badge from '$components/ui/Badge.svelte';

  $effect(() => { notificationsStore.load(); });

  const typeIcon: Record<string, string> = {
    event_reminder: '⏰', giftcode: '🎁', announcement: '📢', system: 'ℹ️'
  };

  async function handleMarkRead(id: string) {
    await markRead(id);
    await notificationsStore.load();
  }
</script>

<svelte:head><title>Notifications — WOS Ally Manager</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Notifications</h1>
    {#if notificationsStore.unreadCount > 0}
      <Button variant="ghost" size="sm" onclick={() => notificationsStore.markAllRead()}>
        Mark all read
      </Button>
    {/if}
  </div>

  <div class="flex gap-2">
    <a href="/notifications/settings" class="text-sm text-primary hover:underline">⚙️ Notification Settings</a>
  </div>

  {#if notificationsStore.loading}
    <div class="text-center py-12 text-muted-foreground">Loading...</div>
  {:else if notificationsStore.items.length === 0}
    <Card class="p-8 text-center text-muted-foreground">
      No notifications yet. You're all caught up! 🎉
    </Card>
  {:else}
    <div class="space-y-2">
      {#each notificationsStore.items as n (n.id)}
        <Card class="p-4 {n.read ? 'opacity-60' : 'border-primary/30'}">
          <div class="flex items-start gap-3">
            <span class="text-xl shrink-0 mt-0.5">{typeIcon[n.type] ?? 'ℹ️'}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="font-medium text-sm">{n.title}</div>
                {#if !n.read}
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 shrink-0"
                    onclick={() => handleMarkRead(n.id)}
                    aria-label="Mark as read"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </Button>
                {/if}
              </div>
              <p class="text-xs text-muted-foreground mt-1">{n.body}</p>
              <div class="flex items-center gap-2 mt-2">
                <Badge variant="outline">{n.type.replace('_', ' ')}</Badge>
                <span class="text-xs text-muted-foreground">{new Date(n.sentAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>
