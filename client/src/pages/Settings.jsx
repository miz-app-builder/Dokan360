import { useEffect, useState, useRef } from "react";
import { API } from "../api";
import { useSettings, useT } from "../context/SettingsContext";

// Display tab is for all users; other tabs are admin-only
const TABS = [
  { key: "display",   label: "🎨 Display",    adminOnly: false },
  { key: "shop",      label: "🏪 Shop Info",        adminOnly: true  },
  { key: "outlets",   label: "🏬 Outlets",          adminOnly: true  },
  { key: "billing",   label: "💰 Billing & Tax",    adminOnly: true  },
  { key: "receipt",   label: "🧾 Receipt",          adminOnly: true  },
];

const LANGUAGES = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
];

const THEMES = [
  { value: "light",  label: "☀️ Light" },
  { value: "dark",   label: "🌙 Dark" },
  { value: "purple", label: "💜 Purple" },
];

const FONT_SIZES = [
  { value: "small",  label: "Small (ছোট)" },
  { value: "medium", label: "Medium (মাঝারি)" },
  { value: "large",  label: "Large (বড়)" },
];

const CURRENCIES = [
  { value: "৳", label: "৳ — Bangladeshi Taka (BDT)" },
  { value: "₹", label: "₹ — Indian Rupee (INR)" },
  { value: "$", label: "$ — US Dollar (USD)" },
  { value: "€", label: "€ — Euro (EUR)" },
  { value: "£", label: "£ — British Pound (GBP)" },
  { value: "¥", label: "¥ — Japanese Yen (JPY)" },
  { value: "د.إ", label: "د.إ — UAE Dirham (AED)" },
];

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("dokan360_user")); } catch { return null; }
}

