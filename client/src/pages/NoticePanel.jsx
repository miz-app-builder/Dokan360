import { useState, useEffect } from "react";
import { API } from "../api";

const ACCENT  = "#6366f1";
const ACCENT2 = "#8b5cf6";

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("bn-BD", { day:"2-digit", month:"short", year:"numeric",
                                      hour:"2-digit", minute:"2-digit" });
};

const diffHours = (from, to) => {
  if (!from || !to) return null;
  return ((new Date(to) - new Date(from)) / 3600000).toFixed(1);
};

export default function NoticePanel() {
  const [notices,   setNotices]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  const [text,          setText]          = useState("");
  const [publishType,   setPublishType]   = useState("now");   // "now" | "scheduled"
  const [scheduleAt,    setScheduleAt]    = useState("");
  const [durationHours, setDurationHours] = useState("");       // "" = no expiry

  const load = async () => {
    setLoading(true);
    try {
      const r = await API.get("/notices");
      setNotices(r.data.notices || []);
    } catch (e) {
      setError("লোড হয়নি: " + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg); setTimeout(() => setError(""), 4000); }
    else       { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!text.trim()) return flash("Notice text লিখুন।", true);
    setSaving(true);
    try {
      await API.post("/notices", {
        text,
        publish_at:     publishType === "scheduled" ? scheduleAt || null : null,
        duration_hours: durationHours ? parseFloat(durationHours) : null,
      });
      flash("✅ Notice যোগ হয়েছে!");
      setText(""); setScheduleAt(""); setDurationHours(""); setPublishType("now");
      load();
    } catch (e) {
      flash(e.response?.data?.error || "Error হয়েছে।", true);
    } finally { setSaving(false); }
  };

  const toggleActive = async (n) => {
    try {
      await API.put(`/notices/${n.id}`, { is_active: !n.is_active });
      load();
    } catch (e) { flash(e.response?.data?.error || "Error", true); }
  };

  const deleteNotice = async (id) => {
    if (!window.confirm("এই notice মুছে ফেলবেন?")) return;
    try {
      await API.delete(`/notices/${id}`);
      flash("মুছে ফেলা হয়েছে।");
      load();
    } catch (e) { flash(e.response?.data?.error || "Error", true); }
  };

  const now = new Date();
  const activeNotices  = notices.filter(n => {
    if (!n.is_active) return false;
    if (new Date(n.publish_at) > now) return false;
    if (n.expires_at && new Date(n.expires_at) <= now) return false;
    return true;
  });
  const pendingNotices = notices.filter(n => n.is_active && new Date(n.publish_at) > now);
  const historyNotices = notices.filter(n =>
    !n.is_active || (n.expires_at && new Date(n.expires_at) <= now)
  );

  const cardStyle = {
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.85)",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(99,102,241,0.08)",
    padding: 20,
    marginBottom: 20,
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "9px 13px",
    background: "rgba(255,255,255,0.8)",
    border: "1.5px solid rgba(255,255,255,0.9)",
    borderRadius: 10, fontSize: 13,
    fontFamily: "inherit", color: "#1e1b4b", outline: "none",
  };

  const labelStyle = { display: "block", fontWeight: 700, fontSize: 12,
    color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 5 };

  const btnStyle = (primary = false) => ({
    padding: "9px 20px",
    background: primary ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(255,255,255,0.7)",
    color: primary ? "#fff" : "#374151",
    border: primary ? "none" : "1.5px solid rgba(255,255,255,0.9)",
    borderRadius: 10, fontWeight: 700, fontSize: 13,
    cursor: "pointer", fontFamily: "inherit",
    boxShadow: primary ? `0 4px 14px ${ACCENT}35` : "none",
    opacity: saving ? 0.6 : 1,
  });

  const NoticeRow = ({ n }) => {
    const isActive  = n.is_active && new Date(n.publish_at) <= now &&
                      (!n.expires_at || new Date(n.expires_at) > now);
    const isPending = n.is_active && new Date(n.publish_at) > now;
    const isExpired = n.expires_at && new Date(n.expires_at) <= now;
    const badge = isActive  ? { label: "চলছে",    color: "#16a34a", bg: "#dcfce7" }
                : isPending ? { label: "নির্ধারিত", color: ACCENT,   bg: `${ACCENT}15` }
                : isExpired ? { label: "মেয়াদ শেষ", color: "#9ca3af", bg: "#f3f4f6" }
                :             { label: "বন্ধ",     color: "#ef4444", bg: "#fee2e2" };
    return (
      <div style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b", marginBottom: 4 }}>
            {n.text}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
            <span>📅 {fmt(n.publish_at)}</span>
            {n.expires_at && <span>⏱️ মেয়াদ: {fmt(n.expires_at)} ({diffHours(n.publish_at, n.expires_at)} ঘণ্টা)</span>}
            {!n.expires_at && <span>♾️ সীমাহীন</span>}
            {n.created_by && <span>✍️ {n.created_by}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            color: badge.color, background: badge.bg,
          }}>{badge.label}</span>
          <button
            onClick={() => toggleActive(n)}
            title={n.is_active ? "বন্ধ করুন" : "চালু করুন"}
            style={{
              background: n.is_active ? "#fee2e2" : "#dcfce7",
              color: n.is_active ? "#ef4444" : "#16a34a",
              border: "none", borderRadius: 8,
              padding: "5px 10px", cursor: "pointer", fontFamily: "inherit",
              fontSize: 12, fontWeight: 700,
            }}>
            {n.is_active ? "বন্ধ" : "চালু"}
          </button>
          <button
            onClick={() => deleteNotice(n.id)}
            style={{
              background: "#fee2e2", color: "#ef4444",
              border: "none", borderRadius: 8,
              padding: "5px 8px", cursor: "pointer", fontFamily: "inherit",
              fontSize: 12, fontWeight: 700,
            }}>✕</button>
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1e1b4b", marginBottom: 4 }}>
          📢 Notice Panel
        </h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>
          Topbar এ notice দিন — এখনই অথবা নির্দিষ্ট সময়ে।
        </p>

        {error   && <div style={{ background: "#fee2e2", color: "#ef4444", padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontWeight: 600 }}>{error}</div>}
        {success && <div style={{ background: "#dcfce7", color: "#16a34a", padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontWeight: 600 }}>{success}</div>}

        {/* ── Create Notice ── */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b", marginBottom: 16 }}>
            ➕ নতুন Notice
          </h2>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Notice লেখা *</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="এখানে notice লিখুন..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* Publish type toggle */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Publish ধরন</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { val: "now",       label: "⚡ এখনই Publish" },
                  { val: "scheduled", label: "📅 সময় নির্ধারণ" },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setPublishType(opt.val)}
                    style={{
                      padding: "8px 16px",
                      background: publishType === opt.val
                        ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`
                        : "rgba(255,255,255,0.7)",
                      color: publishType === opt.val ? "#fff" : "#374151",
                      border: `1.5px solid ${publishType === opt.val ? "transparent" : "rgba(255,255,255,0.9)"}`,
                      borderRadius: 10, fontWeight: 700, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {publishType === "scheduled" && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Publish হওয়ার সময় *</label>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={e => setScheduleAt(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>কতক্ষণ দেখাবে? (ঘণ্টায়)</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["", "1", "6", "12", "24", "48", "168"].map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDurationHours(h)}
                    style={{
                      padding: "6px 14px",
                      background: durationHours === h
                        ? `${ACCENT}15`
                        : "rgba(255,255,255,0.6)",
                      color: durationHours === h ? ACCENT : "#6b7280",
                      border: `1.5px solid ${durationHours === h ? ACCENT + "40" : "rgba(255,255,255,0.9)"}`,
                      borderRadius: 8, fontWeight: 700, fontSize: 12,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >{h === "" ? "♾️ সীমাহীন" : h === "168" ? "৭ দিন" : `${h} ঘণ্টা`}</button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving} style={btnStyle(true)}>
              {saving ? "যোগ হচ্ছে..." : "📢 Notice Publish করুন"}
            </button>
          </form>
        </div>

        {/* ── Active Notices ── */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#16a34a", marginBottom: 4 }}>
            ✅ এখন চলছে ({activeNotices.length}টি)
          </h2>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>এগুলো এখন Topbar এ দেখাচ্ছে।</p>
          {loading ? <p style={{ color: "#9ca3af" }}>লোড হচ্ছে...</p> :
           activeNotices.length === 0 ? <p style={{ color: "#9ca3af", fontSize: 13 }}>কোনো active notice নেই।</p> :
           activeNotices.map(n => <NoticeRow key={n.id} n={n} />)}
        </div>

        {/* ── Pending / Scheduled ── */}
        {pendingNotices.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: ACCENT, marginBottom: 4 }}>
              ⏳ নির্ধারিত ({pendingNotices.length}টি)
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>নির্দিষ্ট সময়ে automatically publish হবে।</p>
            {pendingNotices.map(n => <NoticeRow key={n.id} n={n} />)}
          </div>
        )}

        {/* ── History ── */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#6b7280", marginBottom: 4 }}>
            🗂️ History ({historyNotices.length}টি)
          </h2>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>মেয়াদ শেষ বা বন্ধ করা notice।</p>
          {loading ? <p style={{ color: "#9ca3af" }}>লোড হচ্ছে...</p> :
           historyNotices.length === 0 ? <p style={{ color: "#9ca3af", fontSize: 13 }}>History খালি।</p> :
           historyNotices.map(n => <NoticeRow key={n.id} n={n} />)}
        </div>
      </div>
    </div>
  );
}
