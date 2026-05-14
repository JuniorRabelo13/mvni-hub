import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  user: User | null;
  effectiveUser: { id: string; email?: string } | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  signOut: () => Promise<void>;
  viewAs: (userId: string | null) => void;
  isViewingAs: boolean;
};

const AuthCtx = createContext<Ctx>({ 
  user: null, 
  effectiveUser: null,
  session: null, 
  loading: true, 
  role: null,
  signOut: async () => {},
  viewAs: () => {},
  isViewingAs: false
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(localStorage.getItem("view_as_user_id"));

  useEffect(() => {
    // 1) listener primeiro
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      setLoading(false);
      
      if (!s) {
        setViewAsUserId(null);
        localStorage.removeItem("view_as_user_id");
      } else {
        // Validar se o usuário é admin se estiver no modo "ver como"
        const storedViewAs = localStorage.getItem("view_as_user_id");
        if (storedViewAs) {
          const { data } = await supabase.from("profiles").select("role").eq("id", s.user.id).single();
          if (data?.role !== "admin") {
            setViewAsUserId(null);
            localStorage.removeItem("view_as_user_id");
          }
        }
      }
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

  const viewAs = async (userId: string | null) => {
    if (userId) {
      localStorage.setItem("view_as_user_id", userId);
    } else {
      localStorage.removeItem("view_as_user_id");
    }
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
      role,
      signOut,
      viewAs,
      isViewingAs: !!viewAsUserId
    }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
