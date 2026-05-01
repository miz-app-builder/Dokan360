import { useState } from "react";

const NAV_TABS = [
  { key: "pos",       icon: "🛒", label: "POS"      },
  { key: "products",  icon: "📦", label: "Products" },
  { key: "customers", icon: "👥", label: "Customers"},
  { key: "reports",   icon: "📊", label: "Reports"  },
  { key: "more",      icon: "⋯",  label: "More"     },
];

const PRODUCTS = [
  { id: 1, name: "Basmati Rice 5kg",  price: 650, stock: 45, cat: "Food"     },
  { id: 2, name: "Sunflower Oil 1L",  price: 185, stock: 30, cat: "Food"     },
  { id: 3, name: "Surf Excel 1kg",    price: 210, stock: 12, cat: "Home"     },
  { id: 4, name: "Lux Soap (3pcs)",   price: 90,  stock: 0,  cat: "Home"     },
  { id: 5, name: "Horlicks 500g",     price: 380, stock: 8,  cat: "Health"   },
  { id: 6, name: "Coca-Cola 2L",      price: 115, stock: 60, cat: "Beverage" },
];

const CATS = ["সব", "Food", "Home", "Health", "Beverage"];

export function Mobile() {
  const [tab, setTab]   = useState("pos");
  const [cat, setCat]   = useState("সব");
  const [cart, setCart] = useState<Array<{ id: number; name: string; price: number; qty: number }>>([]);
  const [showCart, setShowCart] = useState(false);

  const filteredProds = PRODUCTS.filter(p => cat === "সব" || p.cat === cat);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
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
      width: "100%", height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "'Inter', sans-serif",
      background: "linear-gradient(160deg, #0f0c29 0%, #302b63 60%, #24243e 100%)",
      position: "relative", overflow: "hidden",
    }}>

      {/* Status bar mockup */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 20px 0",
        color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, flexShrink: 0,
      }}>
        <span>9:41</span>
        <span>📶 🔋 98%</span>
      </div>

      {/* Top Header */}
      <header style={{
        padding: "12px 16px 10px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
          }}>🏪</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Dokan360</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>👑 Admin • Rahman</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>🔔</button>
        </div>
      </header>

      {/* CART DRAWER */}
      {showCart && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
        }} onClick={() => setShowCart(false)}>
          <div style={{
            background: "linear-gradient(160deg, #1e1b4b, #312e81)",
            borderRadius: "24px 24px 0 0",
            padding: 20, maxHeight: "75vh", display: "flex", flexDirection: "column",
            border: "1px solid rgba(255,255,255,0.1)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>🛒 Cart ({cartCount})</span>
              <button onClick={() => setShowCart(false)} style={{
                background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8,
                color: "#fff", padding: "4px 10px", cursor: "pointer", fontSize: 12,
              }}>বন্ধ করুন</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {cart.length === 0 && (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", paddingTop: 30, fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🛒</div>Cart খালি
                </div>
              )}
              {cart.map(item => (
                <div key={item.id} style={{
                  background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: "#a5b4fc", fontSize: 11 }}>{item.price} ৳</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => changeQty(item.id, -1)} style={{
                      width: 26, height: 26, borderRadius: 7,
                      background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff", cursor: "pointer", fontSize: 14,
                    }}>−</button>
                    <span style={{ color: "#fff", fontWeight: 700, minWidth: 20, textAlign: "center", fontSize: 13 }}>{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} style={{
                      width: 26, height: 26, borderRadius: 7,
                      background: "rgba(99,102,241,0.5)", border: "1px solid rgba(99,102,241,0.5)",
                      color: "#fff", cursor: "pointer", fontSize: 14,
                    }}>+</button>
                  </div>
                  <span style={{ color: "#e0e7ff", fontWeight: 700, fontSize: 13, minWidth: 50, textAlign: "right" }}>
                    {item.price * item.qty}৳
                  </span>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>মোট</span>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>{cartTotal} ৳</span>
              </div>
              <button style={{
                width: "100%", padding: 14, borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(34,197,94,0.35)",
              }}>✅ Checkout করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* POS Tab */}
        {tab === "pos" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Search */}
            <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.09)", borderRadius: 14,
                padding: "11px 14px", border: "1px solid rgba(255,255,255,0.12)",
              }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>🔍</span>
                <input placeholder="Product খুঁজুন..." style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  color: "#fff", fontSize: 14,
                }} />
                <button style={{
                  background: "rgba(99,102,241,0.3)", border: "none", borderRadius: 8,
                  color: "#fff", padding: "4px 8px", cursor: "pointer", fontSize: 14,
                }}>📷</button>
              </div>
            </div>

            {/* Category scroll */}
            <div style={{
              display: "flex", gap: 8, padding: "0 16px 12px", flexShrink: 0,
              overflowX: "auto", scrollbarWidth: "none",
            }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{
                  padding: "7px 16px", borderRadius: 20, border: "none",
                  cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  background: cat === c ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.09)",
                  color: cat === c ? "#fff" : "rgba(255,255,255,0.6)",
                  boxShadow: cat === c ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                  border: cat === c ? "none" : "1px solid rgba(255,255,255,0.1)",
                  flexShrink: 0,
                }}>{c}</button>
              ))}
            </div>

            {/* Products grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingBottom: 16 }}>
                {filteredProds.map(p => {
                  const inCart  = cart.find(i => i.id === p.id)?.qty || 0;
                  const oos     = p.stock === 0;
                  const lowStock = p.stock > 0 && p.stock < 10;
                  return (
                    <div key={p.id} onClick={() => addToCart(p)} style={{
                      background: inCart > 0
                        ? "rgba(99,102,241,0.22)"
                        : oos ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.07)",
                      backdropFilter: "blur(12px)",
                      borderRadius: 16,
                      border: inCart > 0
                        ? "1px solid rgba(99,102,241,0.5)"
                        : oos ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.1)",
                      padding: "14px", cursor: oos ? "not-allowed" : "pointer",
                      position: "relative", transition: "all 0.2s",
                      boxShadow: inCart > 0 ? "0 4px 20px rgba(99,102,241,0.2)" : "none",
                    }}>
                      {/* Stock badge */}
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        background: oos ? "rgba(239,68,68,0.85)" : lowStock ? "rgba(245,158,11,0.85)" : "rgba(34,197,94,0.85)",
                        color: "#fff", fontSize: 9, fontWeight: 700,
                        padding: "2px 6px", borderRadius: 20,
                      }}>{oos ? "শেষ" : p.stock}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{p.cat}</div>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 12, marginBottom: 8, lineHeight: 1.4, paddingRight: 28 }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#a5b4fc", fontWeight: 800, fontSize: 15 }}>{p.price}৳</span>
                        {inCart > 0 && (
                          <span style={{
                            background: "rgba(99,102,241,0.5)", color: "#c7d2fe",
                            borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                          }}>×{inCart}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart FAB */}
            {cartCount > 0 && (
              <div style={{ padding: "10px 16px", flexShrink: 0 }}>
                <button onClick={() => setShowCart(true)} style={{
                  width: "100%", padding: "14px", borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  boxShadow: "0 8px 25px rgba(99,102,241,0.45)",
                }}>
                  <span>🛒 {cartCount} item cart-এ</span>
                  <span>{cartTotal} ৳ →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Other tabs placeholder */}
        {tab !== "pos" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{
              textAlign: "center",
              background: "rgba(255,255,255,0.06)", borderRadius: 20,
              padding: "32px 24px", border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>
                {NAV_TABS.find(t => t.key === tab)?.icon}
              </div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                {NAV_TABS.find(t => t.key === tab)?.label}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>নতুন UI সব page-এ apply হবে</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <nav style={{
        flexShrink: 0,
        background: "rgba(15,12,41,0.85)",
        backdropFilter: "blur(30px)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex", padding: "8px 0 16px",
      }}>
        {NAV_TABS.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 0",
            }}>
              <div style={{
                width: 42, height: 28, borderRadius: 14,
                background: active ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.2s",
                boxShadow: active ? "0 3px 10px rgba(99,102,241,0.4)" : "none",
              }}>{t.icon}</div>
              <span style={{
                color: active ? "#a5b4fc" : "rgba(255,255,255,0.35)",
                fontSize: 10, fontWeight: active ? 700 : 400,
              }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
