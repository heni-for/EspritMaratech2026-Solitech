import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import StudentsPage from "@/pages/students";
import StudentDetailPage from "@/pages/student-detail";
import TrainingsPage from "@/pages/trainings";
import TrainingDetailPage from "@/pages/training-detail";
import AttendancePage from "@/pages/attendance";
import CertificatesPage from "@/pages/certificates";
import TrainerDashboard from "@/pages/trainer-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import UserManagement from "@/pages/user-management";

function AdminRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/students" component={StudentsPage} />
      <Route path="/students/:id" component={StudentDetailPage} />
      <Route path="/trainings" component={TrainingsPage} />
      <Route path="/trainings/:id" component={TrainingDetailPage} />
      <Route path="/attendance" component={AttendancePage} />
      <Route path="/certificates" component={CertificatesPage} />
      <Route path="/users" component={UserManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TrainerRoutes() {
  return (
    <Switch>
      <Route path="/trainer" component={TrainerDashboard} />
      <Route path="/trainings" component={TrainingsPage} />
      <Route path="/trainings/:id" component={TrainingDetailPage} />
      <Route path="/attendance" component={AttendancePage} />
      <Route path="/students" component={StudentsPage} />
      <Route path="/students/:id" component={StudentDetailPage} />
      <Route path="/">
        <Redirect to="/trainer" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function StudentRoutes() {
  return (
    <Switch>
      <Route path="/my" component={StudentDashboard} />
      <Route path="/">
        <Redirect to="/my" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {user?.role === "admin" && <AdminRoutes />}
            {user?.role === "trainer" && <TrainerRoutes />}
            {user?.role === "student" && <StudentRoutes />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
