import { useEffect, useState } from "react";
import { API } from "../api";

const ROLES = ["admin", "seller", "viewer"];
const roleLabel = { admin: "👑 Admin", seller: "🛒 Seller", viewer: "👁️ Viewer" };
const roleColor = { admin: { bg: "#f5f3ff", color: "#7c3aed" }, seller: { bg: "#eef2ff", color: "#4f46e5" }, viewer: { bg: "#f3f4f6", color: "#6b7280" } };

export default function AdminPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "seller" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: "", password: "" });

  const load = () => {
    API.get("/users").then(r => setUsers(r.data)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/users", form);
      showMsg("success", `✅ "${form.username}" সফলভাবে তৈরি হয়েছে!`);
      setForm({ username: "", password: "", role: "seller" });
      load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const body = {};
      if (editForm.role) body.role = editForm.role;
      if (editForm.password) body.password = editForm.password;
      await API.put(`/users/${editUser.id}`, body);
      showMsg("success", `✅ "${editUser.username}" আপডেট হয়েছে!`);
      setEditUser(null);
      load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`"${u.username}" কে delete করবেন?`)) return;
    try {
      await API.delete(`/users/${u.id}`);
      showMsg("success", `✅ "${u.username}" delete হয়েছে।`);
      load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: "24px auto", padding: "0 16px" }}>
      <h2 style={{ margin: "0 0 20px", color: "#1e1b4b" }}>⚙️ Admin Panel — User Management</h2>

      {msg.text && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 16,
          background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${msg.type === "success" ? "#86efac" : "#fca5a5"}`,
          color: msg.type === "success" ? "#16a34a" : "#ef4444",
          fontWeight: "bold",
        }}>
          {msg.text}
        </div>
      )}

      {/* Add User Form */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: 24, marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        <h3 style={{ margin: "0 0 16px", color: "#374151" }}>➕ নতুন User তৈরি করুন</h3>
        <form onSubmit={handleAdd}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Username *</label>
              <input
                placeholder="username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Password *</label>
              <input
                type="password"
                placeholder="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Role *</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                style={inputStyle}
              >
                {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 18px",
                background: loading ? "#d1d5db" : "#4f46e5",
                color: "#fff", border: "none", borderRadius: 8,
                fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "তৈরি..." : "✅ তৈরি করুন"}
            </button>
          </div>
        </form>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 28,
            width: "100%", maxWidth: 400,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ margin: "0 0 16px" }}>✏️ "{editUser.username}" সম্পাদনা</h3>
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>নতুন Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  style={inputStyle}
                >
                  {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>নতুন Password (ঐচ্ছিক)</label>
                <input
                  type="password"
                  placeholder="খালি রাখলে পরিবর্তন হবে না"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" style={{
                  flex: 1, padding: "10px", background: "#4f46e5",
                  color: "#fff", border: "none", borderRadius: 8,
                  fontWeight: "bold", cursor: "pointer",
                }}>✅ আপডেট করুন</button>
                <button type="button" onClick={() => setEditUser(null)} style={{
                  flex: 1, padding: "10px", background: "#f3f4f6",
                  color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8,
                  fontWeight: "bold", cursor: "pointer",
                }}>বাতিল</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          padding: "12px 20px", background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <b style={{ color: "#374151" }}>সব Users</b>
          <span style={{ background: "#4f46e5", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 13 }}>
            {users.length} জন
          </span>
        </div>
        {users.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>কোনো user নেই।</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                {["#", "Username", "Role", "তৈরির তারিখ", ""].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  <td style={td}>{i + 1}</td>
                  <td style={{ ...td, fontWeight: "bold" }}>
                    👤 {u.username}
                    {u.id === currentUser?.id && (
                      <span style={{ marginLeft: 8, fontSize: 11, background: "#eef2ff", color: "#4f46e5", borderRadius: 4, padding: "1px 6px" }}>
                        আপনি
                      </span>
                    )}
                  </td>
                  <td style={td}>
                    <span style={{
                      ...roleColor[u.role],
                      borderRadius: 6, padding: "3px 10px", fontSize: 13, fontWeight: "bold",
                    }}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td style={{ ...td, color: "#9ca3af", fontSize: 12 }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("bn-BD") : "—"}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => { setEditUser(u); setEditForm({ role: u.role, password: "" }); }}
                        style={{ padding: "5px 12px", background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: "bold" }}
                      >✏️ Edit</button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          style={{ padding: "5px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: "bold" }}
                        >🗑️ Delete</button>
                      )}
                    </div>
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

const labelStyle = { display: "block", fontSize: 13, fontWeight: "bold", color: "#374151", marginBottom: 4 };
const inputStyle = { width: "100%", padding: "9px 12px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };
const th = { padding: "10px 14px", textAlign: "left", fontSize: 13, color: "#6b7280", fontWeight: "bold" };
const td = { padding: "11px 14px", fontSize: 14, color: "#374151" };
