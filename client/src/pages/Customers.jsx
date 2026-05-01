import { useEffect, useState } from "react";
import { API } from "../api";
import { glass, T, th, td, primaryBtn, editBtn, deleteBtn, successBtn, secondaryBtn, msgBox } from "../theme";
import { useT } from "../context/SettingsContext";

const ACCENT = "#6366f1";
const inpStyle = {
  padding: "7px 10px",
  background: "rgba(255,255,255,0.7)",
  border: "1.5px solid rgba(255,255,255,0.85)",
  borderRadius: 8, fontSize: 13, fontFamily: "inherit",
  color: T.text1, outline: "none", boxSizing: "border-box",
};

export default function Customers({ onViewLedger }) {
  const t = useT();
  const [customers,  setCustomers]  = useState([]);
  const [form,       setForm]       = useState({ name: "", phone: "" });
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState({ type: "", text: "" });
  const [search,     setSearch]     = useState("");
  const [editingId,  setEditingId]  = useState(null);
  const [editForm,   setEditForm]   = useState({ name: "", phone: "" });
  const [deletingId, setDeletingId] = useState(null);

  const load = () => API.get("/customers").then(r => setCustomers(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showMsg("error", t("customers_name_required")); return; }
    setLoading(true);
    try {
      await API.post("/customers", { name: form.name.trim(), phone: form.phone.trim() });
      showMsg("success", `✅ "${form.name.trim()}" ${t("customers_added") || "যোগ হয়েছে!"}`);
      setForm({ name: "", phone: "" }); load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("customers_problem")));
    } finally { setLoading(false); }
  };

  const handleEdit = async (id) => {
    if (!editForm.name.trim()) return;
    try {
      await API.put(`/customers/${id}`, { name: editForm.name.trim(), phone: editForm.phone.trim() });
      showMsg("success", `✅ ${t("customers_updated")}`);
      setEditingId(null); load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("customers_update_error")));
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await API.delete(`/customers/${id}`);
      showMsg("success", `✅ "${name}" ${t("customers_deleted")}`);
      setDeletingId(null); load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("customers_delete_error")));
      setDeletingId(null);
    }
  };

  const filtered   = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );
  const totalDue = customers.reduce((s, c) => s + (c.due_amount || 0), 0);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">{t("customers_title")}</h2>
        {totalDue > 0 && (
          <div style={{
            background: "rgba(254,242,242,0.9)", border: "1px solid #fca5a5",
            borderRadius: 12, padding: "8px 16px",
          }}>
            <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>
              {t("customers_total_due")}: {totalDue.toFixed(2)} ৳
            </span>
          </div>
        )}
      </div>

      {msg.text && <div style={msgBox(msg.type)}>{msg.text}</div>}

      {/* Add Form */}
      <div style={{ ...glass({ borderRadius: 18, padding: 20, marginBottom: 20 }) }}>
        <h3 style={{ margin: "0 0 14px", color: T.text1, fontWeight: 800, fontSize: 15 }}>{t("customers_add_heading")}</h3>
        <form onSubmit={handleAdd}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.text3, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("customers_name_label")}</label>
              <input placeholder={t("customers_add_heading")} value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "rgba(255,255,255,0.6)",
                  border: "1.5px solid rgba(255,255,255,0.85)",
                  borderRadius: 10, fontSize: 14, fontFamily: "inherit",
                  color: T.text1, outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.85)"; e.target.style.boxShadow = "none"; }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.text3, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("customers_phone_label")}</label>
              <input placeholder="01XXXXXXXXX" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "rgba(255,255,255,0.6)",
                  border: "1.5px solid rgba(255,255,255,0.85)",
                  borderRadius: 10, fontSize: 14, fontFamily: "inherit",
                  color: T.text1, outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.85)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? t("customers_adding") : t("customers_add_btn")}
            </button>
          </div>
        </form>
      </div>

      {/* Search */}
      <div style={{ ...glass({ borderRadius: 12, padding: "0 14px", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }) }}>
        <span style={{ color: T.text4 }}>🔍</span>
        <input type="text" placeholder={t("customers_search_ph")}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: "none", border: "none", outline: "none", padding: "10px 0", fontSize: 14, color: T.text1, width: 220, fontFamily: "inherit" }}
        />
      </div>

      {/* Table */}
      <div style={{ ...glass({ borderRadius: 18, overflow: "hidden", padding: 0 }) }}>
        <div style={{
          padding: "14px 20px",
          background: "rgba(255,255,255,0.5)",
          borderBottom: "1px solid rgba(255,255,255,0.6)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <b style={{ color: T.text1, fontSize: 15 }}>{t("customers_all")}</b>
          <span style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
            {filtered.length} {t("customers_count_suffix")}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
            <p style={{ color: T.text4 }}>{t("customers_none")}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", t("customers_col_name"), t("customers_col_phone"), t("customers_col_due"), t("customers_col_ledger"), t("action")].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={td}><span style={{ color: T.text4, fontSize: 12 }}>{i + 1}</span></td>

                    <td style={{ ...td, fontWeight: 700, color: T.text1 }}>
                      {editingId === c.id
                        ? <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            autoFocus style={{ ...inpStyle, width: 140 }} />
                        : <>👤 {c.name}</>}
                    </td>

                    <td style={{ ...td, color: T.text3 }}>
                      {editingId === c.id
                        ? <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                            placeholder="01XXXXXXXXX" style={{ ...inpStyle, width: 130 }} />
                        : (c.phone || "—")}
                    </td>

                    <td style={td}>
                      {c.due_amount > 0 ? (
                        <span style={{ background: "rgba(254,242,242,0.9)", color: "#ef4444", borderRadius: 8, padding: "3px 10px", fontWeight: 700, fontSize: 13, border: "1px solid #fca5a5" }}>
                          {c.due_amount} ৳
                        </span>
                      ) : (
                        <span style={{ background: "rgba(240,253,244,0.9)", color: "#16a34a", borderRadius: 8, padding: "3px 10px", fontSize: 13, border: "1px solid #86efac" }}>
                          {t("customers_due_clear")}
                        </span>
                      )}
                    </td>

                    <td style={td}>
                      <button onClick={() => onViewLedger(c)} style={editBtn}>{t("customers_ledger_btn")}</button>
                    </td>

                    <td style={td}>
                      {editingId === c.id ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleEdit(c.id)} style={successBtn}>✅ {t("save")}</button>
                          <button onClick={() => setEditingId(null)} style={secondaryBtn}>{t("cancel")}</button>
                        </div>
                      ) : deletingId === c.id ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{t("customers_confirm")}</span>
                          <button onClick={() => handleDelete(c.id, c.name)} style={deleteBtn}>{t("customers_yes")}</button>
                          <button onClick={() => setDeletingId(null)} style={secondaryBtn}>{t("no")}</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, phone: c.phone || "" }); setDeletingId(null); }} style={editBtn}>✏️ {t("edit")}</button>
                          <button onClick={() => { setDeletingId(c.id); setEditingId(null); }} style={deleteBtn}>🗑️</button>
                        </div>
                      )}
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
