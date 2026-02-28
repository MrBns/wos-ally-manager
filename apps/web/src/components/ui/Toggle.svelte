<script lang="ts">
  import { cn } from '$lib/utils.js';

  let {
    checked = $bindable(false),
    disabled = false,
    label = '',
    class: className = '',
    onchange,
  }: {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    class?: string;
    onchange?: (checked: boolean) => void;
  } = $props();

  function toggle() {
    if (disabled) return;
    checked = !checked;
    onchange?.(checked);
  }
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  {disabled}
  onclick={toggle}
  class={cn(
    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
    'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
    checked ? 'bg-primary' : 'bg-muted',
    className
  )}
>
  <span
    class={cn(
      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg',
      'transform transition duration-200',
      checked ? 'translate-x-5' : 'translate-x-0'
    )}
  ></span>
</button>
