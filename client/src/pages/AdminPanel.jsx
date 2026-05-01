import { useEffect, useState, useRef } from "react";
import { API } from "../api";

const ROLES = ["admin", "seller", "viewer"];
const ROLE_LABEL = { admin: "👑 Admin", seller: "🛒 Seller", viewer: "👁️ Viewer" };
const ROLE_COLOR = {
  admin:  { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  seller: { bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
  viewer: { bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" },
};
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MODULES = [
  { key: "pos",        label: "🧾 বিক্রয় (POS)" },
  { key: "products",   label: "📦 পণ্য" },
  { key: "categories", label: "🗂️ ক্যাটাগরি" },
  { key: "customers",  label: "👥 কাস্টমার" },
  { key: "inventory",  label: "📊 ইনভেন্টরি" },
  { key: "reports",    label: "📈 রিপোর্ট" },
  { key: "admin",      label: "⚙️ অ্যাডমিন প্যানেল" },
];

const EMPTY_PROFILE = {
  name: "", father_name: "", mother_name: "",
  present_address: "", permanent_address: "",
  email: "", phone: "", blood_group: "",
  join_date: "", reference: "", emergency_contact: "",
  nid_number: "", role: "seller", password: "",
  is_active: true, username: "",
};

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function AdminPanel({ currentUser }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [permissions, setPermissions] = useState({});
  const [permLoading, setPermLoading] = useState(false);
  const [activePermRole, setActivePermRole] = useState("admin");

  const loadUsers = () =>
    API.get("/users").then(r => setUsers(r.data)).catch(console.error);

  const loadPermissions = () =>
    API.get("/permissions").then(r => {
      const grouped = {};
      r.data.forEach(p => {
        if (!grouped[p.role]) grouped[p.role] = {};
        grouped[p.role][p.module] = p;
      });
      setPermissions(grouped);
    }).catch(console.error);

  useEffect(() => { loadUsers(); loadPermissions(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const openProfile = async (user) => {
    try {
      const r = await API.get(`/users/${user.id}`);
      setSelectedUser(r.data);
      setShowNewForm(false);
      setTab("profile");
    } catch { showMsg("error", "Profile লোড করতে সমস্যা।"); }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>

      <h2 style={{ margin: "0 0 20px", color: "#1e1b4b" }}>⚙️ Admin Panel</h2>

      {/* Message */}
      {msg.text && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 16,
          background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${msg.type === "success" ? "#86efac" : "#fca5a5"}`,
          color: msg.type === "success" ? "#16a34a" : "#ef4444",
          fontWeight: "bold",
        }}>{msg.text}</div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "2px solid #e5e7eb", paddingBottom: 0 }}>
        {[
          { key: "users",       label: "👥 Users" },
          { key: "profile",     label: selectedUser ? `📋 ${selectedUser.username}` : "📋 Profile" },
          { key: "permissions", label: "🔐 Permissions" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px", border: "none", borderRadius: "8px 8px 0 0",
              fontWeight: "bold", fontSize: 14, cursor: "pointer",
              background: tab === t.key ? "#4f46e5" : "#f3f4f6",
              color: tab === t.key ? "#fff" : "#6b7280",
              borderBottom: tab === t.key ? "2px solid #4f46e5" : "none",
              marginBottom: -2,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* TAB: USER LIST */}
      {tab === "users" && (
        <UserList
          users={users}
          currentUser={currentUser}
          onOpen={openProfile}
          onNew={() => { setShowNewForm(true); setSelectedUser(null); setTab("profile"); }}
          onDelete={async (id, username) => {
            if (!confirm(`"${username}" কে delete করবেন?`)) return;
            try {
              await API.delete(`/users/${id}`);
              showMsg("success", `✅ "${username}" মুছে ফেলা হয়েছে।`);
              loadUsers();
            } catch (err) {
              showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
            }
          }}
          showMsg={showMsg}
          reload={loadUsers}
        />
      )}

      {/* TAB: PROFILE */}
      {tab === "profile" && (
        <UserProfile
          user={selectedUser}
          isNew={showNewForm && !selectedUser}
          currentUser={currentUser}
          onSaved={(u) => {
            loadUsers();
            setSelectedUser(u);
            setShowNewForm(false);
            showMsg("success", "✅ সফলভাবে সেভ হয়েছে!");
          }}
          onBack={() => { setTab("users"); setSelectedUser(null); setShowNewForm(false); }}
          showMsg={showMsg}
        />
      )}

      {/* TAB: PERMISSIONS */}
      {tab === "permissions" && (
        <PermissionsPanel
          permissions={permissions}
          activeRole={activePermRole}
          setActiveRole={setActivePermRole}
          loading={permLoading}
          onSave={async (role, module, perms) => {
            setPermLoading(true);
            try {
              await API.put(`/permissions/${role}/${module}`, perms);
              loadPermissions();
            } catch (err) {
              showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
            } finally {
              setPermLoading(false);
            }
          }}
          showMsg={showMsg}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   USER LIST
═══════════════════════════════════════ */
function UserList({ users, currentUser, onOpen, onNew, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = users.filter(u =>
    (u.name || u.username).toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search)
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <input
          placeholder="🔍 নাম বা ফোন দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
        />
        <button onClick={onNew} style={{
          padding: "10px 20px", background: "#4f46e5", color: "#fff",
          border: "none", borderRadius: 8, fontWeight: "bold",
          fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", marginLeft: 12,
        }}>
          ➕ নতুন User
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map(u => (
          <div key={u.id} style={{
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 12, padding: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {/* Top row: photo + info */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "#eef2ff", border: "2px solid #c7d2fe",
                overflow: "hidden", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {u.photo_url
                  ? <img src={u.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 22 }}>👤</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "bold", fontSize: 15, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.name || u.username}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>@{u.username}</div>
                {u.phone && <div style={{ fontSize: 12, color: "#6b7280" }}>📞 {u.phone}</div>}
              </div>
            </div>

            {/* Role + Status */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{
                ...ROLE_COLOR[u.role],
                padding: "3px 10px", borderRadius: 20,
                fontSize: 12, fontWeight: "bold",
                border: `1px solid ${ROLE_COLOR[u.role]?.border}`,
              }}>
                {ROLE_LABEL[u.role] || u.role}
              </span>
              <span style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: "bold",
                background: u.is_active !== false ? "#f0fdf4" : "#fef2f2",
                color: u.is_active !== false ? "#16a34a" : "#ef4444",
              }}>
                {u.is_active !== false ? "✓ Active" : "✗ Inactive"}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onOpen(u)}
                style={{ flex: 1, padding: "7px 0", background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", borderRadius: 7, fontSize: 13, fontWeight: "bold", cursor: "pointer" }}
              >
                📋 Profile
              </button>
              {currentUser?.id !== u.id && (
                <button
                  onClick={() => onDelete(u.id, u.username)}
                  style={{ padding: "7px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 7, fontSize: 13, cursor: "pointer" }}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>কোনো user পাওয়া যায়নি।</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   USER PROFILE FORM
═══════════════════════════════════════ */
function UserProfile({ user, isNew, currentUser, onSaved, onBack, showMsg }) {
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "", father_name: user.father_name || "",
        mother_name: user.mother_name || "", present_address: user.present_address || "",
        permanent_address: user.permanent_address || "", email: user.email || "",
        phone: user.phone || "", blood_group: user.blood_group || "",
        join_date: user.join_date ? user.join_date.split("T")[0] : "",
        reference: user.reference || "", emergency_contact: user.emergency_contact || "",
        nid_number: user.nid_number || "", role: user.role || "seller",
        password: "", is_active: user.is_active !== false, username: user.username || "",
      });
      setPhotoPreview(user.photo_url || null);
      setPhoto(null);
    } else {
      setForm(EMPTY_PROFILE);
      setPhotoPreview(null);
      setPhoto(null);
    }
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg("error", "❌ ছবি ৫MB এর কম হতে হবে।"); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Compress to max 400x400
        const MAX = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else        { if (h > MAX) { w = w * MAX / h; h = MAX; } }

        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        setPhoto(compressed);
        setPhotoPreview(compressed);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isNew && !form.username.trim()) { showMsg("error", "Username দেওয়া আবশ্যক।"); return; }
    if (isNew && !form.password.trim()) { showMsg("error", "Password দেওয়া আবশ্যক।"); return; }

    setSaving(true);
    try {
      let savedUser;
      if (isNew) {
        const r = await API.post("/users", {
          username: form.username.trim(), password: form.password,
          role: form.role, name: form.name, email: form.email,
          phone: form.phone, join_date: form.join_date || null,
        });
        savedUser = r.data;
        // Now save full profile
        await API.put(`/users/${savedUser.id}`, {
          father_name: form.father_name, mother_name: form.mother_name,
          present_address: form.present_address, permanent_address: form.permanent_address,
          blood_group: form.blood_group, reference: form.reference,
          emergency_contact: form.emergency_contact, nid_number: form.nid_number,
          is_active: form.is_active,
        });
      } else {
        const body = {
          role: form.role, is_active: form.is_active,
          name: form.name, father_name: form.father_name,
          mother_name: form.mother_name, present_address: form.present_address,
          permanent_address: form.permanent_address, email: form.email,
          phone: form.phone, blood_group: form.blood_group,
          join_date: form.join_date || null, reference: form.reference,
          emergency_contact: form.emergency_contact, nid_number: form.nid_number,
        };
        if (form.password) body.password = form.password;
        const r = await API.put(`/users/${user.id}`, body);
        savedUser = r.data;
      }

      // Upload photo if changed
      if (photo && savedUser?.id) {
        await API.post(`/users/${savedUser.id}/photo`, { photo_base64: photo });
        savedUser.photo_url = photo;
      }

      onSaved(savedUser);
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    } finally {
      setSaving(false);
    }
  };

  const title = isNew ? "➕ নতুন User তৈরি করুন" : `📋 ${user?.name || user?.username} — Profile`;

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: "#1e1b4b" }}>{title}</h3>
        <button type="button" onClick={onBack} style={{ ...btnStyle("#f3f4f6", "#374151"), padding: "8px 16px" }}>
          ← ফিরে যান
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, alignItems: "start" }}>

        {/* LEFT: Photo + Account */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Photo */}
          <div style={card}>
            <label style={sectionLabel}>📸 ছবি</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%", aspectRatio: "1",
                borderRadius: 12, overflow: "hidden",
                background: "#f3f4f6", cursor: "pointer",
                border: "2px dashed #d1d5db",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {photoPreview
                ? <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: 32 }}>📷</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>ছবি আপলোড করুন</div>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ ...btnStyle("#eef2ff", "#4f46e5"), width: "100%", marginTop: 8, fontSize: 12 }}>
              📁 ছবি বেছে নিন
            </button>
            <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 0", textAlign: "center" }}>সর্বোচ্চ ২ MB, JPG/PNG</p>
          </div>

          {/* Account Settings */}
          <div style={card}>
            <label style={sectionLabel}>🔐 Account</label>
            {isNew && (
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Username *</label>
                <input value={form.username} onChange={e => set("username", e.target.value)} style={inp} required />
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Role *</label>
              <select value={form.role} onChange={e => set("role", e.target.value)} style={inp}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>{isNew ? "Password *" : "নতুন Password (ঐচ্ছিক)"}</label>
              <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
                placeholder={isNew ? "" : "পরিবর্তন করতে লিখুন"} style={inp} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={lbl}>Status</label>
              <div
                onClick={() => set("is_active", !form.is_active)}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                  background: form.is_active ? "#4f46e5" : "#d1d5db",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 3,
                  left: form.is_active ? 23 : 3,
                  transition: "left 0.2s",
                }} />
              </div>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: form.is_active ? "#16a34a" : "#ef4444" }}>
              {form.is_active ? "✓ Active" : "✗ Inactive"}
            </p>
          </div>
        </div>

        {/* RIGHT: Profile Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Personal Info */}
          <div style={card}>
            <label style={sectionLabel}>👤 ব্যক্তিগত তথ্য</label>
            <div style={grid2}>
              <Field label="পূর্ণ নাম" value={form.name} onChange={v => set("name", v)} />
              <Field label="পিতার নাম" value={form.father_name} onChange={v => set("father_name", v)} />
              <Field label="মাতার নাম" value={form.mother_name} onChange={v => set("mother_name", v)} />
              <Field label="রক্তের গ্রুপ" value={form.blood_group} onChange={v => set("blood_group", v)} type="select" options={["", ...BLOOD_GROUPS]} />
              <Field label="NID / জন্ম নিবন্ধন নম্বর" value={form.nid_number} onChange={v => set("nid_number", v)} />
              <Field label="যোগদানের তারিখ" value={form.join_date} onChange={v => set("join_date", v)} type="date" />
            </div>
          </div>

          {/* Contact */}
          <div style={card}>
            <label style={sectionLabel}>📞 যোগাযোগ</label>
            <div style={grid2}>
              <Field label="ফোন নম্বর" value={form.phone} onChange={v => set("phone", v)} placeholder="01XXXXXXXXX" />
              <Field label="ইমেইল" value={form.email} onChange={v => set("email", v)} type="email" />
              <Field label="জরুরি যোগাযোগ নম্বর" value={form.emergency_contact} onChange={v => set("emergency_contact", v)} placeholder="01XXXXXXXXX" />
              <Field label="রেফারেন্স" value={form.reference} onChange={v => set("reference", v)} />
            </div>
          </div>

          {/* Address */}
          <div style={card}>
            <label style={sectionLabel}>🏠 ঠিকানা</label>
            <Field label="বর্তমান ঠিকানা" value={form.present_address} onChange={v => set("present_address", v)} type="textarea" />
            <div style={{ marginTop: 10 }}>
              <Field label="স্থায়ী ঠিকানা" value={form.permanent_address} onChange={v => set("permanent_address", v)} type="textarea" />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "13px 0", background: saving ? "#d1d5db" : "#4f46e5",
              color: "#fff", border: "none", borderRadius: 10,
              fontWeight: "bold", fontSize: 16, cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "সেভ হচ্ছে..." : isNew ? "✅ User তৈরি করুন" : "💾 সেভ করুন"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════
   PERMISSIONS PANEL
═══════════════════════════════════════ */
function PermissionsPanel({ permissions, activeRole, setActiveRole, onSave, loading }) {
  const [local, setLocal] = useState({});

  useEffect(() => {
    setLocal(JSON.parse(JSON.stringify(permissions)));
  }, [permissions]);

  const toggle = (role, module, field) => {
    setLocal(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: {
          ...(prev[role]?.[module] || {}),
          [field]: !(prev[role]?.[module]?.[field]),
        },
      },
    }));
  };

  const saveRole = async (role) => {
    const rolePerms = local[role] || {};
    for (const mod of MODULES) {
      const p = rolePerms[mod.key] || { can_view: false, can_add: false, can_edit: false, can_delete: false };
      await onSave(role, mod.key, {
        can_view: !!p.can_view,
        can_add: !!p.can_add,
        can_edit: !!p.can_edit,
        can_delete: !!p.can_delete,
      });
    }
  };

  const perm = (role, module, field) => !!(local[role]?.[module]?.[field]);

  return (
    <div>
      {/* Role tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {ROLES.map(r => (
          <button
            key={r}
            onClick={() => setActiveRole(r)}
            style={{
              padding: "9px 20px", border: "none", borderRadius: 8,
              fontWeight: "bold", fontSize: 13, cursor: "pointer",
              background: activeRole === r ? ROLE_COLOR[r].color : "#f3f4f6",
              color: activeRole === r ? "#fff" : "#6b7280",
            }}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      {/* Permission Grid */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={{ ...th, textAlign: "left", width: "35%" }}>Module</th>
              <th style={th}>👁️ দেখা</th>
              <th style={th}>➕ যোগ</th>
              <th style={th}>✏️ Edit</th>
              <th style={th}>🗑️ Delete</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod, i) => (
              <tr key={mod.key} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "12px 16px", fontWeight: "bold", color: "#374151", fontSize: 14 }}>
                  {mod.label}
                </td>
                {["can_view", "can_add", "can_edit", "can_delete"].map(field => (
                  <td key={field} style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div
                      onClick={() => activeRole !== "admin" || mod.key !== "admin"
                        ? toggle(activeRole, mod.key, field)
                        : null}
                      style={{
                        width: 28, height: 28, borderRadius: 8, margin: "0 auto",
                        background: perm(activeRole, mod.key, field) ? "#4f46e5" : "#f3f4f6",
                        border: `2px solid ${perm(activeRole, mod.key, field) ? "#4f46e5" : "#d1d5db"}`,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, transition: "all 0.15s",
                      }}
                    >
                      {perm(activeRole, mod.key, field) ? <span style={{ color: "#fff", fontWeight: "bold" }}>✓</span> : ""}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => saveRole(activeRole)}
          disabled={loading}
          style={{
            padding: "11px 32px",
            background: loading ? "#d1d5db" : "#4f46e5",
            color: "#fff", border: "none", borderRadius: 8,
            fontWeight: "bold", fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "সেভ হচ্ছে..." : "💾 সেভ করুন"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   REUSABLE FIELD
═══════════════════════════════════════ */
function Field({ label, value, onChange, type = "text", placeholder, options }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {type === "select" ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={inp}>
          {options.map(o => <option key={o} value={o}>{o || "— বেছে নিন —"}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{ ...inp, resize: "vertical" }}
        />
      ) : (
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={inp}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   STYLES
═══════════════════════════════════════ */
const card = {
  background: "#fff", border: "1px solid #e5e7eb",
  borderRadius: 12, padding: 16,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};
const sectionLabel = {
  display: "block", fontWeight: "bold",
  color: "#374151", fontSize: 13,
  marginBottom: 12, paddingBottom: 8,
  borderBottom: "1px solid #f3f4f6",
};
const grid2 = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
};
const lbl = {
  display: "block", fontSize: 12,
  fontWeight: "bold", color: "#6b7280", marginBottom: 4,
};
const inp = {
  width: "100%", padding: "8px 10px",
  border: "2px solid #e5e7eb", borderRadius: 7,
  fontSize: 13, boxSizing: "border-box", outline: "none",
  background: "#fafafa",
};
const inputStyle = {
  padding: "9px 14px", border: "2px solid #e5e7eb",
  borderRadius: 8, fontSize: 14, outline: "none", width: 260,
};
const th = {
  padding: "11px 14px", textAlign: "center",
  fontSize: 13, color: "#6b7280", fontWeight: "bold",
};
const btnStyle = (bg, color) => ({
  padding: "7px 14px", background: bg, color,
  border: "none", borderRadius: 7,
  fontSize: 13, fontWeight: "bold", cursor: "pointer",
});
