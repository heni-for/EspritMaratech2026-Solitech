import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, BookOpen, Users, Layers, CheckCircle2 } from "lucide-react";
import type { Training, Level, Session, Student, Enrollment } from "@shared/schema";

interface TrainingDetail {
  training: Training;
  levels: Array<Level & { sessions: Session[] }>;
  enrolledStudents: Array<{
    student: Student;
    enrollment: Enrollment;
    attendedSessions: number;
    totalSessions: number;
    levelsCompleted: number;
    eligible: boolean;
  }>;
}

export default function TrainingDetailPage() {
  const [, params] = useRoute("/trainings/:id");
  const trainingId = params?.id;

  const { data, isLoading } = useQuery<TrainingDetail>({
    queryKey: ["/api/trainings", trainingId],
    enabled: !!trainingId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="font-medium">Formation introuvable</p>
        <Link href="/trainings">
          <Button variant="outline" className="mt-4" data-testid="button-back-trainings">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux formations
          </Button>
        </Link>
      </div>
    );
  }

  const { training, levels, enrolledStudents } = data;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/trainings">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-training-name">
              {training.name}
            </h1>
            <Badge variant={training.status === "active" ? "default" : "secondary"}>
              {training.status}
            </Badge>
          </div>
          {training.description && (
            <p className="text-sm text-muted-foreground mt-1">{training.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{enrolledStudents.length}</p>
              <p className="text-xs text-muted-foreground">Eleves inscrits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{levels.length}</p>
              <p className="text-xs text-muted-foreground">Niveaux</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {enrolledStudents.filter((s) => s.eligible).length}
              </p>
              <p className="text-xs text-muted-foreground">Eligibles au certificat</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students" data-testid="tab-students">Eleves</TabsTrigger>
          <TabsTrigger value="levels" data-testid="tab-levels">Niveaux et seances</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {enrolledStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium">Aucun eleve inscrit</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inscrivez des eleves depuis la liste des formations
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Eleve</TableHead>
                      <TableHead>Progression</TableHead>
                      <TableHead className="hidden sm:table-cell">Niveaux</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledStudents.map((es) => {
                      const progressPct = es.totalSessions > 0
                        ? Math.round((es.attendedSessions / es.totalSessions) * 100)
                        : 0;
                      return (
                        <TableRow key={es.enrollment.id} data-testid={`row-enrolled-${es.student.id}`}>
                          <TableCell>
                            <Link href={`/students/${es.student.id}`}>
                              <div className="flex items-center gap-2 cursor-pointer">
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                  {es.student.firstName[0]}{es.student.lastName[0]}
                                </div>
                                <span className="text-sm font-medium">
                                  {es.student.firstName} {es.student.lastName}
                                </span>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={progressPct} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-8 text-right">
                                {progressPct}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {es.levelsCompleted}/4
                            </span>
                          </TableCell>
                          <TableCell>
                            {es.eligible ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Eligible
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                En cours
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels" className="mt-4">
          {levels.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Layers className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Aucun niveau configure</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {levels.map((level) => (
                <Card key={level.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Niveau {level.levelNumber}</Badge>
                      {level.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {level.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="p-2 rounded-md border text-center"
                        >
                          <p className="text-xs font-medium">Seance {session.sessionNumber}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{session.title}</p>
                          {session.date && (
                            <p className="text-xs text-muted-foreground">{session.date}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
