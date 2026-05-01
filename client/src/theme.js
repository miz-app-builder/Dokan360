export const T = {
  accent:  "#6366f1",
  accent2: "#8b5cf6",
  text1:   "#1e1b4b",
  text2:   "#374151",
  text3:   "#6b7280",
  text4:   "#9ca3af",
  green:   "#16a34a",
  red:     "#ef4444",
  yellow:  "#d97706",
};

export const glass = (extra = {}) => ({
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 4px 24px rgba(99,102,241,0.08), 0 1px 3px rgba(0,0,0,0.04)",
  ...extra,
});

export const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.6)",
  border: "1.5px solid rgba(255,255,255,0.85)",
  borderRadius: 10,
  fontSize: 14,
  fontFamily: "inherit",
  color: "#1e1b4b",
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#6b7280",
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};

export const primaryBtn = {
  padding: "10px 20px",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
  whiteSpace: "nowrap",
};

export const secondaryBtn = {
  padding: "10px 20px",
  background: "rgba(255,255,255,0.7)",
  color: "#374151",
  border: "1.5px solid rgba(255,255,255,0.9)",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const editBtn = {
  padding: "5px 12px",
  background: "rgba(238,242,255,0.9)",
  color: "#6366f1",
  border: "1px solid #c7d2fe",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const deleteBtn = {
  padding: "5px 12px",
  background: "rgba(254,242,242,0.9)",
  color: "#ef4444",
  border: "1px solid #fca5a5",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const successBtn = {
  padding: "5px 12px",
  background: "rgba(240,253,244,0.9)",
  color: "#16a34a",
  border: "1px solid #86efac",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const th = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderBottom: "1px solid rgba(255,255,255,0.6)",
  background: "rgba(255,255,255,0.4)",
};

export const td = {
  padding: "12px 16px",
  fontSize: 14,
  color: "#374151",
  borderBottom: "1px solid rgba(255,255,255,0.5)",
};

export const stockBadge = (stock) => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 700,
  background: stock <= 0 ? "rgba(254,242,242,0.9)" : stock < 10 ? "rgba(255,251,235,0.9)" : "rgba(240,253,244,0.9)",
  color: stock <= 0 ? "#ef4444" : stock < 10 ? "#d97706" : "#16a34a",
  border: `1px solid ${stock <= 0 ? "#fca5a5" : stock < 10 ? "#fde68a" : "#86efac"}`,
});

export const msgBox = (type) => ({
  padding: "12px 16px",
  borderRadius: 12,
  marginBottom: 16,
  fontWeight: 600,
  fontSize: 14,
  background: type === "success" ? "rgba(240,253,244,0.9)" : "rgba(254,242,242,0.9)",
  border: `1px solid ${type === "success" ? "#86efac" : "#fca5a5"}`,
  color: type === "success" ? "#15803d" : "#dc2626",
});
