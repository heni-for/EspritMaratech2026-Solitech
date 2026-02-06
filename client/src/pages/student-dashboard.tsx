import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Award, ClipboardCheck, TrendingUp, Check, X, Minus } from "lucide-react";

interface StudentDashboardData {
  student: { id: number; firstName: string; lastName: string; email: string | null };
  formations: Array<{
    training: { id: number; name: string };
    currentLevel: number;
    totalSessions: number;
    attendedSessions: number;
    levelsCompleted: number;
    totalLevels: number;
    progress: number;
    eligible: boolean;
    status: string;
    certificateNumber?: string;
  }>;
  attendanceHistory: Array<{
    sessionTitle: string;
    trainingName: string;
    levelName: string;
    date: string;
    present: boolean;
  }>;
  certificates: Array<{
    id: number;
    certificateNumber: string;
    issuedAt: string;
    trainingName: string;
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

export default function StudentDashboard() {
  const { data, isLoading } = useQuery<StudentDashboardData>({
    queryKey: ["/api/my/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const formations = data?.formations || [];
  const certificates = data?.certificates || [];
  const attendanceHistory = data?.attendanceHistory || [];
  const totalProgress = formations.length > 0
    ? Math.round(formations.reduce((acc, f) => acc + f.progress, 0) / formations.length)
    : 0;

  const getStatusLabel = (status: string) => {
    if (status === "Certified") return "Certifie";
    if (status === "Eligible for Certification") return "Eligible au certificat";
    if (status === "In Progress") return "En cours";
    return status;
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-student-dashboard-title">
          Mon tableau de bord
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bienvenue, {data?.student.firstName} {data?.student.lastName}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Formations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-my-formations">{formations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progression globale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-my-progress">{totalProgress}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certificats</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-my-certificates">{certificates.length}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Mes formations</h2>
        {formations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Aucune formation</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formations.map((f) => (
              <Card key={f.training.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">{f.training.name}</CardTitle>
                    <Badge
                      variant={f.status === "Certified" ? "default" : f.status === "Eligible for Certification" ? "secondary" : "outline"}
                    >
                      {getStatusLabel(f.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Niveaux completes</span>
                    <span className="font-medium">{f.levelsCompleted} / {f.totalLevels}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Seances suivies</span>
                    <span className="font-medium">{f.attendedSessions} / {f.totalSessions}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Progression</span>
                    <ProgressBar value={f.progress} />
                  </div>
                  {f.certificateNumber && (
                    <div className="text-xs text-muted-foreground pt-1">
                      Certificat : {f.certificateNumber}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {certificates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Mes certificats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 flex-shrink-0">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{cert.trainingName}</p>
                    <p className="text-xs text-muted-foreground">{cert.certificateNumber}</p>
                    <p className="text-xs text-muted-foreground">Delivre le : {cert.issuedAt}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Historique des presences</h2>
        {attendanceHistory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Aucun enregistrement de presence</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-muted-foreground">Formation</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Niveau</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Seance</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.slice(0, 20).map((record, idx) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="p-3">{record.trainingName}</td>
                        <td className="p-3">{record.levelName}</td>
                        <td className="p-3">{record.sessionTitle}</td>
                        <td className="p-3 text-center">
                          {record.present ? (
                            <Badge variant="default" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Present
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <X className="h-3 w-3 mr-1" />
                              Absent
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
