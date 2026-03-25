import { useState, useCallback, useRef, useEffect } from "react";
import MapPicker from "@/components/MapPicker";
import WatermarkPreview from "@/components/WatermarkPreview";

const TIMEZONE_OPTIONS = ["WIB", "WITA", "WIT", "UTC"];

const Index = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [lat, setLat] = useState(0.561515);
  const [lng, setLng] = useState(122.2187417);
  const [locationName, setLocationName] = useState("OMUTO");
  const [address, setAddress] = useState("Omuto, Gorontalo Utara, Gorontalo, Sulawesi, Indonesia");
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " PM";
  });
  const [timezone, setTimezone] = useState("WITA");
  const [watermarked, setWatermarked] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("GPS tidak didukung di browser ini.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationChange(latitude, longitude);
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        alert("Gagal mendapatkan lokasi: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setFileName(file.name);
      setWatermarked(false);
    }
  };

  const handleLocationChange = useCallback(async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    // Reverse geocode
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=14&addressdetails=1`
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
        const parts = data.address;
        setLocationName(
          (parts?.village || parts?.town || parts?.city || parts?.county || "").toUpperCase()
        );
      }
    } catch {
      // silent
    }
  }, []);

  const handleApplyWatermark = () => {
    setWatermarked(true);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `watermark_${fileName || "image"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTime(e.target.value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              KHAIR TIMESTAMP PRO
            </h1>
            <p className="text-xs text-muted-foreground">AI Pembuat Timestamp Buatan Khair</p>
          </div>
          <span className="text-xs text-muted-foreground">v2.1 Fix Watermark</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Step 1: Photo Upload */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">1</span>
              <span className="text-sm font-semibold text-step-label uppercase tracking-wide">Foto Objek</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-secondary">
              <label className="px-4 py-1.5 rounded text-xs font-semibold bg-primary text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity">
                Choose File
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <span className="text-sm text-muted-foreground truncate">{fileName || "Belum ada file"}</span>
            </div>
          </section>

          {/* Step 2: Map Location */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">2</span>
              <span className="text-sm font-semibold text-step-label uppercase tracking-wide">Lokasi Peta</span>
            </div>
            <div className="rounded-md border border-border overflow-hidden">
              <MapPicker lat={lat} lng={lng} onLocationChange={handleLocationChange} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <input
                type="text"
                value={lat.toFixed(7)}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 rounded-md border border-border bg-secondary text-foreground text-sm"
              />
              <input
                type="text"
                value={lng.toFixed(7)}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 rounded-md border border-border bg-secondary text-foreground text-sm"
              />
            </div>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full mt-3 px-3 py-2 rounded-md border border-border bg-secondary text-foreground text-sm"
              placeholder="Nama lokasi"
            />
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full mt-3 px-3 py-2 rounded-md border border-border bg-secondary text-foreground text-sm resize-none"
              rows={2}
              placeholder="Alamat lengkap"
            />
          </section>

          {/* Step 3: Date/Time */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">3</span>
              <span className="text-sm font-semibold text-step-label uppercase tracking-wide">Keterangan Waktu & Proses</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Atur Tanggal & Jam</label>
                <input
                  type="text"
                  value={dateTime}
                  onChange={handleDateTimeChange}
                  className="w-full px-3 py-2 rounded-md border border-border bg-secondary text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Zona Waktu</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-secondary text-foreground text-sm"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <button
            onClick={handleApplyWatermark}
            disabled={!imageFile}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Terapkan Watermark
          </button>
        </div>

        {/* Right Column - Preview */}
        <div>
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <span>✓</span> Preview Laporan
          </h2>
          {watermarked ? (
            <WatermarkPreview
              imageFile={imageFile}
              locationName={locationName}
              address={address}
              lat={lat}
              lng={lng}
              dateTime={dateTime}
              timezone={timezone}
              onCanvasReady={(c) => { canvasRef.current = c; }}
            />
          ) : (
            <div className="flex items-center justify-center h-48 rounded-md border border-border bg-secondary">
              <p className="text-muted-foreground text-sm">Klik "Terapkan Watermark" untuk preview</p>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={!watermarked}
            className="w-full mt-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Simpan Gambar Ke Galeri
          </button>
        </div>
      </main>
    </div>
  );
};

export default Index;
