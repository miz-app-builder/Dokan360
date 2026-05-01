export default function Navbar({ activePage, setPage, user, perms = {}, onLogout }) {
  const isAdmin = user?.role === "admin";

  // Admin always sees everything. Others use permission table.
  const canView = (module) => {
    if (isAdmin) return true;
    if (perms[module]) return !!perms[module].can_view;
    return false;
  };

  const links = [
    { key: "pos",        label: "🛒 POS" },
    { key: "products",   label: "📦 Products" },
    { key: "categories", label: "🗂️ Categories" },
    { key: "customers",  label: "👥 Customers" },
    { key: "inventory",  label: "🏭 Inventory" },
    { key: "reports",    label: "📊 Reports" },
    { key: "admin",      label: "⚙️ Admin",  adminOnly: true },
  ].filter(l => l.adminOnly ? isAdmin : canView(l.key));

  const roleLabel = { admin: "👑 Admin", seller: "🛒 Seller", viewer: "👁️ Viewer" };

  return (
    <nav style={{
      background: "#4f46e5",
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      gap: 2,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      flexWrap: "nowrap",
      overflowX: "auto",
    }}>
      <span style={{
        color: "#fff", fontWeight: "bold", fontSize: 17,
        marginRight: 16, padding: "14px 0", whiteSpace: "nowrap",
      }}>
        🏪 Dokan360
      </span>

      {links.map(l => (
        <button
          key={l.key}
          onClick={() => setPage(l.key)}
          style={{
            background: activePage === l.key ? "rgba(255,255,255,0.2)" : "transparent",
            color: "#fff", border: "none", borderRadius: 6,
            padding: "8px 14px", cursor: "pointer",
            fontWeight: activePage === l.key ? "bold" : "normal",
            fontSize: 13,
            borderBottom: activePage === l.key ? "3px solid #fff" : "3px solid transparent",
            whiteSpace: "nowrap",
          }}
        >
          {l.label}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 8 }}>
        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, whiteSpace: "nowrap" }}>
          {user?.name || user?.username} · {roleLabel[user?.role] || user?.role}
        </span>
        <button
          onClick={onLogout}
          style={{
            padding: "6px 14px",
            background: "rgba(255,255,255,0.15)",
            color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 6, fontSize: 13, cursor: "pointer",
            fontWeight: "bold", whiteSpace: "nowrap",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
