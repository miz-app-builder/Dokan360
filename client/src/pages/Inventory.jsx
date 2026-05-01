import { useEffect, useState } from "react";
import { API } from "../api";
import { glass, T, th, td, msgBox, stockBadge } from "../theme";
import { useT } from "../context/SettingsContext";

const LOW_STOCK_LIMIT = 10;
const ACCENT  = "#6366f1";
const ACCENT2 = "#8b5cf6";

const glassInp = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.6)",
  border: "1.5px solid rgba(255,255,255,0.85)",
  borderRadius: 10, fontSize: 14, fontFamily: "inherit",
  color: T.text1, outline: "none", boxSizing: "border-box",
};
const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: T.text3, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" };

export default function Inventory() {
  const t = useT();
  const [products,     setProducts]     = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [activeTab,    setActiveTab]    = useState("low_stock");
  const [msg,          setMsg]          = useState({ type: "", text: "" });
  const [inForm,       setInForm]       = useState({ product_id: "", quantity: "", cost_price: "", note: "" });
  const [inLoading,    setInLoading]    = useState(false);
  const [adjForm,      setAdjForm]      = useState({ product_id: "", new_stock: "", reason: "" });
  const [adjLoading,   setAdjLoading]   = useState(false);
  const [filterType,   setFilterType]   = useState("");
  const [filterProduct,setFilterProduct]= useState("");

  const loadProducts = () => API.get("/products").then(r => setProducts(r.data)).catch(console.error);
  const loadLogs     = () => API.get("/stock/logs").then(r => setLogs(r.data)).catch(console.error);

  useEffect(() => { loadProducts(); loadLogs(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!inForm.product_id) { showMsg("error", t("inventory_product_required")); return; }
    if (!inForm.quantity || inForm.quantity <= 0) { showMsg("error", t("inventory_qty_invalid")); return; }
    setInLoading(true);
    try {
      const res = await API.post("/stock/in", {
        product_id: parseInt(inForm.product_id),
        quantity: parseInt(inForm.quantity),
        cost_price: inForm.cost_price ? parseFloat(inForm.cost_price) : null,
        note: inForm.note || null,
      });
      showMsg("success", `✅ "${res.data.product_name}" — ${inForm.quantity}${t("items_count")} ${t("inventory_add_success_pre")} ${res.data.new_stock}`);
      setInForm({ product_id: "", quantity: "", cost_price: "", note: "" });
      loadProducts(); loadLogs();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("error")));
    } finally { setInLoading(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjForm.product_id) { showMsg("error", t("inventory_adj_product_required")); return; }
    if (adjForm.new_stock === "" || adjForm.new_stock < 0) { showMsg("error", t("inventory_adj_qty_invalid")); return; }
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
      loadProducts(); loadLogs();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("error")));
    } finally { setAdjLoading(false); }
  };

  const lowStockProducts = products.filter(p => p.stock <= LOW_STOCK_LIMIT);
  const filteredLogs = logs.filter(l => {
    const matchType    = filterType    ? l.type === filterType : true;
    const matchProduct = filterProduct ? String(l.product_id) === filterProduct : true;
    return matchType && matchProduct;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleString("bn-BD") : "—";

  const typeBadge = (type) => ({
    IN:     { background: "rgba(240,253,244,0.9)", color: "#16a34a", border: "1px solid #86efac" },
    OUT:    { background: "rgba(254,242,242,0.9)", color: "#ef4444", border: "1px solid #fca5a5" },
    ADJUST: { background: "rgba(255,251,235,0.9)", color: "#d97706", border: "1px solid #fde68a" },
  }[type] || {});

  const tabs = [
    { key: "low_stock", labelKey: "inventory_tab_low",     badge: lowStockProducts.length > 0 ? ` (${lowStockProducts.length})` : "" },
    { key: "stock_in",  labelKey: "inventory_tab_in",      badge: "" },
    { key: "history",   labelKey: "inventory_tab_history", badge: "" },
    { key: "adjust",    labelKey: "inventory_tab_adjust",  badge: "" },
  ];

  const fi = (label, children) => (
    <div>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">{t("inventory_title")}</h2>
      </div>

      {msg.text && <div style={{ ...msgBox(msg.type), marginBottom: 16 }}>{msg.text}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "9px 18px",
              background: active ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(255,255,255,0.65)",
              color: active ? "#fff" : T.text2,
              border: "none", borderRadius: 10,
              fontWeight: active ? 700 : 500, fontSize: 13,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: active ? `0 4px 12px ${ACCENT}35` : "0 1px 4px rgba(0,0,0,0.06)",
              backdropFilter: "blur(10px)",
            }}>{t(tab.labelKey)}{tab.badge}</button>
          );
        })}
      </div>

      {/* LOW STOCK TAB */}
      {activeTab === "low_stock" && (
        lowStockProducts.length === 0 ? (
          <div style={{ ...glass({ borderRadius: 18, padding: 40, textAlign: "center" }) }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <p style={{ color: "#16a34a", fontWeight: 700, margin: 0, fontSize: 15 }}>
              {t("inventory_all_ok")}
            </p>
          </div>
        ) : (
          <div>
            <div style={{ background: "rgba(254,242,242,0.9)", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 20px", marginBottom: 16 }}>
              <span style={{ color: "#ef4444", fontWeight: 700 }}>
                ⚠️ {lowStockProducts.length}{t("inventory_low_warning_pre")} {LOW_STOCK_LIMIT} {t("inventory_low_warning_suf")}
              </span>
            </div>
            <div style={{ ...glass({ borderRadius: 18, overflow: "hidden", padding: 0 }) }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", t("inventory_col_product"), t("inventory_col_barcode"), t("inventory_col_stock"), t("inventory_col_status")].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p, i) => (
                    <tr key={p.id}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={td}><span style={{ color: T.text4, fontSize: 12 }}>{i + 1}</span></td>
                      <td style={{ ...td, fontWeight: 700, color: T.text1 }}>{p.name}</td>
                      <td style={{ ...td, color: T.text4, fontSize: 12 }}>{p.barcode || "—"}</td>
                      <td style={td}><span style={stockBadge(p.stock)}>{p.stock}</span></td>
                      <td style={td}>
                        {p.stock <= 0
                          ? <span style={{ color: "#ef4444", fontWeight: 700 }}>{t("inventory_out")}</span>
                          : <span style={{ color: "#d97706", fontWeight: 700 }}>{t("inventory_low")}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* STOCK IN TAB */}
      {activeTab === "stock_in" && (
        <div style={{ ...glass({ borderRadius: 20, padding: 28 }), maxWidth: 600 }}>
          <h3 style={{ margin: "0 0 20px", color: T.text1, fontWeight: 800, fontSize: 16 }}>{t("inventory_add_heading")}</h3>
          <form onSubmit={handleStockIn}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                {fi(t("inventory_select_label"),
                  <select value={inForm.product_id}
                    onChange={e => setInForm({ ...inForm, product_id: e.target.value })}
                    style={{ ...glassInp, cursor: "pointer" }} required>
                    <option value="">{t("inventory_select_ph")}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} — {t("inventory_current_stock")}: {p.stock}</option>)}
                  </select>
                )}
              </div>
              {fi(t("inventory_qty_label"),
                <input type="number" placeholder={t("inventory_qty_ph")}
                  value={inForm.quantity} onChange={e => setInForm({ ...inForm, quantity: e.target.value })}
                  style={glassInp} min="1" required />
              )}
              {fi(t("inventory_cost_label"),
                <input type="number" placeholder={t("inventory_cost_ph")}
                  value={inForm.cost_price} onChange={e => setInForm({ ...inForm, cost_price: e.target.value })}
                  style={glassInp} min="0" />
              )}
              <div style={{ gridColumn: "1 / -1" }}>
                {fi(t("inventory_note_label"),
                  <input placeholder={t("inventory_note_ph")}
                    value={inForm.note} onChange={e => setInForm({ ...inForm, note: e.target.value })}
                    style={glassInp} />
                )}
              </div>
            </div>
            <button type="submit" disabled={inLoading} style={{
              marginTop: 20, padding: "12px 28px",
              background: inLoading ? "rgba(209,213,219,0.8)" : `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
              color: "#fff", border: "none", borderRadius: 12,
              fontWeight: 700, fontSize: 15, cursor: inLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit", boxShadow: inLoading ? "none" : `0 4px 14px ${ACCENT}35`,
            }}>
              {inLoading ? t("inventory_adding") : t("inventory_add_btn")}
            </button>
          </form>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ ...glassInp, width: "auto", cursor: "pointer" }}>
              <option value="">{t("inventory_all_types")}</option>
              <option value="IN">⬆️ IN</option>
              <option value="OUT">⬇️ OUT</option>
              <option value="ADJUST">🔧 ADJUST</option>
            </select>
            <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
              style={{ ...glassInp, width: "auto", cursor: "pointer" }}>
              <option value="">{t("inventory_all_products")}</option>
              {products.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ ...glass({ borderRadius: 18, overflow: "hidden", padding: 0 }) }}>
            <div style={{
              padding: "14px 20px",
              background: "rgba(255,255,255,0.5)",
              borderBottom: "1px solid rgba(255,255,255,0.6)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <b style={{ color: T.text1, fontSize: 15 }}>{t("inventory_history_title")}</b>
              <span style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
                {filteredLogs.length} {t("items_count")}
              </span>
            </div>
            {filteredLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                <p style={{ color: T.text4 }}>{t("inventory_no_movement")}</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {[t("inventory_col_date"), t("inventory_col_product"), t("inventory_col_type"), t("inventory_col_qty"), t("inventory_col_cost"), t("inventory_col_note")].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((l, i) => (
                      <tr key={l.id || i}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ ...td, fontSize: 12, color: T.text3 }}>{formatDate(l.created_at)}</td>
                        <td style={{ ...td, fontWeight: 700, color: T.text1 }}>{l.products?.name || "—"}</td>
                        <td style={td}>
                          <span style={{ ...typeBadge(l.type), borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                            {l.type === "IN" ? "⬆️ IN" : l.type === "OUT" ? "⬇️ OUT" : "🔧 ADJUST"}
                          </span>
                        </td>
                        <td style={{ ...td, fontWeight: 700 }}>
                          <span style={{ color: l.type === "IN" ? "#16a34a" : l.type === "OUT" ? "#ef4444" : "#d97706" }}>
                            {l.change_qty > 0 ? `+${l.change_qty}` : l.change_qty}
                          </span>
                        </td>
                        <td style={{ ...td, color: T.text3 }}>{l.cost_price ? `${l.cost_price} ৳` : "—"}</td>
                        <td style={{ ...td, fontSize: 13, color: T.text3 }}>{l.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADJUST TAB */}
      {activeTab === "adjust" && (
        <div style={{
          ...glass({ borderRadius: 20, padding: 28 }),
          border: "1.5px solid rgba(245,158,11,0.4)",
          boxShadow: "0 4px 20px rgba(245,158,11,0.10)",
          maxWidth: 560,
        }}>
          <h3 style={{ margin: "0 0 6px", color: "#92400e", fontWeight: 800, fontSize: 16 }}>{t("inventory_adjust_heading")}</h3>
          <p style={{ margin: "0 0 20px", color: T.text3, fontSize: 13 }}>
            {t("inventory_adjust_warning")}
          </p>
          <form onSubmit={handleAdjust}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                {fi(t("inventory_adj_select_label"),
                  <select value={adjForm.product_id}
                    onChange={e => {
                      const p = products.find(p => String(p.id) === e.target.value);
                      setAdjForm({ ...adjForm, product_id: e.target.value, new_stock: p ? String(p.stock) : "" });
                    }}
                    style={{ ...glassInp, cursor: "pointer" }} required>
                    <option value="">{t("inventory_adj_select_ph")}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} — {t("inventory_adj_current")}: {p.stock}</option>)}
                  </select>
                )}
              </div>
              {fi(t("inventory_correct_label"),
                <input type="number" placeholder={t("inventory_correct_ph")}
                  value={adjForm.new_stock} onChange={e => setAdjForm({ ...adjForm, new_stock: e.target.value })}
                  style={glassInp} min="0" required />
              )}
              {fi(t("inventory_reason_label"),
                <input placeholder={t("inventory_reason_ph")}
                  value={adjForm.reason} onChange={e => setAdjForm({ ...adjForm, reason: e.target.value })}
                  style={glassInp} />
              )}
            </div>
            <button type="submit" disabled={adjLoading} style={{
              marginTop: 20, padding: "12px 28px",
              background: adjLoading ? "rgba(209,213,219,0.8)" : "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff", border: "none", borderRadius: 12,
              fontWeight: 700, fontSize: 15, cursor: adjLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit", boxShadow: adjLoading ? "none" : "0 4px 14px rgba(245,158,11,0.35)",
            }}>
              {adjLoading ? t("inventory_adjusting") : t("inventory_adj_btn")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
