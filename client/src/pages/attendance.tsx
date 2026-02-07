import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardCheck, Users, Save } from "lucide-react";
import { StatusIndicator } from "@/components/accessibility/status-indicator";
interface TrainingOption {
  id: string;
  name: string;
  levels: Array<{
    id: string;
    levelNumber: number;
    name: string;
    sessions: Array<{
      id: string;
      sessionNumber: number;
      title: string;
    }>;
  }>;
}

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  present: boolean;
  note?: number | null;
  comment?: string | null;
}

export default function AttendancePage() {
  const [selectedTraining, setSelectedTraining] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [attendanceState, setAttendanceState] = useState<Map<string, boolean>>(new Map());
  const [notesState, setNotesState] = useState<Map<string, string>>(new Map());
  const [commentsState, setCommentsState] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  const { data: trainingOptions = [], isLoading: loadingTrainings } = useQuery<TrainingOption[]>({
    queryKey: ["/api/attendance/options"],
  });

  const currentTraining = trainingOptions.find((t) => t.id.toString() === selectedTraining);
  const currentLevel = currentTraining?.levels.find((l) => l.id.toString() === selectedLevel);
  const currentSession = currentLevel?.sessions.find((s) => s.id.toString() === selectedSession);

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance", selectedSession],
    enabled: !!selectedSession,
  });

  const saveMutation = useMutation({
    mutationFn: async (records: Array<{ studentId: string; sessionId: string; present: boolean; note?: number | null; comment?: string | null }>) => {
      const res = await apiRequest("POST", "/api/attendance/bulk", { records });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", selectedSession] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Seance validee avec succes" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur lors de l'enregistrement", description: error.message, variant: "destructive" });
    },
  });

  const handleToggle = (studentId: string, present: boolean) => {
    setAttendanceState((prev) => {
      const next = new Map(prev);
      next.set(studentId, present);
      return next;
    });
  };

  const handleNoteChange = (studentId: string, value: string) => {
    setNotesState((prev) => {
      const next = new Map(prev);
      next.set(studentId, value);
      return next;
    });
  };

  const handleCommentChange = (studentId: string, value: string) => {
    setCommentsState((prev) => {
      const next = new Map(prev);
      next.set(studentId, value);
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedSession) return;
    const source = attendanceData || [];
    const ids = new Set<string>([
      ...source.map((r) => r.studentId),
      ...Array.from(attendanceState.keys()),
      ...Array.from(notesState.keys()),
      ...Array.from(commentsState.keys()),
    ]);

    const records = Array.from(ids.values()).map((studentId) => {
      const original = source.find((r) => r.studentId === studentId);
      const present = attendanceState.has(studentId)
        ? attendanceState.get(studentId)!
        : original?.present ?? false;

      const noteRaw = notesState.get(studentId);
      const noteVal = noteRaw !== undefined && noteRaw !== "" ? Number(noteRaw) : original?.note ?? null;
      return {
        studentId,
        sessionId: selectedSession,
        present,
        note: Number.isNaN(noteVal as number) ? null : noteVal,
        comment: commentsState.has(studentId) ? commentsState.get(studentId)! : original?.comment ?? null,
      };
    });
    if (records.length > 0) {
      saveMutation.mutate(records);
    }
  };

  const getPresenceStatus = (studentId: string, originalPresent: boolean) => {
    return attendanceState.has(studentId) ? attendanceState.get(studentId)! : originalPresent;
  };

  const getNoteValue = (studentId: string, originalNote?: number | null) => {
    if (notesState.has(studentId)) return notesState.get(studentId)!;
    return originalNote !== null && originalNote !== undefined ? String(originalNote) : "";
  };

  const getCommentValue = (studentId: string, originalComment?: string | null) => {
    if (commentsState.has(studentId)) return commentsState.get(studentId)!;
    return originalComment ?? "";
  };

  const handleTrainingChange = (value: string) => {
    setSelectedTraining(value);
    setSelectedLevel("");
    setSelectedSession("");
    setAttendanceState(new Map());
    setNotesState(new Map());
    setCommentsState(new Map());
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    setSelectedSession("");
    setAttendanceState(new Map());
    setNotesState(new Map());
    setCommentsState(new Map());
  };

  const handleSessionChange = (value: string) => {
    setSelectedSession(value);
    setAttendanceState(new Map());
    setNotesState(new Map());
    setCommentsState(new Map());
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-attendance-title">Presences</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Marquer la presence des eleves pour chaque seance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selectionner une seance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground" htmlFor="attendance-training">
                Formation
              </Label>
              <Select value={selectedTraining} onValueChange={handleTrainingChange}>
                <SelectTrigger id="attendance-training" data-testid="select-training">
                  <SelectValue placeholder="Choisir une formation" />
                </SelectTrigger>
                <SelectContent>
                  {trainingOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground" htmlFor="attendance-level">
                Niveau
              </Label>
              <Select
                value={selectedLevel}
                onValueChange={handleLevelChange}
                disabled={!currentTraining}
              >
                <SelectTrigger id="attendance-level" data-testid="select-level">
                  <SelectValue placeholder="Choisir un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {currentTraining?.levels.map((l) => (
                    <SelectItem key={l.id} value={l.id.toString()}>
                      Niveau {l.levelNumber} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground" htmlFor="attendance-session">
                Seance
              </Label>
              <Select
                value={selectedSession}
                onValueChange={handleSessionChange}
                disabled={!currentLevel}
              >
                <SelectTrigger id="attendance-session" data-testid="select-session">
                  <SelectValue placeholder="Choisir une seance" />
                </SelectTrigger>
                <SelectContent>
                  {currentLevel?.sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      Seance {s.sessionNumber} - {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSession && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Feuille de presence
              {currentSession && (
                <Badge variant="secondary" className="text-xs ml-1">
                  Seance {currentSession.sessionNumber}
                </Badge>
              )}
            </CardTitle>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !attendanceData || attendanceData.length === 0}
              data-testid="button-save-attendance"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Validation..." : "Valider la seance"}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAttendance ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !attendanceData || attendanceData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Aucun eleve inscrit</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Inscrivez des eleves a cette formation d'abord
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Statut</TableHead>
                    <TableHead>Eleve</TableHead>
                    <TableHead className="w-[90px] text-center">Present</TableHead>
                    <TableHead className="w-[110px] text-center">Note</TableHead>
                    <TableHead>Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((record) => {
                    const isPresent = getPresenceStatus(record.studentId, record.present);
                    return (
                      <TableRow key={record.studentId} data-testid={`row-attendance-${record.studentId}`}>
                        <TableCell>
                          <StatusIndicator status={isPresent ? "present" : "absent"} />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{record.studentName}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isPresent}
                            onCheckedChange={(checked) =>
                              handleToggle(record.studentId, checked === true)
                            }
                            aria-label={`Presence pour ${record.studentName}`}
                            data-testid={`checkbox-attendance-${record.studentId}`}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            className="h-8 w-20 text-center"
                            value={getNoteValue(record.studentId, record.note)}
                            onChange={(e) => handleNoteChange(record.studentId, e.target.value)}
                            placeholder="0-20"
                            aria-label={`Note pour ${record.studentName}`}
                            data-testid={`input-note-${record.studentId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={getCommentValue(record.studentId, record.comment)}
                            onChange={(e) => handleCommentChange(record.studentId, e.target.value)}
                            placeholder="Observation..."
                            aria-label={`Commentaire pour ${record.studentName}`}
                            data-testid={`input-comment-${record.studentId}`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedSession && !loadingTrainings && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Selectionnez une seance pour marquer les presences</p>
            <p className="text-sm text-muted-foreground mt-1">
              Choisissez une formation, un niveau et une seance ci-dessus
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
