import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusIndicator } from "@/components/accessibility/status-indicator";
import { ArrowLeft } from "lucide-react";

interface TrainingDetailResponse {
  training: { id: string; name: string };
  enrollment: { enrollmentDate?: string; status?: string; currentLevel?: number };
  progress: {
    totalSessions: number;
    attendedSessions: number;
    levelsCompleted: number;
    totalLevels: number;
    eligible: boolean;
    absentCount: number;
  };
  levels: Array<{
    id: string;
    levelNumber: number;
    name: string;
    validated: boolean;
    sessions: Array<{
      id: string;
      sessionNumber: number;
      title: string;
      status: "present" | "absent" | "not_marked";
    }>;
  }>;
}

export default function StudentTrainingDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery<TrainingDetailResponse>({
    queryKey: ["/api/my/trainings", id],
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    staleTime: 0,
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/my/trainings">
          <Button size="icon" variant="ghost" data-icon-label="Retour aux formations">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{data.training.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Niveau actuel : Niveau {data.enrollment.currentLevel ?? 1}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carte de progression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.levels.map((level) => (
              <Card key={level.id} className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-sm font-semibold">
                      Niveau {level.levelNumber} - {level.name}
                    </CardTitle>
                    <Badge variant={level.validated ? "default" : "outline"}>
                      {level.validated ? "Valide" : "Non valide"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {level.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between gap-2 rounded-md border p-2"
                      >
                        <span className="text-xs text-muted-foreground">S{session.sessionNumber}</span>
                        <StatusIndicator status={session.status} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
