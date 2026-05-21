import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_ROUTES = ["/auth", "/cadastro", "/cadastro/sucesso", "/termos", "/recuperar-senha", "/nova-senha"];
const MASTER_ONLY_ROUTES = ["/bi-executivo", "/projecoes-futuras", "/financeiro-global", "/gestao-comissoes", "/rede-afiliados", "/base-global", "/whatsapp-engine", "/infra-telecom", "/ia-workers", "/centro-critico", "/antifraude-risco", "/auditoria-global", "/usuarios-permissoes", "/master-config"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled) {
        console.warn("[AUTH] Guard fallback triggered after 5s");
        if (!PUBLIC_ROUTES.includes(location.pathname)) {
          navigate("/auth", { replace: true });
        }
        setReady(true);
      }
    }, 5000);

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (cancelled) return;
        if (sessionError) throw sessionError;

        if (!session) {
          clearTimeout(fallback);
          if (!PUBLIC_ROUTES.includes(location.pathname)) {
            navigate("/auth", { replace: true });
          }
          setReady(true);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (cancelled) return;
        clearTimeout(fallback);

        const role = userData?.role ?? "representante";
        if (MASTER_ONLY_ROUTES.includes(location.pathname) && role !== "master") {
          navigate("/painel", { replace: true });
        }
        setReady(true);
      } catch (err) {
        console.error("[AUTH] Guard error:", err);
        if (!cancelled) {
          clearTimeout(fallback);
          if (!PUBLIC_ROUTES.includes(location.pathname)) {
            navigate("/auth", { replace: true });
          }
          setReady(true);
        }
      }
    };

    checkAuth();

    return () => { cancelled = true; clearTimeout(fallback); };
  }, [location.pathname, navigate]);

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F1A]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9b87f5] border-t-transparent"></div>
        <style>
        {`@keyframes spin { to { transform: rotate(360deg) } }`}
      </style>
      </div>
    );
  }

  return <>{children}</>;
}