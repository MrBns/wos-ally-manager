<script lang="ts">
  import Card from '$components/ui/Card.svelte';
</script>

<svelte:head><title>Admin — WOS Ally Manager</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">⚙️ Admin Panel</h1>
  <div class="grid grid-cols-2 gap-3">
    {#each [
      { href: '/admin/events', icon: '📅', title: 'Events', desc: 'Manage weekly events' },
      { href: '/admin/giftcodes', icon: '🎁', title: 'Gift Codes', desc: 'Add & auto-claim codes' },
      { href: '/admin/announcements', icon: '📢', title: 'Announcements', desc: 'Broadcast to all users' },
      { href: '/admin/users', icon: '👥', title: 'Users', desc: 'Manage roles & users' },
    ] as item (item.href)}
      <a href={item.href}>
        <Card class="p-5 hover:border-primary/50 transition-colors cursor-pointer h-full">
          <div class="text-3xl mb-2">{item.icon}</div>
          <div class="font-semibold">{item.title}</div>
          <div class="text-xs text-muted-foreground mt-1">{item.desc}</div>
        </Card>
      </a>
    {/each}
  </div>
</div>
