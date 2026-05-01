import { useState } from "react";
import { API } from "../api";
import { useT } from "../context/SettingsContext";

const ACCENT  = "#6366f1";
const ACCENT2 = "#8b5cf6";

const inp = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.6)",
  border: "1.5px solid rgba(255,255,255,0.85)",
  borderRadius: 12, fontSize: 14, fontFamily: "inherit",
  color: "#1e1b4b", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const lbl = {
  display: "block", fontSize: 12, fontWeight: 700,
  color: "#6b7280", marginBottom: 6,
  textTransform: "uppercase", letterSpacing: "0.4px",
};

export default function Login({ onLogin }) {
  const t = useT();
  const [form, setForm]           = useState({ username: "", password: "" });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ username: "", password: "", confirm: "" });
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMsg, setSetupMsg]   = useState({ type: "", text: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("dokan360_token", res.data.token);
      localStorage.setItem("dokan360_user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || t("login_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (setupForm.password !== setupForm.confirm) {
      setSetupMsg({ type: "error", text: t("login_pw_mismatch") });
      return;
    }
    setSetupLoading(true);
    try {
      await API.post("/auth/setup", { username: setupForm.username, password: setupForm.password });
      setSetupMsg({ type: "success", text: t("login_setup_success") });
      setTimeout(() => {
        setShowSetup(false);
        setSetupMsg({ type: "", text: "" });
        setForm({ username: setupForm.username, password: "" });
      }, 2000);
    } catch (err) {
      setSetupMsg({ type: "error", text: err.response?.data?.error || t("error") });
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 40%, #dbeafe 80%, #f0fdf4 100%)",
      padding: 16,
    }}>
      <div style={{ position: "fixed", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(139,92,246,0.15)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: "rgba(99,102,241,0.12)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.9)",
        borderRadius: 24,
        padding: 36,
        boxShadow: "0 20px 60px rgba(99,102,241,0.15), 0 4px 16px rgba(0,0,0,0.06)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: "0 auto 14px",
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, boxShadow: `0 8px 24px ${ACCENT}40`,
          }}>🏪</div>
          <h1 style={{ margin: "0 0 6px", color: "#1e1b4b", fontSize: 26, fontWeight: 900 }}>Dokan360</h1>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>
            {showSetup ? t("login_subtitle_setup") : t("login_subtitle_login")}
          </p>
        </div>

        {!showSetup && (
          <form onSubmit={handleLogin}>
            {error && (
              <div style={{
                background: "rgba(254,242,242,0.9)", border: "1px solid #fca5a5",
                color: "#dc2626", borderRadius: 12, padding: "10px 14px",
                marginBottom: 16, fontWeight: 600, fontSize: 13,
              }}>❌ {error}</div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>{t("login_username")}</label>
              <input type="text" placeholder="admin" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={inp} required autoFocus
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.85)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={lbl}>{t("login_password")}</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={inp} required
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.85)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px",
              background: loading ? "rgba(209,213,219,0.8)" : `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
              color: "#fff", border: "none", borderRadius: 12,
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              boxShadow: loading ? "none" : `0 6px 20px ${ACCENT}40`,
              transition: "all 0.15s",
            }}>
              {loading ? t("login_logging") : t("login_btn")}
            </button>
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <button type="button" onClick={() => setShowSetup(true)} style={{
                background: "none", border: "none",
                color: ACCENT, fontSize: 13, cursor: "pointer",
                fontFamily: "inherit", fontWeight: 600, textDecoration: "underline",
              }}>{t("login_first_time")}</button>
            </div>
          </form>
        )}

        {showSetup && (
          <form onSubmit={handleSetup}>
            {setupMsg.text && (
              <div style={{
                background: setupMsg.type === "success" ? "rgba(240,253,244,0.9)" : "rgba(254,242,242,0.9)",
                border: `1px solid ${setupMsg.type === "success" ? "#86efac" : "#fca5a5"}`,
                color: setupMsg.type === "success" ? "#15803d" : "#dc2626",
                borderRadius: 12, padding: "10px 14px",
                marginBottom: 16, fontWeight: 600, fontSize: 13,
              }}>{setupMsg.text}</div>
            )}
            {[
              { label: "Admin Username", name: "username", type: "text", ph: "admin" },
              { label: t("login_password"), name: "password", type: "password", ph: t("login_setup_pw_ph") },
              { label: t("login_setup_confirm_label"), name: "confirm", type: "password", ph: t("login_setup_confirm_ph") },
            ].map((f, i) => (
              <div key={f.name} style={{ marginBottom: i < 2 ? 14 : 22 }}>
                <label style={lbl}>{f.label}</label>
                <input type={f.type} placeholder={f.ph}
                  value={setupForm[f.name]}
                  onChange={e => setSetupForm({ ...setupForm, [f.name]: e.target.value })}
                  style={inp} required autoFocus={i === 0}
                  onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.85)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            ))}
            <button type="submit" disabled={setupLoading} style={{
              width: "100%", padding: "13px",
              background: setupLoading ? "rgba(209,213,219,0.8)" : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff", border: "none", borderRadius: 12,
              fontWeight: 700, fontSize: 15, cursor: setupLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit", boxShadow: setupLoading ? "none" : "0 6px 20px rgba(34,197,94,0.35)",
            }}>
              {setupLoading ? t("login_setup_creating") : t("login_setup_btn")}
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button type="button" onClick={() => setShowSetup(false)} style={{
                background: "none", border: "none",
                color: "#6b7280", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>{t("login_back")}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
