import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  user: User | null;
  effectiveUser: { id: string; email?: string } | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  authenticated: boolean;
  isAuthReady: boolean;
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
  authenticated: false,
  isAuthReady: false,
  signOut: async () => {},
  viewAs: () => {},
  isViewingAs: false
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(localStorage.getItem("view_as_user_id"));

  const fetchRole = async (userId: string) => {
    try {
      console.log('[AUTH] Fetching role for:', userId);
      // Query 'usuarios' table as requested in prompt
      const { data, error } = await supabase
        .from("usuarios")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[AUTH] Error fetching role from 'usuarios':", error);
        // Fallback to 'profiles' table if 'usuarios' query fails
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        
        if (profileError) throw profileError;
        if (profileData) {
          console.log('[AUTH] Role loaded from profiles:', profileData.role);
          setRole(profileData.role);
          return;
        }
      }

      console.log('[AUTH] Role loaded from usuarios:', data?.role);
      setRole(data?.role ?? 'user');
    } catch (error) {
      console.error("[AUTH] Erro crítico ao buscar role:", error);
      setRole('user'); // Fallback seguro
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('[AUTH] Initializing AuthProvider');

    const initializeAuth = async () => {
      try {
        // Use getUser for more security as requested
        const { data: { user: initialUser } } = await supabase.auth.getUser();
        if (!mounted) return;

        console.log('[AUTH] Initial user:', initialUser?.id);
        
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(initialSession);

        if (initialUser) {
          await fetchRole(initialUser.id);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('[AUTH] Initialization error:', error);
      } finally {
        if (mounted) {
          console.log('[AUTH] Loading complete');
          setLoading(false);
          setIsAuthReady(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AUTH] Auth state changed:', event, newSession?.user?.id);
      
      if (!mounted) return;

      setSession(newSession);
      
      if (newSession) {
        // No await here to prevent blocking isAuthReady if onAuthStateChange fires repeatedly
        fetchRole(newSession.user.id).finally(() => {
           if (mounted) {
             setLoading(false);
             setIsAuthReady(true);
           }
        });
      } else {
        setRole(null);
        setViewAsUserId(null);
        localStorage.removeItem("view_as_user_id");
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
      isAuthReady,
      role,
      authenticated: !!session,
      signOut,
      viewAs,
      isViewingAs: !!viewAsUserId
    }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
