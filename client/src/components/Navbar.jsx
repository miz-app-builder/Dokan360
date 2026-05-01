import { useState } from "react";
import { useT } from "../context/SettingsContext";

const ACCENT  = "#6366f1";
const ACCENT2 = "#8b5cf6";

export default function Navbar({ activePage, setPage, user, perms = {}, onLogout, shopName }) {
  const t = useT();
  const isAdmin = user?.role === "admin";
  const [collapsed, setCollapsed] = useState(false);

  const canView = (module) => {
    if (isAdmin) return true;
    if (perms[module]) return !!perms[module].can_view;
    return false;
  };

  const links = [
    { key: "pos",        icon: "🛒", labelKey: "nav_pos"        },
    { key: "products",   icon: "📦", labelKey: "nav_products"   },
    { key: "categories", icon: "🗂️",  labelKey: "nav_categories" },
    { key: "customers",  icon: "👥", labelKey: "nav_customers"  },
    { key: "inventory",  icon: "🏭", labelKey: "nav_inventory"  },
    { key: "reports",    icon: "📊", labelKey: "nav_reports"    },
    { key: "notices",    icon: "📢", labelKey: "nav_notices",   adminOnly: true },
    { key: "admin",      icon: "⚙️", labelKey: "nav_admin",     adminOnly: true },
    { key: "settings",   icon: "🔧", labelKey: "nav_settings"   },
  ].filter(l => l.adminOnly ? isAdmin : canView(l.key));

  const bottomLinks = [
    { key: "pos",        icon: "🛒", labelKey: "nav_pos"       },
    { key: "products",   icon: "📦", labelKey: "nav_products"  },
    { key: "customers",  icon: "👥", labelKey: "nav_customers" },
    { key: "reports",    icon: "📊", labelKey: "nav_reports"   },
    { key: "admin",      icon: "⚙️", labelKey: "nav_admin",    adminOnly: true },
    { key: "settings",   icon: "🔧", labelKey: "nav_settings"  },
  ].filter(l => l.adminOnly ? isAdmin : (canView(l.key) || l.key === "settings"));

  const roleLabel = { admin: "👑 Admin", seller: "🛒 Seller", viewer: "👁️ Viewer" };
  const sideW = collapsed ? 64 : 240;

  return (
    <>
      {/* ====== DESKTOP SIDEBAR ====== */}
      <aside className="sidebar" style={{ width: sideW, minWidth: sideW, transition: "width 0.22s ease" }}>

        {/* Logo */}
        <div style={{
          padding: collapsed ? "20px 0" : "24px 20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.6)",
          display: "flex", alignItems: "center",
          gap: 12, justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: `0 6px 16px ${ACCENT}40`,
          }}>🏪</div>
          {!collapsed && (
            <div>
              <div style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
                {shopName || "Dokan360"}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 11 }}>POS System</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{
              marginLeft: "auto", background: "rgba(99,102,241,0.1)", border: "none",
              borderRadius: 8, width: 28, height: 28, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: ACCENT, fontSize: 14, flexShrink: 0,
            }} title="Collapse">‹</button>
          )}
        </div>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{
            background: "none", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "8px", cursor: "pointer", color: ACCENT, fontSize: 18,
            width: "100%", marginTop: 4,
          }} title="Expand">›</button>
        )}

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: collapsed ? "8px 8px" : "12px 12px", overflowY: "auto", overflowX: "hidden" }}>
          {links.map(l => {
            const active = activePage === l.key;
            const label  = t(l.labelKey);
            return (
              <button
                key={l.key}
                onClick={() => setPage(l.key)}
                title={collapsed ? label : undefined}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "10px 0" : "10px 14px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  marginBottom: 4,
                  background: active
                    ? `linear-gradient(135deg, ${ACCENT}18, ${ACCENT2}10)`
                    : "transparent",
                  color: active ? ACCENT : "#374151",
                  border: active ? `1px solid ${ACCENT}30` : "1px solid transparent",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  fontFamily: "inherit",
                  textAlign: "left",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  boxShadow: active ? `0 2px 12px ${ACCENT}20` : "none",
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = "rgba(99,102,241,0.06)";
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{l.icon}</span>
                {!collapsed && <span>{label}</span>}
                {!collapsed && active && (
                  <span style={{
                    marginLeft: "auto",
                    width: 6, height: 6, borderRadius: "50%",
                    background: ACCENT, flexShrink: 0,
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{
          padding: collapsed ? "12px 8px" : "12px 14px",
          borderTop: "1px solid rgba(255,255,255,0.6)",
        }}>
          {!collapsed && (
            <div style={{
              background: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.8)",
              borderRadius: 12, padding: "10px 12px",
              marginBottom: 10,
            }}>
              <div style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                {user?.name || user?.username}
              </div>
              <div style={{
                display: "inline-block", fontSize: 11, fontWeight: 600,
                color: ACCENT,
                background: `${ACCENT}15`, borderRadius: 20,
                padding: "2px 8px",
              }}>
                {roleLabel[user?.role] || user?.role}
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            title={collapsed ? t("nav_logout") : undefined}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
              gap: 8,
              padding: collapsed ? "10px 0" : "9px 12px",
              background: "rgba(254,242,242,0.7)",
              color: "#ef4444",
              border: "1px solid rgba(252,165,165,0.5)",
              borderRadius: 10,
              fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span>🚪</span>
            {!collapsed && <span>{t("nav_logout")}</span>}
          </button>
        </div>
      </aside>

      {/* ====== MOBILE BOTTOM NAV ====== */}
      <nav className="bottom-nav">
        {bottomLinks.map(l => {
          const active = activePage === l.key;
          const label  = t(l.labelKey);
          return (
            <button key={l.key} onClick={() => setPage(l.key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, background: "none", border: "none", cursor: "pointer",
              padding: "4px 0", fontFamily: "inherit",
            }}>
              <div style={{
                width: 44, height: 28, borderRadius: 14,
                background: active ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.18s",
                boxShadow: active ? `0 3px 12px ${ACCENT}40` : "none",
              }}>{l.icon}</div>
              <span style={{
                color: active ? ACCENT : "#9ca3af",
                fontSize: 10, fontWeight: active ? 700 : 400,
              }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
