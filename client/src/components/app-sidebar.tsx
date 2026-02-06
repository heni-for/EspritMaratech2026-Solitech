import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  Award,
  GraduationCap,
  UserCog,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const adminMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, color: "bg-violet-500/20 text-violet-400" },
  { title: "Eleves", url: "/students", icon: Users, color: "bg-orange-500/20 text-orange-400" },
  { title: "Formations", url: "/trainings", icon: BookOpen, color: "bg-blue-500/20 text-blue-400" },
  { title: "Presences", url: "/attendance", icon: ClipboardCheck, color: "bg-teal-500/20 text-teal-400" },
  { title: "Certificats", url: "/certificates", icon: Award, color: "bg-rose-500/20 text-rose-400" },
  { title: "Utilisateurs", url: "/users", icon: UserCog, color: "bg-purple-500/20 text-purple-400" },
];

const trainerMenuItems = [
  { title: "Dashboard", url: "/trainer", icon: LayoutDashboard, color: "bg-violet-500/20 text-violet-400" },
  { title: "Formations", url: "/trainings", icon: BookOpen, color: "bg-blue-500/20 text-blue-400" },
  { title: "Presences", url: "/attendance", icon: ClipboardCheck, color: "bg-teal-500/20 text-teal-400" },
  { title: "Eleves", url: "/students", icon: Users, color: "bg-orange-500/20 text-orange-400" },
];

const studentMenuItems = [
  { title: "Mon espace", url: "/my", icon: LayoutDashboard, color: "bg-violet-500/20 text-violet-400" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const menuItems =
    user?.role === "admin"
      ? adminMenuItems
      : user?.role === "trainer"
      ? trainerMenuItems
      : studentMenuItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-center py-4">
        <Link href={user?.role === "admin" ? "/" : user?.role === "trainer" ? "/trainer" : "/my"}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-sidebar-primary cursor-pointer" data-testid="link-logo">
                <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">ASTBA</TooltipContent>
          </Tooltip>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex flex-col items-center">
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  item.url === "/" || item.url === "/trainer" || item.url === "/my"
                    ? location === item.url
                    : location.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title} className="flex justify-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="flex items-center justify-center"
                        >
                          <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                            <div className={`flex items-center justify-center w-8 h-8 rounded-md ${isActive ? 'bg-sidebar-primary/25 text-sidebar-primary' : item.color}`}>
                              <item.icon className="h-4 w-4" />
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-center py-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => logout()}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-red-500/15 text-red-400 cursor-pointer"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Deconnexion</TooltipContent>
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}
