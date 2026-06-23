import { Bell, LogOut, Moon, Sun, User as UserIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  diretor: "Diretor",
  analista: "Analista",
  gestor_obra: "Gestor de Obra",
};

function initials(value: string) {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppHeader() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const { theme, toggle } = useTheme();

  const primaryRole = (roles[0] ?? "analista") as AppRole;
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "Usuário";

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <header className="h-14 flex items-center gap-2 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20 px-2 sm:px-4">
        <SidebarTrigger />
        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{theme === "dark" ? "Modo claro" : "Modo escuro"}</TooltipContent>
        </Tooltip>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">Notificações</p>
              <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Alertas de obras atrasadas, distratos e variações financeiras aparecerão aqui.
            </p>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-2 gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-tight min-w-0">
                <span className="text-xs font-medium truncate max-w-[160px]">{displayName}</span>
                <span className="text-[10px] text-gold uppercase tracking-wider">{ROLE_LABEL[primaryRole]}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="truncate">{displayName}</span>
              <span className="text-xs font-normal text-muted-foreground truncate">{user?.email}</span>
              <Badge variant="outline" className="w-fit mt-1 border-gold/40 text-gold">
                {ROLE_LABEL[primaryRole]}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/configuracoes" })}>
              <UserIcon className="h-4 w-4 mr-2" /> Preferências
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </TooltipProvider>
  );
}