import { useEffect, useState } from "react";
import { API } from "../api";
import { glass, T, inputStyle, labelStyle, primaryBtn, secondaryBtn, editBtn, deleteBtn, th, td, msgBox, stockBadge } from "../theme";
import { useT } from "../context/SettingsContext";

const EMPTY = { name: "", buy_price: "", sell_price: "", stock: "", barcode: "", category_id: "" };
const ACCENT = "#6366f1";

export default function Products() {
  const t = useT();
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [form,       setForm]       = useState(EMPTY);
  const [editingId,  setEditingId]  = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [filterCat,  setFilterCat]  = useState("");
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState({ type: "", text: "" });

  const load = () => {
    API.get("/products").then(r => setProducts(r.data)).catch(console.error);
    API.get("/categories").then(r => setCategories(r.data)).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const filtered = products.filter(p => {
    const matchCat = filterCat ? p.category_id === parseInt(filterCat) : true;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    return matchCat && matchSearch;
  });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const openEdit = (p) => {
    setForm({ name: p.name || "", buy_price: p.buy_price || "", sell_price: p.sell_price || "",
      stock: p.stock || "", barcode: p.barcode || "", category_id: p.category_id || "" });
    setEditingId(p.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAdd = () => {
    setForm(EMPTY); setEditingId(null); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showMsg("error", t("products_name_required")); return; }
    setLoading(true);
    try {
      if (editingId) {
        await API.put(`/products/${editingId}`, form);
        showMsg("success", `✅ "${form.name}" ${t("products_updated")}`);
      } else {
        await API.post("/products", form);
        showMsg("success", `✅ "${form.name}" ${t("products_added")}`);
      }
      setForm(EMPTY); setEditingId(null); setShowForm(false); load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("products_problem")));
    } finally { setLoading(false); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`"${p.name}" ${t("products_confirm_delete")}`)) return;
    try {
      await API.delete(`/products/${p.id}`);
      showMsg("success", `✅ "${p.name}" ${t("products_deleted")}`); load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("products_delete_error")));
    }
  };

  const getCatName = (id) => categories.find(c => c.id === id)?.name || "—";

  const fld = (label, children) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <h2 className="page-title">{t("products_title")}</h2>
        <button onClick={openAdd} style={primaryBtn}>{t("products_add_new")}</button>
      </div>

      {msg.text && <div style={msgBox(msg.type)}>{msg.text}</div>}

      {showForm && (
        <div style={{ ...glass({ borderRadius: 18, padding: 24, marginBottom: 24 }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ margin: 0, color: T.text1, fontWeight: 800, fontSize: 16 }}>
              {editingId ? t("products_edit_title") : t("products_add_title")}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY); }}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.text4 }}>✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                {fld(t("products_name_label"), <input name="name" value={form.name} onChange={handleChange}
                  placeholder={t("products_name_ph")} style={inputStyle} required className="glass-input" />)}
              </div>
              {fld(t("products_buy_price"), <input name="buy_price" type="number" value={form.buy_price}
                onChange={handleChange} placeholder="0" style={inputStyle} className="glass-input" />)}
              {fld(t("products_sell_price"), <input name="sell_price" type="number" value={form.sell_price}
                onChange={handleChange} placeholder="0" style={inputStyle} className="glass-input" />)}
              {fld(t("products_stock_qty"), <input name="stock" type="number" value={form.stock}
                onChange={handleChange} placeholder="0" style={inputStyle} className="glass-input" />)}
              {fld(t("products_barcode"), <input name="barcode" value={form.barcode}
                onChange={handleChange} placeholder={t("products_barcode_ph")} style={inputStyle} className="glass-input" />)}
              <div style={{ gridColumn: "1 / -1" }}>
                {fld(t("products_category"), (
                  <select name="category_id" value={form.category_id} onChange={handleChange}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">{t("products_select_cat")}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="submit" disabled={loading} style={primaryBtn}>
                {loading ? t("products_saving") : editingId ? t("products_update_btn") : t("products_add_btn")}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY); }}
                style={secondaryBtn}>{t("cancel")}</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ ...glass({ borderRadius: 12, padding: "0 14px" }), display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: T.text4 }}>🔍</span>
          <input type="text" placeholder={t("products_search_ph")}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", padding: "10px 0", fontSize: 14, color: T.text1, width: 220, fontFamily: "inherit" }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ id: "", name: `${t("all")} (${products.length})` }, ...categories.map(c => ({
            id: String(c.id), name: `${c.name} (${products.filter(p => p.category_id === c.id).length})`
          }))].map(c => {
            const active = filterCat === String(c.id);
            return (
              <button key={String(c.id)} onClick={() => setFilterCat(String(c.id))} style={{
                padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: active ? 700 : 500, fontFamily: "inherit",
                background: active ? `linear-gradient(135deg, ${ACCENT}, #8b5cf6)` : "rgba(255,255,255,0.65)",
                color: active ? "#fff" : T.text2,
                boxShadow: active ? `0 4px 12px ${ACCENT}35` : "0 1px 4px rgba(0,0,0,0.06)",
              }}>{c.name}</button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...glass({ borderRadius: 18, overflow: "hidden", padding: 0 }) }}>
        <div style={{
          padding: "14px 20px",
          background: "rgba(255,255,255,0.5)",
          borderBottom: "1px solid rgba(255,255,255,0.6)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <b style={{ color: T.text1, fontSize: 15 }}>{t("products_list")}</b>
          <span style={{
            background: `${ACCENT}15`, color: ACCENT,
            border: `1px solid ${ACCENT}30`,
            borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700,
          }}>{filtered.length} {t("items_count")}</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
            <p style={{ color: T.text4 }}>{t("products_not_found")}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", t("products_col_name"), t("products_category"), t("products_col_buy"), t("products_col_sell"), t("products_col_stock"), t("products_col_barcode"), t("action")].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={td}><span style={{ color: T.text4, fontSize: 12 }}>{i + 1}</span></td>
                    <td style={{ ...td, fontWeight: 700, color: T.text1 }}>{p.name}</td>
                    <td style={td}>
                      {p.category_id
                        ? <span style={{ background: `${ACCENT}12`, color: ACCENT, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600, border: `1px solid ${ACCENT}25` }}>{getCatName(p.category_id)}</span>
                        : <span style={{ color: T.text4 }}>—</span>}
                    </td>
                    <td style={td}>{p.buy_price ? `${p.buy_price} ৳` : "—"}</td>
                    <td style={{ ...td, color: ACCENT, fontWeight: 700 }}>{p.sell_price ? `${p.sell_price} ৳` : "—"}</td>
                    <td style={td}><span style={stockBadge(p.stock)}>{p.stock}</span></td>
                    <td style={{ ...td, color: T.text4, fontSize: 12 }}>{p.barcode || "—"}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={editBtn}>✏️ {t("edit")}</button>
                        <button onClick={() => handleDelete(p)} style={deleteBtn}>🗑️ {t("delete")}</button>
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
