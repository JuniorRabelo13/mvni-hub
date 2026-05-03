import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Network, Wallet, LogOut, Sparkles, Receipt, Settings, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/estrutura", label: "Estrutura", icon: Network },
  { to: "/equipe", label: "Equipe", icon: Users },
  { to: "/ganhos", label: "Ganhos", icon: Wallet },
  { to: "/pagamentos", label: "Pagamentos", icon: Receipt },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setIsAdmin(data?.role === "admin");
      }
    }
    checkRole();
  }, [user]);

  const nav = [
    { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
    { to: "/clientes", label: "Clientes", icon: Users },
    { to: "/estrutura", label: "Estrutura", icon: Network },
    { to: "/equipe", label: "Equipe", icon: Users },
    { to: "/ganhos", label: "Ganhos", icon: Wallet },
    { to: "/pagamentos", label: "Pagamentos", icon: Receipt },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
  ];

  if (isAdmin) {
    nav.push({ to: "/admin", label: "Admin Global", icon: ShieldCheck });
  }

  const handleSignOut = async () => {
...
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
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
            <LogOut className="h-3.5 w-3.5" /> Sair
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
          {nav.map(({ to, label, icon: Icon, end }) => (
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
