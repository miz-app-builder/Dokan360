export default function Navbar({ activePage, setPage }) {
  const links = [
    { key: "pos",        label: "🛒 POS" },
    { key: "products",   label: "📦 Products" },
    { key: "categories", label: "🗂️ Categories" },
    { key: "customers",  label: "👥 Customers" },
  ];

  return (
    <nav style={{
      background: "#4f46e5",
      padding: "0 20px",
      display: "flex",
      alignItems: "center",
      gap: 4,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      <span style={{
        color: "#fff",
        fontWeight: "bold",
        fontSize: 18,
        marginRight: 24,
        padding: "14px 0",
      }}>
        🏪 Dokan360
      </span>

      {links.map(l => (
        <button
          key={l.key}
          onClick={() => setPage(l.key)}
          style={{
            background: activePage === l.key ? "rgba(255,255,255,0.2)" : "transparent",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: activePage === l.key ? "bold" : "normal",
            fontSize: 14,
            borderBottom: activePage === l.key ? "3px solid #fff" : "3px solid transparent",
          }}
        >
          {l.label}
        </button>
      ))}
    </nav>
  );
}
