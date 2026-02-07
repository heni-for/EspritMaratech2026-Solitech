import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  TrendingUp,
  Layers,
  BadgeCheck,
  Search,
  Calendar as CalendarIcon,
  Bell,
  Settings,
  PlayCircle,
  ArrowRight,
  Star,
  GraduationCap,
} from "lucide-react";

interface StudentDashboardData {
  student: { id: string; firstName: string; lastName: string; email: string | null };
  formations: Array<{
    training: { id: string; name: string };
    currentLevel: number;
    enrollmentStatus?: "active" | "completed" | "dropped";
    totalSessions: number;
    attendedSessions: number;
    levelsCompleted: number;
    totalLevels: number;
    progress: number;
    eligible: boolean;
    formationStatus: "in_progress" | "completed" | "failed";
    absentCount: number;
  }>;
  attendanceHistory: Array<{
    status: "present" | "absent" | "not_marked";
  }>;
  certificates: Array<{
    id: string;
    certificateNumber: string;
    issuedAt: string;
    trainingName: string;
  }>;
}

export default function StudentDashboard() {
  const { data, isLoading } = useQuery<StudentDashboardData>({
    queryKey: ["/api/my/dashboard"],
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    staleTime: 0,
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const formations = data.formations || [];
  const totalProgress = formations.length > 0
    ? Math.round(formations.reduce((acc, f) => acc + f.progress, 0) / formations.length)
    : 0;
  const currentLevel = formations.length > 0
    ? Math.max(...formations.map((f) => f.currentLevel || 1))
    : 1;

  const totalSessions = formations.reduce((acc, f) => acc + f.totalSessions, 0);
  const attendedSessions = formations.reduce((acc, f) => acc + f.attendedSessions, 0);
  const absentSessions = formations.reduce((acc, f) => acc + (f.absentCount || 0), 0);
  const remainingSessions = Math.max(0, totalSessions - attendedSessions - absentSessions);

  const certStatus = (() => {
    if (formations.some((f) => f.eligible)) return "Eligible";
    const nearly = formations.some((f) => {
      const missingLevels = Math.max(0, f.totalLevels - f.levelsCompleted);
      const missingSessions = Math.max(0, f.totalSessions - f.attendedSessions);
      return missingLevels <= 1 && missingSessions <= 2;
    });
    return nearly ? "Presque eligible" : "Non eligible";
  })();

  const currentCourses = formations.slice(0, 4).map((f) => ({
    id: f.training.id,
    title: f.training.name,
    level: `Niveau ${f.currentLevel}`,
    progress: f.progress,
    status: f.enrollmentStatus || "active",
  }));

  const recentCards = formations.slice(0, 4).map((f, idx) => ({
    id: f.training.id,
    title: f.training.name,
    label: `Niveau ${f.currentLevel}`,
    duration: `${Math.max(1, f.totalSessions)} seances`,
    progress: f.progress,
    color: idx % 2 === 0 ? "from-sky-500 to-cyan-400" : "from-violet-500 to-fuchsia-400",
  }));

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord etudiant</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bienvenue, {data.student.firstName} {data.student.lastName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost">
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <Bell className="h-4 w-4" />
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
            <BookOpen className="h-4 w-4 mr-1.5" />
            Explorer des cours
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.2fr] gap-4">
        <Card className="border bg-gradient-to-br from-white via-slate-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Mon niveau / Cours actuel</CardTitle>
            <Button size="sm" variant="ghost">
              Voir tout <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentCourses.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun cours actif.</div>
            ) : (
              currentCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between gap-4 rounded-xl border bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                      {course.level.replace("Niveau ", "")}
                    </div>
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.level}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      course.status === "completed"
                        ? "default"
                        : course.status === "dropped"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {course.status === "completed"
                      ? "Terminé"
                      : course.status === "dropped"
                      ? "Abandonné"
                      : "En cours"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Calendrier</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              Cette semaine
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border p-6 bg-slate-50">
              <div className="grid grid-cols-7 text-center text-xs text-slate-500 font-medium">
                {["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-7 gap-3 text-center text-sm">
                {[28, 29, 30, 1, 2, 3, 4].map((day) => (
                  <div key={day} className={`rounded-full py-2 ${day === 2 ? "bg-blue-600 text-white" : "text-slate-700"}`}>
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                Debut d'un cours le 02
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Rechercher une formation..."
                  className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Formations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formations.length}</div>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Niveau actuel</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Niveau {currentLevel}</div>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progression globale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProgress}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Seances effectuees</CardTitle>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendedSessions}</div>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Seances restantes</CardTitle>
            <Badge variant="outline">A venir</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remainingSessions}</div>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Seances manquees</CardTitle>
            <Badge variant="secondary">Absences</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentSessions}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border bg-white">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Statut de la certification</CardTitle>
          <Badge variant={certStatus === "Eligible" ? "default" : certStatus === "Presque eligible" ? "secondary" : "outline"}>
            {certStatus}
          </Badge>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {certStatus === "Eligible"
            ? "Vous etes eligible au certificat."
            : certStatus === "Presque eligible"
            ? "Il reste quelques seances pour etre eligible."
            : "Vous n'etes pas encore eligible."}
          <div className="pt-3">
            <Button size="sm" variant="outline" asChild>
              <a href="/my/certificates">Voir le certificat</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">Le dernier visionne</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            Recommandations
          </div>
        </div>
        {formations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Aucune formation</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {recentCards.map((card) => (
              <div
                key={card.id}
                className={`rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br ${card.color}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide text-white/80">Module</div>
                  <PlayCircle className="h-5 w-5 text-white/90" />
                </div>
                <div className="mt-2 text-lg font-semibold">{card.title}</div>
                <div className="mt-1 text-xs text-white/80">{card.label}</div>
                <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {card.duration}
                </div>
                <div className="mt-4">
                  <div className="h-1.5 w-full rounded-full bg-white/30">
                    <div className="h-full rounded-full bg-white" style={{ width: `${card.progress}%` }} />
                  </div>
                  <div className="mt-1 text-xs">{card.progress}% complete</div>
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="secondary" className="bg-white/90 text-slate-900 hover:bg-white">
                    Continuer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
