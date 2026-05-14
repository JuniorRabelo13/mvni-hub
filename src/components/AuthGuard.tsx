import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

const PUBLIC_ROUTES = [
  "/auth",
  "/cadastro",
  "/cadastro/sucesso",
  "/termos",
  "/recuperar-senha",
  "/nova-senha"
]

const MASTER_ONLY_ROUTES = [
  "/",
  "/bi-executivo",
  "/projecoes-futuras",
  "/financeiro-global",
  "/gestao-comissoes",
  "/rede-afiliados",
  "/base-global",
  "/whatsapp-engine",
  "/infra-telecom",
  "/ia-workers",
  "/centro-critico",
  "/antifraude-risco",
  "/auditoria-global",
  "/usuarios-permissoes",
  "/master-config"
]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, authenticated, role, isAuthReady } = useAuth()

  useEffect(() => {
    if (!isAuthReady) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
    
    console.log('[AuthGuard] Check:', { 
      authenticated, 
      role, 
      path: location.pathname, 
      isPublicRoute 
    });

    if (!authenticated) {
      if (!isPublicRoute) {
        console.log('[AuthGuard] Redirecting to /auth');
        navigate("/auth", { replace: true });
      }
      return;
    }

    // Se autenticado e na tela de login, manda para o painel
    if (location.pathname === "/auth") {
      navigate("/painel", { replace: true });
      return;
    }

    if (
      MASTER_ONLY_ROUTES.includes(location.pathname) &&
      role && role !== "master"
    ) {
      console.log('[AuthGuard] Access denied for role:', role);
      navigate("/painel", { replace: true });
    }
  }, [loading, authenticated, role, location.pathname, navigate]);

  if (!isAuthReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Carregando acesso...</p>
        </div>
        <style>
          {`@keyframes spin { to { transform: rotate(360deg) } }`}
        </style>
      </div>
    );
  }

  return <>{children}</>;
}
