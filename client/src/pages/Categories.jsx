import { useEffect, useState } from "react";
import { API } from "../api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // LOAD CATEGORIES
  // =========================
  const loadCategories = () => {
    API.get("/categories")
      .then(res => setCategories(res.data))
      .catch(() => setError("Categories load করতে সমস্যা হয়েছে।"));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // =========================
  // ADD CATEGORY
  // =========================
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await API.post("/categories", { name: newName.trim() });
      setNewName("");
      setSuccess(`✅ "${newName.trim()}" সফলভাবে যোগ হয়েছে!`);
      loadCategories();
    } catch (err) {
      setError("❌ " + (err.response?.data?.error || "কিছু একটা সমস্যা হয়েছে।"));
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ maxWidth: 700, margin: "32px auto", padding: "0 16px" }}>

      <h2 style={{ marginBottom: 24, color: "#1e1b4b" }}>🗂️ Categories</h2>

      {/* Add Form */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        marginBottom: 28,
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
              flex: 1,
              padding: "10px 14px",
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s",
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
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 14,
              cursor: loading || !newName.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "যোগ হচ্ছে..." : "যোগ করুন"}
          </button>
        </form>

        {success && (
          <p style={{ marginTop: 10, color: "#16a34a", fontWeight: "bold" }}>{success}</p>
        )}
        {error && (
          <p style={{ marginTop: 10, color: "#ef4444" }}>{error}</p>
        )}
      </div>

      {/* Categories List */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          padding: "14px 20px",
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <b style={{ color: "#374151" }}>সব Categories</b>
          <span style={{
            background: "#4f46e5",
            color: "#fff",
            borderRadius: 20,
            padding: "2px 10px",
            fontSize: 13,
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
                    <span style={{
                      display: "inline-block",
                      background: "#eef2ff",
                      color: "#4f46e5",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 13,
                    }}>
                      🗂️ {cat.name}
                    </span>
                  </td>
                  <td style={{ ...td, color: "#9ca3af", fontSize: 13 }}>
                    {cat.created_at
                      ? new Date(cat.created_at).toLocaleDateString("bn-BD")
                      : "—"}
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
  padding: "10px 16px",
  textAlign: "left",
  fontSize: 13,
  color: "#6b7280",
  fontWeight: "bold",
};

const td = {
  padding: "12px 16px",
  fontSize: 14,
  color: "#374151",
};
