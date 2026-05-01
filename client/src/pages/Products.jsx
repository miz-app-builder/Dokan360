import { useEffect, useState } from "react";
import { API } from "../api";

const EMPTY_FORM = {
  name: "", buy_price: "", sell_price: "", stock: "", barcode: "", category_id: "",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // =========================
  // LOAD DATA
  // =========================
  const load = () => {
    API.get("/products").then(r => setProducts(r.data)).catch(console.error);
    API.get("/categories").then(r => setCategories(r.data)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  // =========================
  // FILTER PRODUCTS
  // =========================
  const filtered = products.filter(p => {
    const matchCat = filterCat ? p.category_id === parseInt(filterCat) : true;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    return matchCat && matchSearch;
  });

  // =========================
  // FORM CHANGE
  // =========================
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // =========================
  // OPEN EDIT
  // =========================
  const openEdit = (p) => {
    setForm({
      name: p.name || "",
      buy_price: p.buy_price || "",
      sell_price: p.sell_price || "",
      stock: p.stock || "",
      barcode: p.barcode || "",
      category_id: p.category_id || "",
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =========================
  // OPEN ADD
  // =========================
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =========================
  // SUBMIT (ADD or EDIT)
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showMsg("error", "নাম দেওয়া আবশ্যক।"); return; }

    setLoading(true);
    try {
      if (editingId) {
        await API.put(`/products/${editingId}`, form);
        showMsg("success", `✅ "${form.name}" সফলভাবে আপডেট হয়েছে!`);
      } else {
        await API.post("/products", form);
        showMsg("success", `✅ "${form.name}" সফলভাবে যোগ হয়েছে!`);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (p) => {
    if (!confirm(`"${p.name}" মুছে ফেলবেন?`)) return;
    try {
      await API.delete(`/products/${p.id}`);
      showMsg("success", `✅ "${p.name}" মুছে ফেলা হয়েছে।`);
      load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "মুছতে সমস্যা হয়েছে।"));
    }
  };

  // =========================
  // CATEGORY NAME HELPER
  // =========================
  const getCatName = (id) => categories.find(c => c.id === id)?.name || "—";

  // =========================
  // UI
  // =========================
  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: "0 16px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#1e1b4b" }}>📦 Products</h2>
        <button onClick={openAdd} style={primaryBtn}>
          ➕ নতুন Product
        </button>
      </div>

      {/* Message */}
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

      {/* ADD / EDIT FORM */}
      {showForm && (
        <div style={{
          background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 12, padding: 24, marginBottom: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#374151" }}>
              {editingId ? "✏️ Product সম্পাদনা" : "➕ নতুন Product যোগ"}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}
            >✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>নাম *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Product এর নাম" style={inputStyle} required />
              </div>

              <div>
                <label style={labelStyle}>ক্রয় মূল্য (Buy Price) ৳</label>
                <input name="buy_price" type="number" value={form.buy_price} onChange={handleChange}
                  placeholder="0" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>বিক্রয় মূল্য (Sell Price) ৳</label>
                <input name="sell_price" type="number" value={form.sell_price} onChange={handleChange}
                  placeholder="0" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Stock পরিমাণ</label>
                <input name="stock" type="number" value={form.stock} onChange={handleChange}
                  placeholder="0" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Barcode</label>
                <input name="barcode" value={form.barcode} onChange={handleChange}
                  placeholder="Barcode নম্বর" style={inputStyle} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Category</label>
                <select name="category_id" value={form.category_id} onChange={handleChange} style={inputStyle}>
                  <option value="">-- Category বেছে নিন --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={loading} style={primaryBtn}>
                {loading ? "সংরক্ষণ হচ্ছে..." : editingId ? "✅ আপডেট করুন" : "✅ যোগ করুন"}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                style={secondaryBtn}>
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="🔍 নাম বা Barcode খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: 260, margin: 0 }}
        />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterCat("")}
            style={filterCat === "" ? activeCatBtn : catBtn}
          >
            সব ({products.length})
          </button>
          {categories.map(c => {
            const count = products.filter(p => p.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setFilterCat(String(c.id))}
                style={filterCat === String(c.id) ? activeCatBtn : catBtn}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* PRODUCTS TABLE */}
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
          <b style={{ color: "#374151" }}>Product তালিকা</b>
          <span style={{ background: "#4f46e5", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 13 }}>
            {filtered.length} টি
          </span>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>
            কোনো product পাওয়া যায়নি।
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  {["#", "নাম", "Category", "ক্রয় মূল্য", "বিক্রয় মূল্য", "Stock", "Barcode", "Action"].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    <td style={td}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: "bold" }}>{p.name}</td>
                    <td style={td}>
                      {p.category_id ? (
                        <span style={{ background: "#eef2ff", color: "#4f46e5", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
                          {getCatName(p.category_id)}
                        </span>
                      ) : <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                    <td style={td}>{p.buy_price ? `${p.buy_price} ৳` : "—"}</td>
                    <td style={{ ...td, color: "#4f46e5", fontWeight: "bold" }}>
                      {p.sell_price ? `${p.sell_price} ৳` : "—"}
                    </td>
                    <td style={td}>
                      <span style={{
                        background: p.stock <= 0 ? "#fef2f2" : p.stock < 10 ? "#fffbeb" : "#f0fdf4",
                        color: p.stock <= 0 ? "#ef4444" : p.stock < 10 ? "#d97706" : "#16a34a",
                        borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: "bold",
                      }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ ...td, color: "#9ca3af", fontSize: 12 }}>{p.barcode || "—"}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={editBtn}>✏️ Edit</button>
                        <button onClick={() => handleDelete(p)} style={deleteBtn}>🗑️ Delete</button>
                      </div>
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

// ===== STYLES =====
const primaryBtn = {
  padding: "10px 20px", background: "#4f46e5", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer",
};
const secondaryBtn = {
  padding: "10px 20px", background: "#f3f4f6", color: "#374151",
  border: "1px solid #e5e7eb", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer",
};
const editBtn = {
  padding: "5px 12px", background: "#eef2ff", color: "#4f46e5",
  border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: "bold",
};
const deleteBtn = {
  padding: "5px 12px", background: "#fef2f2", color: "#ef4444",
  border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: "bold",
};
const catBtn = {
  padding: "6px 14px", background: "#f3f4f6", color: "#374151",
  border: "1px solid #e5e7eb", borderRadius: 20, fontSize: 13, cursor: "pointer",
};
const activeCatBtn = {
  ...catBtn, background: "#4f46e5", color: "#fff", border: "1px solid #4f46e5", fontWeight: "bold",
};
const labelStyle = { display: "block", fontSize: 13, fontWeight: "bold", color: "#374151", marginBottom: 4 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "2px solid #e5e7eb",
  borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none",
};
const th = { padding: "10px 14px", textAlign: "left", fontSize: 13, color: "#6b7280", fontWeight: "bold" };
const td = { padding: "11px 14px", fontSize: 14, color: "#374151" };
