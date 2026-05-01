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

const ACCENT  = "#6366f1";
const ACCENT2 = "#8b5cf6";

const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 4px 20px rgba(99,102,241,0.08), 0 1px 3px rgba(0,0,0,0.04)",
  ...extra,
});

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
      .filter(i => i.qty > 0));
  };

  return (
    <div style={{
      width: "100%", height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "'Inter', sans-serif",
      // Light gradient — pastel purple/blue/green canvas
      background: "linear-gradient(160deg, #ede9fe 0%, #dbeafe 55%, #dcfce7 100%)",
      position: "relative", overflow: "hidden",
    }}>

      {/* Status bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 20px 0", color: "#6b7280", fontSize: 11, fontWeight: 600, flexShrink: 0,
      }}>
        <span>9:41</span>
        <span>📶 🔋 98%</span>
      </div>

      {/* Header */}
      <header style={{
        padding: "10px 16px 12px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            boxShadow: `0 6px 16px ${ACCENT}40`,
          }}>🏪</div>
          <div>
            <div style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 15 }}>Dokan360</div>
            <div style={{ color: "#9ca3af", fontSize: 10 }}>👑 Admin • Rahman</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            ...glass(), borderRadius: 12,
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative",
          }}>
            <span style={{ fontSize: 15 }}>🔔</span>
            <div style={{
              position: "absolute", top: 7, right: 7,
              width: 7, height: 7, borderRadius: "50%",
              background: "#ef4444", border: "1.5px solid white",
            }} />
          </div>
        </div>
      </header>

      {/* CART DRAWER */}
      {showCart && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(99,102,241,0.12)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
        }} onClick={() => setShowCart(false)}>
          <div style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            borderRadius: "28px 28px 0 0",
            padding: 20, maxHeight: "78vh", display: "flex", flexDirection: "column",
            border: "1px solid rgba(255,255,255,0.95)",
            boxShadow: "0 -8px 40px rgba(99,102,241,0.15)",
          }} onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "0 auto 18px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 16 }}>🛒 Cart ({cartCount})</span>
              <button onClick={() => setShowCart(false)} style={{
                background: "#f3f4f6", border: "none", borderRadius: 8,
                color: "#6b7280", padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}>বন্ধ করুন</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {cart.length === 0 && (
                <div style={{ textAlign: "center", color: "#d1d5db", paddingTop: 30, fontSize: 13 }}>
                  <div style={{ fontSize: 34, marginBottom: 6 }}>🛒</div>Cart খালি
                </div>
              )}
              {cart.map(item => (
                <div key={item.id} style={{
                  ...glass(), borderRadius: 12, padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#1e1b4b", fontSize: 12, fontWeight: 700 }}>{item.name}</div>
                    <div style={{ color: ACCENT, fontSize: 11, fontWeight: 600 }}>{item.price} ৳</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <button onClick={() => changeQty(item.id, -1)} style={{
                      width: 28, height: 28, borderRadius: 8, background: "#f3f4f6",
                      border: "1px solid #e5e7eb", color: "#374151", cursor: "pointer", fontSize: 15,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>−</button>
                    <span style={{ color: "#1e1b4b", fontWeight: 800, minWidth: 20, textAlign: "center", fontSize: 13 }}>{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                      border: "none", color: "#fff", cursor: "pointer", fontSize: 15,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 3px 10px ${ACCENT}40`,
                    }}>+</button>
                  </div>
                  <span style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 13, minWidth: 52, textAlign: "right" }}>
                    {item.price * item.qty}৳
                  </span>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 14, marginTop: 12, borderTop: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ color: "#6b7280", fontSize: 14, fontWeight: 500 }}>মোট</span>
                <span style={{ color: "#1e1b4b", fontWeight: 900, fontSize: 22 }}>{cartTotal} ৳</span>
              </div>
              <button style={{
                width: "100%", padding: 14, borderRadius: 16, border: "none",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(34,197,94,0.30)",
              }}>✅ Checkout করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {tab === "pos" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Search bar */}
            <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
              <div style={{
                ...glass(), borderRadius: 16,
                display: "flex", alignItems: "center", gap: 8, padding: "11px 14px",
              }}>
                <span style={{ color: "#9ca3af" }}>🔍</span>
                <input placeholder="Product খুঁজুন..." style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  color: "#374151", fontSize: 14,
                }} />
                <button style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                  border: "none", borderRadius: 9, color: "#fff",
                  padding: "5px 10px", cursor: "pointer", fontSize: 14,
                  boxShadow: `0 3px 10px ${ACCENT}40`,
                }}>📷</button>
              </div>
            </div>

            {/* Category pills */}
            <div style={{
              display: "flex", gap: 8, padding: "0 16px 12px", flexShrink: 0,
              overflowX: "auto", scrollbarWidth: "none",
            }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{
                  padding: "7px 16px", borderRadius: 20, border: "none",
                  cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  flexShrink: 0, transition: "all 0.18s",
                  background: cat === c
                    ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`
                    : "rgba(255,255,255,0.72)",
                  color: cat === c ? "#fff" : "#374151",
                  boxShadow: cat === c
                    ? `0 4px 12px ${ACCENT}40`
                    : "0 1px 4px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.9)",
                  backdropFilter: "blur(10px)",
                }}>{c}</button>
              ))}
            </div>

            {/* Products grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingBottom: 16 }}>
                {filteredProds.map(p => {
                  const inCart   = cart.find(i => i.id === p.id)?.qty || 0;
                  const oos      = p.stock === 0;
                  const lowStock = p.stock > 0 && p.stock < 10;
                  return (
                    <div key={p.id} onClick={() => addToCart(p)} style={{
                      ...glass(),
                      borderRadius: 18, padding: "14px", cursor: oos ? "not-allowed" : "pointer",
                      position: "relative", transition: "all 0.18s",
                      background: inCart > 0
                        ? `linear-gradient(135deg, ${ACCENT}18, ${ACCENT2}0e)`
                        : oos ? "rgba(254,242,242,0.75)" : "rgba(255,255,255,0.72)",
                      border: inCart > 0
                        ? `1.5px solid ${ACCENT}50`
                        : oos ? "1px solid #fecaca" : "1px solid rgba(255,255,255,0.9)",
                      boxShadow: inCart > 0 ? `0 4px 18px ${ACCENT}20` : "0 2px 10px rgba(0,0,0,0.05)",
                    }}>
                      {/* Stock badge */}
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        background: oos ? "#fef2f2" : lowStock ? "#fffbeb" : "#f0fdf4",
                        color: oos ? "#ef4444" : lowStock ? "#d97706" : "#16a34a",
                        border: `1px solid ${oos ? "#fecaca" : lowStock ? "#fde68a" : "#bbf7d0"}`,
                        fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20,
                      }}>{oos ? "শেষ" : p.stock}</div>

                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4, fontWeight: 500 }}>{p.cat}</div>
                      <div style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 12, marginBottom: 8, lineHeight: 1.4, paddingRight: 28 }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: ACCENT, fontWeight: 900, fontSize: 15 }}>{p.price}৳</span>
                        {inCart > 0 && (
                          <span style={{
                            background: `${ACCENT}18`, color: ACCENT,
                            borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                          }}>×{inCart}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart button */}
            {cartCount > 0 && (
              <div style={{ padding: "10px 16px", flexShrink: 0 }}>
                <button onClick={() => setShowCart(true)} style={{
                  width: "100%", padding: "14px", borderRadius: 18, border: "none",
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  boxShadow: `0 8px 25px ${ACCENT}45`,
                }}>
                  <span>🛒 {cartCount} item cart-এ</span>
                  <span style={{ fontWeight: 800 }}>{cartTotal} ৳ →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {tab !== "pos" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ ...glass(), borderRadius: 24, textAlign: "center", padding: "36px 28px" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>
                {NAV_TABS.find(t => t.key === tab)?.icon}
              </div>
              <div style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 17, marginBottom: 4 }}>
                {NAV_TABS.find(t => t.key === tab)?.label}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 12 }}>নতুন UI সব page-এ apply হবে</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <nav style={{
        flexShrink: 0,
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.9)",
        boxShadow: "0 -4px 20px rgba(99,102,241,0.08)",
        display: "flex", padding: "8px 0 16px",
      }}>
        {NAV_TABS.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 0",
            }}>
              <div style={{
                width: 44, height: 28, borderRadius: 14,
                background: active
                  ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`
                  : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.2s",
                boxShadow: active ? `0 3px 12px ${ACCENT}40` : "none",
              }}>{t.icon}</div>
              <span style={{
                color: active ? ACCENT : "#9ca3af",
                fontSize: 10, fontWeight: active ? 700 : 400,
              }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
