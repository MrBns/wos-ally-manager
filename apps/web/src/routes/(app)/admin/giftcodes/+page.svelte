<script lang="ts">
  import { api } from '$lib/api/client.js';
  import Card from '$components/ui/Card.svelte';
  import Button from '$components/ui/Button.svelte';
  import Input from '$components/ui/Input.svelte';
  import Badge from '$components/ui/Badge.svelte';

  interface Giftcode {
    id: string; code: string; addedBy: string; expiresAt?: string | null; isActive: boolean; createdAt: string;
  }

  let codes = $state<Giftcode[]>([]);
  let loading = $state(true);
  let newCode = $state('');
  let submitting = $state(false);

  $effect(() => { loadCodes(); });

  async function loadCodes() {
    loading = true;
    try { codes = await api.get<Giftcode[]>('/api/giftcodes'); } finally { loading = false; }
  }

  async function handleAdd(e: Event) {
    e.preventDefault();
    if (!newCode.trim()) return;
    submitting = true;
    try {
      await api.post('/api/giftcodes', { code: newCode.trim() });
      newCode = '';
      await loadCodes();
    } catch (err: any) {
      alert(err.message ?? 'Failed to add code');
    } finally {
      submitting = false;
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this code?')) return;
    await api.patch(`/api/giftcodes/${id}/deactivate`);
    await loadCodes();
  }
</script>

<svelte:head><title>Gift Codes — WOS Ally Manager</title></svelte:head>

<div class="space-y-6">
  <div>
    <a href="/admin" class="text-sm text-muted-foreground hover:text-foreground">← Admin</a>
    <h1 class="text-2xl font-bold mt-1">🎁 Gift Codes</h1>
    <p class="text-sm text-muted-foreground">Adding a code automatically claims it for all registered users.</p>
  </div>

  <Card class="p-4">
    <form onsubmit={handleAdd} class="flex gap-3">
      <Input placeholder="Enter gift code" bind:value={newCode} class="flex-1" />
      <Button type="submit" loading={submitting}>Add & Claim</Button>
    </form>
  </Card>

  {#if loading}
    <div class="text-center py-12 text-muted-foreground">Loading...</div>
  {:else if codes.length === 0}
    <Card class="p-8 text-center text-muted-foreground">No gift codes added yet.</Card>
  {:else}
    <div class="space-y-3">
      {#each codes as code (code.id)}
        <Card class="p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="font-mono font-semibold">{code.code}</div>
              <div class="text-xs text-muted-foreground mt-0.5">{new Date(code.createdAt).toLocaleString()}</div>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant={code.isActive ? 'success' : 'secondary'}>
                {code.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {#if code.isActive}
                <Button variant="outline" size="sm" onclick={() => handleDeactivate(code.id)}>Deactivate</Button>
              {/if}
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>
