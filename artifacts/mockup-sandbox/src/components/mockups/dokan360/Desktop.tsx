import { useState } from "react";

const NAV_ITEMS = [
  { key: "pos",        icon: "🛒", label: "POS",        badge: null },
  { key: "products",   icon: "📦", label: "Products",   badge: "142" },
  { key: "categories", icon: "🗂️", label: "Categories", badge: null },
  { key: "customers",  icon: "👥", label: "Customers",  badge: "28" },
  { key: "inventory",  icon: "🏭", label: "Inventory",  badge: null },
  { key: "reports",    icon: "📊", label: "Reports",    badge: null },
];

const ADMIN_ITEMS = [
  { key: "admin",    icon: "⚙️", label: "Admin Panel" },
  { key: "settings", icon: "🔧", label: "Settings"    },
];

const PRODUCTS = [
  { id: 1, name: "Basmati Rice 5kg",    price: 650,  stock: 45, cat: "Food" },
  { id: 2, name: "Sunflower Oil 1L",    price: 185,  stock: 30, cat: "Food" },
  { id: 3, name: "Surf Excel 1kg",      price: 210,  stock: 12, cat: "Home" },
  { id: 4, name: "Lux Soap (3pcs)",     price: 90,   stock: 0,  cat: "Home" },
  { id: 5, name: "Horlicks 500g",       price: 380,  stock: 8,  cat: "Health" },
  { id: 6, name: "Nescafe 200g",        price: 490,  stock: 20, cat: "Beverage" },
  { id: 7, name: "Coca-Cola 2L",        price: 115,  stock: 60, cat: "Beverage" },
  { id: 8, name: "Dettol 500ml",        price: 175,  stock: 5,  cat: "Health" },
];

const CART_INIT = [
  { id: 1, name: "Basmati Rice 5kg", price: 650, qty: 2 },
  { id: 7, name: "Coca-Cola 2L",     price: 115, qty: 3 },
];

const CATS = ["সব", "Food", "Home", "Health", "Beverage"];

