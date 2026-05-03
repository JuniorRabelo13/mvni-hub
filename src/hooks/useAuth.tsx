import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  user: User | null;
  effectiveUser: { id: string; email?: string } | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  viewAs: (userId: string | null) => void;
  isViewingAs: boolean;
};

const AuthCtx = createContext<Ctx>({ 
  user: null, 
  effectiveUser: null,
  session: null, 
  loading: true, 
  signOut: async () => {},
  viewAs: () => {},
  isViewingAs: false
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1) listener primeiro
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
      if (!s) setViewAsUserId(null); // Limpa se deslogar
    });
    // 2) sessão inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const viewAs = (userId: string | null) => {
    setViewAsUserId(userId);
  };

  const effectiveUser = viewAsUserId 
    ? { id: viewAsUserId, email: `Simulando ID: ${viewAsUserId.slice(0, 8)}...` }
    : session?.user ?? null;

  return (
    <AuthCtx.Provider value={{ 
      user: session?.user ?? null, 
      effectiveUser: effectiveUser as any,
      session, 
      loading, 
      signOut,
      viewAs,
      isViewingAs: !!viewAsUserId
    }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
