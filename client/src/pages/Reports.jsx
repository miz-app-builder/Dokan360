import { useEffect, useState, useCallback } from "react";
import { API } from "../api";
import { useSettings } from "../context/SettingsContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const today    = () => new Date().toISOString().slice(0, 10);
const daysAgo  = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const fmt      = (n) => Number(n || 0).toFixed(0);
const fmtDate  = (d) => d ? new Date(d).toLocaleString("bn-BD") : "—";
const fmtShort = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "";

const TABS = [
  { key: "daily",    label: "📅 দৈনিক বিক্রয়" },
  { key: "profit",   label: "💰 মুনাফা" },
  { key: "products", label: "📦 পণ্যভিত্তিক" },
  { key: "user",     label: "👤 User ভিত্তিক" },
  { key: "outlet",   label: "🏬 Outlet ভিত্তিক" },
  { key: "due",      label: "👥 Customer বাকি" },
];

export default function Reports() {
  const { settings } = useSettings();
  const cur = settings?.currency_symbol || "৳";

  const [activeTab, setActiveTab] = useState("daily");
  const [outlets,   setOutlets]   = useState([]);
  const [users,     setUsers]     = useState([]);

  // ── Daily ──────────────────────────────────────────
  const [dailyDate,    setDailyDate]    = useState(today());
  const [dailyData,    setDailyData]    = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  // ── Profit ─────────────────────────────────────────
  const [profitFrom,    setProfitFrom]    = useState(daysAgo(30));
  const [profitTo,      setProfitTo]      = useState(today());
  const [profitData,    setProfitData]    = useState(null);
  const [profitLoading, setProfitLoading] = useState(false);

  // ── Product-wise ───────────────────────────────────
  const [prodFrom,    setProdFrom]    = useState(daysAgo(30));
  const [prodTo,      setProdTo]      = useState(today());
  const [prodData,    setProdData]    = useState(null);
  const [prodLoading, setProdLoading] = useState(false);

  // ── User-wise ──────────────────────────────────────
  const [userFrom,    setUserFrom]    = useState(today());
  const [userTo,      setUserTo]      = useState(today());
  const [selUserId,   setSelUserId]   = useState("");
  const [userData,    setUserData]    = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  // ── Outlet-wise ────────────────────────────────────
  const [outletFrom,    setOutletFrom]    = useState(today());
  const [outletTo,      setOutletTo]      = useState(today());
  const [selOutletId,   setSelOutletId]   = useState("");
  const [outletData,    setOutletData]    = useState(null);
  const [outletLoading, setOutletLoading] = useState(false);

  // ── Due ─────────────────────────────────────────────
  const [dueData,    setDueData]    = useState(null);
  const [dueLoading, setDueLoading] = useState(false);

  // ── Loaders ─────────────────────────────────────────
  const loadDaily = useCallback(() => {
    setDailyLoading(true);
    API.get(`/reports/daily?date=${dailyDate}`)
      .then(r => setDailyData(r.data)).catch(console.error)
      .finally(() => setDailyLoading(false));
  }, [dailyDate]);

  const loadProfit = () => {
    setProfitLoading(true);
    API.get(`/reports/profit?from=${profitFrom}&to=${profitTo}`)
      .then(r => setProfitData(r.data)).catch(console.error)
      .finally(() => setProfitLoading(false));
  };

  const loadProducts = () => {
    setProdLoading(true);
    API.get(`/reports/products?from=${prodFrom}&to=${prodTo}`)
      .then(r => setProdData(r.data)).catch(console.error)
      .finally(() => setProdLoading(false));
  };

  const loadUser = () => {
    setUserLoading(true);
    const q = selUserId ? `&user_id=${selUserId}` : "";
    API.get(`/reports/user-wise?from=${userFrom}&to=${userTo}${q}`)
      .then(r => setUserData(r.data)).catch(console.error)
      .finally(() => setUserLoading(false));
  };

  const loadOutlet = () => {
    setOutletLoading(true);
    const q = selOutletId ? `&outlet_id=${selOutletId}` : "";
    API.get(`/reports/outlet-wise?from=${outletFrom}&to=${outletTo}${q}`)
      .then(r => setOutletData(r.data)).catch(console.error)
      .finally(() => setOutletLoading(false));
  };

  const loadDue = () => {
    setDueLoading(true);
    API.get("/reports/due")
      .then(r => setDueData(r.data)).catch(console.error)
      .finally(() => setDueLoading(false));
  };

  // ── Init data ───────────────────────────────────────
  useEffect(() => {
    API.get("/outlets").then(r => setOutlets(r.data || [])).catch(() => {});
    API.get("/users").then(r => setUsers(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { loadDaily(); }, [loadDaily]);
  useEffect(() => { if (activeTab === "profit")   loadProfit();  }, [activeTab]);
  useEffect(() => { if (activeTab === "products") loadProducts(); }, [activeTab]);
  useEffect(() => { if (activeTab === "user")     loadUser();    }, [activeTab]);
  useEffect(() => { if (activeTab === "outlet")   loadOutlet();  }, [activeTab]);
  useEffect(() => { if (activeTab === "due")      loadDue();     }, [activeTab]);

  // ── Dynamic filename helper ─────────────────────────
  const buildFilename = (reportType, ext, userLabel = "", outletLabel = "") => {
    const shop   = (settings?.shop_name || "Dokan360").replace(/\s+/g, "_");
    const outlet = outletLabel ? `_${outletLabel.replace(/\s+/g, "_")}` : "";
    const user   = userLabel   ? `_${userLabel.replace(/\s+/g, "_")}` : "";
    const date   = today();
    return `${shop}${outlet}_${reportType}${user}_${date}.${ext}`;
  };

  // ── PDF generator ───────────────────────────────────
  const makePDF = ({ title, columns, rows, summary = [], reportType, userLabel = "", outletLabel = "" }) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const shopName = settings?.shop_name || "Dokan360";
    const pageW    = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(shopName, pageW / 2, 18, { align: "center" });
    if (settings?.shop_address) {
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(settings.shop_address, pageW / 2, 24, { align: "center" });
    }
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text(title, pageW / 2, 32, { align: "center" });
    if (userLabel || outletLabel) {
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const sub = [outletLabel, userLabel].filter(Boolean).join(" | ");
      doc.text(sub, pageW / 2, 38, { align: "center" });
    }
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(14, 41, pageW - 14, 41);

    // Summary box
    let yStart = 46;
    if (summary.length > 0) {
      doc.setFontSize(9);
      summary.forEach((s, i) => {
        const x = 14 + (i % 3) * 62;
        const y = yStart + Math.floor(i / 3) * 12;
        doc.setFillColor(238, 242, 255);
        doc.roundedRect(x, y, 58, 10, 2, 2, "F");
        doc.setFont("helvetica", "normal"); doc.setTextColor(107, 114, 128);
        doc.text(s.label, x + 4, y + 4);
        doc.setFont("helvetica", "bold"); doc.setTextColor(30, 27, 75);
        doc.text(String(s.value), x + 4, y + 9);
      });
      yStart += (Math.ceil(summary.length / 3)) * 12 + 6;
    }

    // Table
    autoTable(doc, {
      startY: yStart,
      head: [columns],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(156, 163, 175);
      doc.text(`Generated: ${new Date().toLocaleString("en-GB")} | Dokan360`, 14, doc.internal.pageSize.getHeight() - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageW - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
    }

    doc.save(buildFilename(reportType, "pdf", userLabel, outletLabel));
  };

  // ── Excel generator ─────────────────────────────────
  const makeExcel = ({ sheetName, columns, rows, summary = [], reportType, userLabel = "", outletLabel = "" }) => {
    const wb   = XLSX.utils.book_new();
    const data = [];

    // Header rows
    data.push([(settings?.shop_name || "Dokan360")]);
    if (settings?.shop_address) data.push([settings.shop_address]);
    data.push([sheetName]);
    if (userLabel || outletLabel) data.push([[outletLabel, userLabel].filter(Boolean).join(" | ")]);
    data.push([]);

    // Summary
    if (summary.length > 0) {
      summary.forEach(s => data.push([s.label, s.value]));
      data.push([]);
    }

    // Table header + rows
    data.push(columns);
    rows.forEach(r => data.push(r));

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = columns.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    XLSX.writeFile(wb, buildFilename(reportType, "xlsx", userLabel, outletLabel));
  };

  // ════════════════════════════════════════════════════
  //  DAILY TAB download helpers
  // ════════════════════════════════════════════════════
  const downloadDailyPDF = () => {
    if (!dailyData) return;
    const summary = [
      { label: "মোট বিক্রয়",    value: `${dailyData.totalSales} টি` },
      { label: "মোট আয়",        value: `${fmt(dailyData.totalIncome)} ${cur}` },
      { label: "নগদ পেয়েছি",   value: `${fmt(dailyData.totalCollected)} ${cur}` },
      { label: "বাকি দিয়েছি",   value: `${fmt(dailyData.totalDue)} ${cur}` },
      { label: "আনু. মুনাফা",    value: `${fmt(dailyData.totalProfit)} ${cur}` },
    ];
    makePDF({
      title: `Daily Sales Report — ${dailyDate}`,
      columns: ["#", "সময়", "মোট ("+cur+")", "পরিশোধ ("+cur+")", "বাকি ("+cur+")"],
      rows: dailyData.sales.map((s, i) => [
        i + 1, fmtDate(s.created_at),
        fmt(s.total_amount), fmt(s.paid_amount),
        fmt((s.total_amount||0)-(s.paid_amount||0)),
      ]),
      summary,
      reportType: `Daily_${dailyDate}`,
    });
  };

  const downloadDailyExcel = () => {
    if (!dailyData) return;
    const summary = [
      { label: "মোট বিক্রয়", value: dailyData.totalSales },
      { label: "মোট আয়",     value: dailyData.totalIncome },
      { label: "নগদ",         value: dailyData.totalCollected },
      { label: "বাকি",        value: dailyData.totalDue },
      { label: "মুনাফা",      value: dailyData.totalProfit },
    ];
    makeExcel({
      sheetName: "Daily", columns: ["#","সময়","মোট","পরিশোধ","বাকি"],
      rows: dailyData.sales.map((s,i) => [i+1, fmtDate(s.created_at), s.total_amount, s.paid_amount, (s.total_amount||0)-(s.paid_amount||0)]),
      summary, reportType: `Daily_${dailyDate}`,
    });
  };

  // ════════════════════════════════════════════════════
  //  USER REPORT download helpers
  // ════════════════════════════════════════════════════
  const getUserLabel = () => {
    if (selUserId) {
      const u = users.find(u => String(u.id) === String(selUserId));
      return u ? (u.name || u.username) : "";
    }
    return "All_Users";
  };

  const downloadUserPDF = () => {
    if (!userData) return;
    const uLabel = getUserLabel();
    const summary = [
      { label: "মোট বিক্রয়", value: `${userData.total_sales} টি` },
      { label: "মোট আয়",     value: `${fmt(userData.total_income)} ${cur}` },
    ];
    const cols = ["#", "User", "Username", "বিক্রয়", `আয় (${cur})`, `নগদ (${cur})`, `বাকি (${cur})`];
    const rows = userData.users.map((u, i) => [
      i+1, u.user_name, u.username, u.sales_count,
      fmt(u.total_income), fmt(u.total_collected), fmt(u.total_due),
    ]);
    makePDF({ title: `User-wise Report (${userFrom} — ${userTo})`, columns: cols, rows, summary, reportType: "UserWise", userLabel: uLabel });
  };

  const downloadUserExcel = () => {
    if (!userData) return;
    const uLabel = getUserLabel();
    makeExcel({
      sheetName: "UserWise",
      columns: ["#","User","Username","বিক্রয়","আয়","নগদ","বাকি"],
      rows: userData.users.map((u,i) => [i+1, u.user_name, u.username, u.sales_count, u.total_income, u.total_collected, u.total_due]),
      summary: [{ label:"মোট আয়", value: userData.total_income }],
      reportType: "UserWise", userLabel: uLabel,
    });
  };

  // ════════════════════════════════════════════════════
  //  OUTLET REPORT download helpers
  // ════════════════════════════════════════════════════
  const getOutletLabel = () => {
    if (selOutletId) {
      const o = outlets.find(o => String(o.id) === String(selOutletId));
      return o ? o.name : "";
    }
    return "All_Outlets";
  };

  const downloadOutletPDF = () => {
    if (!outletData) return;
    const oLabel = getOutletLabel();
    makePDF({
      title: `Outlet-wise Report (${outletFrom} — ${outletTo})`,
      columns: ["#", "Outlet", "বিক্রয়", `আয় (${cur})`, `নগদ (${cur})`, `বাকি (${cur})`],
      rows: outletData.outlets.map((o,i) => [i+1, o.outlet_name, o.sales_count, fmt(o.total_income), fmt(o.total_collected), fmt(o.total_due)]),
      summary: [{ label:"মোট আয়", value: `${fmt(outletData.total_income)} ${cur}` }],
      reportType: "OutletWise", outletLabel: oLabel,
    });
  };

  const downloadOutletExcel = () => {
    if (!outletData) return;
    const oLabel = getOutletLabel();
    makeExcel({
      sheetName: "OutletWise",
      columns: ["#","Outlet","বিক্রয়","আয়","নগদ","বাকি"],
      rows: outletData.outlets.map((o,i) => [i+1, o.outlet_name, o.sales_count, o.total_income, o.total_collected, o.total_due]),
      summary: [{ label:"মোট আয়", value: outletData.total_income }],
      reportType: "OutletWise", outletLabel: oLabel,
    });
  };

  // ════════════════════════════════════════════════════
  //  PRODUCT REPORT download helpers
  // ════════════════════════════════════════════════════
  const downloadProdPDF = () => {
    if (!prodData) return;
    makePDF({
      title: `Product-wise Report (${prodFrom} — ${prodTo})`,
      columns: ["#","পণ্যের নাম",`বিক্রিত`,`আয় (${cur})`,`মুনাফা (${cur})`],
      rows: prodData.products.map((p,i) => [i+1, p.name, p.totalQty, fmt(p.totalRevenue), fmt(p.totalProfit)]),
      summary: [{ label:"মোট পণ্য", value: prodData.products.length }],
      reportType: "ProductWise",
    });
  };

  const downloadProdExcel = () => {
    if (!prodData) return;
    makeExcel({
      sheetName: "ProductWise",
      columns: ["#","পণ্য","বিক্রিত","আয়","মুনাফা"],
      rows: prodData.products.map((p,i) => [i+1, p.name, p.totalQty, p.totalRevenue, p.totalProfit]),
      summary: [],
      reportType: "ProductWise",
    });
  };

  // ════════════════════════════════════════════════════
  //  DUE REPORT download helpers
  // ════════════════════════════════════════════════════
  const downloadDuePDF = () => {
    if (!dueData) return;
    makePDF({
      title: "Customer Due Report",
      columns: ["#","নাম","ফোন",`বাকি (${cur})`],
      rows: dueData.customers.map((c,i) => [i+1, c.name, c.phone||"—", fmt(c.due_amount)]),
      summary: [{ label:"মোট বাকি", value: `${fmt(dueData.totalDue)} ${cur}` }],
      reportType: "CustomerDue",
    });
  };

  const downloadDueExcel = () => {
    if (!dueData) return;
    makeExcel({
      sheetName: "CustomerDue",
      columns: ["#","নাম","ফোন","বাকি"],
      rows: dueData.customers.map((c,i) => [i+1, c.name, c.phone||"", c.due_amount]),
      summary: [{ label:"মোট বাকি", value: dueData.totalDue }],
      reportType: "CustomerDue",
    });
  };

  // ════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: 1020, margin: "24px auto", padding: "0 16px" }}>
      <h2 style={{ margin: "0 0 20px", color: "#1e1b4b" }}>📊 Reports Dashboard</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.filter(t => t.key !== "outlet" || outlets.length > 0).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "9px 18px",
            background: activeTab === t.key ? "#4f46e5" : "#f3f4f6",
            color: activeTab === t.key ? "#fff" : "#374151",
            border: activeTab === t.key ? "none" : "1px solid #e5e7eb",
            borderRadius: 8, fontWeight: "bold", fontSize: 13, cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── DAILY ── */}
      {activeTab === "daily" && (
        <div>
          <FilterBar>
            <LabeledField label="তারিখ:">
              <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} style={inputSm} />
            </LabeledField>
            <RefreshBtn onClick={loadDaily} />
            {dailyData && <DownloadBtns onPDF={downloadDailyPDF} onExcel={downloadDailyExcel} />}
          </FilterBar>

          {dailyLoading ? <Loader /> : dailyData && (
            <div>
              <div style={summaryGrid}>
                {[
                  { label: "মোট বিক্রয়",   value: `${dailyData.totalSales} টি`,          color: "#4f46e5", bg: "#eef2ff", icon: "🛒" },
                  { label: "মোট আয়",        value: `${fmt(dailyData.totalIncome)} ${cur}`, color: "#0891b2", bg: "#ecfeff", icon: "💵" },
                  { label: "নগদ পেয়েছি",   value: `${fmt(dailyData.totalCollected)} ${cur}`, color: "#16a34a", bg: "#f0fdf4", icon: "✅" },
                  { label: "বাকি দিয়েছি",   value: `${fmt(dailyData.totalDue)} ${cur}`,    color: "#ef4444", bg: "#fef2f2", icon: "⚠️" },
                  { label: "আনু. মুনাফা",    value: `${fmt(dailyData.totalProfit)} ${cur}`, color: "#7c3aed", bg: "#f5f3ff", icon: "📈" },
                ].map(c => <SummaryCard key={c.label} {...c} />)}
              </div>

              <div style={cardStyle}>
                <CardHdr title={`${dailyDate} এর বিক্রয় তালিকা`} badge={`${dailyData.sales.length} টি`} />
                {dailyData.sales.length === 0 ? <EmptyMsg /> : (
                  <Table cols={["#","সময়","মোট","পরিশোধ","বাকি"]}
                    rows={dailyData.sales.map((s,i) => [
                      i+1,
                      <span style={{ fontSize:12,color:"#6b7280" }}>{fmtDate(s.created_at)}</span>,
                      <b style={{color:"#4f46e5"}}>{s.total_amount} {cur}</b>,
                      <span style={{color:"#16a34a"}}>{s.paid_amount} {cur}</span>,
                      (() => { const d=(s.total_amount||0)-(s.paid_amount||0); return d>0?<b style={{color:"#ef4444"}}>{d} {cur}</b>:<span style={{color:"#16a34a"}}>—</span>; })(),
                    ])} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PROFIT ── */}
      {activeTab === "profit" && (
        <div>
          <FilterBar>
            <LabeledField label="থেকে:"><input type="date" value={profitFrom} onChange={e=>setProfitFrom(e.target.value)} style={inputSm}/></LabeledField>
            <LabeledField label="পর্যন্ত:"><input type="date" value={profitTo} onChange={e=>setProfitTo(e.target.value)} style={inputSm}/></LabeledField>
            <RefreshBtn onClick={loadProfit} />
            {profitData && <DownloadBtns onPDF={() => makePDF({
              title:`Profit Report (${profitFrom} — ${profitTo})`,
              columns:["মেট্রিক","পরিমাণ"],
              rows:[["মোট আয়",`${fmt(profitData.totalRevenue)} ${cur}`],["মোট খরচ",`${fmt(profitData.totalCost)} ${cur}`],["নিট মুনাফা",`${fmt(profitData.totalProfit)} ${cur}`]],
              reportType:"Profit",
            })} onExcel={() => makeExcel({
              sheetName:"Profit",columns:["মেট্রিক","পরিমাণ"],
              rows:[["মোট আয়",profitData.totalRevenue],["মোট খরচ",profitData.totalCost],["নিট মুনাফা",profitData.totalProfit]],
              reportType:"Profit",
            })} />}
          </FilterBar>

          {profitLoading ? <Loader /> : profitData && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
                {[
                  { label:"মোট বিক্রয় আয়", value:`${fmt(profitData.totalRevenue)} ${cur}`, color:"#0891b2", bg:"#ecfeff", icon:"💵" },
                  { label:"মোট ক্রয় খরচ",  value:`${fmt(profitData.totalCost)} ${cur}`,    color:"#ef4444", bg:"#fef2f2", icon:"🏷️" },
                  { label:"নিট মুনাফা",     value:`${fmt(profitData.totalProfit)} ${cur}`,   color: profitData.totalProfit>=0?"#16a34a":"#ef4444", bg: profitData.totalProfit>=0?"#f0fdf4":"#fef2f2", icon: profitData.totalProfit>=0?"📈":"📉" },
                ].map(c => <SummaryCard key={c.label} {...c} large />)}
              </div>
              {profitData.totalRevenue > 0 && (
                <div style={cardStyle}>
                  <CardHdr title="মুনাফার হার" />
                  <div style={{padding:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{color:"#6b7280",fontSize:14}}>মুনাফা মার্জিন</span>
                      <b style={{color:"#16a34a"}}>{((profitData.totalProfit/profitData.totalRevenue)*100).toFixed(1)}%</b>
                    </div>
                    <div style={{background:"#e5e7eb",borderRadius:99,height:12}}>
                      <div style={{background:"#16a34a",width:`${Math.min(100,Math.max(0,(profitData.totalProfit/profitData.totalRevenue)*100))}%`,height:"100%",borderRadius:99,transition:"width .5s"}}/>
                    </div>
                    <p style={{margin:"12px 0 0",color:"#6b7280",fontSize:13}}>{profitFrom} থেকে {profitTo} পর্যন্ত মোট {profitData.itemCount} টি পণ্য বিক্রি।</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCT-WISE ── */}
      {activeTab === "products" && (
        <div>
          <FilterBar>
            <LabeledField label="থেকে:"><input type="date" value={prodFrom} onChange={e=>setProdFrom(e.target.value)} style={inputSm}/></LabeledField>
            <LabeledField label="পর্যন্ত:"><input type="date" value={prodTo} onChange={e=>setProdTo(e.target.value)} style={inputSm}/></LabeledField>
            <RefreshBtn onClick={loadProducts} />
            {prodData && <DownloadBtns onPDF={downloadProdPDF} onExcel={downloadProdExcel} />}
          </FilterBar>

          {prodLoading ? <Loader /> : prodData && (
            <div style={cardStyle}>
              <CardHdr title={`পণ্যভিত্তিক বিক্রয় (${prodFrom} — ${prodTo})`} badge={`${prodData.products.length} পণ্য`} />
              {prodData.products.length === 0 ? <EmptyMsg /> : (
                <Table cols={["#","পণ্যের নাম","বিক্রিত","আয়","মুনাফা"]}
                  rows={prodData.products.map((p,i) => [
                    i+1,
                    <b>{p.name}</b>,
                    <span style={{background:"#eef2ff",color:"#4f46e5",borderRadius:6,padding:"2px 8px",fontWeight:"bold"}}>{p.totalQty} টি</span>,
                    <span style={{color:"#0891b2",fontWeight:"bold"}}>{fmt(p.totalRevenue)} {cur}</span>,
                    <span style={{color:p.totalProfit>=0?"#16a34a":"#ef4444",fontWeight:"bold"}}>{fmt(p.totalProfit)} {cur}</span>,
                  ])} />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── USER-WISE ── */}
      {activeTab === "user" && (
        <div>
          <FilterBar>
            <LabeledField label="থেকে:"><input type="date" value={userFrom} onChange={e=>setUserFrom(e.target.value)} style={inputSm}/></LabeledField>
            <LabeledField label="পর্যন্ত:"><input type="date" value={userTo} onChange={e=>setUserTo(e.target.value)} style={inputSm}/></LabeledField>
            <LabeledField label="User:">
              <select value={selUserId} onChange={e=>setSelUserId(e.target.value)} style={inputSm}>
                <option value="">— সব User —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name||u.username}</option>)}
              </select>
            </LabeledField>
            <RefreshBtn onClick={loadUser} />
            {userData && <DownloadBtns onPDF={downloadUserPDF} onExcel={downloadUserExcel} />}
          </FilterBar>

          {userLoading ? <Loader /> : userData && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:24 }}>
                <SummaryCard label="মোট বিক্রয়" value={`${userData.total_sales} টি`} color="#4f46e5" bg="#eef2ff" icon="🛒" />
                <SummaryCard label="মোট আয়"     value={`${fmt(userData.total_income)} ${cur}`} color="#16a34a" bg="#f0fdf4" icon="💵" />
              </div>
              <div style={cardStyle}>
                <CardHdr title={`User ভিত্তিক বিক্রয় (${userFrom} — ${userTo})`} badge={`${userData.users.length} জন`} />
                {userData.users.length === 0 ? <EmptyMsg text="এই সময়ে কোনো বিক্রয় নেই।" /> : (
                  <Table
                    cols={["#","User নাম","Username","বিক্রয়",`আয় (${cur})`,`নগদ (${cur})`,`বাকি (${cur})`]}
                    rows={userData.users.map((u,i) => [
                      i+1,
                      <b>{u.user_name}</b>,
                      <span style={{color:"#6b7280",fontSize:12}}>@{u.username}</span>,
                      <span style={{background:"#eef2ff",color:"#4f46e5",borderRadius:6,padding:"2px 8px",fontWeight:"bold"}}>{u.sales_count} টি</span>,
                      <b style={{color:"#0891b2"}}>{fmt(u.total_income)}</b>,
                      <span style={{color:"#16a34a"}}>{fmt(u.total_collected)}</span>,
                      u.total_due > 0 ? <b style={{color:"#ef4444"}}>{fmt(u.total_due)}</b> : <span style={{color:"#16a34a"}}>—</span>,
                    ])} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── OUTLET-WISE ── */}
      {activeTab === "outlet" && (
        <div>
          <FilterBar>
            <LabeledField label="থেকে:"><input type="date" value={outletFrom} onChange={e=>setOutletFrom(e.target.value)} style={inputSm}/></LabeledField>
            <LabeledField label="পর্যন্ত:"><input type="date" value={outletTo} onChange={e=>setOutletTo(e.target.value)} style={inputSm}/></LabeledField>
            <LabeledField label="Outlet:">
              <select value={selOutletId} onChange={e=>setSelOutletId(e.target.value)} style={inputSm}>
                <option value="">— সব Outlet —</option>
                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </LabeledField>
            <RefreshBtn onClick={loadOutlet} />
            {outletData && <DownloadBtns onPDF={downloadOutletPDF} onExcel={downloadOutletExcel} />}
          </FilterBar>

          {outletLoading ? <Loader /> : outletData && (
            <div>
              <SummaryCard label="মোট আয়" value={`${fmt(outletData.total_income)} ${cur}`} color="#4f46e5" bg="#eef2ff" icon="💵" />
              <div style={{ marginTop:16, ...cardStyle }}>
                <CardHdr title={`Outlet ভিত্তিক বিক্রয় (${outletFrom} — ${outletTo})`} badge={`${outletData.outlets.length} টি`} />
                {outletData.outlets.length === 0 ? <EmptyMsg text="এই সময়ে কোনো বিক্রয় নেই।" /> : (
                  <Table
                    cols={["#","Outlet","বিক্রয়",`আয় (${cur})`,`নগদ (${cur})`,`বাকি (${cur})`]}
                    rows={outletData.outlets.map((o,i) => [
                      i+1,
                      <div><b>{o.outlet_name}</b>{o.outlet_address && <div style={{fontSize:11,color:"#9ca3af"}}>{o.outlet_address}</div>}</div>,
                      <span style={{background:"#eef2ff",color:"#4f46e5",borderRadius:6,padding:"2px 8px",fontWeight:"bold"}}>{o.sales_count} টি</span>,
                      <b style={{color:"#0891b2"}}>{fmt(o.total_income)}</b>,
                      <span style={{color:"#16a34a"}}>{fmt(o.total_collected)}</span>,
                      o.total_due > 0 ? <b style={{color:"#ef4444"}}>{fmt(o.total_due)}</b> : <span style={{color:"#16a34a"}}>—</span>,
                    ])} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DUE ── */}
      {activeTab === "due" && (
        <div>
          <FilterBar>
            <RefreshBtn onClick={loadDue} />
            {dueData && <DownloadBtns onPDF={downloadDuePDF} onExcel={downloadDueExcel} />}
          </FilterBar>

          {dueLoading ? <Loader /> : dueData && (
            <div>
              {dueData.customers.length > 0 && (
                <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, padding:"14px 20px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"#ef4444", fontWeight:"bold" }}>⚠️ মোট {dueData.customers.length} জন customer এর কাছে বাকি আছে</span>
                  <span style={{ color:"#ef4444", fontWeight:"bold", fontSize:18 }}>মোট: {fmt(dueData.totalDue)} {cur}</span>
                </div>
              )}
              <div style={cardStyle}>
                <CardHdr title="👥 Customer বাকির তালিকা" badge={`${dueData.customers.length} জন`} badgeRed={dueData.customers.length > 0} />
                {dueData.customers.length === 0 ? (
                  <div style={{ textAlign:"center", padding:40 }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
                    <p style={{ color:"#16a34a", fontWeight:"bold", margin:0 }}>কোনো customer এর বাকি নেই!</p>
                  </div>
                ) : (
                  <Table cols={["#","নাম","ফোন",`বাকি (${cur})`]}
                    rows={dueData.customers.map((c,i) => [
                      i+1,
                      <b>👤 {c.name}</b>,
                      <span style={{color:"#6b7280"}}>{c.phone||"—"}</span>,
                      <span style={{background:"#fef2f2",color:"#ef4444",borderRadius:6,padding:"4px 12px",fontWeight:"bold"}}>{c.due_amount} {cur}</span>,
                    ])} />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════ SMALL COMPONENTS ════════════════════

function FilterBar({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, flexWrap:"wrap",
      background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 16px" }}>
      {children}
    </div>
  );
}

function LabeledField({ label, children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ fontWeight:"bold", fontSize:13, color:"#374151", whiteSpace:"nowrap" }}>{label}</span>
      {children}
    </div>
  );
}

function RefreshBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"8px 16px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:7, fontWeight:"bold", fontSize:13, cursor:"pointer" }}>
      🔄 দেখুন
    </button>
  );
}

function DownloadBtns({ onPDF, onExcel }) {
  return (
    <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
      <button onClick={onPDF}
        style={{ padding:"8px 14px", background:"#dc2626", color:"#fff", border:"none", borderRadius:7, fontWeight:"bold", fontSize:12, cursor:"pointer" }}>
        📄 PDF
      </button>
      <button onClick={onExcel}
        style={{ padding:"8px 14px", background:"#16a34a", color:"#fff", border:"none", borderRadius:7, fontWeight:"bold", fontSize:12, cursor:"pointer" }}>
        📊 Excel
      </button>
    </div>
  );
}

function SummaryCard({ label, value, color, bg, icon, large }) {
  return (
    <div style={{ background:bg, borderRadius:10, padding: large ? "20px" : "16px 20px", textAlign:"center", border:`1px solid ${color}22` }}>
      <div style={{ fontSize: large ? 28 : 22, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize: large ? 22 : 20, fontWeight:"bold", color }}>{value}</div>
    </div>
  );
}

function CardHdr({ title, badge, badgeRed }) {
  return (
    <div style={{ padding:"12px 20px", background:"#f9fafb", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <b style={{ color:"#1e1b4b" }}>{title}</b>
      {badge !== undefined && (
        <span style={{ background: badgeRed ? "#ef4444" : "#4f46e5", color:"#fff", borderRadius:20, padding:"2px 12px", fontSize:13 }}>{badge}</span>
      )}
    </div>
  );
}

function Table({ cols, rows }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#f3f4f6" }}>
            {cols.map(h => <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:13, color:"#6b7280", fontWeight:"bold" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom:"1px solid #f3f4f6" }}
              onMouseEnter={e => e.currentTarget.style.background="#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}>
              {row.map((cell, ci) => <td key={ci} style={{ padding:"11px 14px", fontSize:14, color:"#374151" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Loader() {
  return <p style={{ color:"#6b7280", textAlign:"center", padding:40 }}>লোড হচ্ছে...</p>;
}

function EmptyMsg({ text = "এই সময়ে কোনো ডেটা নেই।" }) {
  return <p style={{ textAlign:"center", color:"#9ca3af", padding:32, margin:0 }}>{text}</p>;
}

const cardStyle  = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" };
const summaryGrid = { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 };
const inputSm    = { padding:"7px 10px", border:"2px solid #e5e7eb", borderRadius:7, fontSize:13 };
