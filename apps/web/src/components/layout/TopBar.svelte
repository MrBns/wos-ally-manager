<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte.js';
  import { notificationsStore } from '$lib/stores/notifications.svelte.js';
  import Avatar from '../ui/Avatar.svelte';

  $effect(() => {
    if (authStore.isAuthenticated) {
      notificationsStore.load();
    }
  });
</script>

<header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="flex h-14 items-center justify-between px-4">
    <div class="flex items-center gap-2">
      <span class="text-lg font-bold text-primary">❄️ WOS</span>
      <span class="hidden sm:block text-sm text-muted-foreground">Ally Manager</span>
    </div>

    {#if authStore.isAuthenticated}
      <div class="flex items-center gap-3">
        <!-- Notification bell -->
        <a href="/notifications" class="relative p-2 rounded-md hover:bg-muted transition-colors" aria-label="Notifications">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {#if notificationsStore.unreadCount > 0}
            <span class="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold">
              {notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount}
            </span>
          {/if}
        </a>
        <!-- Profile -->
        <a href="/profile" class="flex items-center gap-2" aria-label="Profile">
          <Avatar
            src={authStore.user?.avatarUrl ?? ''}
            alt={authStore.user?.nickname ?? authStore.user?.gameUserId ?? ''}
            fallback={authStore.user?.nickname?.[0] ?? authStore.user?.gameUserId?.[0] ?? 'U'}
            size="sm"
          />
        </a>
      </div>
    {:else}
      <a href="/auth/login" class="text-sm font-medium text-primary hover:underline">Sign In</a>
    {/if}
  </div>
</header>
