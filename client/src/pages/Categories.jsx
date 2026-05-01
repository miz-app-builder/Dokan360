import { useEffect, useState } from "react";
import { API } from "../api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);

  const loadCategories = () => {
    API.get("/categories")
      .then(res => setCategories(res.data))
      .catch(() => setError("Categories load করতে সমস্যা হয়েছে।"));
  };

  useEffect(() => { loadCategories(); }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setSuccess("");
  };

  // ADD
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError(""); setSuccess("");
    try {
      await API.post("/categories", { name: newName.trim() });
      setNewName("");
      showSuccess(`✅ "${newName.trim()}" সফলভাবে যোগ হয়েছে!`);
      loadCategories();
    } catch (err) {
      showError("❌ " + (err.response?.data?.error || "কিছু একটা সমস্যা হয়েছে।"));
    } finally {
      setLoading(false);
    }
  };

  // START EDIT
  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setDeletingId(null);
  };

  // SAVE EDIT
  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      await API.put(`/categories/${id}`, { name: editName.trim() });
      showSuccess(`✅ Category সফলভাবে আপডেট হয়েছে!`);
      setEditingId(null);
      loadCategories();
    } catch (err) {
      showError("❌ " + (err.response?.data?.error || "আপডেট করতে সমস্যা হয়েছে।"));
    }
  };

  // DELETE
  const handleDelete = async (id, name) => {
    try {
      await API.delete(`/categories/${id}`);
      showSuccess(`✅ "${name}" মুছে ফেলা হয়েছে।`);
      setDeletingId(null);
      loadCategories();
    } catch (err) {
      showError("❌ " + (err.response?.data?.error || "মুছতে সমস্যা হয়েছে।"));
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "32px auto", padding: "0 16px" }}>

      <h2 style={{ marginBottom: 24, color: "#1e1b4b" }}>🗂️ Categories</h2>

      {/* Add Form */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: 24, marginBottom: 28,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: "#374151" }}>
          ➕ নতুন Category যোগ করুন
        </h3>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            placeholder="Category এর নাম লিখুন..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{
              flex: 1, padding: "10px 14px",
              border: "2px solid #e5e7eb", borderRadius: 8,
              fontSize: 14, outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = "#4f46e5"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            style={{
              padding: "10px 22px",
              background: loading || !newName.trim() ? "#d1d5db" : "#4f46e5",
              color: "#fff", border: "none", borderRadius: 8,
              fontWeight: "bold", fontSize: 14,
              cursor: loading || !newName.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "যোগ হচ্ছে..." : "যোগ করুন"}
          </button>
        </form>
        {success && <p style={{ marginTop: 10, color: "#16a34a", fontWeight: "bold" }}>{success}</p>}
        {error && <p style={{ marginTop: 10, color: "#ef4444" }}>{error}</p>}
      </div>

      {/* Categories List */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          padding: "14px 20px", background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <b style={{ color: "#374151" }}>সব Categories</b>
          <span style={{
            background: "#4f46e5", color: "#fff",
            borderRadius: 20, padding: "2px 10px", fontSize: 13,
          }}>
            {categories.length} টি
          </span>
        </div>

        {categories.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>
            কোনো category নেই। উপরে যোগ করুন।
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={th}>#</th>
                <th style={th}>নাম</th>
                <th style={th}>তৈরির তারিখ</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr
                  key={cat.id}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                >
                  <td style={td}>{i + 1}</td>

                  <td style={{ ...td, fontWeight: "bold" }}>
                    {editingId === cat.id ? (
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleEdit(cat.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        style={{
                          padding: "5px 10px", border: "2px solid #4f46e5",
                          borderRadius: 6, fontSize: 14, outline: "none", width: "100%",
                        }}
                      />
                    ) : (
                      <span style={{
                        display: "inline-block",
                        background: "#eef2ff", color: "#4f46e5",
                        borderRadius: 6, padding: "3px 10px", fontSize: 13,
                      }}>
                        🗂️ {cat.name}
                      </span>
                    )}
                  </td>

                  <td style={{ ...td, color: "#9ca3af", fontSize: 13 }}>
                    {cat.created_at
                      ? new Date(cat.created_at).toLocaleDateString("bn-BD")
                      : "—"}
                  </td>

                  <td style={{ ...td }}>
                    {editingId === cat.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleEdit(cat.id)}
                          style={btnGreen}
                        >
                          ✅ সেভ
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={btnGray}
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : deletingId === cat.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#ef4444" }}>নিশ্চিত?</span>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          style={btnRed}
                        >
                          হ্যাঁ, মুছুন
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          style={btnGray}
                        >
                          না
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => startEdit(cat)} style={btnBlue}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => { setDeletingId(cat.id); setEditingId(null); }} style={btnRed}>
                          🗑️ Delete
                        </button>
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

const th = {
  padding: "10px 16px", textAlign: "left",
  fontSize: 13, color: "#6b7280", fontWeight: "bold",
};
const td = { padding: "12px 16px", fontSize: 14, color: "#374151" };

const btnBase = {
  padding: "5px 12px", border: "none", borderRadius: 6,
  fontSize: 12, fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap",
};
const btnBlue = { ...btnBase, background: "#eef2ff", color: "#4f46e5" };
const btnRed  = { ...btnBase, background: "#fef2f2", color: "#ef4444" };
const btnGreen = { ...btnBase, background: "#f0fdf4", color: "#16a34a" };
const btnGray  = { ...btnBase, background: "#f3f4f6", color: "#6b7280" };
