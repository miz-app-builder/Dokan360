import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [activeCamId, setActiveCamId] = useState(null);
  const [status, setStatus] = useState("ক্যামেরা চালু হচ্ছে...");
  const [error, setError] = useState("");
  const [lastScan, setLastScan] = useState("");

  useEffect(() => {
    startScanner();
    return () => stop();
  }, []);

  const stop = () => {
    try { controlsRef.current?.stop(); } catch {}
  };

  const startScanner = async (deviceId) => {
    stop();
    setError("");
    setStatus("ক্যামেরা চালু হচ্ছে...");

    const reader = new BrowserMultiFormatReader();

    try {
      // Use constraints — this triggers permission popup automatically
      const constraints = deviceId
        ? { video: { deviceId: { exact: deviceId } } }
        : { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } };

      const controls = await reader.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            setLastScan(text);
            setStatus("✅ পাওয়া গেছে!");
            controls.stop();
            setTimeout(() => onDetected(text), 200);
          }
        }
      );

      controlsRef.current = controls;
      setStatus("স্ক্যান করুন — বারকোডটি ফ্রেমের মধ্যে ধরুন");

      // After starting, list cameras for switching option
      if (!deviceId) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vids = devices.filter(d => d.kind === "videoinput");
        setCameras(vids);
        if (vids.length > 0) {
          const back = vids.find(d =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          );
          setActiveCamId((back || vids[vids.length - 1]).deviceId);
        }
      }

    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("❌ ক্যামেরার অনুমতি দেননি। Browser এ Camera permission Allow করুন।");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("❌ কোনো ক্যামেরা পাওয়া যায়নি।");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("❌ ক্যামেরা অন্য app ব্যবহার করছে। সেটি বন্ধ করে আবার চেষ্টা করুন।");
      } else {
        setError("❌ ক্যামেরা error: " + (err.message || err.name));
      }
    }
  };

  const switchCamera = (deviceId) => {
    setActiveCamId(deviceId);
    startScanner(deviceId);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.93)",
      zIndex: 9999,
      display: "flex", flexDirection: "column",
      alignItems: "center",
      paddingTop: 12,
    }}>

      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 520,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 16px 10px",
      }}>
        <span style={{ color: "#fff", fontWeight: "bold", fontSize: 17 }}>
          📷 Barcode Scanner
        </span>
        <button
          onClick={() => { stop(); onClose(); }}
          style={{
            background: "#ef4444", color: "#fff",
            border: "none", borderRadius: 8,
            padding: "8px 18px", fontWeight: "bold",
            fontSize: 14, cursor: "pointer",
          }}
        >
          ✕ বন্ধ করুন
        </button>
      </div>

      {/* Video */}
      <div style={{
        width: "100%", maxWidth: 520,
        aspectRatio: "4/3",
        borderRadius: 12,
        overflow: "hidden",
        background: "#000",
        position: "relative",
      }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Scanning frame */}
        {!error && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              width: "60%", height: "55%",
              border: "3px solid #6366f1",
              borderRadius: 14,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.38)",
              position: "relative", overflow: "hidden",
            }}>
              {/* Corner accents */}
              {[
                { top: -2, left: -2, borderTop: "5px solid #4f46e5", borderLeft: "5px solid #4f46e5" },
                { top: -2, right: -2, borderTop: "5px solid #4f46e5", borderRight: "5px solid #4f46e5" },
                { bottom: -2, left: -2, borderBottom: "5px solid #4f46e5", borderLeft: "5px solid #4f46e5" },
                { bottom: -2, right: -2, borderBottom: "5px solid #4f46e5", borderRight: "5px solid #4f46e5" },
              ].map((s, i) => (
                <div key={i} style={{ position: "absolute", width: 18, height: 18, borderRadius: 2, ...s }} />
              ))}
              {/* Scan line */}
              <div style={{
                position: "absolute", left: 0, right: 0, height: 2,
                background: "rgba(99, 102, 241, 0.85)",
                animation: "scanLine 2s ease-in-out infinite",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Status / Error */}
      <div style={{ marginTop: 14, textAlign: "center", padding: "0 20px", width: "100%", maxWidth: 520 }}>
        {error ? (
          <div>
            <p style={{ color: "#fca5a5", fontWeight: "bold", fontSize: 14, marginBottom: 12 }}>{error}</p>
            <button
              onClick={() => startScanner()}
              style={{
                padding: "10px 28px", background: "#4f46e5", color: "#fff",
                border: "none", borderRadius: 8,
                fontWeight: "bold", fontSize: 14, cursor: "pointer",
              }}
            >
              🔄 আবার চেষ্টা করুন
            </button>
          </div>
        ) : (
          <p style={{ color: "#a5b4fc", fontSize: 14 }}>{status}</p>
        )}
        {lastScan && (
          <p style={{ color: "#86efac", fontWeight: "bold", fontSize: 15, marginTop: 6 }}>
            বারকোড: {lastScan}
          </p>
        )}
      </div>

      {/* Camera switch (only if multiple cameras) */}
      {cameras.length > 1 && !error && (
        <div style={{ marginTop: 14 }}>
          <select
            value={activeCamId || ""}
            onChange={e => switchCamera(e.target.value)}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid #4f46e5",
              background: "#1e1b4b", color: "#fff",
              fontSize: 13, cursor: "pointer",
            }}
          >
            {cameras.map((cam, i) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `ক্যামেরা ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%   { top: 0; opacity: 1; }
          50%  { top: calc(100% - 2px); opacity: 0.7; }
          100% { top: 0; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
