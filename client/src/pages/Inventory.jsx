import { useEffect, useState } from "react";
import { API } from "../api";

const LOW_STOCK_LIMIT = 10;

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("stock_in");
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Stock IN form state
  const [inForm, setInForm] = useState({ product_id: "", quantity: "", cost_price: "", note: "" });
  const [inLoading, setInLoading] = useState(false);

  // Adjust form state
  const [adjForm, setAdjForm] = useState({ product_id: "", new_stock: "", reason: "" });
  const [adjLoading, setAdjLoading] = useState(false);

  // Log filter state
  const [filterType, setFilterType] = useState("");
  const [filterProduct, setFilterProduct] = useState("");

  const loadProducts = () =>
    API.get("/products").then(r => setProducts(r.data)).catch(console.error);

  const loadLogs = () =>
    API.get("/stock/logs").then(r => setLogs(r.data)).catch(console.error);

  useEffect(() => {
    loadProducts();
    loadLogs();
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  // ========================
  // Phase 3.3 — Stock IN submit
  // ========================
  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!inForm.product_id) { showMsg("error", "Product বেছে নিন।"); return; }
    if (!inForm.quantity || inForm.quantity <= 0) { showMsg("error", "সঠিক পরিমাণ দিন।"); return; }
    setInLoading(true);
    try {
      const res = await API.post("/stock/in", {
        product_id: parseInt(inForm.product_id),
        quantity: parseInt(inForm.quantity),
        cost_price: inForm.cost_price ? parseFloat(inForm.cost_price) : null,
        note: inForm.note || null,
      });
      showMsg("success", `✅ "${res.data.product_name}" — ${inForm.quantity}টি stock যোগ হয়েছে। নতুন stock: ${res.data.new_stock}`);
      setInForm({ product_id: "", quantity: "", cost_price: "", note: "" });
      loadProducts();
      loadLogs();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    } finally {
      setInLoading(false);
    }
  };

  // ========================
  // Phase 3.6 — Stock Adjust submit
  // ========================
  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjForm.product_id) { showMsg("error", "Product বেছে নিন।"); return; }
    if (adjForm.new_stock === "" || adjForm.new_stock < 0) { showMsg("error", "সঠিক stock সংখ্যা দিন।"); return; }
    setAdjLoading(true);
    try {
      const res = await API.post("/stock/adjust", {
        product_id: parseInt(adjForm.product_id),
        new_stock: parseInt(adjForm.new_stock),
        reason: adjForm.reason || null,
      });
      const d = res.data;
      const diffText = d.diff > 0 ? `+${d.diff}` : `${d.diff}`;
      showMsg("success", `✅ "${d.product_name}" — stock ${d.old_stock} → ${d.new_stock} (${diffText})`);
      setAdjForm({ product_id: "", new_stock: "", reason: "" });
      loadProducts();
      loadLogs();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    } finally {
      setAdjLoading(false);
    }
  };

  // ========================
  // Phase 3.5 — Low stock products
  // ========================
  const lowStockProducts = products.filter(p => p.stock <= LOW_STOCK_LIMIT);

  // ========================
  // Phase 3.4 — Log filter
  // ========================
  const filteredLogs = logs.filter(l => {
    const matchType = filterType ? l.type === filterType : true;
    const matchProduct = filterProduct ? String(l.product_id) === filterProduct : true;
    return matchType && matchProduct;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleString("bn-BD") : "—";

  const typeStyle = (type) => {
    if (type === "IN") return { background: "#f0fdf4", color: "#16a34a" };
    if (type === "OUT") return { background: "#fef2f2", color: "#ef4444" };
    return { background: "#fefce8", color: "#ca8a04" };
  };

  const typeLabel = (type) => {
    if (type === "IN") return "⬆️ IN";
    if (type === "OUT") return "⬇️ OUT";
    return "🔧 ADJUST";
  };

  const tabs = [
    { key: "low_stock", label: `⚠️ Low Stock${lowStockProducts.length > 0 ? ` (${lowStockProducts.length})` : ""}` },
    { key: "stock_in",  label: "📥 Stock IN" },
    { key: "history",   label: "📋 History" },
    { key: "adjust",    label: "🔧 Adjust" },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>

      <h2 style={{ margin: "0 0 20px", color: "#1e1b4b" }}>🏭 Inventory Panel</h2>

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

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "9px 18px",
              background: activeTab === t.key ? "#4f46e5" : "#f3f4f6",
              color: activeTab === t.key ? "#fff" : "#374151",
              border: activeTab === t.key ? "none" : "1px solid #e5e7eb",
              borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ========================
          Phase 3.5 — Low Stock Alert Tab
      ======================== */}
      {activeTab === "low_stock" && (
        <div>
          {lowStockProducts.length === 0 ? (
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac",
              borderRadius: 12, padding: 32, textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <p style={{ color: "#16a34a", fontWeight: "bold", margin: 0 }}>
                সব পণ্যের stock ঠিক আছে! কোনো low stock নেই।
              </p>
            </div>
          ) : (
            <div>
              <div style={{
                background: "#fef2f2", border: "1px solid #fca5a5",
                borderRadius: 10, padding: "12px 20px", marginBottom: 16,
              }}>
                <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                  ⚠️ {lowStockProducts.length}টি পণ্যের stock {LOW_STOCK_LIMIT} বা তার কম!
                </span>
              </div>
              <div style={{
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 12, overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                      {["#", "পণ্যের নাম", "Barcode", "বর্তমান Stock", "অবস্থা"].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p, i) => (
                      <tr
                        key={p.id}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fef9f9"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        <td style={td}>{i + 1}</td>
                        <td style={{ ...td, fontWeight: "bold" }}>{p.name}</td>
                        <td style={{ ...td, color: "#9ca3af", fontSize: 12 }}>{p.barcode || "—"}</td>
                        <td style={td}>
                          <span style={{
                            background: p.stock <= 0 ? "#fef2f2" : "#fffbeb",
                            color: p.stock <= 0 ? "#ef4444" : "#d97706",
                            borderRadius: 6, padding: "3px 10px",
                            fontWeight: "bold", fontSize: 14,
                          }}>
                            {p.stock}
                          </span>
                        </td>
                        <td style={td}>
                          {p.stock <= 0 ? (
                            <span style={{ color: "#ef4444", fontWeight: "bold" }}>🔴 Stock শেষ!</span>
                          ) : (
                            <span style={{ color: "#d97706", fontWeight: "bold" }}>🟡 প্রায় শেষ</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================
          Phase 3.3 — Stock IN Form Tab
      ======================== */}
      {activeTab === "stock_in" && (
        <div style={{
          background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 12, padding: 28,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <h3 style={{ margin: "0 0 20px", color: "#374151" }}>📥 নতুন Stock যোগ করুন</h3>
          <form onSubmit={handleStockIn}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>পণ্য বেছে নিন *</label>
                <select
                  value={inForm.product_id}
                  onChange={e => setInForm({ ...inForm, product_id: e.target.value })}
                  style={inputStyle}
                  required
                >
                  <option value="">-- পণ্য বেছে নিন --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — বর্তমান stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>পরিমাণ (কতটি কিনলেন) *</label>
                <input
                  type="number"
                  placeholder="যেমন: 50"
                  value={inForm.quantity}
                  onChange={e => setInForm({ ...inForm, quantity: e.target.value })}
                  style={inputStyle}
                  min="1"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>ক্রয় মূল্য প্রতি পিস (৳) — ঐচ্ছিক</label>
                <input
                  type="number"
                  placeholder="যেমন: 45"
                  value={inForm.cost_price}
                  onChange={e => setInForm({ ...inForm, cost_price: e.target.value })}
                  style={inputStyle}
                  min="0"
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>নোট — ঐচ্ছিক</label>
                <input
                  placeholder="যেমন: ABC সাপ্লায়ার থেকে কেনা"
                  value={inForm.note}
                  onChange={e => setInForm({ ...inForm, note: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={inLoading}
              style={{
                marginTop: 20,
                padding: "11px 28px",
                background: inLoading ? "#d1d5db" : "#4f46e5",
                color: "#fff", border: "none", borderRadius: 8,
                fontWeight: "bold", fontSize: 15,
                cursor: inLoading ? "not-allowed" : "pointer",
              }}
            >
              {inLoading ? "যোগ হচ্ছে..." : "✅ Stock যোগ করুন"}
            </button>
          </form>
        </div>
      )}

      {/* ========================
          Phase 3.4 — Stock Log History Tab
      ======================== */}
      {activeTab === "history" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ ...inputStyle, maxWidth: 160 }}
            >
              <option value="">সব ধরন</option>
              <option value="IN">⬆️ IN</option>
              <option value="OUT">⬇️ OUT</option>
              <option value="ADJUST">🔧 ADJUST</option>
            </select>

            <select
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              style={{ ...inputStyle, maxWidth: 260 }}
            >
              <option value="">সব পণ্য</option>
              {products.map(p => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>

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
              <b style={{ color: "#374151" }}>📋 Stock Movement History</b>
              <span style={{ background: "#4f46e5", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 13 }}>
                {filteredLogs.length} টি
              </span>
            </div>

            {filteredLogs.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>
                কোনো stock movement নেই।
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                      {["তারিখ", "পণ্য", "ধরন", "পরিমাণ", "ক্রয় মূল্য", "নোট"].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((l, i) => (
                      <tr
                        key={l.id || i}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        <td style={{ ...td, fontSize: 12, color: "#6b7280" }}>{formatDate(l.created_at)}</td>
                        <td style={{ ...td, fontWeight: "bold" }}>{l.products?.name || "—"}</td>
                        <td style={td}>
                          <span style={{
                            ...typeStyle(l.type),
                            borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: "bold",
                          }}>
                            {typeLabel(l.type)}
                          </span>
                        </td>
                        <td style={{ ...td, fontWeight: "bold" }}>
                          <span style={{ color: l.type === "IN" ? "#16a34a" : l.type === "OUT" ? "#ef4444" : "#ca8a04" }}>
                            {l.change_qty > 0 ? `+${l.change_qty}` : l.change_qty}
                          </span>
                        </td>
                        <td style={{ ...td, color: "#6b7280" }}>
                          {l.cost_price ? `${l.cost_price} ৳` : "—"}
                        </td>
                        <td style={{ ...td, fontSize: 13, color: "#6b7280" }}>{l.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================
          Phase 3.6 — Stock Adjust Tab
      ======================== */}
      {activeTab === "adjust" && (
        <div style={{
          background: "#fff", border: "2px solid #f59e0b",
          borderRadius: 12, padding: 28,
          boxShadow: "0 2px 8px rgba(245,158,11,0.08)",
        }}>
          <h3 style={{ margin: "0 0 8px", color: "#92400e" }}>🔧 Stock Adjustment</h3>
          <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 14 }}>
            ⚠️ এই tool টি ব্যবহার করুন শুধুমাত্র যখন actual stock এবং system এর stock মিলছে না।
          </p>

          <form onSubmit={handleAdjust}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>পণ্য বেছে নিন *</label>
                <select
                  value={adjForm.product_id}
                  onChange={e => {
                    const p = products.find(p => String(p.id) === e.target.value);
                    setAdjForm({ ...adjForm, product_id: e.target.value, new_stock: p ? String(p.stock) : "" });
                  }}
                  style={inputStyle}
                  required
                >
                  <option value="">-- পণ্য বেছে নিন --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — বর্তমান stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>সঠিক Stock পরিমাণ *</label>
                <input
                  type="number"
                  placeholder="নতুন stock সংখ্যা দিন"
                  value={adjForm.new_stock}
                  onChange={e => setAdjForm({ ...adjForm, new_stock: e.target.value })}
                  style={inputStyle}
                  min="0"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>কারণ — ঐচ্ছিক</label>
                <input
                  placeholder="যেমন: গণনায় ভুল ছিল"
                  value={adjForm.reason}
                  onChange={e => setAdjForm({ ...adjForm, reason: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={adjLoading}
              style={{
                marginTop: 20,
                padding: "11px 28px",
                background: adjLoading ? "#d1d5db" : "#d97706",
                color: "#fff", border: "none", borderRadius: 8,
                fontWeight: "bold", fontSize: 15,
                cursor: adjLoading ? "not-allowed" : "pointer",
              }}
            >
              {adjLoading ? "সংশোধন হচ্ছে..." : "🔧 Stock সংশোধন করুন"}
            </button>
          </form>
        </div>
      )}
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
