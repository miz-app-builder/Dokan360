import { useState } from "react";
import { API } from "../api";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Setup mode — first time admin create
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ username: "", password: "", confirm: "" });
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMsg, setSetupMsg] = useState({ type: "", text: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("dokan360_token", res.data.token);
      localStorage.setItem("dokan360_user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "লগইন ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (setupForm.password !== setupForm.confirm) {
      setSetupMsg({ type: "error", text: "দুটো password মিলছে না।" });
      return;
    }
    setSetupLoading(true);
    try {
      await API.post("/auth/setup", {
        username: setupForm.username,
        password: setupForm.password,
      });
      setSetupMsg({ type: "success", text: "✅ Admin তৈরি হয়েছে! এখন লগইন করুন।" });
      setTimeout(() => {
        setShowSetup(false);
        setSetupMsg({ type: "", text: "" });
        setForm({ username: setupForm.username, password: "" });
      }, 2000);
    } catch (err) {
      setSetupMsg({ type: "error", text: err.response?.data?.error || "সমস্যা হয়েছে।" });
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 40,
        width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
          <h1 style={{ margin: 0, color: "#1e1b4b", fontSize: 26, fontWeight: "bold" }}>Dokan360</h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
            {showSetup ? "প্রথমবার Admin তৈরি করুন" : "আপনার account এ লগইন করুন"}
          </p>
        </div>

        {/* LOGIN FORM */}
        {!showSetup && (
          <form onSubmit={handleLogin}>
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fca5a5",
                color: "#ef4444", borderRadius: 8, padding: "10px 14px",
                marginBottom: 16, fontWeight: "bold", fontSize: 14,
              }}>
                ❌ {error}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                placeholder="admin"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={inputStyle}
                required
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "12px",
                background: loading ? "#d1d5db" : "#4f46e5",
                color: "#fff", border: "none", borderRadius: 8,
                fontWeight: "bold", fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "লগইন হচ্ছে..." : "🔐 লগইন করুন"}
            </button>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                style={{
                  background: "none", border: "none",
                  color: "#4f46e5", fontSize: 13, cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                প্রথমবার? Admin account তৈরি করুন
              </button>
            </div>
          </form>
        )}

        {/* FIRST-TIME SETUP FORM */}
        {showSetup && (
          <form onSubmit={handleSetup}>
            {setupMsg.text && (
              <div style={{
                background: setupMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${setupMsg.type === "success" ? "#86efac" : "#fca5a5"}`,
                color: setupMsg.type === "success" ? "#16a34a" : "#ef4444",
                borderRadius: 8, padding: "10px 14px",
                marginBottom: 16, fontWeight: "bold", fontSize: 14,
              }}>
                {setupMsg.text}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Admin Username</label>
              <input
                placeholder="admin"
                value={setupForm.username}
                onChange={e => setSetupForm({ ...setupForm, username: e.target.value })}
                style={inputStyle}
                required
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                placeholder="শক্তিশালী password দিন"
                value={setupForm.password}
                onChange={e => setSetupForm({ ...setupForm, password: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password নিশ্চিত করুন</label>
              <input
                type="password"
                placeholder="আবার লিখুন"
                value={setupForm.confirm}
                onChange={e => setSetupForm({ ...setupForm, confirm: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <button
              type="submit"
              disabled={setupLoading}
              style={{
                width: "100%", padding: "12px",
                background: setupLoading ? "#d1d5db" : "#16a34a",
                color: "#fff", border: "none", borderRadius: 8,
                fontWeight: "bold", fontSize: 16,
                cursor: setupLoading ? "not-allowed" : "pointer",
              }}
            >
              {setupLoading ? "তৈরি হচ্ছে..." : "✅ Admin তৈরি করুন"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowSetup(false)}
                style={{
                  background: "none", border: "none",
                  color: "#6b7280", fontSize: 13, cursor: "pointer",
                }}
              >
                ← লগইনে ফিরুন
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: "bold",
  color: "#374151", marginBottom: 6,
};
const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: "2px solid #e5e7eb", borderRadius: 8,
  fontSize: 14, boxSizing: "border-box", outline: "none",
};
