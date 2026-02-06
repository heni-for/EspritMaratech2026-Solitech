import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: Users },
  { title: "Trainings", url: "/trainings", icon: BookOpen },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
  { title: "Certificates", url: "/certificates", icon: Award },
  { title: "Users", url: "/users", icon: UserCog },
];

const trainerMenuItems = [
  { title: "Dashboard", url: "/trainer", icon: LayoutDashboard },
  { title: "Trainings", url: "/trainings", icon: BookOpen },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
  { title: "Students", url: "/students", icon: Users },
];

const studentMenuItems = [
  { title: "My Dashboard", url: "/my", icon: LayoutDashboard },
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

  const roleLabelMap: Record<string, string> = {
    admin: "Administration",
    trainer: "Trainer",
    student: "Student",
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href={user?.role === "admin" ? "/" : user?.role === "trainer" ? "/trainer" : "/my"}>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-sidebar-primary">
              <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">ASTBA</span>
              <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                {roleLabelMap[user?.role || "student"]}
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  item.url === "/" || item.url === "/trainer" || item.url === "/my"
                    ? location === item.url
                    : location.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground truncate px-1">
            {user?.fullName}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
