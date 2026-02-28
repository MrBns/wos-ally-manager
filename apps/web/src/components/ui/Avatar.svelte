<script lang="ts">
  import { cn } from '$lib/utils.js';

  let {
    src = '',
    alt = '',
    fallback = '',
    size = 'md',
    class: className = '',
  }: {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  } = $props();

  let imgError = $state(false);

  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' };
</script>

<div class={cn('relative rounded-full overflow-hidden flex items-center justify-center bg-muted font-semibold text-muted-foreground', sizes[size], className)}>
  {#if src && !imgError}
    <img {src} {alt} class="h-full w-full object-cover" onerror={() => imgError = true} />
  {:else}
    <span>{fallback || (alt?.[0]?.toUpperCase() ?? '?')}</span>
  {/if}
</div>
