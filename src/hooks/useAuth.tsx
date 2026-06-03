import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent, identifyUser, resetPostHog } from "@/lib/posthog";

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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(localStorage.getItem("view_as_user_id"));

  const fetchRole = async (userId: string, currentSession?: Session | null) => {
    try {
      console.log('[AUTH] Fetching role for:', userId);

      // 1) Fonte de verdade para PRIVILÉGIOS: public.user_roles (enum app_role).
      //    Evita escalation via UPDATE em usuarios.role.
      const { data: rolesRows, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) {
        console.error("[AUTH] Error fetching user_roles:", rolesError);
      }

      const roleSet = new Set((rolesRows ?? []).map((r: any) => r.role as string));

      let effectiveRole: string;
      if (roleSet.has("master_admin")) {
        effectiveRole = "master_admin";
      } else if (roleSet.has("admin")) {
        effectiveRole = "admin";
      } else {
        // 2) Fallback APENAS para role de exibição (representante, vendedor, etc.).
        //    NUNCA usado por AuthGuard/rotas master — essas checam apenas master_admin/admin.
        const { data: u } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (u?.role) {
          effectiveRole = u.role;
        } else {
          const { data: p } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .maybeSingle();
          effectiveRole = p?.role ?? "user";
        }
      }

      console.log('[AUTH] Role loaded:', effectiveRole);
      setRole(effectiveRole);

      // PostHog Identify
      const userSession = currentSession || session;
      if (userSession) {
        identifyUser(userId, {
          email: userSession.user?.email,
          role: effectiveRole,
          tenant: 'default',
        });
      }

      return effectiveRole;
    } catch (error) {
      console.error("[AUTH] critical error fetching role:", error);
      setRole('user');
      return 'user';
    }
  };



  useEffect(() => {
    let mounted = true;
    let fallbackTimer: any;

    const initialize = async () => {
      try {
        console.log('[AUTH] Initializing...');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!mounted) return;

        if (initialSession) {
          setSession(initialSession);
          trackEvent('login', { method: 'session_restore' });
          await fetchRole(initialSession.user.id, initialSession);
        }
      } catch (err) {
        console.error('[AUTH] Init error:', err);
      } finally {
        if (mounted) {
          console.log('[AUTH] Ready');
          setIsAuthReady(true);
        }
      }
    };

    // Segurança: se em 5s não estiver pronto, força o estado ready
    fallbackTimer = setTimeout(() => {
      if (mounted && !isAuthReady) {
        console.warn('[AUTH] Fallback ready');
        setIsAuthReady(true);
      }
    }, 5000);

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AUTH] State changed:', event);
      if (!mounted) return;

      setSession(newSession);
      if (newSession) {
        if (event === 'SIGNED_IN') {
          trackEvent('login', { method: 'supabase_auth' });
        }
        await fetchRole(newSession.user.id, newSession);
      } else {
        if (event === 'SIGNED_OUT') {
          trackEvent('logout');
          resetPostHog();
        }
        setRole(null);
      }
      setIsAuthReady(true);
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
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
