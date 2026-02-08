import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { extractDescriptorFromBase64, descriptorToArray } from "@/lib/faceRecognition";

interface FaceLoginProps {
  onLogin: (faceData: string) => Promise<void>;
  isLoading?: boolean;
}

export function FaceLogin({ onLogin, isLoading = false }: FaceLoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastScanTime = useRef<number>(0);
  const isProcessing = useRef<boolean>(false);
  const failedAttempts = useRef<number>(0);

  useEffect(() => {
    if (!isScanning) return;

    const startCamera = async () => {
      try {
        setError(null);
        failedAttempts.current = 0;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setMessage("Visage détecté. Reconnaissance en cours...");
          startContinuousScan();
        }
      } catch (err) {
        setError(
          "Accès à la caméra refusé. Veuillez activer les permissions de caméra."
        );
        setIsScanning(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isScanning]);

  const startContinuousScan = () => {
    const scan = () => {
      const now = Date.now();
      const timeSinceLastScan = now - lastScanTime.current;
      
      // Only attempt recognition every 2 seconds and if not already processing
      if (timeSinceLastScan >= 2000 && !isProcessing.current && isScanning) {
        if (videoRef.current && canvasRef.current) {
          const context = canvasRef.current.getContext("2d");
          if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            const imageData = canvasRef.current.toDataURL("image/jpeg", 0.8);
            
            lastScanTime.current = now;
            handleFaceRecognition(imageData);
          }
        }
      }
      
      // Stop scanning after 10 failed attempts
      if (failedAttempts.current >= 10) {
        setError("Trop de tentatives échouées. Veuillez réessayer.");
        setIsScanning(false);
        return;
      }
      
      animationFrameId.current = requestAnimationFrame(scan);
    };
    scan();
  };

  const handleFaceRecognition = async (imageData: string) => {
    if (isProcessing.current) return;
    
    isProcessing.current = true;
    try {
      setError(null);
      
      // Extract face descriptor
      const descriptor = await extractDescriptorFromBase64(imageData);
      
      if (!descriptor) {
        throw new Error("Aucun visage détecté");
      }
      
      // Convert to array and send to server
      const descriptorArray = descriptorToArray(descriptor);
      const faceData = JSON.stringify({
        descriptor: descriptorArray,
        timestamp: new Date().toISOString(),
      });
      
      await onLogin(faceData);
      setIsScanning(false);
      setMessage("Authentification réussie!");
      failedAttempts.current = 0;
    } catch (err: any) {
      failedAttempts.current += 1;
      if (err.message.includes("No matching face") || err.message.includes("Aucun visage")) {
        setError(`Visage non reconnu. Tentative ${failedAttempts.current}/10`);
      } else if (err.message.includes("Multiple faces")) {
        setMessage("Plusieurs visages détectés. Assurez-vous d'être seul.");
      } else {
        setError(err.message || "Erreur de reconnaissance faciale");
      }
    } finally {
      isProcessing.current = false;
    }
  };

  const handleCancel = () => {
    setIsScanning(false);
    setError(null);
    setMessage(null);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Connexion par reconnaissance faciale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="text-sm text-sky-600 bg-sky-50 p-3 rounded-md">
            {message}
          </div>
        )}

        {!isScanning && (
          <Button
            onClick={() => setIsScanning(true)}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <Camera className="h-4 w-4 mr-2" />
            Utiliser le visage
          </Button>
        )}

        {isScanning && (
          <div className="space-y-3">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-sky-500 opacity-50 pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Scanning visage...</p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Annuler
            </Button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <p className="text-xs text-slate-500 text-center">
          Assurez-vous que votre visage est bien visible dans le cadre.
          Reconnaissance faciale par face-api.js.
        </p>
      </CardContent>
    </Card>
  );
}
