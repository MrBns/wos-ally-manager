<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte.js';
  import { api } from '$lib/api/client.js';
  import type { User } from '$lib/api/auth.js';
  import Button from '$components/ui/Button.svelte';
  import Input from '$components/ui/Input.svelte';
  import Card from '$components/ui/Card.svelte';
  import Avatar from '$components/ui/Avatar.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import { goto } from '$app/navigation';
  import { signOut } from '$lib/api/auth.js';

  let nickname = $state(authStore.user?.nickname ?? '');
  let avatarUrl = $state(authStore.user?.avatarUrl ?? '');
  let discordWebhook = $state(authStore.user?.discordWebhook ?? '');
  let telegramChatId = $state(authStore.user?.telegramChatId ?? '');
  let email = $state(authStore.user?.email ?? '');
  let loading = $state(false);
  let saved = $state(false);
  let error = $state('');

  async function handleSave(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    saved = false;
    try {
      const updated = await api.patch<User>('/api/users/me', {
        nickname: nickname || undefined,
        avatarUrl: avatarUrl || undefined,
        discordWebhook: discordWebhook || undefined,
        telegramChatId: telegramChatId || undefined,
        email: email || undefined,
      });
      authStore.setUser(updated);
      saved = true;
      setTimeout(() => saved = false, 3000);
    } catch (err: any) {
      error = err.message ?? 'Failed to save profile';
    } finally {
      loading = false;
    }
  }

  async function handleSignOut() {
    await authStore.signOut();
    goto('/');
  }

  const roleLabel: Record<string, string> = {
    r1: 'R1 — Member', r2: 'R2 — Member', r3: 'R3 — Member',
    r4: 'R4 — Moderator', r5: 'R5 — Commander'
  };
</script>

<svelte:head><title>Profile — WOS Ally Manager</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">My Profile</h1>

  <!-- Avatar & basic info -->
  <Card class="p-6">
    <div class="flex items-center gap-4">
      <Avatar
        src={authStore.user?.avatarUrl ?? ''}
        alt={authStore.user?.nickname ?? authStore.user?.gameUserId ?? ''}
        fallback={authStore.user?.nickname?.[0] ?? authStore.user?.gameUserId?.[0] ?? 'U'}
        size="lg"
      />
      <div>
        <div class="text-lg font-semibold">
          {authStore.user?.nickname ?? `Player ${authStore.user?.gameUserId}`}
        </div>
        <div class="text-sm text-muted-foreground">Game ID: {authStore.user?.gameUserId}</div>
        <Badge variant={authStore.user?.role === 'r5' ? 'success' : authStore.user?.role === 'r4' ? 'warning' : 'secondary'} class="mt-1">
          {roleLabel[authStore.user?.role ?? 'r1']}
        </Badge>
      </div>
    </div>
  </Card>

  <!-- Edit form -->
  <Card class="p-6">
    <form onsubmit={handleSave} class="space-y-4">
      <h2 class="text-base font-semibold">Edit Profile</h2>

      <Input
        label="Nickname (any unicode supported ✨)"
        placeholder="e.g. ⚔️ Dragon King 龙王"
        bind:value={nickname}
      />
      <Input
        label="Avatar URL"
        type="url"
        placeholder="https://example.com/avatar.png"
        bind:value={avatarUrl}
      />

      <div class="border-t border-border pt-4 space-y-4">
        <h3 class="text-sm font-semibold text-muted-foreground">Notification Channels</h3>
        <Input
          label="Discord Webhook URL"
          type="url"
          placeholder="https://discord.com/api/webhooks/..."
          bind:value={discordWebhook}
        />
        <Input
          label="Telegram Chat ID"
          placeholder="e.g. -1001234567890"
          bind:value={telegramChatId}
        />
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          bind:value={email}
        />
      </div>

      {#if error}
        <p class="text-sm text-destructive">{error}</p>
      {/if}
      {#if saved}
        <p class="text-sm text-success">✓ Profile saved!</p>
      {/if}

      <Button type="submit" class="w-full" {loading}>Save Profile</Button>
    </form>
  </Card>

  <!-- Sign out -->
  <Button variant="destructive" class="w-full" onclick={handleSignOut}>Sign Out</Button>
</div>
