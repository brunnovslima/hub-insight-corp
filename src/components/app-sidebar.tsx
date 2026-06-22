import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  PackageX,
  HardHat,
  Wallet,
  LineChart,
  PiggyBank,
  Scale,
  Bot,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, canAccess, type AppRole } from "@/hooks/use-auth";
import logo from "@/assets/logo.png";

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles: AppRole[];
}

const overview: NavItem[] = [
  { title: "Visão Geral", url: "/overview", icon: LayoutDashboard, roles: ["admin", "diretor", "analista", "gestor_obra"] },
];

const mercado: NavItem[] = [
  { title: "VGV e Lançamentos", url: "/mercado/vgv", icon: TrendingUp, roles: ["admin", "diretor", "analista", "gestor_obra"] },
  { title: "Performance de Vendas", url: "/mercado/vendas", icon: ShoppingCart, roles: ["admin", "diretor", "analista", "gestor_obra"] },
  { title: "Estoque e Distratos", url: "/mercado/estoque", icon: PackageX, roles: ["admin", "diretor", "analista", "gestor_obra"] },
  { title: "Obras e Entregas", url: "/mercado/obras", icon: HardHat, roles: ["admin", "diretor", "analista", "gestor_obra"] },
];

const financeiro: NavItem[] = [
  { title: "Liquidez e Endividamento", url: "/financeiro/liquidez", icon: Scale, roles: ["admin", "diretor", "analista"] },
  { title: "Fluxo de Caixa", url: "/financeiro/fluxo", icon: Wallet, roles: ["admin", "diretor", "analista"] },
  { title: "Rentabilidade", url: "/financeiro/rentabilidade", icon: LineChart, roles: ["admin", "diretor", "analista"] },
  { title: "Balanço Patrimonial", url: "/financeiro/balanco", icon: PiggyBank, roles: ["admin", "diretor", "analista"] },
];

const ai: NavItem[] = [
  { title: "Chat IA", url: "/chat", icon: Bot, roles: ["admin", "diretor", "analista"] },
];

const settings: NavItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + "/");

  const renderGroup = (label: string, items: NavItem[]) => {
    const visible = items.filter((i) => canAccess(roles, i.roles));
    if (!visible.length) return null;
    return (
      <SidebarGroup>
        {!collapsed && <SidebarGroupLabel className="text-gold/80 uppercase text-xs tracking-wider">{label}</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {visible.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gold/20 shrink-0">
            <Building2 className="h-5 w-5 text-gold" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">Hub Corporativo</span>
              <span className="text-[10px] text-gold uppercase tracking-widest">Inteligência</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Geral", overview)}
        {renderGroup("Mercado", mercado)}
        {renderGroup("Financeiro", financeiro)}
        {renderGroup("Assistente", ai)}
        {renderGroup("Admin", settings)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-2 pt-2 pb-1">
            <p className="text-xs text-sidebar-foreground/70 truncate">{user.email}</p>
            <p className="text-[10px] text-gold uppercase tracking-wider">{roles.join(", ") || "sem perfil"}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

// Suppress unused import warning - logo reserved for future header use
void logo;