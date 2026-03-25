import { useRef, useState, useCallback } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);
    } catch (err: any) {
      setError("Gagal mengakses kamera: " + (err.message || "Izin ditolak"));
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
        stopCamera();
        onCapture(file);
      }
    }, "image/jpeg", 0.9);
  }, [stopCamera, onCapture]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
      <div className="w-full max-w-lg mx-4 rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">📷 Ambil Foto dari Kamera</h3>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="relative rounded-md overflow-hidden bg-secondary aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!active && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Buka Kamera
              </button>
            </div>
          )}
        </div>

        {active && (
          <div className="flex gap-3">
            <button
              onClick={capture}
              className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
            >
              📸 Ambil Foto
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-md bg-secondary text-foreground text-sm hover:opacity-80 transition-opacity"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