export default function Settings() {
  const t = useT();
  const { settings, loadSettings, updateDisplayPrefs } = useSettings();
  const currentUser = getCurrentUser();
  const isAdmin     = currentUser?.role === "admin";

  // Non-admins start on Display tab; admins start on Shop tab
  const [tab, setTab] = useState(isAdmin ? "shop" : "display");

  // Global settings form (admin-only fields)
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Display prefs form (per-user)
  const [displayForm, setDisplayForm] = useState({
    language:  settings.language  || "bn",
    font_size: settings.font_size || "medium",
    theme:     settings.theme     || "light",
  });
  const [displaySaved,   setDisplaySaved]   = useState(false);
  const [displaySaving,  setDisplaySaving]  = useState(false);
  const [displayError,   setDisplayError]   = useState("");

  // Outlets
  const [outlets, setOutlets] = useState([]);
  const [outletForm, setOutletForm] = useState({ name: "", address: "", phone: "", is_active: true });
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [outletSaving, setOutletSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const logoRef = useRef(null);

  // Sync global settings form (non-display fields)
  useEffect(() => {
    setForm({ ...settings });
    setLogoPreview(settings.shop_logo || "");
  }, [settings]);

  // Sync display prefs form when settings load
  useEffect(() => {
    setDisplayForm({
      language:  settings.language  || "bn",
      font_size: settings.font_size || "medium",
      theme:     settings.theme     || "light",
    });
  }, [settings.language, settings.font_size, settings.theme]);

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = () =>
    API.get("/outlets").then(r => setOutlets(r.data)).catch(console.error);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setDisp = async (k, v) => {
    const newPrefs = { ...displayForm, [k]: v };
    setDisplayForm(newPrefs);
    try {
      await updateDisplayPrefs(newPrefs);
      setDisplaySaved(true);
      setTimeout(() => setDisplaySaved(false), 2000);
    } catch {
      setDisplayError("❌ " + t("settings_save_error"));
      setTimeout(() => setDisplayError(""), 3000);
    }
  };

  // Save per-user display prefs to server
  const handleDisplaySave = async () => {
    setDisplaySaving(true);
    setDisplayError("");
    try {
      await updateDisplayPrefs(displayForm);
      setDisplaySaved(true);
      setTimeout(() => setDisplaySaved(false), 2500);
    } catch (err) {
      setDisplayError("❌ " + (err.response?.data?.error || t("settings_save_error")));
    } finally {
      setDisplaySaving(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showMsg("error", `❌ ${t("settings_logo_size_error")}`); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else        { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/png", 0.85);
        set("shop_logo", compressed);
        setLogoPreview(compressed);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Save global settings to server (admin-only; NO display prefs)
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        shop_name:       form.shop_name       || "",
        shop_logo:       form.shop_logo        || "",
        shop_address:    form.shop_address     || "",
        shop_phone:      form.shop_phone       || "",
        shop_email:      form.shop_email       || "",
        currency_symbol: form.currency_symbol  || "৳",
        tax_enabled:     form.tax_enabled      || "false",
        tax_rate:        String(form.tax_rate  || "0"),
        tax_label:       form.tax_label        || "VAT",
        receipt_footer:  form.receipt_footer   || "",
        low_stock_alert: String(form.low_stock_alert || "10"),
      };
      await API.put("/settings", payload);
      loadSettings();
      showMsg("success", `✅ ${t("settings_saved")}`);
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("error")));
    } finally {
      setSaving(false);
    }
  };

  const handleOutletSave = async () => {
    if (!outletForm.name.trim()) { showMsg("error", t("settings_outlet_name_required")); return; }
    setOutletSaving(true);
    try {
      if (editingOutlet) {
        await API.put(`/outlets/${editingOutlet.id}`, outletForm);
        showMsg("success", `✅ ${t("settings_outlet_updated")}`);
      } else {
        await API.post("/outlets", outletForm);
        showMsg("success", `✅ ${t("settings_outlet_added")}`);
      }
      setOutletForm({ name: "", address: "", phone: "", is_active: true });
      setEditingOutlet(null);
      loadOutlets();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("error")));
    } finally {
      setOutletSaving(false);
    }
  };

  const handleOutletDelete = async (id, name) => {
    if (!confirm(`"${name}" ${t("settings_outlet_confirm_delete")}`)) return;
    try {
      await API.delete(`/outlets/${id}`);
      showMsg("success", `✅ ${t("settings_outlet_deleted")}`);
      loadOutlets();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || t("error")));
    }
  };

  const startEditOutlet = (outlet) => {
    setEditingOutlet(outlet);
    setOutletForm({ name: outlet.name, address: outlet.address || "", phone: outlet.phone || "", is_active: outlet.is_active });
  };

  const cancelEditOutlet = () => {
    setEditingOutlet(null);
    setOutletForm({ name: "", address: "", phone: "", is_active: true });
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">⚙️ Settings</h2>
      </div>

      {msg.text && (
        <div style={{
          padding: "11px 18px", borderRadius: 12, marginBottom: 16,
          background: msg.type === "success" ? "rgba(240,253,244,0.9)" : "rgba(254,242,242,0.9)",
          border: `1px solid ${msg.type === "success" ? "#86efac" : "#fca5a5"}`,
          color: msg.type === "success" ? "#16a34a" : "#ef4444",
          fontWeight: 700, fontSize: 14,
        }}>{msg.text}</div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.filter(t => !t.adminOnly || isAdmin).map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "9px 18px",
              background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.65)",
              color: active ? "#fff" : "#374151",
              border: "none", borderRadius: 10,
              fontWeight: active ? 700 : 500, fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: active ? "0 4px 12px rgba(99,102,241,0.35)" : "0 1px 4px rgba(0,0,0,0.06)",
              backdropFilter: "blur(10px)",
            }}>{t.label}</button>
          );
        })}
      </div>

      {/* ── SHOP INFO TAB ── */}
      {tab === "shop" && (
        <div style={card}>
          <div style={cardHdr}><b>🏪 Shop Information</b></div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <div
                  onClick={() => logoRef.current?.click()}
                  style={{
                    width: 110, height: 110, borderRadius: 12,
                    border: "2px dashed #d1d5db", background: "#f9fafb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", overflow: "hidden",
                  }}
                >
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <div style={{ textAlign: "center", color: "#9ca3af" }}>
                        <div style={{ fontSize: 28 }}>🏪</div>
                        <div style={{ fontSize: 11, marginTop: 4 }}>Logo</div>
                      </div>
                  }
                </div>
                <button type="button" onClick={() => logoRef.current?.click()}
                  style={{ ...actionBtn, fontSize: 12, padding: "6px 12px" }}>
                  {t("settings_logo_upload")}
                </button>
                {logoPreview && (
                  <button type="button" onClick={() => { set("shop_logo", ""); setLogoPreview(""); }}
                    style={{ ...dangerBtn, fontSize: 12, padding: "4px 10px" }}>
                    🗑️ Remove
                  </button>
                )}
                <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
                <p style={{ fontSize: 10, color: "#9ca3af", margin: 0, textAlign: "center" }}>PNG/JPG, max ২MB</p>
              </div>

              <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Shop নাম *" value={form.shop_name || ""} onChange={v => set("shop_name", v)} placeholder="আপনার দোকানের নাম" />
                <Field label="ফোন নম্বর" value={form.shop_phone || ""} onChange={v => set("shop_phone", v)} placeholder="01XXXXXXXXX" />
                <Field label="ইমেইল" value={form.shop_email || ""} onChange={v => set("shop_email", v)} type="email" placeholder="shop@email.com" />
              </div>
            </div>

            <Field label="ঠিকানা" value={form.shop_address || ""} onChange={v => set("shop_address", v)} type="textarea" placeholder="দোকানের পূর্ণ ঠিকানা লিখুন..." />

            <SaveBtn onClick={handleSave} saving={saving} />
          </div>
        </div>
      )}

      {/* ── OUTLETS TAB ── */}
      {tab === "outlets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <div style={card}>
            <div style={cardHdr}>
              <b>{editingOutlet ? `✏️ Outlet সম্পাদনা — ${editingOutlet.name}` : "➕ নতুন Outlet যোগ করুন"}</b>
              {editingOutlet && (
                <button onClick={cancelEditOutlet} style={{ ...dangerBtn, fontSize: 12 }}>✕ বাতিল</button>
              )}
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Outlet নাম *" value={outletForm.name} onChange={v => setOutletForm(f => ({ ...f, name: v }))} placeholder="যেমন: মেইন শাখা" />
                <Field label="ফোন নম্বর" value={outletForm.phone} onChange={v => setOutletForm(f => ({ ...f, phone: v }))} placeholder="01XXXXXXXXX" />
              </div>
              <Field label="ঠিকানা" value={outletForm.address} onChange={v => setOutletForm(f => ({ ...f, address: v }))} type="textarea" placeholder="Outlet এর ঠিকানা..." />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ fontWeight: "bold", fontSize: 13 }}>Status:</label>
                <Toggle value={outletForm.is_active} onChange={v => setOutletForm(f => ({ ...f, is_active: v }))} />
                <span style={{ fontSize: 13, color: outletForm.is_active ? "#16a34a" : "#ef4444" }}>
                  {outletForm.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <button onClick={handleOutletSave} disabled={outletSaving} style={actionBtn}>
                {outletSaving ? t("settings_saving") : editingOutlet ? t("settings_outlet_update_btn") : t("settings_outlet_add_btn")}
              </button>
            </div>
          </div>

          <div style={card}>
            <div style={cardHdr}><b>🏬 সকল Outlet ({outlets.length})</b></div>
            {outlets.length === 0 ? (
              <p style={emptyTxt}>কোনো outlet নেই। উপরে যোগ করুন।</p>
            ) : (
              <div style={{ padding: "0 0 8px" }}>
                {outlets.map(o => (
                  <div key={o.id} style={{
                    padding: "14px 20px", borderBottom: "1px solid #f3f4f6",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: 15 }}>
                        🏬 {o.name}
                        <span style={{
                          marginLeft: 10, fontSize: 11, fontWeight: "bold",
                          background: o.is_active ? "#f0fdf4" : "#fef2f2",
                          color: o.is_active ? "#16a34a" : "#ef4444",
                          borderRadius: 20, padding: "2px 8px",
                        }}>{o.is_active ? "Active" : "Inactive"}</span>
                      </div>
                      {o.phone && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>📞 {o.phone}</div>}
                      {o.address && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>📍 {o.address}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => startEditOutlet(o)} style={{ ...editBtn, fontSize: 13 }}>✏️ Edit</button>
                      <button onClick={() => handleOutletDelete(o.id, o.name)} style={{ ...dangerBtn, fontSize: 13 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DISPLAY TAB ── */}
      {tab === "display" && (
        <div style={card}>
          <div style={cardHdr}>
            <b>🎨 Display Settings</b>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>

            <Section label="🌐 Language / ভাষা">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {LANGUAGES.map(l => (
                  <ChoiceBtn key={l.value} active={displayForm.language === l.value} onClick={() => setDisp("language", l.value)}>
                    {l.label}
                  </ChoiceBtn>
                ))}
              </div>
            </Section>

            <Section label="🔤 Font Size / ফন্ট সাইজ">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {FONT_SIZES.map(f => (
                  <ChoiceBtn key={f.value} active={displayForm.font_size === f.value} onClick={() => setDisp("font_size", f.value)}>
                    {f.label}
                  </ChoiceBtn>
                ))}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6b7280" }}>
                Preview: <span style={{ fontSize: { small: "13px", medium: "15px", large: "17px" }[displayForm.font_size] }}>
                  এটি একটি sample text।
                </span>
              </p>
            </Section>

            <Section label="🎨 Theme / থিম">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {THEMES.map(t => (
                  <ChoiceBtn key={t.value} active={displayForm.theme === t.value} onClick={() => setDisp("theme", t.value)}>
                    {t.value === "light"  ? "☀️ Light"  :
                     t.value === "dark"   ? "🌙 Dark"   :
                     t.value === "purple" ? "💜 Purple" : t.label}
                  </ChoiceBtn>
                ))}
              </div>
            </Section>

            {/* Auto-save status */}
            <div style={{ minHeight: 24 }}>
              {displaySaved && (
                <span style={{ color: "#16a34a", fontWeight: "bold", fontSize: 13 }}>
                  ✅ সেভ হয়ে গেছে!
                </span>
              )}
              {displayError && (
                <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: 13 }}>
                  {displayError}
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── BILLING & TAX TAB ── */}
      {tab === "billing" && (
        <div style={card}>
          <div style={cardHdr}><b>💰 Billing & Tax Settings</b></div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>

            <Section label="💱 Currency / মুদ্রা">
              <select
                value={form.currency_symbol || "৳"}
                onChange={e => set("currency_symbol", e.target.value)}
                style={inputStyle}
              >
                {CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>
                Preview: <b>১,২৫০ {form.currency_symbol || "৳"}</b>
              </p>
            </Section>

            <Section label="📊 Tax / ট্যাক্স">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Toggle
                  value={form.tax_enabled === "true"}
                  onChange={v => set("tax_enabled", v ? "true" : "false")}
                />
                <span style={{ fontSize: 14, fontWeight: "bold", color: form.tax_enabled === "true" ? "#16a34a" : "#6b7280" }}>
                  {form.tax_enabled === "true" ? "Tax চালু আছে" : "Tax বন্ধ আছে"}
                </span>
              </div>
              {form.tax_enabled === "true" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={lbl}>Tax Label (যেমন: VAT, GST)</label>
                    <input
                      value={form.tax_label || "VAT"}
                      onChange={e => set("tax_label", e.target.value)}
                      style={inputStyle}
                      placeholder="VAT"
                    />
                  </div>
                  <div>
                    <label style={lbl}>Tax হার (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.tax_rate || "0"}
                      onChange={e => set("tax_rate", e.target.value)}
                      style={inputStyle}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
              {form.tax_enabled === "true" && (
                <div style={{
                  marginTop: 12, background: "#f0fdf4", border: "1px solid #86efac",
                  borderRadius: 8, padding: "10px 14px", fontSize: 13,
                }}>
                  <b>Preview:</b> ১,০০০ {form.currency_symbol || "৳"} বিক্রয়ে {form.tax_label || "VAT"} = <b>{(1000 * parseFloat(form.tax_rate || 0) / 100).toFixed(2)} {form.currency_symbol || "৳"}</b>
                </div>
              )}
            </Section>

            <SaveBtn onClick={handleSave} saving={saving} />
          </div>
        </div>
      )}

      {/* ── RECEIPT TAB ── */}
      {tab === "receipt" && (
        <div style={card}>
          <div style={cardHdr}><b>🧾 Receipt Settings</b></div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

            <Section label="📝 Receipt Footer Message">
              <textarea
                value={form.receipt_footer || ""}
                onChange={e => set("receipt_footer", e.target.value)}
                rows={3}
                placeholder="ধন্যবাদ! আবার আসবেন।"
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                Receipt এর নিচে এই message দেখাবে।
              </p>
            </Section>

            <div style={{
              background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 10, padding: 20,
            }}>
              <p style={{ margin: "0 0 10px", fontWeight: "bold", fontSize: 14 }}>🧾 Receipt Preview</p>
              <div style={{
                background: "#fff", border: "1px dashed #d1d5db",
                borderRadius: 8, padding: 16, fontFamily: "monospace", fontSize: 13,
                maxWidth: 320, margin: "0 auto",
              }}>
                {form.shop_logo ? (
                  <div style={{ textAlign: "center", marginBottom: 8 }}>
                    <img src={form.shop_logo} alt="logo" style={{ height: 50, objectFit: "contain" }} />
                  </div>
                ) : null}
                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>
                  {form.shop_name || "Dokan360"}
                </div>
                {form.shop_address && <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280" }}>{form.shop_address}</div>}
                {form.shop_phone && <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280" }}>📞 {form.shop_phone}</div>}
                <div style={{ borderTop: "1px dashed #d1d5db", margin: "10px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>পণ্য ১</span><span>৳ ১০০</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>পণ্য ২</span><span>৳ ২৫০</span>
                </div>
                <div style={{ borderTop: "1px dashed #d1d5db", margin: "10px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                  <span>মোট</span><span>{form.currency_symbol || "৳"} ৩৫০</span>
                </div>
                {form.tax_enabled === "true" && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", fontSize: 12 }}>
                    <span>{form.tax_label || "VAT"} ({form.tax_rate || 0}%)</span>
                    <span>{form.currency_symbol || "৳"} {(350 * parseFloat(form.tax_rate || 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ borderTop: "1px dashed #d1d5db", margin: "10px 0" }} />
                {form.receipt_footer && (
                  <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                    {form.receipt_footer}
                  </div>
                )}
              </div>
            </div>

            <SaveBtn onClick={handleSave} saving={saving} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", options = [] }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      ) : type === "select" ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <p style={{ margin: "0 0 10px", fontWeight: "bold", fontSize: 14, color: "#374151" }}>{label}</p>
      {children}
    </div>
  );
}

function ChoiceBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 18px",
        background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.65)",
        color: active ? "#fff" : "#374151",
        border: "none", borderRadius: 9,
        fontWeight: active ? 700 : 500, fontSize: 14,
        cursor: "pointer", fontFamily: "inherit",
        backdropFilter: "blur(10px)",
        boxShadow: active ? "0 4px 12px rgba(99,102,241,0.30)" : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >{children}</button>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(209,213,219,0.8)",
        position: "relative", cursor: "pointer", transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

function SaveBtn({ onClick, saving }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      padding: "12px 0",
      background: saving ? "rgba(209,213,219,0.8)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
      color: "#fff", border: "none", borderRadius: 12,
      fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
      fontFamily: "inherit",
      boxShadow: saving ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
    }}>
      {saving ? "⏳ সেভ হচ্ছে..." : "💾 Save করুন"}
    </button>
  );
}

const card = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  borderRadius: 18, overflow: "hidden",
  boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
};
const cardHdr = {
  padding: "15px 22px", background: "rgba(255,255,255,0.5)",
  borderBottom: "1px solid rgba(255,255,255,0.6)",
  display: "flex", justifyContent: "space-between", alignItems: "center",
  fontWeight: 700, color: "#1e1b4b", fontSize: 15,
};
const inputStyle = {
  width: "100%", padding: "9px 12px",
  background: "rgba(255,255,255,0.6)",
  border: "1.5px solid rgba(255,255,255,0.85)",
  borderRadius: 9, fontSize: 14, boxSizing: "border-box", outline: "none",
  color: "#1e1b4b", fontFamily: "inherit",
};
const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" };
const emptyTxt = { textAlign: "center", color: "#9ca3af", padding: 36, margin: 0 };
const actionBtn = {
  padding: "10px 20px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
  border: "none", borderRadius: 10, fontWeight: 700,
  fontSize: 14, cursor: "pointer", fontFamily: "inherit",
  boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
};
const editBtn = {
  padding: "6px 14px", background: "rgba(99,102,241,0.12)", color: "#6366f1",
  border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, cursor: "pointer", fontWeight: 700,
  fontFamily: "inherit",
};
const dangerBtn = {
  padding: "6px 14px", background: "rgba(239,68,68,0.10)", color: "#ef4444",
  border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, cursor: "pointer", fontWeight: 700,
  fontFamily: "inherit",
};
