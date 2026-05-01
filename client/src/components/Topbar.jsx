import { useState, useEffect, useRef } from "react";
import { API } from "../api";

const ACCENT  = "#6366f1";
const ACCENT2 = "#8b5cf6";

const toBn = (n) => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);

const DAYS_BN   = ["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];
const MONTHS_BN = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন",
                   "জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

export default function Topbar({ user, shopName, onLogout, setPage }) {
  const [now, setNow]           = useState(new Date());
  const [notices, setNotices]   = useState([]);
  const [open, setOpen]         = useState(false);
  const dropRef                 = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await API.get("/notices/active");
        setNotices(r.data.notices || []);
      } catch { setNotices([]); }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const h    = now.getHours();
  const m    = String(now.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 || 12;
  const timeStr = `${toBn(h12)}:${toBn(m)} ${ampm}`;
  const dateStr = `${DAYS_BN[now.getDay()]}, ${toBn(now.getDate())} ${MONTHS_BN[now.getMonth()]} ${toBn(now.getFullYear())}`;

  const noticeText = notices.length > 0
    ? notices.map(n => n.text).join("     ◆     ")
    : null;

  const initials = (user?.name || user?.username || "U")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="topbar-root" style={{
      height: "var(--topbar-h)",
      display: "flex",
      alignItems: "center",
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.85)",
      boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
      padding: "0 16px",
      gap: 12,
      zIndex: 150,
      flexShrink: 0,
      position: "relative",
    }}>

      {/* ── LEFT: Time + Date ── */}
      <div className="topbar-time" style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        flexShrink: 0, minWidth: 110,
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b", lineHeight: 1.2 }}>
          {timeStr}
        </span>
        <span className="hide-mobile" style={{ fontSize: 10, color: "#6b7280", fontWeight: 500 }}>
          {dateStr}
        </span>
      </div>

      {/* ── CENTER: Notice Marquee ── */}
      <div className="topbar-notice" style={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        borderRadius: 8,
        background: noticeText ? "rgba(99,102,241,0.06)" : "transparent",
        border: noticeText ? "1px solid rgba(99,102,241,0.15)" : "none",
        height: 30,
        padding: noticeText ? "0 10px" : 0,
        position: "relative",
      }}>
        {noticeText ? (
          <div style={{ overflow: "hidden", width: "100%", display: "flex", alignItems: "center" }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: ACCENT,
              marginRight: 8, flexShrink: 0,
            }}>📢</span>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div className="notice-marquee-track">
                <span>{noticeText}</span>
                <span aria-hidden="true">&nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp;{noticeText}</span>
              </div>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "#9ca3af", width: "100%", textAlign: "center" }}>
            — কোনো নোটিশ নেই —
          </span>
        )}
      </div>

      {/* ── RIGHT: Outlet + User dropdown ── */}
      <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {shopName && (
          <span className="hide-mobile" style={{
            fontSize: 12, fontWeight: 700, color: ACCENT,
            background: `${ACCENT}12`, borderRadius: 8,
            padding: "4px 10px", border: `1px solid ${ACCENT}25`,
          }}>{shopName}</span>
        )}

        {/* User button */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: open ? `${ACCENT}12` : "rgba(255,255,255,0.6)",
              border: `1.5px solid ${open ? ACCENT + "50" : "rgba(255,255,255,0.8)"}`,
              borderRadius: 10, padding: "5px 10px 5px 6px",
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {/* Avatar circle */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 800, flexShrink: 0,
              boxShadow: `0 3px 10px ${ACCENT}40`,
            }}>{initials}</div>
            <span className="hide-mobile" style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b" }}>
              {user?.name || user?.username}
            </span>
            <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 2 }}>▾</span>
          </button>

          {/* Dropdown */}
          {open && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.9)",
              borderRadius: 14,
              boxShadow: "0 8px 32px rgba(99,102,241,0.18)",
              minWidth: 200,
              zIndex: 500,
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 14, fontWeight: 800,
                    boxShadow: `0 4px 12px ${ACCENT}40`,
                  }}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1e1b4b" }}>
                      {user?.name || user?.username}
                    </div>
                    <div style={{
                      fontSize: 11, color: ACCENT, fontWeight: 600,
                      background: `${ACCENT}15`, borderRadius: 20,
                      padding: "1px 8px", display: "inline-block", marginTop: 2,
                    }}>
                      {user?.role === "admin" ? "👑 Admin" : user?.role === "seller" ? "🛒 Seller" : "👁️ Viewer"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: "6px" }}>
                {user?.role === "admin" && (
                  <button className="topbar-drop-item" onClick={() => { setPage("notices"); setOpen(false); }}>
                    📢 Notice Panel
                  </button>
                )}
                <button className="topbar-drop-item" onClick={() => { setPage("settings"); setOpen(false); }}>
                  ⚙️ Settings
                </button>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "6px" }}>
                <button
                  className="topbar-drop-item topbar-drop-danger"
                  onClick={() => { setOpen(false); onLogout(); }}
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
