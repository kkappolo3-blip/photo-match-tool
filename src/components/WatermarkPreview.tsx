import { useRef, useEffect, useState } from "react";

interface WatermarkPreviewProps {
  imageFile: File | null;
  locationName: string;
  address: string;
  lat: number;
  lng: number;
  dateTime: string;
  timezone: string;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

export default function WatermarkPreview({
  imageFile,
  locationName,
  address,
  lat,
  lng,
  dateTime,
  timezone,
  onCanvasReady,
}: WatermarkPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    }
    setImageSrc(null);
  }, [imageFile]);

  // Load static map image
  useEffect(() => {
    const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=13&size=150x100&markers=${lat},${lng},red-pushpin`;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setMapImage(img);
    img.onerror = () => setMapImage(null);
    img.src = mapUrl;
  }, [lat, lng]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      // Watermark overlay at bottom
      const overlayHeight = img.height * 0.22;
      const overlayY = img.height - overlayHeight;

      // Semi-transparent dark overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, overlayY, img.width, overlayHeight);

      const padding = img.width * 0.03;
      const fontSize = Math.max(12, img.width * 0.025);

      // Location name (bold, yellow)
      ctx.fillStyle = "#FFD700";
      ctx.font = `bold ${fontSize * 1.4}px sans-serif`;
      ctx.fillText(locationName || "LOKASI", padding, overlayY + fontSize * 2);

      // Address
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `${fontSize}px sans-serif`;
      const maxTextWidth = img.width * 0.65;
      const words = address.split(" ");
      let line = "";
      let lineY = overlayY + fontSize * 3.5;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > maxTextWidth && line) {
          ctx.fillText(line.trim(), padding, lineY);
          line = word + " ";
          lineY += fontSize * 1.3;
        } else {
          line = test;
        }
      }
      ctx.fillText(line.trim(), padding, lineY);

      // Coordinates
      lineY += fontSize * 1.8;
      ctx.fillStyle = "#AAAAAA";
      ctx.font = `${fontSize * 0.85}px sans-serif`;
      ctx.fillText(`Lat ${lat.toFixed(7)}, Long ${lng.toFixed(7)}`, padding, lineY);

      // Date/time
      lineY += fontSize * 1.3;
      ctx.fillText(`${dateTime} ${timezone}`, padding, lineY);

      // Draw mini map on right side
      if (mapImage) {
        const mapW = img.width * 0.2;
        const mapH = overlayHeight * 0.8;
        const mapX = img.width - mapW - padding;
        const mapY = overlayY + (overlayHeight - mapH) / 2;
        ctx.drawImage(mapImage, mapX, mapY, mapW, mapH);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(mapX, mapY, mapW, mapH);
      }

      onCanvasReady?.(canvas);
    };
    img.src = imageSrc;
  }, [imageSrc, locationName, address, lat, lng, dateTime, timezone, mapImage, onCanvasReady]);

  if (!imageFile) {
    return (
      <div className="flex items-center justify-center h-48 rounded-md border border-border bg-secondary">
        <p className="text-muted-foreground text-sm">Upload foto untuk melihat preview</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-md"
      style={{ maxHeight: "350px", objectFit: "contain" }}
    />
  );
}
