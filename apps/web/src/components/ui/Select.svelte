<script lang="ts">
  import { cn } from '$lib/utils.js';

  interface Option { value: string | number; label: string }

  let {
    options,
    value = $bindable(''),
    label: fieldLabel = '',
    class: className = '',
    disabled = false,
    error = '',
    ...rest
  }: {
    options: Option[];
    value?: string | number;
    label?: string;
    class?: string;
    disabled?: boolean;
    error?: string;
  } = $props();
</script>

<div class="flex flex-col gap-1.5 w-full">
  {#if fieldLabel}
    <label class="text-sm font-medium text-foreground">{fieldLabel}</label>
  {/if}
  <select
    bind:value
    {disabled}
    class={cn(
      'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      error && 'border-destructive',
      className
    )}
    {...rest}
  >
    {#each options as opt (opt.value)}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
  {#if error}
    <p class="text-xs text-destructive">{error}</p>
  {/if}
</div>
