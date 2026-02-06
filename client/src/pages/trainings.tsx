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
import { insertTrainingSchema, type Training, type InsertTraining, type Student } from "@shared/schema";
import { Plus, BookOpen, Users, Eye, UserPlus } from "lucide-react";
import { Link } from "wouter";

interface TrainingWithStats extends Training {
  enrolledCount: number;
  levelsCount: number;
}

export default function TrainingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const { toast } = useToast();

  const { data: trainings = [], isLoading } = useQuery<TrainingWithStats[]>({
    queryKey: ["/api/trainings"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

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
      const res = await apiRequest("POST", "/api/trainings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Training created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create training", description: error.message, variant: "destructive" });
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
      toast({ title: "Student enrolled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to enroll student", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-trainings-title">Trainings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage formations and their levels
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-training">
              <Plus className="h-4 w-4 mr-2" />
              Create Training
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Training</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Robotics Fundamentals" {...field} data-testid="input-training-name" />
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
                        <Textarea placeholder="Training description..." {...field} value={field.value ?? ""} data-testid="input-training-desc" />
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
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} data-testid="input-training-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-training">
                  {createMutation.isPending ? "Creating..." : "Create Training"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger data-testid="select-student-enroll">
                  <SelectValue placeholder="Choose a student" />
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
              {enrollMutation.isPending ? "Enrolling..." : "Enroll Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <p className="font-medium">No trainings yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first training to get started</p>
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
                    {training.status}
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
                    <span>{training.enrolledCount} students</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{training.levelsCount} levels</span>
                  </div>
                </div>
                {training.startDate && (
                  <p className="text-xs text-muted-foreground">Started: {training.startDate}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/trainings/${training.id}`}>
                    <Button variant="outline" size="sm" data-testid={`button-view-training-${training.id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                    </Button>
                  </Link>
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
                    Enroll
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={className} {...props}>{children}</label>;
}
