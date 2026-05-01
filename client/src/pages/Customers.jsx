import { useEffect, useState } from "react";
import { API } from "../api";

export default function Customers({ onViewLedger }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");

  const load = () => {
    API.get("/customers").then(r => setCustomers(r.data)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showMsg("error", "নাম দেওয়া আবশ্যক।"); return; }
    setLoading(true);
    try {
      await API.post("/customers", { name: form.name.trim(), phone: form.phone.trim() });
      showMsg("success", `✅ "${form.name.trim()}" সফলভাবে যোগ হয়েছে!`);
      setForm({ name: "", phone: "" });
      load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const totalDue = customers.reduce((s, c) => s + (c.due_amount || 0), 0);

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#1e1b4b" }}>👥 Customers</h2>
        {totalDue > 0 && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5",
            borderRadius: 8, padding: "8px 16px",
          }}>
            <span style={{ color: "#ef4444", fontWeight: "bold" }}>
              মোট বাকি: {totalDue.toFixed(2)} ৳
            </span>
          </div>
        )}
      </div>

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

      {/* ADD FORM */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: 24, marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        <h3 style={{ margin: "0 0 16px", color: "#374151" }}>➕ নতুন Customer যোগ করুন</h3>
        <form onSubmit={handleAdd}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>নাম *</label>
              <input
                placeholder="Customer এর নাম"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>ফোন নম্বর</label>
              <input
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 20px", background: loading ? "#d1d5db" : "#4f46e5",
                color: "#fff", border: "none", borderRadius: 8,
                fontWeight: "bold", fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "যোগ হচ্ছে..." : "✅ যোগ করুন"}
            </button>
          </div>
        </form>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="🔍 নাম বা ফোন দিয়ে খুঁজুন..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, marginBottom: 16, maxWidth: 320 }}
      />

      {/* CUSTOMER LIST */}
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
          <b style={{ color: "#374151" }}>সব Customers</b>
          <span style={{ background: "#4f46e5", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 13 }}>
            {filtered.length} জন
          </span>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>
            কোনো customer পাওয়া যায়নি।
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  {["#", "নাম", "ফোন", "বাকি", ""].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    <td style={td}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: "bold" }}>👤 {c.name}</td>
                    <td style={{ ...td, color: "#6b7280" }}>{c.phone || "—"}</td>
                    <td style={td}>
                      {c.due_amount > 0 ? (
                        <span style={{
                          background: "#fef2f2", color: "#ef4444",
                          borderRadius: 6, padding: "3px 10px",
                          fontWeight: "bold", fontSize: 13,
                        }}>
                          {c.due_amount} ৳
                        </span>
                      ) : (
                        <span style={{
                          background: "#f0fdf4", color: "#16a34a",
                          borderRadius: 6, padding: "3px 10px", fontSize: 13,
                        }}>
                          পরিষ্কার ✓
                        </span>
                      )}
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => onViewLedger(c)}
                        style={{
                          padding: "5px 14px", background: "#eef2ff", color: "#4f46e5",
                          border: "1px solid #c7d2fe", borderRadius: 6,
                          fontSize: 13, cursor: "pointer", fontWeight: "bold",
                        }}
                      >
                        📒 Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: "bold", color: "#374151", marginBottom: 4 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "2px solid #e5e7eb",
  borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none",
};
const th = { padding: "10px 14px", textAlign: "left", fontSize: 13, color: "#6b7280", fontWeight: "bold" };
const td = { padding: "11px 14px", fontSize: 14, color: "#374151" };
