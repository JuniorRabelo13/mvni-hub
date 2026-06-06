import { NavLink, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Wallet,
  Menu,
  LogOut,
  Crown,
LucideIcon, } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean };

interface Props {
  primaryItems: NavItem[];
  secondaryItems: NavItem[];
  waItems: NavItem[];
  masterItems: NavItem[];
  isMasterAdmin: boolean;
}

const tabItems: NavItem[] = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/crm", label: "CRM", icon: TrendingUp },
  { to: "/ganhos", label: "Ganhos", icon: Wallet },
];

export function MobileNav({ primaryItems, waItems, masterItems, isMasterAdmin }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-sidebar/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação principal"
    >
      {tabItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}

      <Sheet>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground">
            <Menu className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[88vw] sm:max-w-sm overflow-y-auto p-0">
          <SheetHeader className="border-b border-border p-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              {isMasterAdmin && <Crown className="h-4 w-4 text-primary" />}
              MVNI Hub
            </SheetTitle>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </SheetHeader>

          <div className="space-y-6 p-4">
            {isMasterAdmin && (
              <Section title="Master Owner" items={masterItems} accent />
            )}
            <Section title="Sistema" items={primaryItems} />
            <Section title="WhatsApp" items={waItems} />

            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

function Section({ title, items, accent }: { title: string; items: NavItem[]; accent?: boolean }) {
  return (
    <div className="space-y-1">
      <p
        className={cn(
          "px-2 text-[10px] font-bold uppercase tracking-widest",
          accent ? "text-primary" : "text-muted-foreground/60",
        )}
      >
        {title}
      </p>
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent",
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
