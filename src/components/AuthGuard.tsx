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
  const { authenticated, role, isAuthReady } = useAuth()

  useEffect(() => {
    // Não faz nada se a autenticação não estiver totalmente pronta (sessão + role)
    if (!isAuthReady) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
    
    console.log('[AuthGuard] Running validation:', { 
      authenticated, 
      role, 
      path: location.pathname, 
      isPublicRoute 
    });

    // 1. Não autenticado
    if (!authenticated) {
      if (!isPublicRoute) {
        console.log('[AuthGuard] Unauthorized access to private route, redirecting to /auth');
        navigate("/auth", { replace: true });
      }
      return;
    }

    // 2. Autenticado tentando acessar rota pública (como /auth)
    if (isPublicRoute && location.pathname === "/auth") {
      console.log('[AuthGuard] Authenticated user on /auth, redirecting to /painel');
      navigate("/painel", { replace: true });
      return;
    }

    // 3. Validação de RBAC (Master Only)
    const isMasterRoute = MASTER_ONLY_ROUTES.includes(location.pathname);
    if (isMasterRoute && role !== "master") {
      console.log('[AuthGuard] RBAC Denial: user role', role, 'tried accessing', location.pathname);
      // Evita redirect recursivo se já estivermos no painel
      if (location.pathname !== "/painel") {
        navigate("/painel", { replace: true });
      }
    }
  }, [authenticated, role, location.pathname, navigate, isAuthReady]);

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
