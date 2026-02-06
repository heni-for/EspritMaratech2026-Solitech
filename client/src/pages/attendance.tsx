import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ClipboardCheck, Users, BookOpen, CheckCircle2, XCircle, Save } from "lucide-react";
import type { Training, Level, Session, Student } from "@shared/schema";

interface TrainingOption {
  id: number;
  name: string;
  levels: Array<{
    id: number;
    levelNumber: number;
    name: string;
    sessions: Array<{
      id: number;
      sessionNumber: number;
      title: string;
    }>;
  }>;
}

interface AttendanceRecord {
  studentId: number;
  studentName: string;
  present: boolean;
}

export default function AttendancePage() {
  const [selectedTraining, setSelectedTraining] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [attendanceState, setAttendanceState] = useState<Map<number, boolean>>(new Map());
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
    mutationFn: async (records: Array<{ studentId: number; sessionId: number; present: boolean }>) => {
      const res = await apiRequest("POST", "/api/attendance/bulk", { records });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", selectedSession] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Attendance saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save attendance", description: error.message, variant: "destructive" });
    },
  });

  const handleToggle = (studentId: number, present: boolean) => {
    setAttendanceState((prev) => {
      const next = new Map(prev);
      next.set(studentId, present);
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedSession) return;
    const records = Array.from(attendanceState.entries()).map(([studentId, present]) => ({
      studentId,
      sessionId: parseInt(selectedSession),
      present,
    }));
    if (records.length > 0) {
      saveMutation.mutate(records);
    }
  };

  const getPresenceStatus = (studentId: number, originalPresent: boolean) => {
    return attendanceState.has(studentId) ? attendanceState.get(studentId)! : originalPresent;
  };

  const handleTrainingChange = (value: string) => {
    setSelectedTraining(value);
    setSelectedLevel("");
    setSelectedSession("");
    setAttendanceState(new Map());
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    setSelectedSession("");
    setAttendanceState(new Map());
  };

  const handleSessionChange = (value: string) => {
    setSelectedSession(value);
    setAttendanceState(new Map());
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-attendance-title">Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mark student attendance for each session
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Training</label>
              <Select value={selectedTraining} onValueChange={handleTrainingChange}>
                <SelectTrigger data-testid="select-training">
                  <SelectValue placeholder="Select training" />
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
              <label className="text-sm font-medium text-muted-foreground">Level</label>
              <Select
                value={selectedLevel}
                onValueChange={handleLevelChange}
                disabled={!currentTraining}
              >
                <SelectTrigger data-testid="select-level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {currentTraining?.levels.map((l) => (
                    <SelectItem key={l.id} value={l.id.toString()}>
                      Level {l.levelNumber} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Session</label>
              <Select
                value={selectedSession}
                onValueChange={handleSessionChange}
                disabled={!currentLevel}
              >
                <SelectTrigger data-testid="select-session">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {currentLevel?.sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      Session {s.sessionNumber} - {s.title}
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
              Attendance Sheet
              {currentSession && (
                <Badge variant="secondary" className="text-xs ml-1">
                  Session {currentSession.sessionNumber}
                </Badge>
              )}
            </CardTitle>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || attendanceState.size === 0}
              data-testid="button-save-attendance"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save"}
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
                <p className="font-medium">No students enrolled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Enroll students in this training first
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-[100px] text-center">Present</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((record) => {
                    const isPresent = getPresenceStatus(record.studentId, record.present);
                    return (
                      <TableRow key={record.studentId} data-testid={`row-attendance-${record.studentId}`}>
                        <TableCell>
                          {isPresent ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
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
                            data-testid={`checkbox-attendance-${record.studentId}`}
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
            <p className="font-medium">Select a session to mark attendance</p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a training, level, and session above
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
