import { useEffect, useState } from "react";
import { API } from "../api";

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export default function Reports() {
  const [activeTab, setActiveTab] = useState("daily");

  // Phase 4.5 — Daily
  const [dailyDate, setDailyDate] = useState(today());
  const [dailyData, setDailyData] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Phase 4.6 — Profit
  const [profitFrom, setProfitFrom] = useState(daysAgo(30));
  const [profitTo, setProfitTo] = useState(today());
  const [profitData, setProfitData] = useState(null);
  const [profitLoading, setProfitLoading] = useState(false);

  // Phase 4.7 — Products
  const [prodFrom, setProdFrom] = useState(daysAgo(30));
  const [prodTo, setProdTo] = useState(today());
  const [prodData, setProdData] = useState(null);
  const [prodLoading, setProdLoading] = useState(false);

  // Phase 4.8 — Due
  const [dueData, setDueData] = useState(null);
  const [dueLoading, setDueLoading] = useState(false);

  // Load daily on mount and date change
  const loadDaily = () => {
    setDailyLoading(true);
    API.get(`/reports/daily?date=${dailyDate}`)
      .then(r => setDailyData(r.data))
      .catch(console.error)
      .finally(() => setDailyLoading(false));
  };

  const loadProfit = () => {
    setProfitLoading(true);
    API.get(`/reports/profit?from=${profitFrom}&to=${profitTo}`)
      .then(r => setProfitData(r.data))
      .catch(console.error)
      .finally(() => setProfitLoading(false));
  };

  const loadProducts = () => {
    setProdLoading(true);
    API.get(`/reports/products?from=${prodFrom}&to=${prodTo}`)
      .then(r => setProdData(r.data))
      .catch(console.error)
      .finally(() => setProdLoading(false));
  };

  const loadDue = () => {
    setDueLoading(true);
    API.get("/reports/due")
      .then(r => setDueData(r.data))
      .catch(console.error)
      .finally(() => setDueLoading(false));
  };

  useEffect(() => { loadDaily(); }, [dailyDate]);
  useEffect(() => { if (activeTab === "profit") loadProfit(); }, [activeTab]);
  useEffect(() => { if (activeTab === "products") loadProducts(); }, [activeTab]);
  useEffect(() => { if (activeTab === "due") loadDue(); }, [activeTab]);

  const formatDate = (d) => d ? new Date(d).toLocaleString("bn-BD") : "—";

  const tabs = [
    { key: "daily",    label: "📅 দৈনিক বিক্রয়" },
    { key: "profit",   label: "💰 মুনাফা" },
    { key: "products", label: "📦 পণ্যভিত্তিক" },
    { key: "due",      label: "👥 Customer বাকি" },
  ];

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px" }}>

      <h2 style={{ margin: "0 0 20px", color: "#1e1b4b" }}>📊 Reports Dashboard</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "9px 20px",
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
          Phase 4.5 — Daily Sales Report
      ======================== */}
      {activeTab === "daily" && (
        <div>
          {/* Date Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <label style={{ fontWeight: "bold", color: "#374151" }}>তারিখ:</label>
            <input
              type="date"
              value={dailyDate}
              onChange={e => setDailyDate(e.target.value)}
              style={{ padding: "8px 12px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
            />
            <button onClick={loadDaily} style={refreshBtn}>🔄 Refresh</button>
          </div>

          {dailyLoading ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>লোড হচ্ছে...</p>
          ) : dailyData ? (
            <div>
              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "মোট বিক্রয়", value: `${dailyData.totalSales} টি`, color: "#4f46e5", bg: "#eef2ff", icon: "🛒" },
                  { label: "মোট আয়", value: `${dailyData.totalIncome} ৳`, color: "#0891b2", bg: "#ecfeff", icon: "💵" },
                  { label: "নগদ পেয়েছি", value: `${dailyData.totalCollected} ৳`, color: "#16a34a", bg: "#f0fdf4", icon: "✅" },
                  { label: "বাকি দিয়েছি", value: `${dailyData.totalDue} ৳`, color: "#ef4444", bg: "#fef2f2", icon: "⚠️" },
                  { label: "আনুমানিক মুনাফা", value: `${dailyData.totalProfit.toFixed(0)} ৳`, color: "#7c3aed", bg: "#f5f3ff", icon: "📈" },
                ].map(c => (
                  <div key={c.label} style={{
                    background: c.bg, borderRadius: 10, padding: "16px 20px",
                    textAlign: "center", border: `1px solid ${c.color}22`,
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Sales Table */}
              <div style={cardStyle}>
                <div style={cardHeader}>
                  <b>{dailyDate} এর বিক্রয় তালিকা</b>
                  <span style={badge}>{dailyData.sales.length} টি</span>
                </div>
                {dailyData.sales.length === 0 ? (
                  <p style={emptyText}>এই তারিখে কোনো বিক্রয় নেই।</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f3f4f6" }}>
                          {["#", "সময়", "মোট", "পরিশোধ", "বাকি"].map(h => <th key={h} style={th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {dailyData.sales.map((s, i) => {
                          const due = (s.total_amount || 0) - (s.paid_amount || 0);
                          return (
                            <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                              <td style={td}>{i + 1}</td>
                              <td style={{ ...td, fontSize: 12, color: "#6b7280" }}>{formatDate(s.created_at)}</td>
                              <td style={{ ...td, fontWeight: "bold", color: "#4f46e5" }}>{s.total_amount} ৳</td>
                              <td style={{ ...td, color: "#16a34a" }}>{s.paid_amount} ৳</td>
                              <td style={td}>
                                {due > 0
                                  ? <span style={{ color: "#ef4444", fontWeight: "bold" }}>{due} ৳</span>
                                  : <span style={{ color: "#16a34a" }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================
          Phase 4.6 — Profit Report
      ======================== */}
      {activeTab === "profit" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <label style={{ fontWeight: "bold", color: "#374151" }}>থেকে:</label>
            <input type="date" value={profitFrom} onChange={e => setProfitFrom(e.target.value)}
              style={dateInput} />
            <label style={{ fontWeight: "bold", color: "#374151" }}>পর্যন্ত:</label>
            <input type="date" value={profitTo} onChange={e => setProfitTo(e.target.value)}
              style={dateInput} />
            <button onClick={loadProfit} style={refreshBtn}>🔄 দেখুন</button>
          </div>

          {profitLoading ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>লোড হচ্ছে...</p>
          ) : profitData ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "মোট বিক্রয় আয়", value: `${profitData.totalRevenue.toFixed(0)} ৳`, color: "#0891b2", bg: "#ecfeff", icon: "💵" },
                  { label: "মোট ক্রয় খরচ", value: `${profitData.totalCost.toFixed(0)} ৳`, color: "#ef4444", bg: "#fef2f2", icon: "🏷️" },
                  { label: "নিট মুনাফা", value: `${profitData.totalProfit.toFixed(0)} ৳`, color: profitData.totalProfit >= 0 ? "#16a34a" : "#ef4444", bg: profitData.totalProfit >= 0 ? "#f0fdf4" : "#fef2f2", icon: profitData.totalProfit >= 0 ? "📈" : "📉" },
                ].map(c => (
                  <div key={c.label} style={{
                    background: c.bg, borderRadius: 10, padding: "20px",
                    textAlign: "center", border: `1px solid ${c.color}22`,
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Profit bar */}
              {profitData.totalRevenue > 0 && (
                <div style={cardStyle}>
                  <div style={cardHeader}><b>মুনাফার হার</b></div>
                  <div style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "#6b7280", fontSize: 14 }}>মুনাফা মার্জিন</span>
                      <b style={{ color: "#16a34a" }}>
                        {((profitData.totalProfit / profitData.totalRevenue) * 100).toFixed(1)}%
                      </b>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: 99, height: 12 }}>
                      <div style={{
                        background: "#16a34a",
                        width: `${Math.min(100, Math.max(0, (profitData.totalProfit / profitData.totalRevenue) * 100))}%`,
                        height: "100%", borderRadius: 99, transition: "width 0.5s",
                      }} />
                    </div>
                    <p style={{ margin: "12px 0 0", color: "#6b7280", fontSize: 13 }}>
                      {profitFrom} থেকে {profitTo} পর্যন্ত মোট {profitData.itemCount} টি পণ্য বিক্রি হয়েছে।
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ========================
          Phase 4.7 — Product-wise Sales
      ======================== */}
      {activeTab === "products" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <label style={{ fontWeight: "bold", color: "#374151" }}>থেকে:</label>
            <input type="date" value={prodFrom} onChange={e => setProdFrom(e.target.value)} style={dateInput} />
            <label style={{ fontWeight: "bold", color: "#374151" }}>পর্যন্ত:</label>
            <input type="date" value={prodTo} onChange={e => setProdTo(e.target.value)} style={dateInput} />
            <button onClick={loadProducts} style={refreshBtn}>🔄 দেখুন</button>
          </div>

          {prodLoading ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>লোড হচ্ছে...</p>
          ) : prodData ? (
            <div style={cardStyle}>
              <div style={cardHeader}>
                <b>পণ্যভিত্তিক বিক্রয় ({prodFrom} — {prodTo})</b>
                <span style={badge}>{prodData.products.length} পণ্য</span>
              </div>
              {prodData.products.length === 0 ? (
                <p style={emptyText}>এই সময়ে কোনো বিক্রয় নেই।</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f3f4f6" }}>
                        {["#", "পণ্যের নাম", "বিক্রিত পরিমাণ", "মোট আয়", "মুনাফা"].map(h => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prodData.products.map((p, i) => (
                        <tr key={p.product_id} style={{ borderBottom: "1px solid #f3f4f6" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                          onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                          <td style={td}>{i + 1}</td>
                          <td style={{ ...td, fontWeight: "bold" }}>{p.name}</td>
                          <td style={td}>
                            <span style={{ background: "#eef2ff", color: "#4f46e5", borderRadius: 6, padding: "3px 10px", fontWeight: "bold" }}>
                              {p.totalQty} টি
                            </span>
                          </td>
                          <td style={{ ...td, color: "#0891b2", fontWeight: "bold" }}>{p.totalRevenue.toFixed(0)} ৳</td>
                          <td style={{ ...td, color: p.totalProfit >= 0 ? "#16a34a" : "#ef4444", fontWeight: "bold" }}>
                            {p.totalProfit.toFixed(0)} ৳
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ========================
          Phase 4.8 — Customer Due Report
      ======================== */}
      {activeTab === "due" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={loadDue} style={refreshBtn}>🔄 Refresh</button>
          </div>

          {dueLoading ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>লোড হচ্ছে...</p>
          ) : dueData ? (
            <div>
              {dueData.customers.length > 0 && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fca5a5",
                  borderRadius: 10, padding: "14px 20px", marginBottom: 16,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                    ⚠️ মোট {dueData.customers.length} জন customer এর কাছে বাকি আছে
                  </span>
                  <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: 18 }}>
                    মোট: {dueData.totalDue.toFixed(0)} ৳
                  </span>
                </div>
              )}

              <div style={cardStyle}>
                <div style={cardHeader}>
                  <b>👥 Customer বাকির তালিকা</b>
                  <span style={{ ...badge, background: dueData.customers.length > 0 ? "#ef4444" : "#16a34a" }}>
                    {dueData.customers.length} জন
                  </span>
                </div>
                {dueData.customers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <p style={{ color: "#16a34a", fontWeight: "bold", margin: 0 }}>
                      কোনো customer এর বাকি নেই!
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f3f4f6" }}>
                          {["#", "নাম", "ফোন", "বাকির পরিমাণ"].map(h => (
                            <th key={h} style={th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dueData.customers.map((c, i) => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fef9f9"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                            <td style={td}>{i + 1}</td>
                            <td style={{ ...td, fontWeight: "bold" }}>👤 {c.name}</td>
                            <td style={{ ...td, color: "#6b7280" }}>{c.phone || "—"}</td>
                            <td style={td}>
                              <span style={{
                                background: "#fef2f2", color: "#ef4444",
                                borderRadius: 6, padding: "4px 12px",
                                fontWeight: "bold", fontSize: 15,
                              }}>
                                {c.due_amount} ৳
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ===== STYLES =====
const refreshBtn = {
  padding: "8px 18px", background: "#4f46e5", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: "bold",
  fontSize: 13, cursor: "pointer",
};
const dateInput = {
  padding: "8px 12px", border: "2px solid #e5e7eb",
  borderRadius: 8, fontSize: 14,
};
const cardStyle = {
  background: "#fff", border: "1px solid #e5e7eb",
  borderRadius: 12, overflow: "hidden",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};
const cardHeader = {
  padding: "12px 20px", background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  display: "flex", justifyContent: "space-between", alignItems: "center",
};
const badge = {
  background: "#4f46e5", color: "#fff",
  borderRadius: 20, padding: "2px 12px", fontSize: 13,
};
const emptyText = { textAlign: "center", color: "#9ca3af", padding: 32, margin: 0 };
const th = { padding: "10px 14px", textAlign: "left", fontSize: 13, color: "#6b7280", fontWeight: "bold" };
const td = { padding: "11px 14px", fontSize: 14, color: "#374151" };
