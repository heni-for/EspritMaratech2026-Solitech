import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Eye, Download, Printer, Info } from "lucide-react";

interface StudentDashboardData {
  student: { id: string; firstName: string; lastName: string; email: string | null };
  formations: Array<{
    training: { id: string; name: string };
    totalSessions: number;
    attendedSessions: number;
    levelsCompleted: number;
    totalLevels: number;
    eligible: boolean;
    formationStatus: "in_progress" | "completed" | "failed";
    certificateNumber?: string;
    progress?: number;
  }>;
  certificates: Array<{
    id: string;
    certificateNumber: string;
    issuedAt: string;
    trainingName: string;
    trainerName?: string;
  }>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-10 text-right">{value}%</span>
    </div>
  );
}

function buildCertificateHtml(
  studentName: string,
  trainingName: string,
  certNumber: string,
  issuedAt: string,
  trainerName?: string
) {
  const issuedDate = issuedAt || new Date().toISOString().split("T")[0];
  const trainerLabel = trainerName || "Formateur";
  return `
    <html>
      <head>
        <title>Certificate - ${certNumber}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root {
            --ink: #0f172a;
            --muted: #64748b;
            --blue: #1d4ed8;
            --cyan: #06b6d4;
            --teal: #14b8a6;
            --gold: #fbbf24;
            --paper: #f8fafc;
            --line: #e2e8f0;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: "Poppins", "Segoe UI", Arial, sans-serif;
            color: var(--ink);
            background: #e2e8f0;
          }
          .page {
            width: 1123px;
            height: 794px;
            margin: 0 auto;
            background: radial-gradient(1200px 600px at 10% 5%, #ffffff 0%, var(--paper) 55%, #eef2f7 100%);
            position: relative;
            overflow: hidden;
            border: 1px solid var(--line);
            box-shadow: 0 24px 50px rgba(15, 23, 42, 0.16);
          }
          .pattern {
            position: absolute;
            inset: 0;
            background:
              linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px) 0 0 / 40px 40px,
              linear-gradient(180deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px) 0 0 / 40px 40px;
            opacity: 0.35;
            pointer-events: none;
          }
          .frame {
            position: absolute;
            inset: 24px;
            border: 2px solid #cbd5f5;
            border-radius: 18px;
          }
          .orbit {
            position: absolute;
            width: 380px;
            height: 380px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.35), rgba(29, 78, 216, 0.15) 55%, transparent 70%);
          }
          .orbit.left { left: -180px; top: -120px; }
          .orbit.right { right: -200px; bottom: -140px; background: radial-gradient(circle at 60% 40%, rgba(20, 184, 166, 0.35), rgba(59, 130, 246, 0.12) 55%, transparent 70%); }
          .accent-bar {
            position: absolute;
            left: 60px;
            right: 60px;
            top: 128px;
            height: 6px;
            border-radius: 999px;
            background: linear-gradient(90deg, var(--blue), var(--cyan), var(--teal));
          }
          .accent-pill {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            top: 150px;
            padding: 6px 16px;
            border-radius: 999px;
            background: rgba(29, 78, 216, 0.08);
            color: var(--blue);
            font-size: 12px;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            font-weight: 600;
          }
          .logo {
            position: absolute;
            left: 60px;
            top: 50px;
            font-size: 18px;
            font-weight: 700;
            color: var(--ink);
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-badge {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background: #ffffff;
            border: 1px solid var(--line);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .logo-badge img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .header {
            text-align: center;
            padding-top: 70px;
          }
          .header h1 {
            margin: 0;
            font-size: 46px;
            color: var(--ink);
            letter-spacing: 0.5px;
          }
          .subtitle {
            margin-top: 18px;
            font-size: 18px;
            color: var(--muted);
          }
          .content {
            text-align: center;
            padding: 40px 120px 0;
            font-size: 20px;
            line-height: 1.7;
          }
          .divider {
            width: 160px;
            height: 4px;
            margin: 18px auto;
            border-radius: 999px;
            background: linear-gradient(90deg, var(--cyan), var(--blue));
          }
          .quote {
            margin-top: 22px;
            font-size: 14px;
            color: var(--muted);
            font-style: italic;
          }
          .badge {
            position: absolute;
            right: 70px;
            top: 55px;
            padding: 8px 14px;
            border-radius: 10px;
            background: rgba(6, 182, 212, 0.12);
            color: var(--ink);
            font-size: 12px;
            font-weight: 700;
          }
          .ribbon {
            position: absolute;
            top: 240px;
            width: 10px;
            height: 280px;
            background: linear-gradient(180deg, var(--cyan), var(--blue));
            opacity: 0.5;
            border-radius: 999px;
          }
          .ribbon.left { left: 40px; }
          .ribbon.right { right: 40px; }
          .student {
            margin: 18px 0 8px;
            font-size: 34px;
            color: var(--blue);
            font-weight: 800;
          }
          .training {
            font-size: 22px;
            margin: 6px 0 18px;
            color: var(--ink);
          }
          .meta {
            font-size: 14px;
            color: var(--muted);
            margin-top: 8px;
          }
          .signatures {
            position: absolute;
            bottom: 90px;
            left: 90px;
            right: 90px;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            gap: 40px;
          }
          .sig-block {
            text-align: center;
            width: 260px;
          }
          .sig-line {
            border-top: 1px solid var(--line);
            margin-top: 40px;
          }
          .sig-name {
            font-weight: 700;
            color: var(--ink);
            margin-top: 10px;
          }
          .sig-role {
            font-size: 14px;
            color: var(--muted);
          }
          .footer {
            position: absolute;
            bottom: 28px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 12px;
            color: var(--muted);
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="pattern"></div>
          <div class="frame"></div>
          <div class="orbit left"></div>
          <div class="orbit right"></div>
          <div class="ribbon left"></div>
          <div class="ribbon right"></div>

          <div class="logo">
            <span class="logo-badge">
              <img src="/logocertif.png" alt="ASTBA logo" />
            </span>
            ASTBA
          </div>
          <div class="accent-bar"></div>
          <div class="accent-pill">CERTIFICATE</div>
          <div class="badge">Excellence</div>

          <div class="header">
            <h1>Certificat de réussite</h1>
            <div class="subtitle">Ce certificat est décerné à</div>
          </div>

          <div class="content">
            <div class="student">${studentName}</div>
            <div class="training">Formation : ${trainingName}</div>
            <div class="divider"></div>
            <p>
              En reconnaissance de ses efforts et de la validation complète des niveaux de formation
              au sein de l’Association Tunisienne pour la Science, la Technologie et les Bonnes Pratiques.
            </p>
            <div class="meta">Certificat n° ${certNumber} • Délivré le ${issuedDate}</div>
            <div class="quote">"L'effort, la curiosité et la rigueur ouvrent la voie de l'excellence."</div>
          </div>

          <div class="signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-name">${trainerLabel}</div>
              <div class="sig-role">Formateur</div>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-name">ASTBA</div>
              <div class="sig-role">Direction</div>
            </div>
          </div>

          <div class="footer">Association Science and Technology Ben Arous</div>
        </div>
      </body>
    </html>
  `;
}

