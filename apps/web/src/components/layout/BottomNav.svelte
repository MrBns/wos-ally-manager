<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.svelte.js';

  const navItems = [
    { href: '/dashboard', icon: '🏠', label: 'Home' },
    { href: '/events', icon: '📅', label: 'Events' },
    { href: '/notifications', icon: '🔔', label: 'Alerts' },
    { href: '/profile', icon: '👤', label: 'Profile' },
  ];
</script>

<!-- Mobile bottom nav, hidden on md+ -->
<nav class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden safe-bottom">
  <div class="flex items-center justify-around h-16 px-2">
    {#each navItems as item (item.href)}
      {@const active = $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
      <a
        href={item.href}
        class="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1 {active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
      >
        <span class="text-xl leading-none">{item.icon}</span>
        <span class="text-[10px] font-medium truncate">{item.label}</span>
      </a>
    {/each}
    {#if authStore.isR4orAbove}
      <a
        href="/admin"
        class="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1 {$page.url.pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
      >
        <span class="text-xl leading-none">⚙️</span>
        <span class="text-[10px] font-medium truncate">Admin</span>
      </a>
    {/if}
  </div>
</nav>
