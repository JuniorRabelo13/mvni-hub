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
      const { data, error } = await supabase
        .from("usuarios")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[AUTH] Error fetching role from 'usuarios':", error);
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        
        if (profileError) throw profileError;
        if (profileData) {
          console.log('[AUTH] Role loaded from profiles:', profileData.role);
          setRole(profileData.role);
          return profileData.role;
        }
      }

      const roleResult = data?.role ?? 'user';
      console.log('[AUTH] Role loaded from usuarios:', roleResult);
      setRole(roleResult);
      return roleResult;
    } catch (error) {
      console.error("[AUTH] Erro crítico ao buscar role:", error);
      setRole('user');
      return 'user';
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('[AUTH] Initializing AuthProvider');

    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Getting session...');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!mounted) return;
        
        if (initialSession) {
          setSession(initialSession);
          // O role DEVE ser carregado antes de marcar isAuthReady
          await fetchRole(initialSession.user.id);
        } else {
          setSession(null);
          setRole(null);
        }
      } catch (error) {
        console.error('[AUTH] Initialization error:', error);
        if (mounted) {
          setSession(null);
          setRole(null);
        }
      } finally {
        if (mounted) {
          console.log('[AUTH] Initialization complete, data ready');
          setIsAuthReady(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AUTH] Auth state changed:', event, newSession?.user?.id);
      
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setRole(null);
        setViewAsUserId(null);
        localStorage.removeItem("view_as_user_id");
        setIsAuthReady(true);
        setLoading(false);
        return;
      }

      if (newSession) {
        setSession(newSession);
        setIsAuthReady(false); // Bloqueia o Guard enquanto carrega o novo role
        setLoading(true);
        // Garante que o role seja buscado ANTES de liberar o AuthGuard
        await fetchRole(newSession.user.id);
        if (mounted) {
          setIsAuthReady(true);
          setLoading(false);
        }
      } else {
        setSession(null);
        setRole(null);
        setIsAuthReady(true);
        setLoading(false);
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
      loading: !isAuthReady,
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