export function Desktop() {
  const [page, setPage]     = useState("pos");
  const [cat, setCat]       = useState("সব");
  const [cart, setCart]     = useState(CART_INIT);
  const [search, setSearch] = useState("");

  const filteredProds = PRODUCTS.filter(p => {
    const q = search.toLowerCase();
    const matchCat    = cat === "সব" || p.cat === cat;
    const matchSearch = p.name.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (p: typeof PRODUCTS[0]) => {
    if (p.stock === 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  };

  const changeQty = (id: number, delta: number) => {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    );
  };

  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      overflow: "hidden",
    }}>

      {/* ── SIDEBAR ───────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0, display: "flex", flexDirection: "column",
        padding: "20px 12px",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 8px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
            }}>🏪</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Dokan360</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>POS System</div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, paddingTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600, letterSpacing: 1.2, padding: "0 10px 6px", textTransform: "uppercase" }}>
            Main Menu
          </div>
          {NAV_ITEMS.map(item => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                background: active
                  ? "linear-gradient(135deg, rgba(99,102,241,0.7), rgba(139,92,246,0.5))"
                  : "transparent",
                boxShadow: active ? "0 4px 15px rgba(99,102,241,0.25)" : "none",
                backdropFilter: active ? "blur(10px)" : "none",
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{
                  flex: 1, color: active ? "#fff" : "rgba(255,255,255,0.65)",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    background: active ? "rgba(255,255,255,0.25)" : "rgba(99,102,241,0.4)",
                    color: "#fff", fontSize: 10, fontWeight: 700,
                    padding: "2px 7px", borderRadius: 20,
                  }}>{item.badge}</span>
                )}
                {active && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#a5b4fc" }} />}
              </button>
            );
          })}

          <div style={{ marginTop: 16, color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600, letterSpacing: 1.2, padding: "0 10px 6px", textTransform: "uppercase" }}>
            Admin
          </div>
          {ADMIN_ITEMS.map(item => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                background: active ? "linear-gradient(135deg, rgba(99,102,241,0.7), rgba(139,92,246,0.5))" : "transparent",
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ flex: 1, color: active ? "#fff" : "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info */}
        <div style={{
          padding: "12px", borderRadius: 12, marginTop: 12,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#fff", fontWeight: 700,
            }}>R</div>
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Rahman</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>👑 Admin</div>
            </div>
            <button style={{
              marginLeft: "auto", background: "rgba(239,68,68,0.2)",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6,
              color: "#fca5a5", fontSize: 10, padding: "4px 8px", cursor: "pointer",
            }}>Logout</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
              {page === "pos" ? "🛒 Point of Sale" :
               page === "products" ? "📦 Products" :
               page === "customers" ? "👥 Customers" :
               page === "reports" ? "📊 Reports" :
               page === "inventory" ? "🏭 Inventory" :
               page === "settings" ? "🔧 Settings" : "⚙️ Admin"}
            </h1>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
              {new Date().toLocaleDateString("bn-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px",
              display: "flex", alignItems: "center", gap: 8,
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>🔍</span>
              <input placeholder="Quick search..." style={{
                background: "none", border: "none", outline: "none",
                color: "#fff", fontSize: 13, width: 160,
              }} />
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)",
            }}>🔔</div>
          </div>
        </header>

        {/* POS PAGE */}
        {page === "pos" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Left: Products */}
            <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Search & Filter row */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.08)", borderRadius: 12,
                  padding: "10px 16px", border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(10px)",
                }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>🔍</span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="নাম বা barcode দিয়ে খুঁজুন..."
                    style={{
                      flex: 1, background: "none", border: "none", outline: "none",
                      color: "#fff", fontSize: 13,
                    }}
                  />
                </div>
                <button style={{
                  padding: "10px 16px", borderRadius: 12,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none", color: "#fff", fontSize: 18, cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
                }}>📷</button>
              </div>

              {/* Category pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{
                    padding: "6px 16px", borderRadius: 20, border: "none",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                    background: cat === c
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "rgba(255,255,255,0.08)",
                    color: cat === c ? "#fff" : "rgba(255,255,255,0.6)",
                    boxShadow: cat === c ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                    border: cat === c ? "none" : "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.2s",
                  }}>{c}</button>
                ))}
              </div>

              {/* Products grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {filteredProds.map(p => {
                  const inCart  = cart.find(i => i.id === p.id)?.qty || 0;
                  const oos     = p.stock === 0;
                  const lowStock = p.stock > 0 && p.stock < 10;
                  return (
                    <div key={p.id} onClick={() => addToCart(p)} style={{
                      background: inCart > 0
                        ? "rgba(99,102,241,0.2)"
                        : oos ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.07)",
                      backdropFilter: "blur(12px)",
                      borderRadius: 14,
                      border: inCart > 0
                        ? "1px solid rgba(99,102,241,0.5)"
                        : oos ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.1)",
                      padding: "14px 16px", cursor: oos ? "not-allowed" : "pointer",
                      position: "relative", transition: "all 0.2s",
                      boxShadow: inCart > 0 ? "0 4px 20px rgba(99,102,241,0.2)" : "none",
                    }}>
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        background: oos ? "rgba(239,68,68,0.8)" : lowStock ? "rgba(245,158,11,0.8)" : "rgba(34,197,94,0.8)",
                        color: "#fff", fontSize: 10, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 20,
                      }}>{oos ? "শেষ" : `${p.stock}`}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{p.cat}</div>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 6, lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 16 }}>{p.price} ৳</span>
                        {inCart > 0 && (
                          <span style={{
                            background: "rgba(99,102,241,0.5)", color: "#c7d2fe",
                            borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                          }}>×{inCart}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Cart */}
            <div style={{
              width: 320, flexShrink: 0, display: "flex", flexDirection: "column",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              padding: 20,
            }}>
              {/* Customer */}
              <div style={{
                background: "rgba(255,255,255,0.07)", borderRadius: 12,
                padding: "12px 14px", marginBottom: 16,
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>👤 CUSTOMER</div>
                <select style={{
                  width: "100%", background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
                  color: "#fff", padding: "8px 10px", fontSize: 12, outline: "none",
                }}>
                  <option value="">Walk-in Customer</option>
                  <option value="1">Karim (বাকি: ৳ 450)</option>
                  <option value="2">Rina Begum</option>
                </select>
              </div>

              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
                🛒 CART ({cart.length} items)
              </div>

              {/* Cart items */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {cart.length === 0 && (
                  <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 40, fontSize: 13 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
                    Cart খালি আছে
                  </div>
                )}
                {cart.map(item => (
                  <div key={item.id} style={{
                    background: "rgba(255,255,255,0.07)", borderRadius: 10,
                    padding: "10px 12px", border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                      <div style={{ color: "#a5b4fc", fontSize: 12 }}>{item.price} ৳ × {item.qty}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => changeQty(item.id, -1)} style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>−</button>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: "rgba(99,102,241,0.4)", border: "1px solid rgba(99,102,241,0.5)",
                        color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>+</button>
                    </div>
                    <div style={{ color: "#e0e7ff", fontWeight: 700, fontSize: 13, minWidth: 55, textAlign: "right" }}>
                      {item.price * item.qty} ৳
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Checkout */}
              <div style={{
                paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 12,
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>মোট মূল্য</span>
                  <span style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>{cartTotal} ৳</span>
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.07)", borderRadius: 10,
                  padding: "10px 12px", border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>💵</span>
                  <input type="number" placeholder={`${cartTotal} ৳ (পুরো টাকা)`} style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    color: "#fff", fontSize: 14,
                  }} />
                </div>
                <button style={{
                  padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff", fontWeight: 800, fontSize: 15,
                  boxShadow: "0 6px 20px rgba(34,197,94,0.35)",
                  letterSpacing: 0.3,
                }}>✅ Checkout করুন</button>
              </div>
            </div>
          </div>
        )}

        {/* OTHER PAGES placeholder */}
        {page !== "pos" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              textAlign: "center", padding: 40,
              background: "rgba(255,255,255,0.06)", borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)",
            }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>
                {NAV_ITEMS.concat(ADMIN_ITEMS).find(i => i.key === page)?.icon}
              </div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                {NAV_ITEMS.concat(ADMIN_ITEMS).find(i => i.key === page)?.label} Page
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                এই page-এর নতুন UI apply হবে পুরো project-এ
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
