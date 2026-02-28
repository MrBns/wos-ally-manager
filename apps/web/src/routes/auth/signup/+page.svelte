<script lang="ts">
  import Button from '$components/ui/Button.svelte';
  import Input from '$components/ui/Input.svelte';
  import Card from '$components/ui/Card.svelte';
  import { signUp } from '$lib/api/auth.js';
  import { authStore } from '$lib/stores/auth.svelte.js';
  import { goto } from '$app/navigation';

  let gameUserId = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let errors = $state<Record<string, string>>({});
  let serverError = $state('');

  function validate() {
    const e: Record<string, string> = {};
    if (!gameUserId) e.gameUserId = 'Game User ID is required';
    else if (!/^\d+$/.test(gameUserId)) e.gameUserId = 'Must be numeric';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'At least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    errors = e;
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!validate()) return;
    loading = true;
    serverError = '';
    try {
      const result = await signUp(gameUserId, password);
      authStore.setUser(result.user);
      goto('/dashboard');
    } catch (err: any) {
      serverError = err.message ?? 'Sign up failed. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Sign Up — WOS Ally Manager</title></svelte:head>

<Card class="w-full max-w-sm p-6 space-y-6">
  <div class="text-center space-y-1">
    <div class="text-4xl">❄️</div>
    <h1 class="text-2xl font-bold">Create Account</h1>
    <p class="text-sm text-muted-foreground">Enter your game user ID to get started</p>
  </div>

  <form onsubmit={handleSubmit} class="space-y-4">
    <Input
      label="Game User ID"
      type="text"
      placeholder="e.g. 12345678"
      bind:value={gameUserId}
      error={errors.gameUserId}
      inputmode="numeric"
      autocomplete="username"
    />
    <Input
      label="Password"
      type="password"
      placeholder="At least 6 characters"
      bind:value={password}
      error={errors.password}
      autocomplete="new-password"
    />
    <Input
      label="Confirm Password"
      type="password"
      placeholder="Repeat password"
      bind:value={confirmPassword}
      error={errors.confirmPassword}
      autocomplete="new-password"
    />

    {#if serverError}
      <p class="text-sm text-destructive text-center">{serverError}</p>
    {/if}

    <Button type="submit" class="w-full" {loading}>Create Account</Button>
  </form>

  <p class="text-center text-sm text-muted-foreground">
    Already have an account?
    <a href="/auth/login" class="text-primary hover:underline font-medium">Sign in</a>
  </p>
</Card>
