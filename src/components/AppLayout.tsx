import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  Wallet, 
  LogOut, 
  Sparkles, 
  Receipt, 
  Settings, 
  ShieldCheck, 
  ScrollText, 
  ShieldAlert, 
  FileUp, 
  MessageSquare, 
  PhoneCall, 
  History, 
  Settings2, 
  UserPlus,
  Crown,
  BarChart4,
  Cpu,
  ShieldQuestion,
  AlertTriangle,
  Database,
  EyeOff,
  ClipboardList,
  TrendingUp,
  Bell
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useIsMasterAdmin } from "@/hooks/useIsMasterAdmin";

export default function AppLayout() {
  const { user, effectiveUser, signOut, viewAs, isViewingAs } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: isMasterAdmin } = useIsMasterAdmin();

  useEffect(() => {
    async function checkRole() {
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setIsAdmin(data?.role === "admin");
      }
    }
    checkRole();
  }, [user]);

  const navItems = [
    { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
    { to: "/clientes", label: "Clientes", icon: Users },
    { to: "/estrutura", label: "Estrutura", icon: Network },
    { to: "/equipe", label: "Equipe", icon: Users },
    { to: "/ganhos", label: "Ganhos", icon: Wallet },
    { to: "/pagamentos", label: "Pagamentos", icon: Receipt },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
    { to: "/sms/dashboard", label: "SMS Marketing", icon: MessageSquare },
  ];

  const waItems = [
    { to: "/agente", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/agente/leads", label: "Leads", icon: UserPlus },
    { to: "/agente/agentes", label: "Números", icon: PhoneCall },
    { to: "/agente/mensagens", label: "Mensagens", icon: History },
    { to: "/agente/configuracoes", label: "Ajustes IA", icon: Settings2 },
  ];

  const masterItems = [
    { to: "/master/central", label: "Central Estratégica", icon: LayoutDashboard },
    { to: "/master/dashboard", label: "BI Executivo", icon: BarChart4 },
    { to: "/master/projecoes", label: "Projeções Futuras", icon: TrendingUp },
    { to: "/master/financeiro", label: "Financeiro Global", icon: Wallet },
    { to: "/master/comissoes", label: "Gestão Comissões", icon: TrendingUp },
    { to: "/master/afiliados", label: "Rede Afiliados", icon: Users },
    { to: "/master/clientes", label: "Base Global", icon: Users },
    { to: "/master/whatsapp", label: "WhatsApp Engine", icon: MessageSquare },
    { to: "/master/linhas", label: "Infra Telecom", icon: Database },
    { to: "/master/workers", label: "IA & Workers", icon: Cpu },
    { to: "/master/alertas", label: "Centro Crítico", icon: AlertTriangle },
    { to: "/master/antifraude", label: "Antifraude & Risco", icon: ShieldAlert },
    { to: "/master/auditoria", label: "Auditoria Global", icon: ClipboardList },
    { to: "/master/notificacoes", label: "Histórico Notificações", icon: Bell },
    { to: "/master/usuarios", label: "Usuários & Permissões", icon: ShieldCheck },
    { to: "/master/config", label: "Master Config", icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ to: "/admin", label: "Admin Global", icon: ShieldCheck });
    navItems.push({ to: "/admin/logs", label: "Logs Admin", icon: ScrollText });
    navItems.push({ to: "/admin/security", label: "Logs Segurança", icon: ShieldAlert });
    navItems.push({ to: "/admin/importacoes", label: "Importações", icon: FileUp });
  }

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
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pessoa Física</p>
          </div>
        </div>

        {isMasterAdmin && (
          <div className="px-3 mb-3">
            <NavLink
              to="/master/central"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-bold transition-all shadow-sm",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-1 ring-primary/50"
                    : "bg-gradient-to-r from-amber-500/20 to-primary/10 text-amber-300 hover:from-amber-500/30 hover:to-primary/20 hover:text-amber-200 border border-amber-500/30",
                )
              }
            >
              <Crown className="h-5 w-5 shrink-0" />
              <span>Master Owner</span>
            </NavLink>
          </div>
        )}

        <nav className="flex-1 space-y-4 px-3 overflow-y-auto pt-4">
          {isMasterAdmin && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                <Crown className="h-3 w-3" /> Master Owner
              </p>
              {masterItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
              <div className="h-px bg-sidebar-border mx-3 my-4" />
            </div>
          )}

          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Sistema Operacional</p>
            {navItems.map(({ to, label, icon: Icon, end }) => (
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
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Agente WhatsApp</p>
            {waItems.map(({ to, label, icon: Icon, end }) => (
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
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 truncate text-xs text-muted-foreground flex items-center gap-2">
            {isMasterAdmin && <Crown className="h-3 w-3 text-primary shrink-0" />}
            <span className="truncate">{user?.email}</span>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-gold">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">MVNI Hub</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2 md:hidden">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8">
          {isViewingAs && (
            <div className="mb-6 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Modo Visualização Ativo</p>
                  <p className="text-xs text-muted-foreground">Você está vendo o sistema como: {effectiveUser?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => viewAs(null)} className="gap-2">
                <EyeOff className="h-4 w-4" /> Sair do modo visualização
              </Button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
