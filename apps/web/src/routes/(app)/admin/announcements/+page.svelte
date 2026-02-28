<script lang="ts">
  import { api } from '$lib/api/client.js';
  import Card from '$components/ui/Card.svelte';
  import Button from '$components/ui/Button.svelte';
  import Input from '$components/ui/Input.svelte';
  import Modal from '$components/ui/Modal.svelte';

  interface Announcement { id: string; title: string; body: string; authorId: string; createdAt: string; }

  let items = $state<Announcement[]>([]);
  let loading = $state(true);
  let showModal = $state(false);
  let title = $state('');
  let body = $state('');
  let submitting = $state(false);

  $effect(() => { loadAnnouncements(); });

  async function loadAnnouncements() {
    loading = true;
    try { items = await api.get<Announcement[]>('/api/announcements'); } finally { loading = false; }
  }

  async function handleCreate(e: Event) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    submitting = true;
    try {
      await api.post('/api/announcements', { title: title.trim(), body: body.trim() });
      title = ''; body = '';
      showModal = false;
      await loadAnnouncements();
    } catch (err: any) {
      alert(err.message ?? 'Failed to broadcast');
    } finally {
      submitting = false;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/api/announcements/${id}`);
    await loadAnnouncements();
  }
</script>

<svelte:head><title>Announcements — WOS Ally Manager</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <a href="/admin" class="text-sm text-muted-foreground hover:text-foreground">← Admin</a>
      <h1 class="text-2xl font-bold mt-1">📢 Announcements</h1>
    </div>
    <Button onclick={() => showModal = true}>+ Broadcast</Button>
  </div>

  {#if loading}
    <div class="text-center py-12 text-muted-foreground">Loading...</div>
  {:else if items.length === 0}
    <Card class="p-8 text-center text-muted-foreground">No announcements yet.</Card>
  {:else}
    <div class="space-y-3">
      {#each items as item (item.id)}
        <Card class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold">{item.title}</div>
              <p class="text-sm text-muted-foreground mt-1">{item.body}</p>
              <div class="text-xs text-muted-foreground mt-2">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
            <Button variant="destructive" size="sm" onclick={() => handleDelete(item.id)}>Delete</Button>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<Modal bind:open={showModal} title="New Announcement">
  <form onsubmit={handleCreate} class="space-y-4">
    <Input label="Title" bind:value={title} required placeholder="Announcement title" />
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium">Message</label>
      <textarea
        bind:value={body}
        required
        rows="5"
        placeholder="Write your announcement..."
        class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      ></textarea>
    </div>
    <div class="flex gap-3 pt-2">
      <Button type="submit" class="flex-1" loading={submitting}>📢 Broadcast to All</Button>
      <Button type="button" variant="outline" class="flex-1" onclick={() => showModal = false}>Cancel</Button>
    </div>
  </form>
</Modal>
