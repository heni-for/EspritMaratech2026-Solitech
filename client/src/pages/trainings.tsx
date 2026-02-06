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
import { Checkbox } from "@/components/ui/checkbox";
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
import { insertTrainingSchema, type Training, type InsertTraining, type Student, type User } from "@shared/schema";
import { Plus, BookOpen, Users, Eye, UserPlus, UserCog } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface TrainingWithStats extends Training {
  enrolledCount: number;
  levelsCount: number;
}

export default function TrainingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedTrainers, setSelectedTrainers] = useState<number[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: trainings = [], isLoading } = useQuery<TrainingWithStats[]>({
    queryKey: ["/api/trainings"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: users = [] } = useQuery<User[]>({
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
      toast({ title: "Formation creee avec succes" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur lors de la creation", description: error.message, variant: "destructive" });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async ({ studentId, trainingId }: { studentId: number; trainingId: number }) => {
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

  const toggleTrainer = (trainerId: number) => {
    setSelectedTrainers((prev) =>
      prev.includes(trainerId)
        ? prev.filter((id) => id !== trainerId)
        : [...prev, trainerId]
    );
  };

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
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-training">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle formation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Creer une formation</DialogTitle>
              </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Encadrants</label>
                  <p className="text-xs text-muted-foreground">Selectionnez les encadrants pour cette formation</p>
                  {trainers.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Aucun encadrant disponible. Creez-en un d'abord.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {trainers.map((trainer) => (
                        <label
                          key={trainer.id}
                          className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                          data-testid={`checkbox-trainer-${trainer.id}`}
                        >
                          <Checkbox
                            checked={selectedTrainers.includes(trainer.id)}
                            onCheckedChange={() => toggleTrainer(trainer.id)}
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                              <UserCog className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{trainer.fullName || trainer.username}</p>
                              <p className="text-xs text-muted-foreground truncate">@{trainer.username}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedTrainers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedTrainers.map((id) => {
                        const t = trainers.find((tr) => tr.id === id);
                        return t ? (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {t.fullName || t.username}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-training">
                  {createMutation.isPending ? "Creation..." : "Creer la formation"}
                </Button>
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
                    studentId: parseInt(selectedStudent),
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