export default function StudentCertificate() {
  const { data, isLoading } = useQuery<StudentDashboardData>({
    queryKey: ["/api/my/dashboard"],
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    staleTime: 0,
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { formations, certificates, student } = data;
  const studentName = `${student.firstName} ${student.lastName}`;
  const hasAnyTraining = formations.length > 0;
  const hasCertificates = certificates.length > 0;

  const handleView = (trainingName: string, certNumber: string, issuedAt: string, trainerName?: string) => {
    const html = buildCertificateHtml(studentName, trainingName, certNumber, issuedAt, trainerName);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const handlePrint = (trainingName: string, certNumber: string, issuedAt: string, trainerName?: string) => {
    const html = buildCertificateHtml(studentName, trainingName, certNumber, issuedAt, trainerName);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  const handleDownload = (trainingName: string, certNumber: string, issuedAt: string, trainerName?: string) => {
    const html = buildCertificateHtml(studentName, trainingName, certNumber, issuedAt, trainerName);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${certNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Certificates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here you can view and download certificates you have earned.
        </p>
      </div>

      {!hasAnyTraining && !hasCertificates ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-10 w-10 text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-sm font-medium">You have not earned any certificates yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Once you complete a training, your certificate will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {hasCertificates && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Available Certificates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <Card
                    key={cert.id}
                    role="region"
                    tabIndex={0}
                    aria-label={`Certificate for ${cert.trainingName}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleView(cert.trainingName, cert.certificateNumber);
                      }
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" aria-label="Certificate" />
                          <CardTitle className="text-base">{cert.trainingName}</CardTitle>
                        </div>
                        <Badge variant="default">Certified</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium">{studentName}</p>
                        <p className="text-xs text-muted-foreground">Issue date: {cert.issuedAt}</p>
                        <p className="text-xs text-muted-foreground">Certificate No: {cert.certificateNumber}</p>
                        {cert.trainerName && (
                          <p className="text-xs text-muted-foreground">Trainer: {cert.trainerName}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(cert.trainingName, cert.certificateNumber, cert.issuedAt, cert.trainerName)}
                        >
                          <Eye className="h-4 w-4" />
                          View certificate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(cert.trainingName, cert.certificateNumber, cert.issuedAt, cert.trainerName)}
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(cert.trainingName, cert.certificateNumber, cert.issuedAt, cert.trainerName)}
                        >
                          <Printer className="h-4 w-4" />
                          Print certificate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {hasAnyTraining && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">In Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formations
                  .filter((f) => !f.eligible)
                  .map((f) => {
                    const missingLevels = Math.max(0, f.totalLevels - f.levelsCompleted);
                    const missingSessions = Math.max(0, f.totalSessions - f.attendedSessions);
                    const progress = typeof f.progress === "number"
                      ? f.progress
                      : f.totalSessions > 0
                      ? Math.round((f.attendedSessions / f.totalSessions) * 100)
                      : 0;
                    return (
                      <Card
                        key={f.training.id}
                        role="region"
                        tabIndex={0}
                        aria-label={`Certificate status for ${f.training.name}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base">{f.training.name}</CardTitle>
                            <Badge variant="outline">Not eligible</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Progress: {progress}%</div>
                            <ProgressBar value={progress} />
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Info className="h-4 w-4" aria-hidden="true" />
                            You need to complete {missingLevels} more level(s) or {missingSessions} session(s).
                          </div>
                          <div>
                            <Button size="sm" variant="outline" disabled>
                              Certificate not available yet
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
