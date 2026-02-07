import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { Link } from "wouter";

interface TrainingRow {
  training: { id: string; name: string };
  enrollment: {
    enrollmentDate?: string;
    status?: "active" | "completed" | "dropped";
    currentLevel?: number;
  };
  progress: {
    progress: number;
    totalSessions: number;
    attendedSessions: number;
    levelsCompleted: number;
    totalLevels: number;
    eligible: boolean;
    absentCount: number;
  };
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-9 text-right">{value}%</span>
    </div>
  );
}

const statusLabel = (status?: string) => {
  if (status === "completed") return "COMPLETED";
  if (status === "dropped") return "DROPPED";
  return "ACTIVE";
};

export default function StudentTrainings() {
  const { data, isLoading } = useQuery<TrainingRow[]>({
    queryKey: ["/api/my/trainings"],
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    staleTime: 0,
  });

  const trainings = data || [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes formations</h1>
            <p className="text-slate-600 text-sm mt-1">
              Suivi de vos formations et progression.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Bibliothèque</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Progression</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : trainings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Aucune formation inscrite</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainings.map((row) => (
            <div
              key={row.training.id}
              className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.15)]"
            >
              <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                <div className="absolute right-6 bottom-6 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />
              </div>
              <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[6px] -translate-x-1/2 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 shadow-[inset_0_0_8px_rgba(15,23,42,0.12)]" />
              <div className="pointer-events-none absolute right-4 top-10 h-2 w-16 rounded-full bg-emerald-200/70" />
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] relative">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{row.training.name}</h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {row.enrollment.status === "completed"
                          ? "Formation terminée avec succès."
                          : row.enrollment.status === "dropped"
                          ? "Formation arrêtée par l'étudiant."
                          : "Formation en cours et suivie régulièrement."}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]">
                      <BookOpen className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge
                      variant={row.enrollment.status === "completed" ? "default" : row.enrollment.status === "dropped" ? "destructive" : "secondary"}
                    >
                      {statusLabel(row.enrollment.status)}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Label: Formation</span>
                    <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 border border-sky-200">Label: Suivi</span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Label: Niveau</span>
                  </div>
                </div>

                <div className="hidden md:block w-[2px] bg-gradient-to-b from-transparent via-slate-300 to-transparent" />

                <div className="p-6 border-t md:border-t-0 md:border-l-0 bg-gradient-to-br from-white via-slate-50 to-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Date d'inscription</span>
                    <span className="font-medium">{row.enrollment.enrollmentDate || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-500">Niveau</span>
                    <span className="font-medium">Niveau {row.enrollment.currentLevel ?? 1}</span>
                  </div>
                  <div className="space-y-1 mt-3">
                    <span className="text-sm text-slate-500">Progression</span>
                    <ProgressBar value={row.progress.progress || 0} />
                  </div>
                  <div className="flex items-center justify-end pt-3">
                    <Link href={`/my/trainings/${row.training.id}`}>
                      <Button size="sm" variant="outline" className="bg-white/70 border-slate-200">
                        Voir les details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
