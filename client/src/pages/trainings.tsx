import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTrainingSchema, type InsertTraining } from "@shared/schema";
import { Plus, BookOpen, Users, Eye, UserPlus, UserCog } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface TrainingWithStats {
  id: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  status: string;
  enrolledCount: number;
  levelsCount: number;
}

interface StudentLite {
  id: string;
  firstName: string;
  lastName: string;
}

interface UserLite {
  id: string;
  username: string;
  fullName?: string | null;
  role: string;
}

export default function TrainingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [levelsCount, setLevelsCount] = useState("4");
  const [sessionsPerLevel, setSessionsPerLevel] = useState("6");
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: trainings = [], isLoading } = useQuery<TrainingWithStats[]>({
    queryKey: ["/api/trainings"],
  });

  const { data: students = [] } = useQuery<StudentLite[]>({
    queryKey: ["/api/students"],
  });

  const { data: users = [] } = useQuery<UserLite[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const trainers = users.filter((u) => u.role === "trainer");

  const form = useForm<InsertTraining>({
    resolver: zodResolver(insertTrainingSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTraining) => {
      const res = await apiRequest("POST", "/api/trainings", {
        ...data,
        trainerIds: selectedTrainers,
        studentIds: selectedStudents,
        levelsCount,
        sessionsPerLevel,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trainer-assignments"] });
      setDialogOpen(false);
      form.reset();
      setSelectedTrainers([]);
      setSelectedStudents([]);
      setLevelsCount("4");
      setSessionsPerLevel("6");
      toast({ title: "Formation creee avec succes" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur lors de la creation", description: error.message, variant: "destructive" });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async ({ studentId, trainingId }: { studentId: string; trainingId: string }) => {
      const res = await apiRequest("POST", "/api/enrollments", { studentId, trainingId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setEnrollDialogOpen(false);
      setSelectedStudent("");
      toast({ title: "Eleve inscrit avec succes" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur lors de l'inscription", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-trainings-title">Formations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerer les formations et leurs niveaux
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSelectedTrainers([]);
              setSelectedStudents([]);
              setLevelsCount("4");
              setSessionsPerLevel("6");
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-training">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle formation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Creer une formation</DialogTitle>
              </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-muted-foreground">Details</div>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la formation</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: Robotique fondamentale" {...field} data-testid="input-training-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Description de la formation..." {...field} value={field.value ?? ""} data-testid="input-training-desc" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de debut</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} data-testid="input-training-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre de niveaux</label>
                        <Input
                          type="number"
                          min={1}
                          value={levelsCount}
                          onChange={(e) => setLevelsCount(e.target.value)}
                          data-testid="input-levels-count"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seances par niveau</label>
                        <Input
                          type="number"
                          min={1}
                          value={sessionsPerLevel}
                          onChange={(e) => setSessionsPerLevel(e.target.value)}
                          data-testid="input-sessions-count"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-muted-foreground">Affectations</div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Encadrants</label>
                      <p className="text-xs text-muted-foreground">Selectionnez les encadrants pour cette formation</p>
                      {trainers.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">Aucun encadrant disponible. Creez-en un d'abord.</p>
                      ) : (
                        <Select
                          onValueChange={(val) => {
                            const id = val;
                            if (!selectedTrainers.includes(id)) {
                              setSelectedTrainers((prev) => [...prev, id]);
                            }
                          }}
                          value=""
                        >
                          <SelectTrigger data-testid="select-trainer-dropdown">
                            <SelectValue placeholder="Choisir un encadrant..." />
                          </SelectTrigger>
                          <SelectContent>
                            {trainers
                              .filter((t) => !selectedTrainers.includes(t.id))
                              .map((trainer) => (
                                <SelectItem key={trainer.id} value={String(trainer.id)} data-testid={`select-trainer-${trainer.id}`}>
                                  <div className="flex items-center gap-2">
                                    <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{trainer.fullName || trainer.username}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            {trainers.filter((t) => !selectedTrainers.includes(t.id)).length === 0 && (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">Tous les encadrants sont selectionnes</div>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {selectedTrainers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedTrainers.map((id) => {
                            const t = trainers.find((tr) => tr.id === id);
                            return t ? (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="text-xs cursor-pointer"
                                onClick={() => setSelectedTrainers((prev) => prev.filter((x) => x !== id))}
                                data-testid={`badge-trainer-${id}`}
                              >
                                {t.fullName || t.username} &times;
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Eleves</label>
                      <p className="text-xs text-muted-foreground">Inscrire des eleves a cette formation (optionnel)</p>
                      {students.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">Aucun eleve disponible.</p>
                      ) : (
                        <Select
                          onValueChange={(val) => {
                            if (!selectedStudents.includes(val)) {
                              setSelectedStudents((prev) => [...prev, val]);
                            }
                          }}
                          value=""
                        >
                          <SelectTrigger data-testid="select-student-dropdown">
                            <SelectValue placeholder="Choisir un eleve..." />
                          </SelectTrigger>
                          <SelectContent>
                            {students
                              .filter((s) => !selectedStudents.includes(s.id))
                              .map((student) => (
                                <SelectItem key={student.id} value={String(student.id)} data-testid={`select-student-${student.id}`}>
                                  <div className="flex items-center gap-2">
                                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{student.firstName} {student.lastName}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            {students.filter((s) => !selectedStudents.includes(s.id)).length === 0 && (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">Tous les eleves sont selectionnes</div>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {selectedStudents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedStudents.map((id) => {
                            const s = students.find((st) => st.id === id);
                            return s ? (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="text-xs cursor-pointer"
                                onClick={() => setSelectedStudents((prev) => prev.filter((x) => x !== id))}
                                data-testid={`badge-student-${id}`}
                              >
                                {s.firstName} {s.lastName} &times;
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="submit" className="min-w-[200px]" disabled={createMutation.isPending} data-testid="button-submit-training">
                    {createMutation.isPending ? "Creation..." : "Creer la formation"}
                  </Button>
                </div>
              </form>
            </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isAdmin && <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Inscrire un eleve</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selectionner un eleve</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger data-testid="select-student-enroll">
                  <SelectValue placeholder="Choisir un eleve" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!selectedStudent || enrollMutation.isPending}
              onClick={() => {
                if (selectedTraining && selectedStudent) {
                  enrollMutation.mutate({
                    studentId: selectedStudent,
                    trainingId: selectedTraining,
                  });
                }
              }}
              data-testid="button-confirm-enroll"
            >
              {enrollMutation.isPending ? "Inscription..." : "Inscrire l'eleve"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-3 w-full mb-4" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : trainings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Aucune formation</p>
            <p className="text-sm text-muted-foreground mt-1">Creez votre premiere formation pour commencer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainings.map((training) => (
            <Card key={training.id} data-testid={`card-training-${training.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{training.name}</CardTitle>
                  <Badge variant={training.status === "active" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                    {training.status === "active" ? "Actif" : training.status}
                  </Badge>
                </div>
                {training.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{training.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>{training.enrolledCount} eleves</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{training.levelsCount} niveaux</span>
                  </div>
                </div>
                {training.startDate && (
                  <p className="text-xs text-muted-foreground">Debut : {training.startDate}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/trainings/${training.id}`}>
                    <Button variant="outline" size="sm" data-testid={`button-view-training-${training.id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Voir details
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTraining(training.id);
                        setEnrollDialogOpen(true);
                      }}
                      data-testid={`button-enroll-training-${training.id}`}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      Inscrire
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
