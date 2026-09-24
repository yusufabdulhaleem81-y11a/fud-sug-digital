import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/models';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string): Promise<Profile | null> {
    const { data }: any = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    const p = (data as Profile | null) ?? null;
    setProfile(p);
    return p;
  }

  useEffect(() => {
    supabase.auth.getSession().then(async (res: any) => {
      setSession(res.data.session);
      if (res.data.session) await loadProfile(res.data.session.user.id);
      setLoading(false);
    });
    const { data: sub }: any = supabase.auth.onAuthStateChange((_e: any, s: any) => {
      setSession(s);
      if (s) loadProfile(s.user.id); else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      session, profile, loading,
      refresh: async () => (session ? loadProfile(session.user.id) : null),
      signOut: async () => { await supabase.auth.signOut(); },
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}