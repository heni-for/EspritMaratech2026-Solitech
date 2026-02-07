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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const adminMenuItems = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard, color: "text-violet-600 dark:text-violet-400" },
  { title: "Eleves", url: "/students", icon: Users, color: "text-indigo-600 dark:text-indigo-400" },
  { title: "Formations", url: "/trainings", icon: BookOpen, color: "text-amber-600 dark:text-amber-400" },
  { title: "Presences", url: "/attendance", icon: ClipboardCheck, color: "text-violet-500 dark:text-violet-400" },
  { title: "Certificats", url: "/certificates", icon: Award, color: "text-orange-500 dark:text-orange-400" },
  { title: "Encadrants", url: "/encadrants", icon: UserCog, color: "text-slate-400 dark:text-slate-500" },
];

const trainerMenuItems = [
  { title: "Tableau de bord", url: "/trainer", icon: LayoutDashboard, color: "text-violet-600 dark:text-violet-400" },
  { title: "Formations", url: "/trainings", icon: BookOpen, color: "text-amber-600 dark:text-amber-400" },
  { title: "Presences", url: "/attendance", icon: ClipboardCheck, color: "text-violet-500 dark:text-violet-400" },
  { title: "Eleves", url: "/students", icon: Users, color: "text-indigo-600 dark:text-indigo-400" },
];

const studentMenuItems = [
  { title: "Historique", url: "/my", icon: LayoutDashboard, color: "text-violet-600 dark:text-violet-400" },
  { title: "Formations", url: "/my/trainings", icon: BookOpen, color: "text-amber-600 dark:text-amber-400" },
  { title: "Attendance", url: "/my/attendance", icon: ClipboardCheck, color: "text-violet-500 dark:text-violet-400" },
  { title: "Certificat", url: "/my/certificates", icon: Award, color: "text-orange-500 dark:text-orange-400" },
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

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-center py-4">
        <Link href={user?.role === "admin" ? "/" : user?.role === "trainer" ? "/trainer" : "/my"}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-sidebar-primary cursor-pointer overflow-hidden" data-testid="link-logo">
                <img src="/logo.png" alt="ASTBA" className="w-8 h-8 object-contain" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">ASTBA</TooltipContent>
          </Tooltip>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex flex-col items-center justify-center">
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
                            <item.icon className={`h-5 w-5 ${isActive ? 'text-violet-600 dark:text-violet-400' : item.color}`} />
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
              onClick={handleLogout}
              className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 dark:text-slate-500 cursor-pointer"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Deconnexion</TooltipContent>
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}
