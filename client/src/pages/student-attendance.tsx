import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusIndicator } from "@/components/accessibility/status-indicator";
import { ClipboardCheck } from "lucide-react";

interface AttendanceRow {
  trainingName: string;
  levelName: string;
  sessionTitle: string;
  date: string;
  status: "present" | "absent" | "not_marked";
  comment?: string | null;
}

export default function StudentAttendance() {
  const { data, isLoading } = useQuery<AttendanceRow[]>({
    queryKey: ["/api/my/attendance"],
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    staleTime: 0,
  });

  const rows = data || [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historique des presences</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Liste des seances avec statut et commentaire.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Aucun historique de presence</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Formation</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Niveau</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Seance</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="p-3">{row.trainingName}</td>
                      <td className="p-3">{row.levelName}</td>
                      <td className="p-3">{row.sessionTitle}</td>
                      <td className="p-3">{row.date || "-"}</td>
                      <td className="p-3 text-center">
                        <StatusIndicator status={row.status} />
                      </td>
                      <td className="p-3">{row.comment || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
