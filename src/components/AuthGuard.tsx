import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_ROUTES = ["/auth", "/cadastro", "/cadastro/sucesso", "/termos", "/recuperar-senha", "/nova-senha"];
const MASTER_ONLY_ROUTES = ["/", "/bi-executivo", "/projecoes-futuras", "/financeiro-global", "/gestao-comissoes", "/rede-afiliados", "/base-global", "/whatsapp-engine", "/infra-telecom", "/ia-workers", "/centro-critico", "/antifraude-risco", "/auditoria-global", "/usuarios-permissoes", "/master-config"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
      navigate("/auth", { replace: true });
    }, 5000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);

      if (!session) {
        if (!PUBLIC_ROUTES.includes(location.pathname)) {
          navigate("/auth", { replace: true });
        }
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from("usuarios")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const role = userData?.role ?? "representante";

      if (MASTER_ONLY_ROUTES.includes(location.pathname) && role !== "master") {
        navigate("/painel", { replace: true });
      }

      setLoading(false);
    });

    return () => clearTimeout(timeout);
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}