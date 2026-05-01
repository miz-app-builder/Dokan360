import { useEffect, useState } from "react";
import { API } from "../api";
import { glass, T, th, td, primaryBtn, editBtn, deleteBtn, successBtn, secondaryBtn } from "../theme";

const ACCENT = "#6366f1";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [newName,    setNewName]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState({ type: "", text: "" });
  const [editingId,  setEditingId]  = useState(null);
  const [editName,   setEditName]   = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = () => API.get("/categories").then(r => setCategories(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await API.post("/categories", { name: newName.trim() });
      showMsg("success", `✅ "${newName.trim()}" যোগ হয়েছে!`);
      setNewName(""); load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "কিছু সমস্যা হয়েছে।"));
    } finally { setLoading(false); }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      await API.put(`/categories/${id}`, { name: editName.trim() });
      showMsg("success", "✅ Category আপডেট হয়েছে!");
      setEditingId(null); load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "আপডেট করতে সমস্যা।"));
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await API.delete(`/categories/${id}`);
      showMsg("success", `✅ "${name}" মুছে ফেলা হয়েছে।`);
      setDeletingId(null); load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "মুছতে সমস্যা।"));
      setDeletingId(null);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: 720, margin: "0 auto" }}>

      <div className="page-header">
        <h2 className="page-title">🗂️ Categories</h2>
      </div>

      {/* Add Form */}
      <div style={{ ...glass({ borderRadius: 18, padding: 24, marginBottom: 24 }) }}>
        <h3 style={{ margin: "0 0 16px", color: T.text1, fontWeight: 800, fontSize: 15 }}>➕ নতুন Category যোগ করুন</h3>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 10 }}>
          <input
            type="text" placeholder="Category এর নাম লিখুন..."
            value={newName} onChange={e => setNewName(e.target.value)}
            style={{
              flex: 1, padding: "10px 14px",
              background: "rgba(255,255,255,0.6)",
              border: "1.5px solid rgba(255,255,255,0.85)",
              borderRadius: 10, fontSize: 14, fontFamily: "inherit",
              color: T.text1, outline: "none",
            }}
            onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.85)"; e.target.style.boxShadow = "none"; }}
          />
          <button type="submit" disabled={loading || !newName.trim()} style={{
            ...primaryBtn,
            opacity: loading || !newName.trim() ? 0.5 : 1,
            cursor: loading || !newName.trim() ? "not-allowed" : "pointer",
          }}>
            {loading ? "যোগ হচ্ছে..." : "যোগ করুন"}
          </button>
        </form>
        {msg.text && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            fontWeight: 600, fontSize: 13,
            background: msg.type === "success" ? "rgba(240,253,244,0.9)" : "rgba(254,242,242,0.9)",
            border: `1px solid ${msg.type === "success" ? "#86efac" : "#fca5a5"}`,
            color: msg.type === "success" ? "#15803d" : "#dc2626",
          }}>{msg.text}</div>
        )}
      </div>

      {/* List */}
      <div style={{ ...glass({ borderRadius: 18, overflow: "hidden", padding: 0 }) }}>
        <div style={{
          padding: "14px 20px",
          background: "rgba(255,255,255,0.5)",
          borderBottom: "1px solid rgba(255,255,255,0.6)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <b style={{ color: T.text1, fontSize: 15 }}>সব Categories</b>
          <span style={{
            background: `${ACCENT}15`, color: ACCENT,
            border: `1px solid ${ACCENT}30`,
            borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700,
          }}>{categories.length} টি</span>
        </div>

        {categories.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🗂️</div>
            <p style={{ color: T.text4 }}>কোনো category নেই।</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["#", "নাম", "তারিখ", "Action"].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr key={cat.id}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={td}><span style={{ color: T.text4, fontSize: 12 }}>{i + 1}</span></td>
                  <td style={{ ...td, fontWeight: 700 }}>
                    {editingId === cat.id ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleEdit(cat.id); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus style={{
                          padding: "6px 10px", border: `2px solid ${ACCENT}`,
                          borderRadius: 8, fontSize: 14, outline: "none",
                          fontFamily: "inherit", color: T.text1,
                          background: "rgba(255,255,255,0.8)",
                        }}
                      />
                    ) : (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: `${ACCENT}12`, color: ACCENT,
                        borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 700,
                        border: `1px solid ${ACCENT}25`,
                      }}>🗂️ {cat.name}</span>
                    )}
                  </td>
                  <td style={{ ...td, color: T.text4, fontSize: 12 }}>
                    {cat.created_at ? new Date(cat.created_at).toLocaleDateString("bn-BD") : "—"}
                  </td>
                  <td style={td}>
                    {editingId === cat.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => handleEdit(cat.id)} style={successBtn}>✅ সেভ</button>
                        <button onClick={() => setEditingId(null)} style={secondaryBtn}>বাতিল</button>
                      </div>
                    ) : deletingId === cat.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>নিশ্চিত?</span>
                        <button onClick={() => handleDelete(cat.id, cat.name)} style={deleteBtn}>হ্যাঁ, মুছুন</button>
                        <button onClick={() => setDeletingId(null)} style={secondaryBtn}>না</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); setDeletingId(null); }} style={editBtn}>✏️ Edit</button>
                        <button onClick={() => { setDeletingId(cat.id); setEditingId(null); }} style={deleteBtn}>🗑️ Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
