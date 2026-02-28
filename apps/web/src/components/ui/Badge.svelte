<script lang="ts">
  import { cn } from '$lib/utils.js';
  import type { Snippet } from 'svelte';

  type Variant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';

  let {
    variant = 'default',
    class: className = '',
    children,
  }: { variant?: Variant; class?: string; children?: Snippet } = $props();

  const variants: Record<Variant, string> = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-white',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    outline: 'border border-border text-foreground bg-transparent',
  };
</script>

<span class={cn(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  variants[variant],
  className
)}>
  {@render children?.()}
</span>
