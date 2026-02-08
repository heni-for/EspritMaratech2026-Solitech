import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Mail, Phone, Calendar, User, BookOpen, CheckCircle2, XCircle } from "lucide-react";
interface StudentDetail {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
  };
  enrollments: Array<{
    enrollment: { id: string };
    training: { id: string; name: string };
    totalSessions: number;
    attendedSessions: number;
    levelsCompleted: number;
    totalLevels: number;
    eligible: boolean;
    formationStatus: "in_progress" | "completed" | "failed";
    late: boolean;
    levelStatuses: Array<{
      levelId: string;
      levelNumber: number;
      name: string;
      status: "in_progress" | "passed" | "failed";
    }>;
  }>;
  attendanceHistory: Array<{
    sessionTitle: string;
    trainingName: string;
    levelName: string;
    date: string;
    present: boolean;
    note?: number | null;
    comment?: string | null;
  }>;
  certificates: Array<{
    id: string;
    trainingId: string;
    trainingName?: string | null;
    issuedAt?: string | null;
    certificateNumber?: string | null;
  }>;
}

export default function StudentDetailPage() {
  const [, params] = useRoute("/students/:id");
  const studentId = params?.id;

  const { data, isLoading } = useQuery<StudentDetail>({
    queryKey: ["/api/students", studentId],
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <User className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="font-medium">Student not found</p>
        <Link href="/students">
          <Button variant="outline" className="mt-4" data-testid="button-back-students">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Students
          </Button>
        </Link>
      </div>
    );
  }

  const { student, enrollments, attendanceHistory } = data;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
          <Link href="/students">
            <Button
              size="icon"
              variant="ghost"
              data-icon-label="Retour a la liste des eleves"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-student-name">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">Student Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-lg font-bold mx-auto mb-4">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            {student.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{student.email}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{student.phone}</span>
              </div>
            )}
            {student.dateOfBirth && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{student.dateOfBirth}</span>
              </div>
            )}
            {student.guardianName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{student.guardianName} {student.guardianPhone ? `(${student.guardianPhone})` : ""}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Enrolled Trainings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Not enrolled in any training</p>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((e) => {
                  const progressPct = e.totalSessions > 0
                    ? Math.round((e.attendedSessions / e.totalSessions) * 100)
                    : 0;
                  return (
                    <div key={e.enrollment.id} className="p-3 rounded-md border space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-sm">{e.training.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Level {e.levelsCompleted}/{e.totalLevels}
                          </Badge>
                          {e.formationStatus === "failed" ? (
                            <Badge variant="destructive" className="text-xs">
                              Echoue
                            </Badge>
                          ) : e.eligible ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Eligible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              In Progress
                            </Badge>
                          )}
                          {e.late && (
                            <Badge variant="secondary" className="text-xs">
                              En retard
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Progress value={progressPct} className="h-2" />
                        </div>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          {e.attendedSessions}/{e.totalSessions} sessions
                        </span>
                      </div>
                      {e.levelStatuses.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {e.levelStatuses.map((lvl) => (
                            <Badge
                              key={lvl.levelId}
                              variant={lvl.status === "passed" ? "default" : lvl.status === "failed" ? "destructive" : "outline"}
                              className="text-xs"
                            >
                              Niveau {lvl.levelNumber}: {lvl.status === "passed" ? "Valide" : lvl.status === "failed" ? "Echoue" : "En cours"}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendanceHistory.map((record, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {record.present ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{record.sessionTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.trainingName} - {record.levelName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={record.present ? "secondary" : "destructive"} className="text-xs">
                      {record.present ? "Present" : "Absent"}
                    </Badge>
                    {record.date && (
                      <span className="text-xs text-muted-foreground">{record.date}</span>
                    )}
                    {record.note !== null && record.note !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        Note: {record.note}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          {data.certificates?.length ? (
            <div className="space-y-2">
              {data.certificates.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 border-b last:border-b-0 py-2">
                  <span className="text-sm font-medium">Formation: {c.trainingName || c.trainingId}</span>
                  <div className="flex items-center gap-2">
                    {c.certificateNumber && (
                      <Badge variant="secondary" className="text-xs">{c.certificateNumber}</Badge>
                    )}
                    {c.issuedAt && <span className="text-xs text-muted-foreground">{c.issuedAt}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No certificates yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
