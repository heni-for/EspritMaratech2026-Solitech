import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, UserCog, Shield, BookOpen, GraduationCap, Loader2 } from "lucide-react";
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

export default function UserManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "student",
    studentId: "",
  });
  const [assignTrainingId, setAssignTrainingId] = useState("");

  const { data: usersData, isLoading } = useQuery<UserData[]>({
    queryKey: ["/api/users"],
  });

  const { data: studentsData } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: trainingsData } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/trainings"],
  });

  const { data: trainerAssignments } = useQuery<TrainerAssignment[]>({
    queryKey: ["/api/trainer-assignments", selectedTrainer?.id],
    enabled: !!selectedTrainer,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/users", {
        ...data,
        studentId: data.studentId ? parseInt(data.studentId) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      setFormData({ username: "", password: "", fullName: "", role: "student", studentId: "" });
      toast({ title: "User created successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
    },
  });

  const assignTrainingMutation = useMutation({
    mutationFn: async ({ userId, trainingId }: { userId: string; trainingId: number }) => {
      const res = await apiRequest("POST", "/api/trainer-assignments", { userId, trainingId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer-assignments", selectedTrainer?.id] });
      setAssignTrainingId("");
      toast({ title: "Training assigned" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/trainer-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer-assignments", selectedTrainer?.id] });
      toast({ title: "Assignment removed" });
    },
  });

  const roleIcon = (role: string) => {
    if (role === "admin") return <Shield className="h-3.5 w-3.5" />;
    if (role === "trainer") return <BookOpen className="h-3.5 w-3.5" />;
    return <GraduationCap className="h-3.5 w-3.5" />;
  };

  const users = usersData || [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-users-title">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage user accounts and access roles</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <Plus className="h-4 w-4 mr-1" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  data-testid="input-user-fullname"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  data-testid="input-user-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  data-testid="input-user-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administration</SelectItem>
                    <SelectItem value="trainer">Trainer / Encadrant</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.role === "student" && (
                <div className="space-y-2">
                  <Label>Link to Student Profile</Label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(v) => setFormData({ ...formData, studentId: v })}
                  >
                    <SelectTrigger data-testid="select-student-link">
                      <SelectValue placeholder="Select student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(studentsData || []).map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={createUserMutation.isPending} data-testid="button-submit-user">
                {createUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Create User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCog className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No users yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Full Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Username</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-b-0" data-testid={`row-user-${user.id}`}>
                      <td className="p-3 font-medium">{user.fullName}</td>
                      <td className="p-3 text-muted-foreground">{user.username}</td>
                      <td className="p-3">
                        <Badge variant={user.role === "admin" ? "default" : user.role === "trainer" ? "secondary" : "outline"}>
                          {roleIcon(user.role)}
                          <span className="ml-1 capitalize">{user.role}</span>
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.role === "trainer" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-assign-${user.id}`}
                              onClick={() => {
                                setSelectedTrainer(user);
                                setAssignDialogOpen(true);
                              }}
                            >
                              <BookOpen className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-user-${user.id}`}
                            onClick={() => deleteUserMutation.mutate(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign Trainings to {selectedTrainer?.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {trainerAssignments && trainerAssignments.length > 0 && (
              <div className="space-y-2">
                <Label>Current Assignments</Label>
                <div className="space-y-1">
                  {trainerAssignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted">
                      <span className="text-sm">{a.trainingName}</span>
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
            <div className="space-y-2">
              <Label>Add Training</Label>
              <div className="flex gap-2">
                <Select value={assignTrainingId} onValueChange={setAssignTrainingId}>
                  <SelectTrigger data-testid="select-assign-training">
                    <SelectValue placeholder="Select training..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(trainingsData || []).map((t) => (
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
                  Assign
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
