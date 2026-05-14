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
  const { loading, authenticated, role } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!authenticated) {
      if (!PUBLIC_ROUTES.includes(location.pathname)) {
        navigate("/auth", { replace: true })
      }
      return
    }

    if (
      MASTER_ONLY_ROUTES.includes(location.pathname) &&
      role && role !== "master"
    ) {
      navigate("/painel", { replace: true })
    }
  }, [loading, authenticated, role, location.pathname, navigate])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <style>
          {`@keyframes spin { to { transform: rotate(360deg) } }`}
        </style>
      </div>
    )
  }

  return <>{children}</>
}
