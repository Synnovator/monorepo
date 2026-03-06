import { useState, useEffect } from 'react';

export interface AuthUser {
  login: string;
  avatar_url: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isLoggedIn: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!cancelled) {
          if (data.authenticated) {
            setUser({ login: data.login, avatar_url: data.avatar_url });
          } else {
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAuth();
    return () => { cancelled = true; };
  }, []);

  return { user, loading, isLoggedIn: !!user };
}
