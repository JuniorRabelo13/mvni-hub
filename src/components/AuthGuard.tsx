import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const PUBLIC_ROUTES = ["/auth", "/cadastro", "/cadastro/sucesso", "/termos", "/recuperar-senha", "/nova-senha", "/privacidade"];
const MASTER_ONLY_ROUTES = ["/master/central", "/master/dashboard", "/master/projecoes", "/master/financeiro", "/master/comissoes", "/master/afiliados", "/master/clientes", "/master/whatsapp", "/master/linhas", "/master/workers", "/master/alertas", "/master/antifraude", "/master/auditoria", "/master/usuarios", "/master/config"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, isAuthReady, role } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log('[AuthGuard] Checking:', { isAuthReady, authenticated, ready, path: location.pathname });
    if (!isAuthReady) return;


    const isPublic = PUBLIC_ROUTES.some(route => location.pathname.startsWith(route));
    
    if (!authenticated && !isPublic) {
      navigate("/auth", { replace: true });
      setReady(true);
      return;
    }

    if (authenticated) {
      const isMasterRoute = MASTER_ONLY_ROUTES.some(route => location.pathname.startsWith(route));
      if (isMasterRoute && role !== "master" && role !== "master_admin") {
        navigate("/painel", { replace: true });
        setReady(true);
        return;
      }
    }

    setReady(true);
  }, [isAuthReady, authenticated, role, location.pathname, navigate]);

  if (!isAuthReady || !ready) {
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
