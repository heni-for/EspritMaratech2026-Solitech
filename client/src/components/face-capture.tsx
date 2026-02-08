import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Check, X, Loader2 } from "lucide-react";
import { extractDescriptorFromBase64, descriptorToArray } from "@/lib/faceRecognition";

interface FaceCaptureProps {
  onCapture: (faceData: string) => void;
  isLoading?: boolean;
}

export function FaceCapture({ onCapture, isLoading = false }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isCameraActive) return;

    const startCamera = async () => {
      try {
        setError(null);
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
          // Ensure video starts playing
          videoRef.current.play().catch(err => {
            console.error("[FaceCapture] Video play error:", err);
          });
        }
      } catch (err) {
        setError(
          "Camera access denied. Please enable camera permissions to use face ID."
        );
        setIsCameraActive(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isCameraActive]);

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        setIsProcessing(true);
        setError(null);
        
        try {
          // Ensure video is ready
          if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            throw new Error("Camera not ready. Please wait a moment and try again.");
          }

          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          
          // Use PNG for better face detection quality
          const imageData = canvasRef.current.toDataURL("image/png");
          if (!imageData || imageData.length < 1000) {
            throw new Error("Impossible de capturer l'image. Vérifiez que la caméra fonctionne.");
          }
          
          console.log("[FaceCapture] Image captured, attempting face detection...");
          
          // Try to extract face descriptor using face-api.js
          try {
            const descriptor = await extractDescriptorFromBase64(imageData);
            
            if (!descriptor) {
              throw new Error("Aucun visage détecté");
            }
            
            console.log("[FaceCapture] Face detected successfully!");
          } catch (detectionError) {
            // Fallback: accept the photo even if face detection fails
            console.warn("[FaceCapture] Face detection failed, accepting photo as visual reference:", detectionError);
            setError("Détection optimisée indisponible. Votre photo a été capturée.");
          }
          
          // Store image (for display and backup)
          setCapturedImage(imageData);
          
          // Stop camera
          if (videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach((track) => track.stop());
          }
          setIsCameraActive(false);
        } catch (err: any) {
          setError(err.message || "Erreur lors de la détection du visage");
          console.error("[FaceCapture] Error:", err);
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const handleAccept = async () => {
    if (capturedImage) {
      setIsProcessing(true);
      setError(null);
      
      try {
        let descriptor: Float32Array | null = null;
        
        // Try to extract descriptor for ML-based matching
        try {
          descriptor = await extractDescriptorFromBase64(capturedImage);
          console.log("[FaceCapture] Descriptor extracted for ML matching");
        } catch (detectionError) {
          console.warn("[FaceCapture] ML descriptor extraction failed, using visual match only:", detectionError);
          // Continue without descriptor - use image-based matching as fallback
        }
        
        // Create face data with descriptor if available, or just image data
        const faceData = JSON.stringify({
          image: capturedImage, // Store actual image as fallback
          descriptor: descriptor ? descriptorToArray(descriptor) : null,
          capturedAt: new Date().toISOString(),
          method: descriptor ? "ml-based" : "image-based",
        });
        
        console.log("[FaceCapture] Saving face data with method:", descriptor ? "ml-based" : "image-based");
        onCapture(faceData);
      } catch (err: any) {
        setError(err.message || "Erreur lors de l'enregistrement");
        console.error("[FaceCapture] Error saving:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setError(null);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Enregistrement du visage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {!isCameraActive && !capturedImage && (
          <Button
            onClick={() => setIsCameraActive(true)}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <Camera className="h-4 w-4 mr-2" />
            Ouvrir la camera
          </Button>
        )}

        {isCameraActive && (
          <div className="space-y-3">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCapture}
                className="flex-1"
                disabled={isLoading || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Détection...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capturer
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsCameraActive(false)}
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-3">
            <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isLoading ? "Enregistrement..." : "Confirmer"}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 gap-2"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                Reprendre
              </Button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <p className="text-xs text-slate-500 text-center">
          Assurez-vous que votre visage est bien visible et bien éclairé. 
          Utilise face-api.js pour la reconnaissance faciale.
        </p>
      </CardContent>
    </Card>
  );
}
