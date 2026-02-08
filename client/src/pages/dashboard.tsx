
import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
  SendHorizontal,
  Mic,
  MicOff,
  Pencil,
  MoreVertical,
  User,
  GraduationCap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalStudents: number;
  activeTrainings: number;
  todayAttendance: number;
  todayAbsences: number;
  certificatesIssued: number;
  attendanceRate: number;
  eligibleCount: number;
  certificatesThisMonth: number;
  trainingProgress: Array<{
    trainingId: string;
    trainingName: string;
    enrolledCount: number;
    completedCount: number;
    avgProgress: number;
    nextSessionDate?: string | null;
    totalSessions?: number;
  }>;
  attendanceChartData: Array<{
    label: string;
    present: number;
    absent: number;
  }>;
  recentActivity: Array<{
    id: string;
    studentId?: string | number;
    sessionId?: string | number;
    trainingId?: string | number | null;
    studentName: string;
    trainingName: string;
    sessionTitle: string;
    present: boolean;
    markedAt: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
  totalUsers: number;
  trainerCount: number;
}

const chartPeriods = ["Semaine", "Mois", "Trimestre", "Semestre", "Annee", "Tout"];
type ChatMessage = { role: "user" | "assistant"; content: string };

export default function Dashboard() {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechLang, setSpeechLang] = useState<"ar-TN" | "fr-FR" | "en-US">("fr-FR");
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>("");
  const [activePeriod, setActivePeriod] = useState("Semaine");
  const [activeFormation, setActiveFormation] = useState(0);
  const [showAbsents, setShowAbsents] = useState(false);
  const [activityRange, setActivityRange] = useState<"today" | "week" | "all">("week");
  const [activityTraining, setActivityTraining] = useState<string>("all");
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const periodKeyMap: Record<string, string> = {
    Semaine: "week",
    Mois: "month",
    Trimestre: "quarter",
    Semestre: "semester",
    Annee: "year",
    Tout: "all",
  };

  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery<{
    data: Array<{ label: string; present: number; absent: number }>;
    totals: { present: number; absent: number; rate: number };
    absents: Array<{ id: string | number; studentName: string; trainingName: string; date: string }>;
  }>({
    queryKey: ["/api/dashboard/attendance", `?period=${periodKeyMap[activePeriod]}`],
  });

  const handleChatSubmit = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const trimmed = (overrideText ?? chatInput).trim();
    if (!trimmed || chatLoading) return;
    const nextMessages = [...chatMessages, { role: "user" as const, content: trimmed }].slice(-10);
    setChatMessages(nextMessages);
    setChatInput("");
    setAssistantOpen(true);
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await apiRequest("POST", "/api/chat", { messages: nextMessages });
      const payload = await res.json();
      const reply = payload?.reply || "Desole, je n'ai pas de reponse pour le moment.";
      setChatMessages((prev) => [...prev, { role: "assistant" as const, content: reply }].slice(-12));
    } catch (err: any) {
      setChatError(err?.message || "Erreur lors de l'appel au bot.");
    } finally {
      setChatLoading(false);
    }
  };

  const setupRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      latestTranscriptRef.current = transcript;
      setChatInput(transcript);
    };
    recognition.onend = () => {
      setIsListening(false);
      const finalText = latestTranscriptRef.current.trim();
      if (finalText) {
        handleChatSubmit(undefined, finalText);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    return recognition;
  };

  const handleToggleMic = () => {
    if (!speechSupported) return;
    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
      if (!recognitionRef.current) return;
    }
    recognitionRef.current.lang = speechLang;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    setAssistantOpen(true);
    setIsListening(true);
    recognitionRef.current.start();
  };

  const formationsForFilter = stats?.trainingProgress ?? [];
  const formationsToShow = stats?.trainingProgress?.slice(0, 5) ?? [];
  const totalFormations = stats?.trainingProgress?.length ?? 0;
  const maxFormations = formationsToShow.length;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (diffX > diffY && diffX > 10) {
      isSwiping.current = true;
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40;
    if (Math.abs(diffX) > threshold && isSwiping.current) {
      if (diffX < 0 && activeFormation < maxFormations - 1) {
        setActiveFormation((prev) => prev + 1);
      } else if (diffX > 0 && activeFormation > 0) {
        setActiveFormation((prev) => prev - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [activeFormation, maxFormations]);

  const updateAttendanceMutation = useMutation({
    mutationFn: async (payload: { studentId: string | number; sessionId: string | number; present: boolean }) => {
      const res = await apiRequest("POST", "/api/attendance/bulk", {
        records: [
          {
            studentId: payload.studentId,
            sessionId: payload.sessionId,
            present: payload.present,
          },
        ],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/attendance"] });
    },
  });

  const filteredActivity = (stats?.recentActivity ?? []).filter((activity) => {
    const dateStr = activity.markedAt ? activity.markedAt.split("T")[0] : "";
    if (activityRange === "today") {
      const today = new Date().toISOString().split("T")[0];
      if (dateStr !== today) return false;
    } else if (activityRange === "week") {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 6);
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (d < weekAgo || d > today) return false;
    }
    if (activityTraining !== "all") {
      if (String(activity.trainingId || "") !== activityTraining) return false;
    }
    return true;
  });

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="relative p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto animate-fade-up">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 420ms ease-out both; }
      `}</style>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-100 via-transparent to-transparent blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-100 via-transparent to-transparent blur-3xl" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Bienvenue, voici un apercu de vos activites
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportPdf} data-testid="button-export">
            <Download className="h-4 w-4 mr-1.5" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_1fr] gap-4">
        <div className="space-y-4">
          <Card className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Presences</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Presents vs absents par jour</p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {chartPeriods.map((p) => (
                    <Button
                      key={p}
                      variant={activePeriod === p ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActivePeriod(p)}
                      data-testid={`button-period-${p}`}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-3 py-2 rounded-md border bg-background text-sm">
                    <span className="text-muted-foreground">Presents</span>
                    <span className="ml-2 font-semibold">{attendanceData?.totals?.present ?? 0}</span>
                  </div>
                  <button
                    className="px-3 py-2 rounded-md border bg-background text-sm hover:bg-accent"
                    onClick={() => setShowAbsents((s) => !s)}
                    data-testid="button-toggle-absents"
                  >
                    <span className="text-muted-foreground">Absents</span>
                    <span className="ml-2 font-semibold">{attendanceData?.totals?.absent ?? 0}</span>
                  </button>
                  <div className="px-3 py-2 rounded-md border bg-background text-sm">
                    <span className="text-muted-foreground">Assiduite</span>
                    <span className="ml-2 font-semibold">{attendanceData?.totals?.rate ?? 0}%</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">Sur la periode selectionnee</span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading || isAttendanceLoading ? (
                <Skeleton className="h-56 w-full rounded-md" />
              ) : attendanceData?.data ? (
                <div data-testid="chart-attendance-area">
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={attendanceData.data}>
                      <defs>
                        <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(248, 55%, 55%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(248, 55%, 55%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(18, 90%, 58%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(18, 90%, 58%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          color: "hsl(var(--card-foreground))",
                          fontSize: 12,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="present"
                        name="Presents"
                        stroke="hsl(248, 55%, 55%)"
                        strokeWidth={2.5}
                        fill="url(#gradPresent)"
                      />
                      <Area
                        type="monotone"
                        dataKey="absent"
                        name="Absents"
                        stroke="hsl(18, 90%, 58%)"
                        strokeWidth={2.5}
                        fill="url(#gradAbsent)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-slate-500">Pas de donnees pour cette periode</p>
                </div>
              )}
              {showAbsents && attendanceData?.absents?.length ? (
                <div className="mt-3 border rounded-md">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                    Liste des absents ({attendanceData.absents.length})
                  </div>
                  <div className="max-h-56 overflow-auto divide-y">
                    {attendanceData.absents.map((a) => (
                      <div key={a.id} className="px-3 py-2 text-sm">
                        <span className="font-medium">{a.studentName}</span>
                        <span className="text-muted-foreground"> • {a.trainingName}</span>
                        <span className="text-muted-foreground"> • {a.date || "Date inconnue"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Activite recente</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Dernieres presences marquees</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Button
                    variant={activityRange === "today" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActivityRange("today")}
                    data-testid="button-filter-today"
                  >
                    Today
                  </Button>
                  <Button
                    variant={activityRange === "week" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActivityRange("week")}
                    data-testid="button-filter-week"
                  >
                    This week
                  </Button>
                  <Button
                    variant={activityRange === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActivityRange("all")}
                    data-testid="button-filter-all"
                  >
                    All
                  </Button>
                </div>
                <select
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                  value={activityTraining}
                  onChange={(e) => setActivityTraining(e.target.value)}
                  data-testid="select-filter-formation"
                >
                  <option value="all">Toutes les formations</option>
                  {formationsForFilter.map((f) => (
                    <option key={f.trainingId} value={String(f.trainingId)}>
                      {f.trainingName}
                    </option>
                  ))}
                </select>
                <Link href="/attendance">
                  <Button variant="ghost" size="sm" data-testid="button-view-all-activity">
                    Voir tout
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredActivity.length > 0 ? (
                <div className="divide-y">
                  {filteredActivity.slice(0, 6).map((activity) => {
                    const canUpdate = Boolean(activity.studentId && activity.sessionId);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-muted/30"
                        data-testid={`row-activity-${activity.id}`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                          activity.present
                            ? "bg-green-500/15 text-green-600"
                            : "bg-red-500/15 text-red-500"
                        }`}>
                          {activity.present ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.studentName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {activity.trainingName} - {activity.sessionTitle}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge variant={activity.present ? "secondary" : "outline"} className="text-xs">
                            {activity.present ? "Present" : "Absent"}
                          </Badge>
                          {activity.markedAt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(activity.markedAt).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={!canUpdate || updateAttendanceMutation.isPending}
                              onClick={() => {
                                if (!activity.studentId || !activity.sessionId) return;
                                updateAttendanceMutation.mutate({
                                  studentId: activity.studentId,
                                  sessionId: activity.sessionId,
                                  present: true,
                                });
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                              Marquer present
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canUpdate || updateAttendanceMutation.isPending}
                              onClick={() => {
                                if (!activity.studentId || !activity.sessionId) return;
                                updateAttendanceMutation.mutate({
                                  studentId: activity.studentId,
                                  sessionId: activity.sessionId,
                                  present: false,
                                });
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Marquer absent
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/attendance">
                                <span className="flex items-center">
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Modifier
                                </span>
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-slate-500">Aucune activite recente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-indigo-50/70 to-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-indigo-100 transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Presences
                </span>
                <span className="font-semibold text-slate-900">{stats?.todayAttendance ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <XCircle className="h-4 w-4 text-rose-500" />
                  Absences
                </span>
                <span className="font-semibold text-slate-900">{stats?.todayAbsences ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                  Assiduite
                </span>
                <span className="font-semibold text-slate-900">{stats?.attendanceRate ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <User className="h-4 w-4 text-slate-500" />
                  Total eleves
                </span>
                <span className="font-semibold text-slate-900">{stats?.totalStudents ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <GraduationCap className="h-4 w-4 text-amber-500" />
                  Formations
                </span>
                <span className="font-semibold text-slate-900">{stats?.activeTrainings ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div>
              <CardTitle className="text-base font-semibold text-slate-900">Vos formations</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Apercu et progression</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {totalFormations > 0
                  ? `${activeFormation + 1} / ${totalFormations} formations`
                  : "0 formation"}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : formationsToShow.length > 0 ? (
                <>
                  <div
                    className="relative flex items-center justify-center py-4"
                    style={{ minHeight: "210px" }}
                    data-testid="formation-carousel"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {formationsToShow.map((tp, idx) => {
                      const gradients = [
                        "linear-gradient(135deg, hsl(248, 55%, 55%) 0%, hsl(248, 45%, 40%) 100%)",
                        "linear-gradient(135deg, hsl(18, 90%, 58%) 0%, hsl(18, 80%, 45%) 100%)",
                        "linear-gradient(135deg, hsl(174, 55%, 45%) 0%, hsl(174, 50%, 33%) 100%)",
                        "linear-gradient(135deg, hsl(210, 65%, 50%) 0%, hsl(210, 55%, 38%) 100%)",
                      ];
                      const isActive = idx === activeFormation;
                      const offset = (idx - activeFormation) * 28;
                      const scale = isActive ? 1 : 0.92 - Math.abs(idx - activeFormation) * 0.03;
                      const zIndex = isActive ? 30 : 20 - Math.abs(idx - activeFormation);
                      const opacity = isActive ? 1 : 0.7 - Math.abs(idx - activeFormation) * 0.15;

                      return (
                        <div
                          key={tp.trainingId}
                          className="absolute cursor-pointer transition-transform duration-300"
                          style={{
                            zIndex,
                            transform: `translateX(${offset}px) scale(${scale})`,
                            opacity,
                            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                            width: "260px",
                          }}
                          onClick={() => setActiveFormation(idx)}
                          data-testid={`formation-card-${tp.trainingId}`}
                        >
                          <div
                            className="rounded-xl p-5 text-white shadow-lg"
                            style={{
                              background: gradients[idx % gradients.length],
                              minHeight: "170px",
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-6">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                                  <BookOpen className="h-4 w-4 text-white" />
                                </div>
                                <div className="w-5 h-5 rounded-full bg-white/30" />
                              </div>
                              <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                                {tp.avgProgress}%
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-[10px] tracking-widest uppercase text-white/60">Formation</p>
                              <p className="text-sm font-bold truncate">{tp.trainingName}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <span className="text-xs text-white/70">{tp.enrolledCount} inscrits</span>
                              <span className="text-xs font-semibold text-white/90">{tp.completedCount} termines</span>
                            </div>
                            <div className="mt-2 text-xs text-white/80">
                              Prochaine session: {tp.nextSessionDate ? new Date(tp.nextSessionDate).toLocaleDateString("fr-FR") : "Non planifiee"}
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-white/80 transition-all duration-500"
                                style={{ width: `${tp.avgProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    {formationsToShow.map((_, idx) => (
                      <button
                        key={idx}
                        className={`rounded-full transition-all duration-300 ${
                          idx === activeFormation
                            ? "w-5 h-1.5 bg-primary"
                            : "w-1.5 h-1.5 bg-muted-foreground/30"
                        }`}
                        onClick={() => setActiveFormation(idx)}
                        data-testid={`dot-formation-${idx}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-slate-500">Aucune formation</p>
                </div>
              )}
              <Link href="/trainings">
                <Button variant="outline" size="sm" className="w-full">
                  Voir toutes les formations
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">Assistant</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Pose des questions sur les eleves, formations ou presences.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleChatSubmit} className="flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Demandez au bot..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="pl-8"
                    data-testid="input-dashboard-chat"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={speechLang}
                    onChange={(e) => {
                      const nextLang = e.target.value as "ar-TN" | "fr-FR" | "en-US";
                      setSpeechLang(nextLang);
                      if (recognitionRef.current) {
                        recognitionRef.current.lang = nextLang;
                      }
                    }}
                    data-testid="select-chat-language"
                  >
                    <option value="fr-FR">FR</option>
                    <option value="en-US">EN</option>
                    <option value="ar-TN">TN</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleMic}
                    disabled={!speechSupported}
                    data-testid="button-mic-chat"
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 mr-1.5" />
                    ) : (
                      <Mic className="h-4 w-4 mr-1.5" />
                    )}
                    {isListening ? "Stop" : "Micro"}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={chatLoading || chatInput.trim().length === 0}
                    data-testid="button-send-chat"
                  >
                    <SendHorizontal className="h-4 w-4 mr-1.5" />
                    Envoyer
                  </Button>
                </div>
              </form>
              <div className="max-h-56 overflow-auto rounded-md border p-3 space-y-2 bg-muted/30">
                {chatMessages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Demarre une conversation avec l'assistant.
                  </div>
                ) : (
                  chatMessages.map((m, idx) => (
                    <div
                      key={`${m.role}-${idx}`}
                      className={`rounded-md px-3 py-2 text-sm w-fit max-w-[85%] ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-background text-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="text-xs text-muted-foreground">Generation en cours...</div>
                )}
                {chatError && (
                  <div className="text-xs text-red-500">{chatError}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
