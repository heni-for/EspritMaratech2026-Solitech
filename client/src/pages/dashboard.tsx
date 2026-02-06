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
  UserCog,
  GraduationCap,
  Percent,
  FileCheck,
  Info,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const chartPeriods = ["1s", "1m", "3m", "1a", "tout"];

const managementLinks = [
  { title: "Eleves", icon: Users, href: "/students", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  { title: "Formations", icon: BookOpen, href: "/trainings", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  { title: "Encadrants", icon: UserCog, href: "/users", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  { title: "Inscriptions", icon: GraduationCap, href: "/trainings", color: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  { title: "Presences", icon: ClipboardCheck, href: "/attendance", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  { title: "Certificats", icon: Award, href: "/certificates", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activePeriod, setActivePeriod] = useState("1s");
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const statCards = [
    { label: "Total eleves", value: stats?.totalStudents ?? 0, icon: Users, color: "bg-violet-500/15 text-violet-600 dark:text-violet-400", change: null },
    { label: "Formations actives", value: stats?.activeTrainings ?? 0, icon: BookOpen, color: "bg-orange-500/15 text-orange-600 dark:text-orange-400", change: null },
    { label: "Presences aujourd'hui", value: stats?.todayAttendance ?? 0, icon: Calendar, color: "bg-blue-500/15 text-blue-600 dark:text-blue-400", change: null },
    { label: "Taux de presence", value: `${stats?.attendanceRate ?? 0}%`, icon: Percent, color: "bg-teal-500/15 text-teal-600 dark:text-teal-400", change: null },
    { label: "Eligibles certificat", value: stats?.eligibleCount ?? 0, icon: FileCheck, color: "bg-purple-500/15 text-purple-600 dark:text-purple-400", change: null },
    { label: "Certificats ce mois", value: stats?.certificatesThisMonth ?? 0, icon: Award, color: "bg-rose-500/15 text-rose-600 dark:text-rose-400", change: `${stats?.certificatesIssued ?? 0} total` },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Bienvenue, voici un apercu de vos activites
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-44"
              data-testid="input-dashboard-search"
            />
          </div>
          <Link href="/students">
            <Button variant="outline" size="sm" data-testid="button-quick-add-student">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Eleve
            </Button>
          </Link>
          <Link href="/trainings">
            <Button variant="outline" size="sm" data-testid="button-quick-add-training">
              <Plus className="h-4 w-4 mr-1.5" />
              Formation
            </Button>
          </Link>
          <Link href="/attendance">
            <Button size="sm" data-testid="button-quick-attendance">
              <ClipboardCheck className="h-4 w-4 mr-1.5" />
              Presence
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, i) => (
          <Card key={i} data-testid={`card-stat-${i}`}>
            {isLoading ? (
              <CardContent className="p-4">
                <Skeleton className="h-9 w-9 rounded-md mb-3" />
                <Skeleton className="h-7 w-14 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            ) : (
              <CardContent className="p-4">
                <div className={`flex items-center justify-center w-9 h-9 rounded-md mb-3 ${stat.color}`} data-testid={`icon-stat-${i}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div
                  className="text-xl font-bold leading-none"
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "")}`}
                >
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5" data-testid={`label-stat-${i}`}>{stat.label}</p>
                {stat.change && (
                  <p className="text-xs text-muted-foreground mt-0.5" data-testid={`change-stat-${i}`}>{stat.change}</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Presences</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Presents vs absents par jour</p>
            </div>
            <div className="flex items-center gap-1">
              {chartPeriods.map((p) => (
                <Button
                  key={p}
                  variant={activePeriod === p ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActivePeriod(p)}
                  data-testid={`button-period-${p}`}
                >
                  {p}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-56 w-full rounded-md" />
            ) : stats?.attendanceChartData ? (
              <div data-testid="chart-attendance-area">
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={stats.attendanceChartData}>
                  <defs>
                    <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(248, 55%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(248, 55%, 55%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(18, 90%, 58%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(18, 90%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    name="Presents"
                    stroke="hsl(248, 55%, 55%)"
                    strokeWidth={2.5}
                    fill="url(#gradPresent)"
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    name="Absents"
                    stroke="hsl(18, 90%, 58%)"
                    strokeWidth={2.5}
                    fill="url(#gradAbsent)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Pas de donnees cette semaine</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Resume des formations</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Progression moyenne</p>
            </div>
            <Link href="/trainings">
              <Button variant="ghost" size="icon" data-testid="button-view-trainings">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : stats?.trainingProgress && stats.trainingProgress.length > 0 ? (
              <div className="space-y-4">
                {stats.trainingProgress.map((tp, idx) => {
                  const colors = [
                    "bg-violet-500",
                    "bg-orange-500",
                    "bg-teal-500",
                    "bg-blue-500",
                    "bg-rose-500",
                  ];
                  const trackColors = [
                    "bg-violet-500/15",
                    "bg-orange-500/15",
                    "bg-teal-500/15",
                    "bg-blue-500/15",
                    "bg-rose-500/15",
                  ];
                  return (
                    <div key={tp.trainingId} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{tp.trainingName}</span>
                        <span className="text-sm font-semibold">{tp.avgProgress}%</span>
                      </div>
                      <div className={`h-2 rounded-full ${trackColors[idx % trackColors.length]} overflow-hidden`}>
                        <div
                          className={`h-full rounded-full ${colors[idx % colors.length]} transition-all duration-500`}
                          style={{ width: `${tp.avgProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted-foreground">{tp.enrolledCount} inscrits</span>
                        <span className="text-xs text-muted-foreground">{tp.completedCount} termines</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Aucune formation</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t">
              {managementLinks.slice(0, 3).map((link) => (
                <Link key={link.title} href={link.href}>
                  <div className="flex flex-col items-center gap-1.5 p-2 rounded-md hover-elevate cursor-pointer">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-md ${link.color}`}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{link.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Activite recente</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Dernieres presences marquees</p>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/attendance">
                <Button variant="ghost" size="sm" data-testid="button-view-all-activity">
                  Voir tout
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="divide-y">
                {stats.recentActivity.slice(0, 6).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 px-4 py-3"
                    data-testid={`row-activity-${activity.id}`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                      activity.present
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-red-500/15 text-red-500 dark:text-red-400"
                    }`}>
                      {activity.present ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.studentName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.trainingName} - {activity.sessionTitle}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={activity.present ? "secondary" : "outline"} className="text-xs" data-testid={`badge-status-${activity.id}`}>
                        {activity.present ? "Present" : "Absent"}
                      </Badge>
                      {activity.markedAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.markedAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Aucune activite recente</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                  ))}
                </div>
              ) : stats?.alerts && stats.alerts.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.alerts.slice(0, 5).map((alert, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-md border"
                      data-testid={`card-alert-${i}`}
                    >
                      {alert.severity === "high" ? (
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : alert.severity === "medium" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-xs leading-relaxed">{alert.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-xs">Tout est en ordre</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Acces rapide</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                {managementLinks.map((link) => (
                  <Link key={link.title} href={link.href}>
                    <div className="flex flex-col items-center gap-1.5 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`tile-${link.title.toLowerCase()}`}>
                      <div className={`flex items-center justify-center w-9 h-9 rounded-md ${link.color}`}>
                        <link.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-center leading-tight">{link.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
