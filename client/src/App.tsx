import { Switch, Route, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantDialog } from "@/components/ai/assistant-dialog";
import { useEffect, useState } from "react";
import { applyAccessibility, defaultAccessibility, loadAccessibility, saveAccessibility } from "@/lib/accessibility";
import { apiRequest } from "@/lib/queryClient";
import { browserTtsSpeak } from "@/lib/speech";
import SettingsPage from "@/pages/settings";
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
import StudentTrainings from "@/pages/student-trainings";
import StudentTrainingDetail from "@/pages/student-training-detail";
import StudentAttendance from "@/pages/student-attendance";
import StudentCertificate from "@/pages/student-certificate";
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
      <Route path="/encadrants" component={UserManagement} />
      <Route path="/settings" component={SettingsPage} />
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
      <Route path="/settings" component={SettingsPage} />
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
      <Route path="/my/trainings" component={StudentTrainings} />
      <Route path="/my/trainings/:id" component={StudentTrainingDetail} />
      <Route path="/my/attendance" component={StudentAttendance} />
      <Route path="/my/certificates" component={StudentCertificate} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/">
        <Redirect to="/my" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  const [a11y, setA11y] = useState(defaultAccessibility);

  useEffect(() => {
    const saved = loadAccessibility();
    setA11y(saved);
    applyAccessibility(saved);
  }, []);

  useEffect(() => {
    saveAccessibility(a11y);
    applyAccessibility(a11y);
  }, [a11y]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent?.detail) {
        setA11y((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };
    window.addEventListener("astba-settings-updated", handler);
    return () => {
      window.removeEventListener("astba-settings-updated", handler);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const loadServerSettings = async () => {
      try {
        const res = await apiRequest("GET", "/api/settings");
        const serverSettings = await res.json();
        if (cancelled) return;
        const merged = { ...defaultAccessibility, ...serverSettings };
        setA11y(merged);
      } catch {
        // keep local settings if server fetch fails
      }
    };
    loadServerSettings();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!a11y.screenDisplay) {
      window.speechSynthesis?.cancel();
      return;
    }

    const getReadableText = (el: HTMLElement | null) => {
      if (!el) return "";
      if (el.closest("[data-no-tts='true']")) return "";
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel) return ariaLabel.trim();
      const title = el.getAttribute("title");
      if (title) return title.trim();
      if (el instanceof HTMLImageElement) {
        const alt = el.getAttribute("alt");
        if (alt) return alt.trim();
      }
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        const label = el.getAttribute("aria-label") || el.getAttribute("placeholder");
        if (label) return label.trim();
      }
      const text = el.textContent?.replace(/\s+/g, " ").trim() || "";
      return text;
    };

    const detectLang = (text: string) => {
      const hasArabic = /[\u0600-\u06FF]/.test(text);
      return hasArabic ? "ar-SA" : "fr-FR";
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const text = getReadableText(target) || getReadableText(target.closest("button, a, label, [role='button']") as HTMLElement);
      if (!text) return;
      const clipped = text.length > 200 ? `${text.slice(0, 200)}...` : text;
      try {
        browserTtsSpeak(clipped, detectLang(clipped));
      } catch {
        // Ignore TTS errors to avoid blocking UI
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [a11y.screenDisplay]);

  const style = {
    "--sidebar-width": "4rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider defaultOpen={false} style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <a href="#main-content" className="skip-link">Aller au contenu</a>
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center justify-end gap-2 ml-auto">
              <AssistantDialog />
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-profile">
                <User className="h-4 w-4" />
                Profil
              </Button>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                data-testid="button-settings"
              >
                <Settings className="h-4 w-4" />
                Parametres
              </Button>
            </Link>
              <ThemeToggle />
            </div>
          </header>
          <main id="main-content" className="flex-1 overflow-auto">
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
