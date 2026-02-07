import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, Layers, BadgeCheck } from "lucide-react";

interface StudentDashboardData {
  student: { id: string; firstName: string; lastName: string; email: string | null };
  formations: Array<{
    training: { id: string; name: string };
    currentLevel: number;
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

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord etudiant</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bienvenue, {data.student.firstName} {data.student.lastName}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Formations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Niveau actuel</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Niveau {currentLevel}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progression globale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProgress}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Seances effectuees</CardTitle>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendedSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Seances restantes</CardTitle>
            <Badge variant="outline">A venir</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remainingSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Seances manquees</CardTitle>
            <Badge variant="secondary">Absences</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentSessions}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
        <h2 className="text-lg font-semibold mb-3">Apercu des formations</h2>
        {formations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Aucune formation</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formations.slice(0, 4).map((f) => (
              <Card key={f.training.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">{f.training.name}</CardTitle>
                    <Badge variant={f.eligible ? "default" : "outline"}>
                      {f.eligible ? "Eligible" : "Non eligible"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Niveau actuel</span>
                    <span className="font-medium">Niveau {f.currentLevel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{f.progress}%</span>
                  </div>
                  <div className="flex items-center justify-end pt-1">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/my/trainings/${f.training.id}`}>Voir les details</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
