<script lang="ts">
  import { listEvents, createEvent, updateEvent, deleteEvent, DAY_NAMES } from '$lib/api/events.js';
  import type { Event } from '$lib/api/events.js';
  import { formatTime } from '$lib/utils.js';
  import Card from '$components/ui/Card.svelte';
  import Button from '$components/ui/Button.svelte';
  import Input from '$components/ui/Input.svelte';
  import Modal from '$components/ui/Modal.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import Select from '$components/ui/Select.svelte';

  let events = $state<Event[]>([]);
  let loading = $state(true);
  let showModal = $state(false);
  let editingEvent = $state<Event | null>(null);
  let formLoading = $state(false);

  let formData = $state({ name: '', description: '', dayOfWeek: 0, startTime: '20:00', durationMinutes: 60, isActive: true });

  $effect(() => { loadEvents(); });

  async function loadEvents() {
    loading = true;
    try { events = await listEvents(); } finally { loading = false; }
  }

  function openCreate() {
    editingEvent = null;
    formData = { name: '', description: '', dayOfWeek: 0, startTime: '20:00', durationMinutes: 60, isActive: true };
    showModal = true;
  }

  function openEdit(event: Event) {
    editingEvent = event;
    formData = { name: event.name, description: event.description ?? '', dayOfWeek: event.dayOfWeek, startTime: event.startTime, durationMinutes: event.durationMinutes, isActive: event.isActive };
    showModal = true;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    formLoading = true;
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
      } else {
        await createEvent(formData);
      }
      showModal = false;
      await loadEvents();
    } catch (err: any) {
      alert(err.message ?? 'Failed to save event');
    } finally {
      formLoading = false;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(id);
    await loadEvents();
  }

  const dayOptions = DAY_NAMES.map((d, i) => ({ value: i, label: d }));
</script>

<svelte:head><title>Admin Events — WOS Ally Manager</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <a href="/admin" class="text-sm text-muted-foreground hover:text-foreground">← Admin</a>
      <h1 class="text-2xl font-bold mt-1">📅 Events</h1>
    </div>
    <Button onclick={openCreate}>+ Add Event</Button>
  </div>

  {#if loading}
    <div class="text-center py-12 text-muted-foreground">Loading...</div>
  {:else if events.length === 0}
    <Card class="p-8 text-center text-muted-foreground">No events yet. Add your first event!</Card>
  {:else}
    <div class="space-y-3">
      {#each events as event (event.id)}
        <Card class="p-4">
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold">{event.name}</span>
                <Badge variant={event.isActive ? 'success' : 'secondary'}>
                  {event.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {#if event.description}
                <p class="text-xs text-muted-foreground mt-0.5">{event.description}</p>
              {/if}
              <div class="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span>📅 {DAY_NAMES[event.dayOfWeek]}</span>
                <span>🕐 {formatTime(event.startTime)}</span>
                <span>⏱ {event.durationMinutes}min</span>
              </div>
            </div>
            <div class="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onclick={() => openEdit(event)}>Edit</Button>
              <Button variant="destructive" size="sm" onclick={() => handleDelete(event.id)}>Del</Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<Modal bind:open={showModal} title={editingEvent ? 'Edit Event' : 'Add Event'}>
  <form onsubmit={handleSubmit} class="space-y-4">
    <Input label="Event Name" bind:value={formData.name} required />
    <Input label="Description (optional)" bind:value={formData.description} />
    <Select label="Day of Week" bind:value={formData.dayOfWeek} options={dayOptions} />
    <Input label="Start Time (UTC)" type="time" bind:value={formData.startTime} required />
    <Input label="Duration (minutes)" type="number" bind:value={formData.durationMinutes} min="1" max="1440" />
    <label class="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" bind:checked={formData.isActive} class="rounded border-border" />
      Active
    </label>
    <div class="flex gap-3 pt-2">
      <Button type="submit" class="flex-1" loading={formLoading}>
        {editingEvent ? 'Update' : 'Create'}
      </Button>
      <Button type="button" variant="outline" class="flex-1" onclick={() => showModal = false}>Cancel</Button>
    </div>
  </form>
</Modal>
