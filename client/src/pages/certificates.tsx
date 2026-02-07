import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Award, Printer, Download, Eye, CheckCircle2 } from "lucide-react";
interface EligibleStudent {
  studentId: string;
  studentName: string;
  trainingId: string;
  trainingName: string;
  completedLevels: number;
  totalLevels: number;
  alreadyCertified: boolean;
  certificateNumber?: string;
}

interface CertificateWithDetails {
  id: string;
  studentId: string;
  trainingId: string;
  issuedAt: string;
  certificateNumber: string;
  studentName: string;
  trainingName: string;
}

export default function CertificatesPage() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    studentName: string;
    trainingName: string;
    certificateNumber: string;
    issuedAt: string;
  } | null>(null);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: eligible = [], isLoading: loadingEligible } = useQuery<EligibleStudent[]>({
    queryKey: ["/api/certificates/eligible"],
  });

  const { data: issued = [], isLoading: loadingIssued } = useQuery<CertificateWithDetails[]>({
    queryKey: ["/api/certificates"],
  });

  const generateMutation = useMutation({
    mutationFn: async ({ studentId, trainingId }: { studentId: string; trainingId: string }) => {
      const res = await apiRequest("POST", "/api/certificates", { studentId, trainingId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/eligible"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Certificat genere avec succes" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur lors de la generation", description: error.message, variant: "destructive" });
    },
  });

  const handlePreview = (data: {
    studentName: string;
    trainingName: string;
    certificateNumber: string;
    issuedAt: string;
  }) => {
    setPreviewData(data);
    setPreviewOpen(true);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Certificate - ${previewData?.certificateNumber}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Georgia', serif; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
              </style>
            </head>
            <body>${printRef.current.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-certificates-title">Certificats</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generer et gerer les certificats de formation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Eleves eligibles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingEligible ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : eligible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Aucun eleve eligible</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les eleves doivent completer tous les niveaux pour etre eligibles
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Eleve</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead className="hidden sm:table-cell">Completion</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligible.map((e) => (
                  <TableRow key={`${e.studentId}-${e.trainingId}`} data-testid={`row-eligible-${e.studentId}-${e.trainingId}`}>
                    <TableCell className="font-medium text-sm">{e.studentName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.trainingName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="default" className="text-xs">
                        {e.completedLevels}/{e.totalLevels} niveaux
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.alreadyCertified ? (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Certifie
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            generateMutation.mutate({
                              studentId: e.studentId,
                              trainingId: e.trainingId,
                            })
                          }
                          disabled={generateMutation.isPending}
                          data-testid={`button-generate-cert-${e.studentId}-${e.trainingId}`}
                        >
                          <Award className="h-3.5 w-3.5 mr-1.5" />
                          Generer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificats delivres
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingIssued ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : issued.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Aucun certificat delivre</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generez des certificats pour les eleves eligibles ci-dessus
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° certificat</TableHead>
                  <TableHead>Eleve</TableHead>
                  <TableHead className="hidden sm:table-cell">Formation</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-[80px]">Voir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issued.map((cert) => (
                  <TableRow key={cert.id} data-testid={`row-certificate-${cert.id}`}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {cert.certificateNumber}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{cert.studentName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {cert.trainingName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {cert.issuedAt}
                    </TableCell>
                    <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handlePreview({
                              studentName: cert.studentName,
                              trainingName: cert.trainingName,
                              certificateNumber: cert.certificateNumber,
                              issuedAt: cert.issuedAt,
                            })
                          }
                          data-icon-label={`Previsualiser le certificat de ${cert.studentName}`}
                          data-testid={`button-view-cert-${cert.id}`}
                        >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Apercu du certificat
              <Button size="sm" variant="outline" onClick={handlePrint} data-testid="button-print-cert">
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Imprimer
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewData && (
            <div ref={printRef}>
              <div
                style={{
                  border: "3px solid hsl(210, 85%, 42%)",
                  borderRadius: "8px",
                  padding: "40px",
                  textAlign: "center",
                  background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    border: "1px solid hsl(210, 85%, 72%)",
                    borderRadius: "4px",
                    padding: "30px",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", letterSpacing: "3px", color: "#64748b", textTransform: "uppercase" }}>
                      Association Sciences and Technology Ben Arous
                    </span>
                  </div>
                  <h2
                    style={{
                      fontSize: "28px",
                      fontFamily: "Georgia, serif",
                      color: "hsl(210, 85%, 42%)",
                      marginBottom: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    Certificat de Reussite
                  </h2>
                  <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px" }}>
                    Nous certifions que
                  </p>
                  <p
                    style={{
                      fontSize: "24px",
                      fontFamily: "Georgia, serif",
                      fontWeight: "bold",
                      color: "#1e293b",
                      marginBottom: "8px",
                    }}
                  >
                    {previewData.studentName}
                  </p>
                  <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                    a complete avec succes tous les niveaux du programme de formation
                  </p>
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "hsl(210, 85%, 42%)",
                      marginBottom: "24px",
                    }}
                  >
                    {previewData.trainingName}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginTop: "32px",
                      paddingTop: "16px",
                      borderTop: "1px solid #cbd5e1",
                    }}
                  >
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>Numero de certificat</p>
                      <p style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: "600" }}>
                        {previewData.certificateNumber}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>Date de delivrance</p>
                      <p style={{ fontSize: "12px", fontWeight: "600" }}>
                        {previewData.issuedAt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
