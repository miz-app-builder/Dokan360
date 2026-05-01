import { useEffect, useState } from "react";
import { API } from "../api";
import { glass, T, th, td, primaryBtn, secondaryBtn, msgBox } from "../theme";

const ACCENT = "#6366f1";
const inpGlass = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.6)",
  border: "1.5px solid rgba(255,255,255,0.85)",
  borderRadius: 10, fontSize: 14, fontFamily: "inherit",
  color: T.text1, outline: "none", boxSizing: "border-box",
};

export default function CustomerLedger({ customer, onBack }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [payNote,   setPayNote]   = useState("");
  const [paying,    setPaying]    = useState(false);
  const [msg,       setMsg]       = useState({ type: "", text: "" });

  const load = () => {
    setLoading(true);
    API.get(`/customers/${customer.id}/ledger`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, [customer.id]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { showMsg("error", "সঠিক পরিমাণ লিখুন।"); return; }
    if (data?.customer?.due_amount > 0 && amt > data.customer.due_amount) {
      showMsg("error", `❌ বাকির চেয়ে বেশি দেওয়া যাবে না।`); return;
    }
    setPaying(true);
    try {
      await API.post("/payments", { customer_id: customer.id, amount: amt, note: payNote.trim() || null });
      showMsg("success", `✅ ${amt} ৳ payment নেওয়া হয়েছে!`);
      setPayAmount(""); setPayNote(""); load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    } finally { setPaying(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString("bn-BD") : "—";

  if (loading) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
      <p style={{ color: T.text4 }}>লোড হচ্ছে...</p>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <p style={{ color: "#ef4444" }}>ডেটা লোড করতে সমস্যা হয়েছে।</p>
      <button onClick={onBack} style={{ ...secondaryBtn, marginTop: 12 }}>← ফিরে যান</button>
    </div>
  );

  const { customer: cust, summary, sales, payments } = data;

  const allTx = [
    ...sales.map(s => ({
      type: "sale", date: s.created_at,
      amount: s.total_amount, paid: s.paid_amount,
      due: s.total_amount - (s.paid_amount || 0), id: s.id,
    })),
    ...payments.map(p => ({ type: "payment", date: p.created_at, amount: p.amount, note: p.note, id: p.id })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="page-wrapper">

      {/* Back */}
      <button onClick={onBack} style={{ ...secondaryBtn, marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
        ← Customers এ ফিরুন
      </button>

      {/* Customer Header Card */}
      <div style={{ ...glass({ borderRadius: 20, padding: 24, marginBottom: 20 }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", color: T.text1, fontWeight: 800, fontSize: 20 }}>👤 {cust.name}</h2>
            {cust.phone && <p style={{ margin: 0, color: T.text3, fontSize: 14 }}>📞 {cust.phone}</p>}
          </div>
          <div style={{
            borderRadius: 14, padding: "12px 20px", textAlign: "center",
            background: cust.due_amount > 0 ? "rgba(254,242,242,0.9)" : "rgba(240,253,244,0.9)",
            border: `1px solid ${cust.due_amount > 0 ? "#fca5a5" : "#86efac"}`,
          }}>
            <div style={{ fontSize: 12, color: cust.due_amount > 0 ? "#ef4444" : "#16a34a", fontWeight: 600, marginBottom: 4 }}>
              {cust.due_amount > 0 ? "বর্তমান বাকি" : "কোনো বাকি নেই"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: cust.due_amount > 0 ? "#ef4444" : "#16a34a" }}>
              {cust.due_amount > 0 ? `${cust.due_amount} ৳` : "✅"}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "মোট বিক্রয়", value: `${summary.totalSale} ৳`, color: ACCENT, bg: `${ACCENT}12` },
            { label: "মোট পেমেন্ট", value: `${(summary.totalPaid + summary.totalPayment)} ৳`, color: "#16a34a", bg: "rgba(240,253,244,0.9)" },
            { label: "বকেয়া", value: `${cust.due_amount} ৳`, color: "#ef4444", bg: "rgba(254,242,242,0.9)" },
          ].map(card => (
            <div key={card.label} style={{
              background: card.bg, borderRadius: 12, padding: "14px 16px", textAlign: "center",
              border: `1px solid rgba(255,255,255,0.7)`,
            }}>
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Form */}
      {cust.due_amount > 0 && (
        <div style={{
          ...glass({ borderRadius: 20, padding: 22, marginBottom: 20 }),
          border: `1.5px solid ${ACCENT}40`,
          boxShadow: `0 4px 20px ${ACCENT}15`,
        }}>
          <h3 style={{ margin: "0 0 16px", color: ACCENT, fontWeight: 800, fontSize: 15 }}>💰 Payment নিন</h3>
          {msg.text && <div style={{ ...msgBox(msg.type), marginBottom: 12 }}>{msg.text}</div>}
          <form onSubmit={handlePayment}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.text3, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>পরিমাণ (৳) *</label>
                <input type="number" placeholder={`সর্বোচ্চ ${cust.due_amount} ৳`}
                  value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  style={inpGlass} min="1" max={cust.due_amount} required
                  onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.85)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.text3, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>নোট (ঐচ্ছিক)</label>
                <input placeholder="যেমন: নগদ, bKash..."
                  value={payNote} onChange={e => setPayNote(e.target.value)}
                  style={inpGlass}
                  onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.85)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <button type="submit" disabled={paying} style={{
                padding: "10px 20px",
                background: paying ? "rgba(209,213,219,0.8)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff", border: "none", borderRadius: 10,
                fontWeight: 700, fontSize: 14, cursor: paying ? "not-allowed" : "pointer",
                fontFamily: "inherit", boxShadow: paying ? "none" : "0 4px 14px rgba(34,197,94,0.3)",
                whiteSpace: "nowrap",
              }}>
                {paying ? "সংরক্ষণ..." : "✅ Payment নিন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {msg.text && cust.due_amount <= 0 && <div style={{ ...msgBox(msg.type), marginBottom: 16 }}>{msg.text}</div>}

      {/* Transaction History */}
      <div style={{ ...glass({ borderRadius: 18, overflow: "hidden", padding: 0 }) }}>
        <div style={{
          padding: "14px 20px",
          background: "rgba(255,255,255,0.5)",
          borderBottom: "1px solid rgba(255,255,255,0.6)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <b style={{ color: T.text1, fontSize: 15 }}>📒 সব Transaction</b>
          <span style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
            {allTx.length} টি
          </span>
        </div>

        {allTx.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📒</div>
            <p style={{ color: T.text4 }}>কোনো transaction নেই।</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["তারিখ", "ধরন", "পরিমাণ", "বিস্তারিত"].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {allTx.map((tx, i) => (
                  <tr key={`${tx.type}-${tx.id}-${i}`}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ ...td, fontSize: 12, color: T.text3 }}>{formatDate(tx.date)}</td>
                    <td style={td}>
                      {tx.type === "sale"
                        ? <span style={{ background: `${ACCENT}12`, color: ACCENT, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700, border: `1px solid ${ACCENT}25` }}>🛒 বিক্রয়</span>
                        : <span style={{ background: "rgba(240,253,244,0.9)", color: "#16a34a", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700, border: "1px solid #86efac" }}>💰 Payment</span>}
                    </td>
                    <td style={{ ...td, fontWeight: 700 }}>
                      {tx.type === "sale"
                        ? <span style={{ color: ACCENT }}>{tx.amount} ৳</span>
                        : <span style={{ color: "#16a34a" }}>+{tx.amount} ৳</span>}
                    </td>
                    <td style={{ ...td, fontSize: 13, color: T.text3 }}>
                      {tx.type === "sale"
                        ? `পরিশোধ: ${tx.paid} ৳${tx.due > 0 ? ` | বাকি: ${tx.due} ৳` : ""}`
                        : tx.note || "—"}
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
