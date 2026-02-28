<script lang="ts">
  import { cn } from '$lib/utils.js';
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    error?: string;
    label?: string;
  }

  let { error, label, class: className = '', id, ...rest }: Props = $props();
  const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;
</script>

<div class="flex flex-col gap-1.5 w-full">
  {#if label}
    <label for={inputId} class="text-sm font-medium text-foreground">{label}</label>
  {/if}
  <input
    id={inputId}
    class={cn(
      'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      error && 'border-destructive focus-visible:ring-destructive',
      className
    )}
    {...rest}
  />
  {#if error}
    <p class="text-xs text-destructive">{error}</p>
  {/if}
</div>
