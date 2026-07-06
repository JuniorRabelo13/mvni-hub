import { Suspense } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Smartphone,
  Receipt,
  BarChart3,
  Wallet,
  History,
  LifeBuoy,
  UserCircle,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/LoadingScreen";

const items = [
  { to: "/cliente", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/cliente/linhas", label: "Minhas Linhas", icon: Smartphone },
  { to: "/cliente/faturas", label: "Minhas Faturas", icon: Receipt },
  { to: "/cliente/consumo", label: "Consumo", icon: BarChart3 },
  { to: "/cliente/pagamentos", label: "Pagamentos", icon: Wallet },
  { to: "/cliente/historico", label: "Histórico", icon: History },
  { to: "/cliente/suporte", label: "Suporte", icon: LifeBuoy },
  { to: "/cliente/perfil", label: "Perfil", icon: UserCircle },
];

export default function ClienteLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">MVNI Hub</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Central do Cliente
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 overflow-y-auto pt-4">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 truncate text-xs text-muted-foreground">{user?.email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-gold">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Central do Cliente</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <nav className="flex overflow-x-auto border-b border-border px-2 py-2 md:hidden gap-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent",
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
