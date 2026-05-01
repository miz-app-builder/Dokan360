import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [status, setStatus] = useState("ক্যামেরা খুলছে...");
  const [lastScan, setLastScan] = useState("");
  const [error, setError] = useState("");

  // Init reader and list cameras
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();

    BrowserMultiFormatReader.listVideoInputDevices()
      .then(devices => {
        if (devices.length === 0) {
          setError("কোনো ক্যামেরা পাওয়া যায়নি।");
          return;
        }
        setCameras(devices);
        // Prefer back camera
        const back = devices.find(d =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
        );
        setSelectedCamera((back || devices[devices.length - 1]).deviceId);
      })
      .catch(() => setError("ক্যামেরার অনুমতি নেই বা সমস্যা হয়েছে।"));

    return () => {
      stopScanner();
    };
  }, []);

  // Start scanning when camera selected
  useEffect(() => {
    if (!selectedCamera || !videoRef.current) return;
    startScanner(selectedCamera);
    return () => stopScanner();
  }, [selectedCamera]);

  const startScanner = (deviceId) => {
    stopScanner();
    setStatus("স্ক্যান করুন...");
    setError("");

    readerRef.current
      .decodeFromVideoDevice(deviceId, videoRef.current, (result, err, controls) => {
        controlsRef.current = controls;
        if (result) {
          const text = result.getText();
          setLastScan(text);
          setStatus(`✅ পাওয়া গেছে: ${text}`);
          // Stop and call parent
          controls.stop();
          setTimeout(() => onDetected(text), 300);
        }
        // Errors between frames are normal — ignored
      })
      .catch(() => {
        setError("ক্যামেরা চালু করতে সমস্যা হয়েছে। অনুমতি দিন।");
      });
  };

  const stopScanner = () => {
    try {
      controlsRef.current?.stop();
    } catch {}
  };

  const handleCameraChange = (deviceId) => {
    setSelectedCamera(deviceId);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.85)",
      zIndex: 9999,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 16px 12px",
      }}>
        <div style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
          📷 Barcode Scanner
        </div>
        <button
          onClick={() => { stopScanner(); onClose(); }}
          style={{
            background: "#ef4444", color: "#fff",
            border: "none", borderRadius: 8,
            padding: "8px 16px", fontWeight: "bold",
            fontSize: 14, cursor: "pointer",
          }}
        >
          ✕ বন্ধ করুন
        </button>
      </div>

      {/* Camera view */}
      <div style={{
        position: "relative",
        width: "100%", maxWidth: 480,
        borderRadius: 16, overflow: "hidden",
        background: "#000",
        aspectRatio: "4/3",
      }}>
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Scan line animation */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            width: "70%", height: "70%",
            border: "2px solid rgba(79, 70, 229, 0.8)",
            borderRadius: 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
          }}>
            <div style={{
              width: "100%", height: 3,
              background: "rgba(79, 70, 229, 0.9)",
              animation: "scanLine 2s linear infinite",
            }} />
          </div>
        </div>
      </div>

      {/* Status / Error */}
      <div style={{ marginTop: 14, textAlign: "center", padding: "0 20px" }}>
        {error ? (
          <p style={{ color: "#fca5a5", fontWeight: "bold", fontSize: 15 }}>{error}</p>
        ) : (
          <p style={{ color: "#a5b4fc", fontSize: 15 }}>{status}</p>
        )}
        {lastScan && (
          <p style={{
            color: "#86efac", fontWeight: "bold",
            fontSize: 16, marginTop: 4,
          }}>
            বারকোড: {lastScan}
          </p>
        )}
      </div>

      {/* Camera selector (if multiple) */}
      {cameras.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <select
            value={selectedCamera}
            onChange={e => handleCameraChange(e.target.value)}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid #4f46e5",
              background: "#1e1b4b", color: "#fff",
              fontSize: 13, cursor: "pointer",
            }}
          >
            {cameras.map(cam => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `ক্যামেরা ${cam.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scan line CSS */}
      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(0); opacity: 1; }
          50%  { transform: translateY(200px); opacity: 0.6; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
