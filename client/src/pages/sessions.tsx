import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface TrainingOption {
  id: string;
  name: string;
  levels: Array<{
    id: string;
    levelNumber: number;
    name: string;
    sessions: Array<{
      id: string;
      sessionNumber: number;
      title: string;
      status: "pending" | "en_cours" | "fini";
    }>;
  }>;
}

export default function SessionsPage() {
  const [selectedTraining, setSelectedTraining] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const { toast } = useToast();

  const { data: trainingOptions = [], isLoading: loadingTrainings } = useQuery<TrainingOption[]>({
    queryKey: ["/api/attendance/options"],
  });

  const currentTraining = trainingOptions.find((t) => t.id.toString() === selectedTraining);
  const currentLevel = currentTraining?.levels.find((l) => l.id.toString() === selectedLevel);

  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/complete`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/options"] });
      toast({
        title: "Session marquée comme terminée",
        description: `Session ${data.session.sessionNumber} completed. Next level/training status will be updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fini":
        return "default"; // Green badge
      case "en_cours":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRowBackgroundColor = (status: string) => {
    if (status === "fini") {
      return "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30";
    }
    return "";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "fini":
        return <CheckCircle2 className="h-4 w-4" />;
      case "en_cours":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestion des Sessions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérer le statut des sessions et la progression du niveau
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sélectionner une formation et un niveau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground" htmlFor="training-select">
                Formation
              </Label>
              <Select value={selectedTraining} onValueChange={(value) => {
                setSelectedTraining(value);
                setSelectedLevel("");
              }}>
                <SelectTrigger id="training-select">
                  <SelectValue placeholder="Sélectionner une formation" />
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
            {currentTraining && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground" htmlFor="level-select">
                  Niveau
                </Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger id="level-select">
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentTraining.levels.map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {currentLevel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{currentLevel.name} - Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLevel.sessions.map((session) => (
                  <TableRow key={session.id} className={getRowBackgroundColor(session.status)}>
                    <TableCell className="font-medium">
                      {session.sessionNumber}
                    </TableCell>
                    <TableCell>{session.title}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusColor(session.status)} className="gap-1">
                        {getStatusIcon(session.status)}
                        {session.status === "fini" ? "Terminée" : session.status === "en_cours" ? "En cours" : "En attente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.status !== "fini" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeSessionMutation.mutate(session.id)}
                          disabled={completeSessionMutation.isPending}
                        >
                          Marquer Terminée
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
