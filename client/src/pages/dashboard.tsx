import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  Award,
  TrendingUp,
  Calendar,
  Search,
  Bell,
  UserPlus,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  UserCog,
  GraduationCap,
  Percent,
  FileCheck,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardStats {
  totalStudents: number;
  activeTrainings: number;
  todayAttendance: number;
  certificatesIssued: number;
  attendanceRate: number;
  eligibleCount: number;
  certificatesThisMonth: number;
  trainingProgress: Array<{
    trainingId: number;
    trainingName: string;
    enrolledCount: number;
    completedCount: number;
    avgProgress: number;
  }>;
  attendanceChartData: Array<{
    label: string;
    present: number;
    absent: number;
  }>;
  recentActivity: Array<{
    id: number;
    studentName: string;
    trainingName: string;
    sessionTitle: string;
    present: boolean;
    markedAt: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
  totalUsers: number;
  trainerCount: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  loading?: boolean;
  accent?: string;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`flex items-center justify-center w-8 h-8 rounded-md ${accent || "bg-muted"}`}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

const managementLinks = [
  { title: "Gestion des eleves", icon: Users, href: "/students", desc: "Ajouter, modifier, supprimer" },
  { title: "Gestion des formations", icon: BookOpen, href: "/trainings", desc: "Formations et niveaux" },
  { title: "Gestion des encadrants", icon: UserCog, href: "/users", desc: "Comptes et assignations" },
  { title: "Inscriptions", icon: GraduationCap, href: "/trainings", desc: "Inscrire des eleves" },
  { title: "Presences", icon: ClipboardCheck, href: "/attendance", desc: "Marquer et corriger" },
  { title: "Certificats", icon: Award, href: "/certificates", desc: "Generer et consulter" },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d'ensemble des activites et du suivi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-48 sm:w-56"
              data-testid="input-dashboard-search"
            />
          </div>
          <Link href="/students">
            <Button variant="outline" data-testid="button-quick-add-student">
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter eleve
            </Button>
          </Link>
          <Link href="/trainings">
            <Button variant="outline" data-testid="button-quick-add-training">
              <Plus className="h-4 w-4 mr-2" />
              Creer formation
            </Button>
          </Link>
          <Link href="/attendance">
            <Button data-testid="button-quick-attendance">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Marquer presence
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total eleves"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          description="Eleves inscrits"
          loading={isLoading}
          accent="bg-blue-600 dark:bg-blue-700"
        />
        <StatCard
          title="Formations actives"
          value={stats?.activeTrainings ?? 0}
          icon={BookOpen}
          description="En cours"
          loading={isLoading}
          accent="bg-green-600 dark:bg-green-700"
        />
        <StatCard
          title="Presences aujourd'hui"
          value={stats?.todayAttendance ?? 0}
          icon={Calendar}
          description="Marques ce jour"
          loading={isLoading}
          accent="bg-purple-600 dark:bg-purple-700"
        />
        <StatCard
          title="Taux de presence"
          value={`${stats?.attendanceRate ?? 0}%`}
          icon={Percent}
          description="7 derniers jours"
          loading={isLoading}
          accent="bg-amber-600 dark:bg-amber-700"
        />
        <StatCard
          title="Eligibles certificat"
          value={stats?.eligibleCount ?? 0}
          icon={FileCheck}
          description="Prets a certifier"
          loading={isLoading}
          accent="bg-teal-600 dark:bg-teal-700"
        />
        <StatCard
          title="Certificats (mois)"
          value={stats?.certificatesThisMonth ?? 0}
          icon={Award}
          description={`${stats?.certificatesIssued ?? 0} au total`}
          loading={isLoading}
          accent="bg-rose-600 dark:bg-rose-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Presences vs Absences (7 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : stats?.attendanceChartData ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.attendanceChartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="present" name="Presents" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absents" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Pas de donnees cette semaine</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progression par formation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : stats?.trainingProgress && stats.trainingProgress.length > 0 ? (
              <div className="space-y-4">
                {stats.trainingProgress.map((tp) => (
                  <div key={tp.trainingId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{tp.trainingName}</span>
                      <span className="text-xs text-muted-foreground">{tp.avgProgress}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${tp.avgProgress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{tp.enrolledCount} inscrits</Badge>
                      <Badge variant="outline" className="text-xs">{tp.completedCount} termines</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Aucune formation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Activite recente
          </CardTitle>
          <Link href="/attendance">
            <Button variant="ghost" size="sm" data-testid="button-view-all-activity">
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Eleve</TableHead>
                  <TableHead className="hidden sm:table-cell">Formation</TableHead>
                  <TableHead className="hidden md:table-cell">Seance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentActivity.map((activity) => (
                  <TableRow key={activity.id} data-testid={`row-activity-${activity.id}`}>
                    <TableCell>
                      <span className="text-sm font-medium">{activity.studentName}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {activity.trainingName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {activity.sessionTitle}
                    </TableCell>
                    <TableCell>
                      {activity.present ? (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1 text-red-500" />
                          Absent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {activity.markedAt ? new Date(activity.markedAt).toLocaleDateString("fr-FR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucune activite recente</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Gestion principale
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {managementLinks.map((link) => (
            <Link key={link.href + link.title} href={link.href}>
              <Card className="hover-elevate cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium leading-tight">{link.title}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{link.desc}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertes et suivi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats?.alerts && stats.alerts.length > 0 ? (
            <div className="space-y-2">
              {stats.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-md border ${
                    alert.severity === "high"
                      ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
                      : alert.severity === "medium"
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
                      : "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30"
                  }`}
                  data-testid={`alert-${i}`}
                >
                  {alert.severity === "high" ? (
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  ) : alert.severity === "medium" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{alert.message}</p>
                    <Badge
                      variant="outline"
                      className="text-xs mt-1"
                    >
                      {alert.type === "absence" ? "Absences" : alert.type === "near_completion" ? "Proche de la fin" : alert.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
              <p className="text-sm text-muted-foreground">Aucune alerte - tout est en ordre</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
