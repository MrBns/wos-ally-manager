<script lang="ts">
  import { api } from '$lib/api/client.js';
  import type { User } from '$lib/api/auth.js';
  import { authStore } from '$lib/stores/auth.svelte.js';
  import Card from '$components/ui/Card.svelte';
  import Button from '$components/ui/Button.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import Avatar from '$components/ui/Avatar.svelte';
  import Select from '$components/ui/Select.svelte';

  let users = $state<User[]>([]);
  let loading = $state(true);
  let updatingId = $state<string | null>(null);

  $effect(() => { loadUsers(); });

  async function loadUsers() {
    loading = true;
    try { users = await api.get<User[]>('/api/users'); } finally { loading = false; }
  }

  async function handleRoleChange(userId: string, role: string) {
    updatingId = userId;
    try {
      await api.patch(`/api/users/${userId}/role`, { role });
      await loadUsers();
    } catch (err: any) {
      alert(err.message ?? 'Failed to update role');
    } finally {
      updatingId = null;
    }
  }

  const roleOptions = [
    { value: 'r1', label: 'R1 — Member' },
    { value: 'r2', label: 'R2 — Member' },
    { value: 'r3', label: 'R3 — Member' },
    { value: 'r4', label: 'R4 — Moderator' },
    { value: 'r5', label: 'R5 — Commander' },
  ];

  const roleVariant = (role: string): 'default' | 'secondary' | 'success' | 'warning' => {
    if (role === 'r5') return 'success';
    if (role === 'r4') return 'warning';
    return 'secondary';
  };
</script>

<svelte:head><title>Admin Users — WOS Ally Manager</title></svelte:head>

<div class="space-y-6">
  <div>
    <a href="/admin" class="text-sm text-muted-foreground hover:text-foreground">← Admin</a>
    <h1 class="text-2xl font-bold mt-1">👥 Users</h1>
  </div>

  {#if loading}
    <div class="text-center py-12 text-muted-foreground">Loading...</div>
  {:else if users.length === 0}
    <Card class="p-8 text-center text-muted-foreground">No users found.</Card>
  {:else}
    <div class="space-y-3">
      {#each users as user (user.id)}
        <Card class="p-4">
          <div class="flex items-center gap-3">
            <Avatar
              src={user.avatarUrl ?? ''}
              alt={user.nickname ?? user.gameUserId}
              fallback={user.nickname?.[0] ?? user.gameUserId?.[0] ?? 'U'}
            />
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{user.nickname ?? `Player ${user.gameUserId}`}</div>
              <div class="text-xs text-muted-foreground">ID: {user.gameUserId}</div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              {#if authStore.isR5}
                <Select
                  options={roleOptions}
                  value={user.role}
                  class="w-36 h-8 text-xs"
                  disabled={updatingId === user.id}
                  onchange={(e) => handleRoleChange(user.id, (e.target as HTMLSelectElement).value)}
                />
              {:else}
                <Badge variant={roleVariant(user.role)}>{user.role.toUpperCase()}</Badge>
              {/if}
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>
