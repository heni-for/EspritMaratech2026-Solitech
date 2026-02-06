import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Mail, Phone, Calendar, User, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import type { Student, Enrollment, Training, Attendance } from "@shared/schema";

interface StudentDetail {
  student: Student;
  enrollments: Array<{
    enrollment: Enrollment;
    training: Training;
    totalSessions: number;
    attendedSessions: number;
    levelsCompleted: number;
    totalLevels: number;
    eligible: boolean;
  }>;
  attendanceHistory: Array<{
    sessionTitle: string;
    trainingName: string;
    levelName: string;
    date: string;
    present: boolean;
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
          <Button size="icon" variant="ghost" data-testid="button-back">
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
                          {e.eligible ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Eligible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              In Progress
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
