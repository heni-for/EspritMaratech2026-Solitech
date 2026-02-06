import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Trash2,
  BookOpen,
  UserPlus,
  Loader2,
  Users,
  Award,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import type { Student } from "@shared/schema";

interface UserData {
  id: string;
  username: string;
  fullName: string;
  role: string;
  studentId: number | null;
}

interface TrainerAssignment {
  id: number;
  userId: string;
  trainingId: number;
  trainingName: string;
}

interface TrainingData {
  id: number;
  name: string;
  description: string | null;
  status: string;
}

const trainerSchema = z.object({
  fullName: z.string().min(1, "Nom complet requis"),
  username: z.string().min(1, "Identifiant requis"),
  password: z.string().min(4, "Minimum 4 caracteres"),
});

type TrainerFormValues = z.infer<typeof trainerSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<UserData | null>(null);
  const [assignTrainingId, setAssignTrainingId] = useState("");

  const form = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
    },
  });

  const { data: usersData, isLoading } = useQuery<UserData[]>({
    queryKey: ["/api/users"],
  });

  const { data: trainingsData } = useQuery<TrainingData[]>({
    queryKey: ["/api/trainings"],
  });

  const { data: trainerAssignments } = useQuery<TrainerAssignment[]>({
    queryKey: ["/api/trainer-assignments", selectedTrainer?.id],
    enabled: !!selectedTrainer,
  });

  const { data: allAssignments } = useQuery<TrainerAssignment[]>({
    queryKey: ["/api/trainer-assignments", "all"],
  });

  const createTrainerMutation = useMutation({
    mutationFn: async (data: TrainerFormValues) => {
      const res = await apiRequest("POST", "/api/users", {
        ...data,
        role: "trainer",
        studentId: null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Encadrant ajoute avec succes" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Encadrant supprime" });
    },
  });

  const assignTrainingMutation = useMutation({
    mutationFn: async ({ userId, trainingId }: { userId: string; trainingId: number }) => {
      const res = await apiRequest("POST", "/api/trainer-assignments", { userId, trainingId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer-assignments"] });
      setAssignTrainingId("");
      toast({ title: "Formation assignee" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/trainer-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer-assignments"] });
      toast({ title: "Assignation retiree" });
    },
  });

  const trainers = (usersData || []).filter((u) => u.role === "trainer");

  const getTrainerAssignmentsFromAll = (userId: string) => {
    if (selectedTrainer?.id === userId && trainerAssignments) return trainerAssignments;
    return (allAssignments || []).filter((a) => a.userId === userId);
  };

  const getAvailableTrainings = (userId: string) => {
    const assigned = getTrainerAssignmentsFromAll(userId);
    const assignedIds = new Set(assigned.map((a) => a.trainingId));
    return (trainingsData || []).filter((t) => !assignedIds.has(t.id));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-users-title">Encadrants</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gerer les formateurs et leurs formations assignees
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-trainer">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Ajouter encadrant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel encadrant</DialogTitle>
              <DialogDescription>
                Creer un compte formateur et lui assigner des formations
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => createTrainerMutation.mutate(v))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input data-testid="input-trainer-fullname" placeholder="Ex: Mohamed Ben Ali" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identifiant</FormLabel>
                      <FormControl>
                        <Input data-testid="input-trainer-username" placeholder="Ex: mohamed.ali" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" data-testid="input-trainer-password" placeholder="Minimum 4 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createTrainerMutation.isPending} data-testid="button-submit-trainer">
                  {createTrainerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Creer l'encadrant
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none" data-testid="stat-total-trainers">{trainers.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Encadrants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none" data-testid="stat-total-formations">{(trainingsData || []).length}</p>
              <p className="text-xs text-muted-foreground mt-1">Formations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none" data-testid="stat-assigned-formations">{(allAssignments || []).length}</p>
              <p className="text-xs text-muted-foreground mt-1">Assignations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : trainers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GraduationCap className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm mb-4">Aucun encadrant pour le moment</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)} data-testid="button-add-trainer-empty">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Ajouter un encadrant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {trainers.map((trainer) => {
            const assignments = getTrainerAssignmentsFromAll(trainer.id);
            return (
              <Card key={trainer.id} data-testid={`card-trainer-${trainer.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold" data-testid={`text-trainer-name-${trainer.id}`}>{trainer.fullName}</h3>
                        <p className="text-xs text-muted-foreground" data-testid={`text-trainer-username-${trainer.id}`}>@{trainer.username}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {assignments.length > 0 ? (
                            assignments.map((a) => (
                              <Badge key={a.id} variant="secondary" data-testid={`badge-assignment-${a.id}`}>
                                <BookOpen className="h-3 w-3 mr-1" />
                                {a.trainingName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucune formation assignee</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-assign-${trainer.id}`}
                        onClick={() => {
                          setSelectedTrainer(trainer);
                          setAssignDialogOpen(true);
                        }}
                      >
                        <BookOpen className="h-4 w-4 mr-1.5" />
                        Formations
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-trainer-${trainer.id}`}
                        onClick={() => {
                          if (confirm("Supprimer cet encadrant ?")) {
                            deleteUserMutation.mutate(trainer.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Circuit de formation</CardTitle>
          <p className="text-xs text-muted-foreground">Le parcours complet de chaque formation</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
              <span>Encadrant</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <span>Formation</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Users className="h-3.5 w-3.5" />
              </div>
              <span>Eleves inscrits</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <Award className="h-3.5 w-3.5" />
              </div>
              <span>Certificat</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Formations de {selectedTrainer?.fullName}
            </DialogTitle>
            <DialogDescription>
              Assigner ou retirer des formations pour cet encadrant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {trainerAssignments && trainerAssignments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Formations actuelles</p>
                <div className="space-y-1.5">
                  {trainerAssignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 p-2.5 rounded-md border" data-testid={`row-assignment-${a.id}`}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{a.trainingName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAssignmentMutation.mutate(a.id)}
                        data-testid={`button-remove-assignment-${a.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {trainerAssignments && trainerAssignments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">Aucune formation assignee</p>
            )}
            {selectedTrainer && getAvailableTrainings(selectedTrainer.id).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ajouter une formation</p>
                <div className="flex gap-2">
                  <Select value={assignTrainingId} onValueChange={setAssignTrainingId}>
                    <SelectTrigger data-testid="select-assign-training">
                      <SelectValue placeholder="Choisir une formation..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTrainer && getAvailableTrainings(selectedTrainer.id).map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!assignTrainingId || assignTrainingMutation.isPending}
                    onClick={() => {
                      if (selectedTrainer && assignTrainingId) {
                        assignTrainingMutation.mutate({
                          userId: selectedTrainer.id,
                          trainingId: parseInt(assignTrainingId),
                        });
                      }
                    }}
                    data-testid="button-assign-training"
                  >
                    {assignTrainingMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Assigner
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
