import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [status, setStatus] = useState("ক্যামেরা চালু করছি...");
  const [lastScan, setLastScan] = useState("");
  const [error, setError] = useState("");

  // Step 1: On mount — request permission first, then list cameras
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    requestAndStart();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    try { controlsRef.current?.stop(); } catch {}
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
  };

  const requestAndStart = async () => {
    try {
      // Request camera permission — this triggers the permission dialog
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      // Attach stream to video so user can see it
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("ক্যামেরা চালু হয়েছে। স্ক্যান করুন...");

      // Now list available cameras for switching
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setCameras(videoDevices);

      // Find back camera device id
      const back = videoDevices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("environment") ||
        d.label.toLowerCase().includes("0,")
      );
      const deviceId = back?.deviceId || videoDevices[videoDevices.length - 1]?.deviceId;

      // Stop the preview stream and start zxing scanner on same camera
      stream.getTracks().forEach(t => t.stop());
      startZxing(deviceId || undefined);

    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("❌ ক্যামেরার অনুমতি দেননি। Browser settings থেকে Camera allow করুন।");
      } else if (err.name === "NotFoundError") {
        setError("❌ কোনো ক্যামেরা পাওয়া যায়নি।");
      } else {
        setError("❌ ক্যামেরা চালু করতে সমস্যা: " + err.message);
      }
    }
  };

  const startZxing = (deviceId) => {
    // Stop previous controls if any
    try { controlsRef.current?.stop(); } catch {}

    setStatus("স্ক্যান করুন...");

    readerRef.current
      .decodeFromVideoDevice(deviceId, videoRef.current, (result, err, controls) => {
        controlsRef.current = controls;
        if (result) {
          const text = result.getText();
          setLastScan(text);
          setStatus(`✅ পাওয়া গেছে!`);
          controls.stop();
          setTimeout(() => onDetected(text), 200);
        }
      })
      .catch(e => {
        setError("❌ Scanner error: " + e.message);
      });
  };

  const switchCamera = async (deviceId) => {
    setSelectedCamera(deviceId);
    setStatus("ক্যামেরা বদলাচ্ছি...");
    startZxing(deviceId);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.92)",
      zIndex: 9999,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      paddingTop: 16,
    }}>
      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 500,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 16px 12px",
      }}>
        <div style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
          📷 Barcode Scanner
        </div>
        <button
          onClick={() => { cleanup(); onClose(); }}
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

      {/* Video container */}
      <div style={{
        width: "100%", maxWidth: 500,
        borderRadius: 16, overflow: "hidden",
        background: "#111",
        position: "relative",
        aspectRatio: "4/3",
      }}>
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
          }}
        />

        {/* Scan frame overlay */}
        {!error && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              width: "65%", height: "50%",
              border: "3px solid #4f46e5",
              borderRadius: 12,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                left: 0, right: 0, height: 3,
                background: "rgba(99, 102, 241, 0.9)",
                animation: "scanLine 2s linear infinite",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{ marginTop: 16, textAlign: "center", padding: "0 20px" }}>
        {error ? (
          <div>
            <p style={{ color: "#fca5a5", fontWeight: "bold", fontSize: 15 }}>{error}</p>
            <button
              onClick={requestAndStart}
              style={{
                marginTop: 10, padding: "10px 24px",
                background: "#4f46e5", color: "#fff",
                border: "none", borderRadius: 8,
                fontWeight: "bold", fontSize: 14, cursor: "pointer",
              }}
            >
              🔄 আবার চেষ্টা করুন
            </button>
          </div>
        ) : (
          <p style={{ color: "#a5b4fc", fontSize: 15 }}>{status}</p>
        )}
        {lastScan && (
          <p style={{ color: "#86efac", fontWeight: "bold", fontSize: 16, marginTop: 4 }}>
            বারকোড: {lastScan}
          </p>
        )}
      </div>

      {/* Camera switcher */}
      {cameras.length > 1 && (
        <div style={{ marginTop: 14 }}>
          <select
            value={selectedCamera || ""}
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
          0%   { top: 0; }
          50%  { top: calc(100% - 3px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
