<script lang="ts">
  import { cn } from '$lib/utils.js';
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    title = '',
    class: className = '',
    children,
    onclose,
  }: {
    open?: boolean;
    title?: string;
    class?: string;
    children?: Snippet;
    onclose?: () => void;
  } = $props();

  function close() {
    open = false;
    onclose?.();
  }

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    onclick={handleBackdrop}
    onkeydown={handleKey}
  >
    <div
      class={cn(
        'relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl',
        'animate-in fade-in zoom-in-95 duration-200',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {#if title}
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onclick={close}
            class="rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      {/if}
      {@render children?.()}
    </div>
  </div>
{/if}
