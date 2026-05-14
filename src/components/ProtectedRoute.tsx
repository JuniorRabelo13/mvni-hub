import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: "master" | "representante" | "both";
}

type AuthStatus = "loading" | "no-session" | "has-session";

const Spinner = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

export const ProtectedRoute = ({ children, requiredRole = "both" }: ProtectedRouteProps) => {
  const location = useLocation();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // 1) Sessão + listener + timeout de 3s
  useEffect(() => {
    let mounted = true;

    const timeoutId = setTimeout(() => {
      if (!mounted) return;
      setStatus((prev) => (prev === "loading" ? "no-session" : prev));
    }, 3000);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setStatus(s ? "has-session" : "no-session");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setStatus(data.session ? "has-session" : "no-session");
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      sub.subscription.unsubscribe();
    };
  }, []);

  // 2) Buscar role quando há sessão
  useEffect(() => {
    if (status !== "has-session" || !session?.user) {
      setRole(null);
      return;
    }
    let mounted = true;
    setRoleLoading(true);
    supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (!mounted) return;
        setRole(data?.role ?? null);
        setRoleLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [status, session?.user?.id]);

  if (status === "loading") {
    return <Spinner />;
  }

  if (status === "no-session") {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (roleLoading) {
    return <Spinner />;
  }

  if (requiredRole === "master" && role !== "master") {
    return <Navigate to="/painel" replace />;
  }

  if (requiredRole === "representante" && role !== "representante" && role !== "master") {
    return <Navigate to="/" replace />;
  }

  return children;
};
