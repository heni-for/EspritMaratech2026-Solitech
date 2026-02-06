import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Users, ClipboardCheck, TrendingUp } from "lucide-react";

interface TrainerDashboardData {
  assignedTrainings: Array<{
    training: { id: number; name: string; description: string | null; status: string };
    enrolledCount: number;
    levelsCount: number;
    avgAttendance: number;
  }>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-9 text-right">{value}%</span>
    </div>
  );
}

export default function TrainerDashboard() {
  const { data, isLoading } = useQuery<TrainerDashboardData>({
    queryKey: ["/api/trainer/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const trainings = data?.assignedTrainings || [];
  const totalStudents = trainings.reduce((acc, t) => acc + t.enrolledCount, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-trainer-dashboard-title">
          Tableau de bord encadrant
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vos formations assignees et la progression des eleves
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Formations assignees</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-assigned-trainings">{trainings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total eleves</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-students">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presence moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avg-attendance">
              {trainings.length > 0
                ? Math.round(trainings.reduce((acc, t) => acc + t.avgAttendance, 0) / trainings.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Vos formations</h2>
        {trainings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Aucune formation assignee</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainings.map((t) => (
              <Card key={t.training.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">{t.training.name}</CardTitle>
                    <Badge variant={t.training.status === "active" ? "default" : "secondary"}>
                      {t.training.status === "active" ? "Actif" : t.training.status}
                    </Badge>
                  </div>
                  {t.training.description && (
                    <p className="text-xs text-muted-foreground mt-1">{t.training.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Eleves inscrits</span>
                    <span className="font-medium">{t.enrolledCount}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Taux de presence</span>
                    </div>
                    <ProgressBar value={t.avgAttendance} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/trainings/${t.training.id}`} data-testid={`link-training-${t.training.id}`}>
                        Voir details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/attendance" data-testid={`link-attendance-${t.training.id}`}>
                        <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                        Marquer presences
                      </Link>
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
