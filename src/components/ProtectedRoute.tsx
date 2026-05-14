import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: "master" | "representante" | "both";
}

export const ProtectedRoute = ({ children, requiredRole = "both" }: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // 1. Qualquer rota autenticada acessada sem sessão ativa -> redirecionar para login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 2. Proteção baseada em Role
  if (requiredRole === "master" && role !== "master") {
    // Se um representante tentar acessar rota master, redireciona para / (que é o painel/dashboard)
    return <Navigate to="/painel" replace />;
  }

  // Role "both" permite master e representante (conforme solicitado no item 3)
  // Como master é considerado superior, assumimos que master também acessa rotas de representante
  if (requiredRole === "representante" && role !== "representante" && role !== "master") {
    return <Navigate to="/" replace />;
  }

  return children;
};