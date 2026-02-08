import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertStudentSchema, type InsertStudent } from "@shared/schema";
import { FaceCapture } from "@/components/face-capture";
import { Plus, Search, Users, UserPlus, Eye, Trash2, Camera } from "lucide-react";
import { Link } from "wouter";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [studentFaceData, setStudentFaceData] = useState<string | null>(null);
  const [existingStudentFaceData, setExistingStudentFaceData] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: students = [], isLoading } = useQuery<StudentLite[]>({
    queryKey: ["/api/students"],
  });

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      const res = await apiRequest("POST", "/api/students", {
        ...data,
        faceData: studentFaceData,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      form.reset();
      setStudentFaceData(null);
      toast({ title: "Eleve ajoute avec succes" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur lors de l'ajout", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Eleve supprime" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur lors de la suppression", description: error.message, variant: "destructive" });
    },
  });

  const updateFaceMutation = useMutation({
    mutationFn: async ({ studentId, faceData }: { studentId: string; faceData: string }) => {
      const res = await apiRequest("PATCH", `/api/students/${studentId}/face`, { faceData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setFaceDialogOpen(false);
      setSelectedStudentId("");
      setExistingStudentFaceData(null);
      toast({ title: "Face ID ajoute avec succes" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur lors de l'ajout du face ID", description: error.message, variant: "destructive" });
    },
  });

  const handleAddFace = () => {
    if (!selectedStudentId || !existingStudentFaceData) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez selectionner un eleve et capturer son visage",
        variant: "destructive" 
      });
      return;
    }
    updateFaceMutation.mutate({ studentId: selectedStudentId, faceData: existingStudentFaceData });
  };

  const filteredStudents = students.filter(
    (s) =>
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-students-title">Eleves</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerer les fiches eleves et les inscriptions
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-student">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un eleve
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvel eleve</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prenom</FormLabel>
                        <FormControl>
                          <Input placeholder="Prenom" {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom" {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} value={field.value ?? ""} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telephone</FormLabel>
                      <FormControl>
                        <Input placeholder="+216 XX XXX XXX" {...field} value={field.value ?? ""} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} data-testid="input-dob" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FaceCapture
                  onCapture={(imageData) => setStudentFaceData(imageData)}
                  isLoading={createMutation.isPending}
                />
                {studentFaceData && (
                  <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
                    ✓ Visage enregistre avec succes
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-student">
                  {createMutation.isPending ? "Ajout..." : "Ajouter l'eleve"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={faceDialogOpen} onOpenChange={setFaceDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              Ajouter eleve face
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter Face ID</DialogTitle>
              <DialogDescription>
                Selectionnez un eleve existant et capturez son visage pour activer la connexion par Face ID
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selectionner un eleve</label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un eleve" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={String(student.id)}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedStudentId && (
                <>
                  <FaceCapture
                    onCapture={(imageData) => setExistingStudentFaceData(imageData)}
                    isLoading={updateFaceMutation.isPending}
                  />
                  {existingStudentFaceData && (
                    <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
                      ✓ Visage enregistre avec succes
                    </div>
                  )}
                </>
              )}
              
              <Button 
                onClick={handleAddFace} 
                className="w-full" 
                disabled={updateFaceMutation.isPending || !selectedStudentId || !existingStudentFaceData}
              >
                {updateFaceMutation.isPending ? "Enregistrement..." : "Enregistrer Face ID"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un eleve..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-students"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Aucun eleve trouve</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Essayez de modifier votre recherche" : "Ajoutez un eleve pour commencer"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telephone</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Absences</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Reclamations</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
                          {student.dateOfBirth && (
                            <p className="text-xs text-muted-foreground">{student.dateOfBirth}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {student.email || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {student.phone || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-center">
                      <Badge variant={student.absenceCount && student.absenceCount > 5 ? "destructive" : "secondary"}>
                        {student.absenceCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-center">
                      <Badge variant={student.complaintCount && student.complaintCount > 0 ? "destructive" : "secondary"}>
                        {student.complaintCount || 0}
                      </Badge>
                    </TableCell>
                      <TableCell className="flex items-center justify-end gap-2">
                        <Link href={`/students/${student.id}`}>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-icon-label={`Voir la fiche de ${student.firstName} ${student.lastName}`}
                            data-testid={`button-view-student-${student.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          data-icon-label={`Supprimer ${student.firstName} ${student.lastName}`}
                          onClick={() => {
                            if (confirm("Supprimer cet eleve ?")) {
                              deleteMutation.mutate(String(student.id));
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-student-${student.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
interface StudentLite {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  absenceCount?: number;
  complaintCount?: number;
}
