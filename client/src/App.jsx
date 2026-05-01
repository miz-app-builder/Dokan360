import { useEffect, useState, useRef } from "react";
import { API } from "./api";

export default function App() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const barcodeRef = useRef(null);

  // =========================
  // LOAD PRODUCTS & CUSTOMERS
  // =========================
  useEffect(() => {
    API.get("/products").then(res => setProducts(res.data)).catch(console.error);
    API.get("/customers").then(res => setCustomers(res.data)).catch(console.error);
    barcodeRef.current?.focus();
  }, []);

  // =========================
  // FILTERED PRODUCTS (by search)
  // =========================
  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q))
    );
  });

  // =========================
  // BARCODE ENTER KEY HANDLER
  // =========================
  const handleBarcodeEnter = (e) => {
    if (e.key === "Enter" && search.trim()) {
      const match = products.find(
        p => p.barcode === search.trim()
      );
      if (match) {
        addToCart(match);
        setSearch("");
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearch("");
      }
    }
  };

  // =========================
  // STOCK CHECK
  // =========================
  const getCartQty = (id) => {
    const item = cart.find(i => i.id === id);
    return item ? item.qty : 0;
  };

  const isOutOfStock = (p) => p.stock <= 0;
  const isMaxReached = (p) => getCartQty(p.id) >= p.stock;

  // =========================
  // ADD TO CART
  // =========================
  const addToCart = (product) => {
    if (isMaxReached(product)) {
      alert(`❌ Stock শেষ! "${product.name}" এর মাত্র ${product.stock} টি আছে।`);
      return;
    }

    const exist = cart.find(i => i.id === product.id);
    if (exist) {
      setCart(cart.map(i =>
        i.id === product.id ? { ...i, qty: i.qty + 1 } : i
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // =========================
  // INCREASE / DECREASE / REMOVE
  // =========================
  const increase = (id) => {
    const product = products.find(p => p.id === id);
    const inCart = getCartQty(id);
    if (inCart >= product.stock) {
      alert(`❌ সর্বোচ্চ ${product.stock} টি যোগ করা যাবে।`);
      return;
    }
    setCart(cart.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  };

  const decrease = (id) => {
    setCart(cart.map(i =>
      i.id === id && i.qty > 1 ? { ...i, qty: i.qty - 1 } : i
    ));
  };

  const remove = (id) => {
    setCart(cart.filter(i => i.id !== id));
  };

  // =========================
  // TOTAL & DUE
  // =========================
  const total = cart.reduce((sum, i) => sum + i.sell_price * i.qty, 0);
  const paid = parseFloat(paidAmount) || 0;
  const due = total - paid;

  // =========================
  // CHECKOUT
  // =========================
  const checkout = () => {
    if (cart.length === 0) {
      alert("Cart খালি আছে!");
      return;
    }
    if (paid > total) {
      alert("❌ Paid amount total এর চেয়ে বেশি হতে পারবে না।");
      return;
    }

    API.post("/sales", {
      items: cart,
      total,
      customer_id: selectedCustomer?.id || null,
      paid_amount: paid || total,
    })
      .then(res => {
        if (res.data.success) {
          const msg = due > 0
            ? `✅ Sale সম্পন্ন!\nSale ID: ${res.data.sale_id}\nবাকি: ${due} ৳`
            : `✅ Sale সম্পন্ন!\nSale ID: ${res.data.sale_id}`;
          alert(msg);
          setCart([]);
          setPaidAmount("");
          setSelectedCustomer(null);
          setSearch("");
          barcodeRef.current?.focus();
          // Refresh products to get updated stock
          API.get("/products").then(r => setProducts(r.data));
        } else {
          alert("❌ Error: " + res.data.error);
        }
      })
      .catch(err => alert("❌ Error: " + err.message));
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>

      {/* ===== LEFT: PRODUCTS ===== */}
      <div style={{ width: "55%", padding: 16, overflowY: "auto", borderRight: "2px solid #eee" }}>

        {/* Barcode / Search */}
        <div style={{ marginBottom: 12 }}>
          <input
            ref={barcodeRef}
            type="text"
            placeholder="🔍 নাম বা Barcode দিয়ে খুঁজুন... (Enter চাপুন)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleBarcodeEnter}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 15,
              border: "2px solid #4f46e5",
              borderRadius: 8,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <h2 style={{ margin: "0 0 12px" }}>📦 Products ({filteredProducts.length})</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {filteredProducts.map(p => {
            const inCart = getCartQty(p.id);
            const outOfStock = isOutOfStock(p);
            const maxReached = isMaxReached(p);

            return (
              <div
                key={p.id}
                style={{
                  border: `2px solid ${outOfStock ? "#fca5a5" : inCart > 0 ? "#6366f1" : "#e5e7eb"}`,
                  borderRadius: 8,
                  padding: 12,
                  background: outOfStock ? "#fff5f5" : inCart > 0 ? "#eef2ff" : "#fff",
                  position: "relative",
                }}
              >
                {/* Stock badge */}
                <span style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  fontSize: 11,
                  background: outOfStock ? "#ef4444" : "#22c55e",
                  color: "#fff",
                  borderRadius: 4,
                  padding: "2px 6px",
                }}>
                  Stock: {p.stock}
                </span>

                <b style={{ display: "block", marginBottom: 4 }}>{p.name}</b>

                {p.barcode && (
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>#{p.barcode}</span>
                )}

                <p style={{ margin: "6px 0", fontWeight: "bold", color: "#4f46e5" }}>
                  {p.sell_price} ৳
                </p>

                {inCart > 0 && (
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: "#6366f1" }}>
                    Cart এ আছে: {inCart} টি
                  </p>
                )}

                <button
                  onClick={() => addToCart(p)}
                  disabled={outOfStock || maxReached}
                  style={{
                    width: "100%",
                    padding: "7px 0",
                    background: outOfStock || maxReached ? "#d1d5db" : "#4f46e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: outOfStock || maxReached ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {outOfStock ? "Stock নেই" : maxReached ? "Max পৌঁছেছে" : "➕ Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== RIGHT: CART ===== */}
      <div style={{ width: "45%", padding: 16, display: "flex", flexDirection: "column" }}>

        {/* Customer Selection */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>
            👤 Customer (ঐচ্ছিক)
          </label>
          <select
            value={selectedCustomer?.id || ""}
            onChange={e => {
              const c = customers.find(c => c.id === parseInt(e.target.value));
              setSelectedCustomer(c || null);
            }}
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            <option value="">-- কোনো customer নেই (walk-in) --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""} {c.due_amount > 0 ? `| বাকি: ${c.due_amount} ৳` : ""}
              </option>
            ))}
          </select>

          {selectedCustomer && selectedCustomer.due_amount > 0 && (
            <p style={{ margin: "6px 0 0", color: "#ef4444", fontSize: 13 }}>
              ⚠️ এই customer এর আগের বাকি: <b>{selectedCustomer.due_amount} ৳</b>
            </p>
          )}
        </div>

        <h2 style={{ margin: "0 0 10px" }}>🛒 Cart ({cart.length})</h2>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {cart.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>
              Cart খালি আছে
            </p>
          ) : (
            cart.map(i => (
              <div
                key={i.id}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "10px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14 }}>{i.name}</b>
                  <p style={{ margin: "2px 0", fontSize: 13, color: "#6b7280" }}>
                    {i.sell_price} ৳ × {i.qty} = <b>{i.sell_price * i.qty} ৳</b>
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={() => decrease(i.id)}
                    style={btnStyle("#6b7280")}
                  >−</button>
                  <span style={{ minWidth: 24, textAlign: "center", fontWeight: "bold" }}>
                    {i.qty}
                  </span>
                  <button
                    onClick={() => increase(i.id)}
                    style={btnStyle("#4f46e5")}
                  >+</button>
                </div>

                <button
                  onClick={() => remove(i.id)}
                  style={{ ...btnStyle("#ef4444"), fontSize: 12, padding: "4px 8px" }}
                >✕</button>
              </div>
            ))
          )}
        </div>

        {/* Totals & Payment */}
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 12, marginTop: 8 }}>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>মোট:</span>
            <b style={{ fontSize: 18, color: "#4f46e5" }}>{total} ৳</b>
          </div>

          {/* Paid Amount */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>
              💵 Paid Amount
            </label>
            <input
              type="number"
              placeholder={`${total} ৳ (পুরো টাকা)`}
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Due */}
          {paid > 0 && paid < total && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
            }}>
              <span style={{ color: "#ef4444" }}>বাকি:</span>
              <b style={{ color: "#ef4444" }}>{due.toFixed(2)} ৳</b>
            </div>
          )}

          {/* Change */}
          {paid > total && (
            <div style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
            }}>
              <span style={{ color: "#16a34a" }}>ফেরত:</span>
              <b style={{ color: "#16a34a" }}>{(paid - total).toFixed(2)} ৳</b>
            </div>
          )}

          <button
            onClick={checkout}
            disabled={cart.length === 0}
            style={{
              width: "100%",
              padding: "12px 0",
              background: cart.length === 0 ? "#d1d5db" : "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: "bold",
              cursor: cart.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            ✅ Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper style for small buttons
const btnStyle = (bg) => ({
  background: bg,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "4px 10px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 14,
});
