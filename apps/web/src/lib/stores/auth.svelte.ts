import type { User } from '../api/auth.js';
import { getSession, signOut as apiSignOut } from '../api/auth.js';

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
};

function createAuthStore() {
  let state = $state<AuthState>({ user: null, loading: false, initialized: false });

  async function initialize() {
    if (state.initialized) return;
    state.loading = true;
    try {
      const session = await getSession();
      state.user = session?.user ?? null;
    } catch {
      state.user = null;
    } finally {
      state.loading = false;
      state.initialized = true;
    }
  }

  function setUser(user: User | null) {
    state.user = user;
    state.initialized = true;
  }

  async function signOut() {
    try {
      await apiSignOut();
    } finally {
      state.user = null;
    }
  }

  return {
    get user() { return state.user; },
    get loading() { return state.loading; },
    get initialized() { return state.initialized; },
    get isAuthenticated() { return state.user !== null; },
    get isR4orAbove() {
      const role = state.user?.role;
      return role === 'r4' || role === 'r5';
    },
    get isR5() { return state.user?.role === 'r5'; },
    initialize,
    setUser,
    signOut,
  };
}

export const authStore = createAuthStore();
