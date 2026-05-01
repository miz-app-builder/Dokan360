import { useEffect, useState, useRef, useCallback } from "react";
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
import Settings from "./pages/Settings";
import BarcodeScanner from "./components/BarcodeScanner";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { glass, T } from "./theme";

const ACCENT  = "#6366f1";
const ACCENT2 = "#8b5cf6";

function AppInner({ onUserChange }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dokan360_user")); } catch { return null; }
  });
  const { settings, loadSettings, loadUserDisplay } = useSettings();

  const [page, setPage]                     = useState("pos");
  const [perms, setPerms]                   = useState({});
  const [products, setProducts]             = useState([]);
  const [categories, setCategories]         = useState([]);
  const [customers, setCustomers]           = useState([]);
  const [cart, setCart]                     = useState([]);
  const [search, setSearch]                 = useState("");
  const [filterCat, setFilterCat]           = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paidAmount, setPaidAmount]         = useState("");
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [showScanner, setShowScanner]       = useState(false);
  const barcodeRef = useRef(null);

  const handleLogin = (u) => {
    setUser(u);
    onUserChange?.(u);
    loadSettings();
    loadUserDisplay();
    setPage(u.role === "viewer" ? "reports" : "pos");
  };

  const handleLogout = () => {
    localStorage.removeItem("dokan360_token");
    localStorage.removeItem("dokan360_user");
    setUser(null);
    onUserChange?.(null);
    setPage("pos");
    setCart([]);
    setPerms({});
  };

  const loadProducts = useCallback(() => {
    API.get("/products").then(r => setProducts(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadProducts();
    API.get("/categories").then(r => setCategories(r.data)).catch(console.error);
    API.get("/customers").then(r => setCustomers(r.data)).catch(console.error);
    API.get("/permissions/my").then(r => {
      setPerms(r.data);
      if (user.role === "viewer") {
        const first = ["reports","products","customers","inventory"].find(m => r.data[m]?.can_view);
        if (first) setPage(first);
      }
    }).catch(console.error);
  }, [user, loadProducts]);

  useEffect(() => {
    if (!user) return;
    if (page === "pos") barcodeRef.current?.focus();
  }, [page, user]);

  if (!user) return <Login onLogin={handleLogin} />;

  const fontSizeMap = { small: "13px", medium: "15px", large: "17px" };
  const appFontSize = fontSizeMap[settings?.font_size] || "15px";
  const cur = settings?.currency_symbol || "৳";

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
    const matchCat = filterCat ? p.category_id === parseInt(filterCat) : true;
    return matchSearch && matchCat;
  });

  const handleBarcodeEnter = (e) => {
    if (e.key === "Enter" && search.trim()) {
      const match = products.find(p => p.barcode === search.trim());
      if (match) { addToCart(match); setSearch(""); }
      else if (filteredProducts.length === 1) { addToCart(filteredProducts[0]); setSearch(""); }
    }
  };

  const handleScanDetected = (barcode) => {
    setShowScanner(false);
    const match = products.find(p => p.barcode === barcode);
    if (match) { addToCart(match); setSearch(""); }
    else { setSearch(barcode); alert(`⚠️ "${barcode}" বারকোডের কোনো product পাওয়া যায়নি।`); }
    setTimeout(() => barcodeRef.current?.focus(), 200);
  };

  const getCartQty   = (id) => (cart.find(i => i.id === id)?.qty || 0);
  const isOutOfStock = (p) => p.stock <= 0;
  const isMaxReached = (p) => getCartQty(p.id) >= p.stock;

  const addToCart = (product) => {
    if (isMaxReached(product)) {
      alert(`❌ Stock শেষ! "${product.name}" এর মাত্র ${product.stock} টি আছে।`);
      return;
    }
    const exist = cart.find(i => i.id === product.id);
    if (exist) setCart(cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    else setCart([...cart, { ...product, qty: 1 }]);
  };

  const increase = (id) => {
    const product = products.find(p => p.id === id);
    if (getCartQty(id) >= product.stock) { alert(`❌ সর্বোচ্চ ${product.stock} টি যোগ করা যাবে।`); return; }
    setCart(cart.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  };
  const decrease = (id) => setCart(cart.map(i => i.id === id && i.qty > 1 ? { ...i, qty: i.qty - 1 } : i));
  const remove   = (id) => setCart(cart.filter(i => i.id !== id));

  const total = cart.reduce((s, i) => s + i.sell_price * i.qty, 0);
  const paid  = parseFloat(paidAmount) || 0;
  const due   = total - paid;

  const checkout = () => {
    if (cart.length === 0) { alert("Cart খালি আছে!"); return; }
    API.post("/sales", {
      items: cart, total,
      customer_id: selectedCustomer?.id || null,
      paid_amount: paid || total,
    }).then(res => {
      if (res.data.success) {
        const change = paid > total ? paid - total : 0;
        const msg = due > 0
          ? `✅ Sale সম্পন্ন!\nSale ID: ${res.data.sale_id}\nবাকি: ${due.toFixed(2)} ${cur}`
          : change > 0
          ? `✅ Sale সম্পন্ন!\nSale ID: ${res.data.sale_id}\nফেরত দিন: ${change.toFixed(2)} ${cur}`
          : `✅ Sale সম্পন্ন!\nSale ID: ${res.data.sale_id}`;
        alert(msg);
        setCart([]); setPaidAmount(""); setSelectedCustomer(null); setSearch("");
        loadProducts();
        barcodeRef.current?.focus();
      } else {
        alert("❌ Error: " + res.data.error);
      }
    }).catch(err => alert("❌ Error: " + err.message));
  };

  return (
    <div className="app-layout" style={{ fontSize: appFontSize }}>

      {showScanner && (
        <BarcodeScanner onDetected={handleScanDetected} onClose={() => setShowScanner(false)} />
      )}

      <Navbar
        activePage={page}
        setPage={(p) => { setPage(p); setLedgerCustomer(null); }}
        user={user}
        perms={perms}
        onLogout={handleLogout}
        shopName={settings?.shop_name}
      />

      {/* ===== MAIN CONTENT ===== */}
      <main className="page-content">

        {/* Products */}
        {page === "products" && <Products />}

        {/* Categories */}
        {page === "categories" && <Categories />}

        {/* Customers */}
        {page === "customers" && !ledgerCustomer && (
          <Customers onViewLedger={(c) => setLedgerCustomer(c)} />
        )}
        {page === "customers" && ledgerCustomer && (
          <CustomerLedger customer={ledgerCustomer} onBack={() => setLedgerCustomer(null)} />
        )}

        {/* Inventory */}
        {page === "inventory" && <Inventory />}

        {/* Reports */}
        {page === "reports" && <Reports />}

        {/* Admin */}
        {page === "admin" && user?.role === "admin" && (
          <AdminPanel currentUser={user} />
        )}

        {/* Settings */}
        {page === "settings" && <Settings />}

        {/* ===== POS PAGE ===== */}
        {page === "pos" && (
          <div className="pos-layout" style={{ display: "flex", flex: 1, overflow: "hidden", height: "100%" }}>

            {/* LEFT: Products */}
            <div className="pos-products" style={{
              flex: 1, padding: 20, overflowY: "auto",
              borderRight: "1px solid rgba(255,255,255,0.6)",
            }}>
              {/* Search Bar */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{
                  ...glass(), flex: 1, display: "flex", alignItems: "center",
                  borderRadius: 12, padding: "0 14px", gap: 8,
                }}>
                  <span style={{ color: T.text4, fontSize: 16 }}>🔍</span>
                  <input
                    ref={barcodeRef}
                    type="text"
                    placeholder="নাম বা Barcode দিয়ে খুঁজুন... (Enter)"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={handleBarcodeEnter}
                    style={{
                      flex: 1, background: "none", border: "none", outline: "none",
                      fontSize: 14, color: T.text1, padding: "11px 0", fontFamily: "inherit",
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowScanner(true)}
                  title="Camera দিয়ে Barcode স্ক্যান করুন"
                  style={{
                    padding: "0 16px",
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                    color: "#fff", border: "none", borderRadius: 12,
                    fontSize: 20, cursor: "pointer", flexShrink: 0,
                    boxShadow: `0 4px 14px ${ACCENT}40`,
                  }}
                >📷</button>
              </div>

              {/* Category Pills */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {[{ id: "", name: `সব (${products.length})` }, ...categories].map(c => {
                  const active = filterCat === String(c.id || "");
                  return (
                    <button key={String(c.id || "")}
                      onClick={() => setFilterCat(String(c.id || ""))}
                      style={{
                        padding: "6px 14px", borderRadius: 20,
                        border: "none", cursor: "pointer",
                        fontSize: 12, fontWeight: active ? 700 : 500,
                        background: active ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(255,255,255,0.65)",
                        color: active ? "#fff" : T.text2,
                        boxShadow: active ? `0 4px 12px ${ACCENT}35` : "0 1px 4px rgba(0,0,0,0.06)",
                        backdropFilter: "blur(10px)",
                        transition: "all 0.15s",
                        fontFamily: "inherit",
                      }}
                    >{c.name}</button>
                  );
                })}
              </div>

              {/* Title */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={{ margin: 0, color: T.text1, fontSize: 16, fontWeight: 700 }}>
                  📦 Products
                </h2>
                <span style={{
                  background: `${ACCENT}15`, color: ACCENT,
                  borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700,
                  border: `1px solid ${ACCENT}30`,
                }}>{filteredProducts.length} টি</span>
              </div>

              {/* Product Grid */}
              <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                {filteredProducts.map(p => {
                  const inCart     = getCartQty(p.id);
                  const outOfStock = isOutOfStock(p);
                  const maxReached = isMaxReached(p);
                  const lowStock   = p.stock > 0 && p.stock < 10;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !outOfStock && !maxReached && addToCart(p)}
                      style={{
                        ...glass(),
                        borderRadius: 14, padding: 12,
                        cursor: outOfStock || maxReached ? "not-allowed" : "pointer",
                        position: "relative", transition: "all 0.15s",
                        background: inCart > 0
                          ? `linear-gradient(135deg, ${ACCENT}18, ${ACCENT2}0e)`
                          : outOfStock ? "rgba(254,242,242,0.7)" : "rgba(255,255,255,0.72)",
                        border: inCart > 0
                          ? `1.5px solid ${ACCENT}50`
                          : outOfStock ? "1px solid #fecaca" : "1px solid rgba(255,255,255,0.9)",
                        boxShadow: inCart > 0
                          ? `0 4px 18px ${ACCENT}20`
                          : "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Stock badge */}
                      <span style={{
                        position: "absolute", top: 8, right: 8,
                        background: outOfStock ? "#fef2f2" : lowStock ? "#fffbeb" : "#f0fdf4",
                        color: outOfStock ? "#ef4444" : lowStock ? "#d97706" : "#16a34a",
                        border: `1px solid ${outOfStock ? "#fecaca" : lowStock ? "#fde68a" : "#bbf7d0"}`,
                        fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 20,
                      }}>
                        {outOfStock ? "শেষ" : p.stock}
                      </span>

                      <div style={{ color: T.text1, fontWeight: 700, fontSize: 13, marginBottom: 4, paddingRight: 28, lineHeight: 1.4 }}>
                        {p.name}
                      </div>
                      {p.barcode && (
                        <div style={{ fontSize: 10, color: T.text4, marginBottom: 4 }}>#{p.barcode}</div>
                      )}
                      <div style={{ color: ACCENT, fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
                        {p.sell_price} {cur}
                      </div>
                      {inCart > 0 && (
                        <div style={{
                          fontSize: 11, color: ACCENT, fontWeight: 700,
                          background: `${ACCENT}12`, borderRadius: 20,
                          padding: "1px 8px", display: "inline-block",
                        }}>Cart এ: {inCart}টি</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Cart */}
            <div className="pos-cart" style={{
              width: 340, flexShrink: 0,
              display: "flex", flexDirection: "column",
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}>
              <div style={{ padding: "16px 16px 8px" }}>
                {/* Customer */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: 700, display: "block", marginBottom: 6, color: T.text2, fontSize: 13 }}>
                    👤 Customer (ঐচ্ছিক)
                  </label>
                  <select
                    value={selectedCustomer?.id || ""}
                    onChange={e => setSelectedCustomer(customers.find(c => c.id === parseInt(e.target.value)) || null)}
                    style={{
                      width: "100%", padding: "9px 12px",
                      background: "rgba(255,255,255,0.7)",
                      border: "1.5px solid rgba(255,255,255,0.9)",
                      borderRadius: 10, fontSize: 13,
                      color: T.text1, fontFamily: "inherit", outline: "none",
                    }}
                  >
                    <option value="">-- Walk-in Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.phone ? ` (${c.phone})` : ""}{c.due_amount > 0 ? ` | বাকি: ${c.due_amount} ${cur}` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedCustomer?.due_amount > 0 && (
                    <div style={{ marginTop: 6, color: "#ef4444", fontSize: 12, fontWeight: 600 }}>
                      ⚠️ আগের বাকি: {selectedCustomer.due_amount} {cur}
                    </div>
                  )}
                </div>

                {/* Cart title */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <h2 style={{ margin: 0, color: T.text1, fontSize: 15, fontWeight: 800 }}>
                    🛒 Cart
                  </h2>
                  <span style={{
                    background: `${ACCENT}15`, color: ACCENT,
                    borderRadius: 20, padding: "2px 10px",
                    fontSize: 12, fontWeight: 700,
                    border: `1px solid ${ACCENT}30`,
                  }}>{cart.length} item</span>
                </div>
              </div>

              {/* Cart Items */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
                    <p style={{ color: T.text4, fontSize: 13 }}>Cart খালি আছে</p>
                  </div>
                ) : (
                  cart.map(i => (
                    <div key={i.id} style={{
                      ...glass({ borderRadius: 12, padding: "10px 12px" }),
                      display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: T.text1, fontWeight: 700, fontSize: 13 }}>{i.name}</div>
                        <div style={{ color: T.text3, fontSize: 12, marginTop: 2 }}>
                          {i.sell_price} {cur} × {i.qty} = <b style={{ color: ACCENT }}>{i.sell_price * i.qty} {cur}</b>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => decrease(i.id)} style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: "rgba(107,114,128,0.15)", border: "none",
                          color: T.text2, cursor: "pointer", fontSize: 14, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>−</button>
                        <span style={{ minWidth: 22, textAlign: "center", fontWeight: 800, fontSize: 13, color: T.text1 }}>{i.qty}</span>
                        <button onClick={() => increase(i.id)} style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                          border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: `0 3px 8px ${ACCENT}35`,
                        }}>+</button>
                      </div>
                      <button onClick={() => remove(i.id)} style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: "rgba(239,68,68,0.1)", border: "none",
                        color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>✕</button>
                    </div>
                  ))
                )}
              </div>

              {/* Totals & Checkout */}
              <div style={{
                padding: 16,
                borderTop: "1px solid rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.4)",
              }}>
                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 15, color: T.text2, fontWeight: 600 }}>মোট:</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: T.text1 }}>{total} {cur}</span>
                </div>

                {/* Paid Input */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5, color: T.text3, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    💵 Paid Amount
                  </label>
                  <input
                    type="number"
                    placeholder={`${total} (পুরো টাকা)`}
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px",
                      background: "rgba(255,255,255,0.7)",
                      border: "1.5px solid rgba(255,255,255,0.9)",
                      borderRadius: 10, fontSize: 14, fontFamily: "inherit",
                      color: T.text1, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Due/Change */}
                {paid > 0 && paid < total && (
                  <div style={{
                    background: "rgba(254,242,242,0.9)", border: "1px solid #fca5a5",
                    borderRadius: 10, padding: "8px 12px", marginBottom: 8,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ color: "#ef4444", fontSize: 13 }}>বাকি:</span>
                    <b style={{ color: "#ef4444", fontSize: 15 }}>{due.toFixed(2)} {cur}</b>
                  </div>
                )}
                {paid > total && (
                  <div style={{
                    background: "rgba(240,253,244,0.9)", border: "1px solid #86efac",
                    borderRadius: 10, padding: "8px 12px", marginBottom: 8,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ color: "#16a34a", fontSize: 13 }}>ফেরত:</span>
                    <b style={{ color: "#16a34a", fontSize: 15 }}>{(paid - total).toFixed(2)} {cur}</b>
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={checkout}
                  disabled={cart.length === 0}
                  style={{
                    width: "100%", padding: "14px 0",
                    background: cart.length === 0
                      ? "rgba(209,213,219,0.8)"
                      : "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "#fff", border: "none", borderRadius: 12,
                    fontSize: 15, fontWeight: 800,
                    cursor: cart.length === 0 ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: cart.length > 0 ? "0 6px 20px rgba(34,197,94,0.35)" : "none",
                    transition: "all 0.15s",
                  }}
                >✅ Checkout করুন</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dokan360_user")); } catch { return null; }
  });
  return (
    <SettingsProvider isLoggedIn={!!user}>
      <AppInner onUserChange={setUser} />
    </SettingsProvider>
  );
}
