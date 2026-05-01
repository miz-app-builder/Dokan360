import { useEffect, useState } from "react";
import { API } from "../api";

export default function CustomerLedger({ customer, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

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
      showMsg("error", `❌ বাকির চেয়ে বেশি দেওয়া যাবে না। বর্তমান বাকি: ${data.customer.due_amount} ৳`);
      return;
    }
    setPaying(true);
    try {
      await API.post("/payments", {
        customer_id: customer.id,
        amount: amt,
        note: payNote.trim() || null,
      });
      showMsg("success", `✅ ${amt} ৳ payment সফলভাবে নেওয়া হয়েছে!`);
      setPayAmount("");
      setPayNote("");
      load();
    } catch (err) {
      showMsg("error", "❌ " + (err.response?.data?.error || "সমস্যা হয়েছে।"));
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString("bn-BD") : "—";

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
        লোড হচ্ছে...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ color: "#ef4444" }}>ডেটা লোড করতে সমস্যা হয়েছে।</p>
        <button onClick={onBack} style={backBtn}>← ফিরে যান</button>
      </div>
    );
  }

  const { customer: cust, summary, sales, payments } = data;

  const allTx = [
    ...sales.map(s => ({
      type: "sale",
      date: s.created_at,
      amount: s.total_amount,
      paid: s.paid_amount,
      due: s.total_amount - (s.paid_amount || 0),
      id: s.id,
    })),
    ...payments.map(p => ({
      type: "payment",
      date: p.created_at,
      amount: p.amount,
      note: p.note,
      id: p.id,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ maxWidth: 860, margin: "24px auto", padding: "0 16px" }}>

      {/* Back Button */}
      <button onClick={onBack} style={backBtn}>← Customers এ ফিরুন</button>

      {/* Customer Header */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: 24, marginBottom: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", color: "#1e1b4b" }}>👤 {cust.name}</h2>
            {cust.phone && <p style={{ margin: 0, color: "#6b7280" }}>📞 {cust.phone}</p>}
          </div>
          {cust.due_amount > 0 && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 10, padding: "10px 20px", textAlign: "center",
            }}>
              <div style={{ fontSize: 13, color: "#ef4444" }}>বর্তমান বাকি</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#ef4444" }}>{cust.due_amount} ৳</div>
            </div>
          )}
          {cust.due_amount <= 0 && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac",
              borderRadius: 10, padding: "10px 20px", textAlign: "center",
            }}>
              <div style={{ fontSize: 20 }}>✅</div>
              <div style={{ fontSize: 13, color: "#16a34a", fontWeight: "bold" }}>কোনো বাকি নেই</div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "মোট বিক্রয়", value: `${summary.totalSale} ৳`, color: "#4f46e5", bg: "#eef2ff" },
            { label: "মোট পেমেন্ট পাওয়া", value: `${(summary.totalPaid + summary.totalPayment)} ৳`, color: "#16a34a", bg: "#f0fdf4" },
            { label: "মোট বাকি", value: `${cust.due_amount} ৳`, color: "#ef4444", bg: "#fef2f2" },
          ].map(card => (
            <div key={card.label} style={{
              background: card.bg, borderRadius: 8, padding: "12px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: "bold", color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PAYMENT RECEIVE FORM (Phase 2.6) */}
      {cust.due_amount > 0 && (
        <div style={{
          background: "#fff", border: "2px solid #4f46e5",
          borderRadius: 12, padding: 24, marginBottom: 20,
          boxShadow: "0 2px 8px rgba(79,70,229,0.08)",
        }}>
          <h3 style={{ margin: "0 0 16px", color: "#4f46e5" }}>💰 Payment নিন</h3>

          {msg.text && (
            <div style={{
              padding: "10px 16px", borderRadius: 8, marginBottom: 12,
              background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${msg.type === "success" ? "#86efac" : "#fca5a5"}`,
              color: msg.type === "success" ? "#16a34a" : "#ef4444",
              fontWeight: "bold",
            }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handlePayment}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={labelStyle}>পরিমাণ (৳) *</label>
                <input
                  type="number"
                  placeholder={`সর্বোচ্চ ${cust.due_amount} ৳`}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  style={inputStyle}
                  min="1"
                  max={cust.due_amount}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>নোট (ঐচ্ছিক)</label>
                <input
                  placeholder="যেমন: নগদ, bKash..."
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={paying}
                style={{
                  padding: "10px 20px",
                  background: paying ? "#d1d5db" : "#16a34a",
                  color: "#fff", border: "none", borderRadius: 8,
                  fontWeight: "bold", fontSize: 14,
                  cursor: paying ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {paying ? "সংরক্ষণ..." : "✅ Payment নিন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {msg.text && cust.due_amount <= 0 && (
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

      {/* TRANSACTION HISTORY */}
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
          <b style={{ color: "#374151" }}>📒 সব Transaction</b>
          <span style={{ background: "#4f46e5", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 13 }}>
            {allTx.length} টি
          </span>
        </div>

        {allTx.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>
            কোনো transaction নেই।
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  {["তারিখ", "ধরন", "পরিমাণ", "বিস্তারিত"].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTx.map((tx, i) => (
                  <tr
                    key={`${tx.type}-${tx.id}-${i}`}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    <td style={{ ...td, fontSize: 13, color: "#6b7280" }}>{formatDate(tx.date)}</td>
                    <td style={td}>
                      {tx.type === "sale" ? (
                        <span style={{
                          background: "#eef2ff", color: "#4f46e5",
                          borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: "bold",
                        }}>
                          🛒 বিক্রয়
                        </span>
                      ) : (
                        <span style={{
                          background: "#f0fdf4", color: "#16a34a",
                          borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: "bold",
                        }}>
                          💰 Payment
                        </span>
                      )}
                    </td>
                    <td style={{ ...td, fontWeight: "bold" }}>
                      {tx.type === "sale" ? (
                        <span style={{ color: "#4f46e5" }}>{tx.amount} ৳</span>
                      ) : (
                        <span style={{ color: "#16a34a" }}>+{tx.amount} ৳</span>
                      )}
                    </td>
                    <td style={{ ...td, fontSize: 13, color: "#6b7280" }}>
                      {tx.type === "sale"
                        ? `পরিশোধ: ${tx.paid} ৳${tx.due > 0 ? ` | বাকি: ${tx.due} ৳` : ""}`
                        : tx.note || "—"
                      }
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

const backBtn = {
  display: "inline-block", marginBottom: 16,
  padding: "8px 16px", background: "#f3f4f6",
  color: "#374151", border: "1px solid #e5e7eb",
  borderRadius: 8, fontSize: 14, cursor: "pointer",
  fontWeight: "bold",
};
const labelStyle = { display: "block", fontSize: 13, fontWeight: "bold", color: "#374151", marginBottom: 4 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "2px solid #e5e7eb",
  borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none",
};
const th = { padding: "10px 14px", textAlign: "left", fontSize: 13, color: "#6b7280", fontWeight: "bold" };
const td = { padding: "11px 14px", fontSize: 14, color: "#374151" };
