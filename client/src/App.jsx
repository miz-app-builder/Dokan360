import { useEffect, useState, useRef } from "react";
import { API } from "./api";
import Navbar from "./components/Navbar";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CustomerLedger from "./pages/CustomerLedger";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  // Auth state (Phase 5.6)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dokan360_user")); } catch { return null; }
  });

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setPage(loggedInUser.role === "viewer" ? "reports" : "pos");
  };

  const handleLogout = () => {
    localStorage.removeItem("dokan360_token");
    localStorage.removeItem("dokan360_user");
    setUser(null);
    setPage("pos");
    setCart([]);
  };

  const [page, setPage] = useState("pos");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const barcodeRef = useRef(null);

  // Show login if not authenticated
  if (!user) return <Login onLogin={handleLogin} />;

  // =========================
  // LOAD PRODUCTS, CATEGORIES & CUSTOMERS
  // =========================
  const loadProducts = () => API.get("/products").then(r => setProducts(r.data)).catch(console.error);

  useEffect(() => {
    loadProducts();
    API.get("/categories").then(r => setCategories(r.data)).catch(console.error);
    API.get("/customers").then(r => setCustomers(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (page === "pos") barcodeRef.current?.focus();
  }, [page]);

  // =========================
  // FILTERED PRODUCTS (search + category)
  // =========================
  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
    const matchCat = filterCat ? p.category_id === parseInt(filterCat) : true;
    return matchSearch && matchCat;
  });

  // =========================
  // BARCODE ENTER KEY
  // =========================
  const handleBarcodeEnter = (e) => {
    if (e.key === "Enter" && search.trim()) {
      const match = products.find(p => p.barcode === search.trim());
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
  // STOCK HELPERS
  // =========================
  const getCartQty = (id) => (cart.find(i => i.id === id)?.qty || 0);
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
      setCart(cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // =========================
  // INCREASE / DECREASE / REMOVE
  // =========================
  const increase = (id) => {
    const product = products.find(p => p.id === id);
    if (getCartQty(id) >= product.stock) {
      alert(`❌ সর্বোচ্চ ${product.stock} টি যোগ করা যাবে।`);
      return;
    }
    setCart(cart.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  };

  const decrease = (id) => {
    setCart(cart.map(i => i.id === id && i.qty > 1 ? { ...i, qty: i.qty - 1 } : i));
  };

  const remove = (id) => setCart(cart.filter(i => i.id !== id));

  // =========================
  // TOTAL & DUE
  // =========================
  const total = cart.reduce((sum, i) => sum + i.sell_price * i.qty, 0);
  const paid  = parseFloat(paidAmount) || 0;
  const due   = total - paid;

  // =========================
  // CHECKOUT
  // =========================
  const checkout = () => {
    if (cart.length === 0) { alert("Cart খালি আছে!"); return; }
    if (paid > total) { alert("❌ Paid amount total এর চেয়ে বেশি হতে পারবে না।"); return; }

    API.post("/sales", {
      items: cart,
      total,
      customer_id: selectedCustomer?.id || null,
      paid_amount: paid || total,
    }).then(res => {
      if (res.data.success) {
        const msg = due > 0
          ? `✅ Sale সম্পন্ন!\nSale ID: ${res.data.sale_id}\nবাকি: ${due} ৳`
          : `✅ Sale সম্পন্ন!\nSale ID: ${res.data.sale_id}`;
        alert(msg);
        setCart([]);
        setPaidAmount("");
        setSelectedCustomer(null);
        setSearch("");
        loadProducts();
        barcodeRef.current?.focus();
      } else {
        alert("❌ Error: " + res.data.error);
      }
    }).catch(err => alert("❌ Error: " + err.message));
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f5f6fa" }}>

      <Navbar
        activePage={page}
        setPage={(p) => { setPage(p); setLedgerCustomer(null); }}
        user={user}
        onLogout={handleLogout}
      />

      {/* ===== PRODUCTS PAGE ===== */}
      {page === "products" && <Products />}

      {/* ===== CATEGORIES PAGE ===== */}
      {page === "categories" && <Categories />}

      {/* ===== CUSTOMERS PAGE ===== */}
      {page === "customers" && !ledgerCustomer && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Customers onViewLedger={(c) => setLedgerCustomer(c)} />
        </div>
      )}

      {/* ===== CUSTOMER LEDGER PAGE ===== */}
      {page === "customers" && ledgerCustomer && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <CustomerLedger
            customer={ledgerCustomer}
            onBack={() => setLedgerCustomer(null)}
          />
        </div>
      )}

      {/* ===== INVENTORY PAGE ===== */}
      {page === "inventory" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Inventory />
        </div>
      )}

      {/* ===== REPORTS PAGE ===== */}
      {page === "reports" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Reports />
        </div>
      )}

      {/* ===== ADMIN PANEL ===== */}
      {page === "admin" && user?.role === "admin" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <AdminPanel currentUser={user} />
        </div>
      )}

      {/* ===== POS PAGE ===== */}
      {page === "pos" && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* LEFT: PRODUCTS */}
          <div style={{ width: "55%", padding: 16, overflowY: "auto", borderRight: "2px solid #e5e7eb" }}>

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
                marginBottom: 10,
              }}
            />

            {/* Category Filter */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              <button
                onClick={() => setFilterCat("")}
                style={filterCat === "" ? activeCatBtn : catBtn}
              >সব</button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setFilterCat(String(c.id))}
                  style={filterCat === String(c.id) ? activeCatBtn : catBtn}
                >{c.name}</button>
              ))}
            </div>

            <h2 style={{ margin: "0 0 12px", color: "#1e1b4b" }}>
              📦 Products ({filteredProducts.length})
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {filteredProducts.map(p => {
                const inCart     = getCartQty(p.id);
                const outOfStock = isOutOfStock(p);
                const maxReached = isMaxReached(p);

                return (
                  <div key={p.id} style={{
                    border: `2px solid ${outOfStock ? "#fca5a5" : inCart > 0 ? "#6366f1" : "#e5e7eb"}`,
                    borderRadius: 8,
                    padding: 12,
                    background: outOfStock ? "#fff5f5" : inCart > 0 ? "#eef2ff" : "#fff",
                    position: "relative",
                  }}>
                    <span style={{
                      position: "absolute", top: 8, right: 8,
                      fontSize: 11,
                      background: outOfStock ? "#ef4444" : p.stock < 10 ? "#f59e0b" : "#22c55e",
                      color: "#fff", borderRadius: 4, padding: "2px 6px",
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
                        Cart এ: {inCart} টি
                      </p>
                    )}

                    <button
                      onClick={() => addToCart(p)}
                      disabled={outOfStock || maxReached}
                      style={{
                        width: "100%", padding: "7px 0",
                        background: outOfStock || maxReached ? "#d1d5db" : "#4f46e5",
                        color: "#fff", border: "none", borderRadius: 6,
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

          {/* RIGHT: CART */}
          <div style={{ width: "45%", padding: 16, display: "flex", flexDirection: "column", background: "#fff" }}>

            {/* Customer Selection */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>
                👤 Customer (ঐচ্ছিক)
              </label>
              <select
                value={selectedCustomer?.id || ""}
                onChange={e => setSelectedCustomer(customers.find(c => c.id === parseInt(e.target.value)) || null)}
                style={{
                  width: "100%", padding: "9px 12px",
                  border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14,
                }}
              >
                <option value="">-- কোনো customer নেই (walk-in) --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}{c.due_amount > 0 ? ` | বাকি: ${c.due_amount} ৳` : ""}
                  </option>
                ))}
              </select>
              {selectedCustomer?.due_amount > 0 && (
                <p style={{ margin: "6px 0 0", color: "#ef4444", fontSize: 13 }}>
                  ⚠️ আগের বাকি: <b>{selectedCustomer.due_amount} ৳</b>
                </p>
              )}
            </div>

            <h2 style={{ margin: "0 0 10px", color: "#1e1b4b" }}>🛒 Cart ({cart.length})</h2>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {cart.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>
                  Cart খালি আছে
                </p>
              ) : (
                cart.map(i => (
                  <div key={i.id} style={{
                    borderBottom: "1px solid #e5e7eb", padding: "10px 0",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: 14 }}>{i.name}</b>
                      <p style={{ margin: "2px 0", fontSize: 13, color: "#6b7280" }}>
                        {i.sell_price} ৳ × {i.qty} = <b>{i.sell_price * i.qty} ৳</b>
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button onClick={() => decrease(i.id)} style={btnStyle("#6b7280")}>−</button>
                      <span style={{ minWidth: 24, textAlign: "center", fontWeight: "bold" }}>{i.qty}</span>
                      <button onClick={() => increase(i.id)} style={btnStyle("#4f46e5")}>+</button>
                    </div>
                    <button onClick={() => remove(i.id)} style={{ ...btnStyle("#ef4444"), fontSize: 12, padding: "4px 8px" }}>✕</button>
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
                    width: "100%", padding: "9px 12px",
                    border: "2px solid #e5e7eb", borderRadius: 8,
                    fontSize: 14, boxSizing: "border-box",
                  }}
                />
              </div>

              {paid > 0 && paid < total && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fca5a5",
                  borderRadius: 8, padding: "8px 12px", marginBottom: 8,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ color: "#ef4444" }}>বাকি:</span>
                  <b style={{ color: "#ef4444" }}>{due.toFixed(2)} ৳</b>
                </div>
              )}

              {paid > total && (
                <div style={{
                  background: "#f0fdf4", border: "1px solid #86efac",
                  borderRadius: 8, padding: "8px 12px", marginBottom: 8,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ color: "#16a34a" }}>ফেরত:</span>
                  <b style={{ color: "#16a34a" }}>{(paid - total).toFixed(2)} ৳</b>
                </div>
              )}

              <button
                onClick={checkout}
                disabled={cart.length === 0}
                style={{
                  width: "100%", padding: "12px 0",
                  background: cart.length === 0 ? "#d1d5db" : "#16a34a",
                  color: "#fff", border: "none", borderRadius: 8,
                  fontSize: 16, fontWeight: "bold",
                  cursor: cart.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                ✅ Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = (bg) => ({
  background: bg, color: "#fff", border: "none",
  borderRadius: 6, padding: "4px 10px",
  cursor: "pointer", fontWeight: "bold", fontSize: 14,
});

const catBtn = {
  padding: "5px 12px", background: "#f3f4f6", color: "#374151",
  border: "1px solid #e5e7eb", borderRadius: 20, fontSize: 12, cursor: "pointer",
};
const activeCatBtn = {
  ...catBtn, background: "#4f46e5", color: "#fff",
  border: "1px solid #4f46e5", fontWeight: "bold",
};
