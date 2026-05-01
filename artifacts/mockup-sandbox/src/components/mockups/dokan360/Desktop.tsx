import { useState } from "react";

const NAV_ITEMS = [
  { key: "pos",        icon: "🛒", label: "POS",        badge: null   },
  { key: "products",   icon: "📦", label: "Products",   badge: "142"  },
  { key: "categories", icon: "🗂️", label: "Categories", badge: null   },
  { key: "customers",  icon: "👥", label: "Customers",  badge: "28"   },
  { key: "inventory",  icon: "🏭", label: "Inventory",  badge: null   },
  { key: "reports",    icon: "📊", label: "Reports",    badge: null   },
];

const ADMIN_ITEMS = [
  { key: "admin",    icon: "⚙️", label: "Admin Panel" },
  { key: "settings", icon: "🔧", label: "Settings"    },
];

const PRODUCTS = [
  { id: 1, name: "Basmati Rice 5kg",  price: 650, stock: 45, cat: "Food"     },
  { id: 2, name: "Sunflower Oil 1L",  price: 185, stock: 30, cat: "Food"     },
  { id: 3, name: "Surf Excel 1kg",    price: 210, stock: 12, cat: "Home"     },
  { id: 4, name: "Lux Soap (3pcs)",   price: 90,  stock: 0,  cat: "Home"     },
  { id: 5, name: "Horlicks 500g",     price: 380, stock: 8,  cat: "Health"   },
  { id: 6, name: "Nescafe 200g",      price: 490, stock: 20, cat: "Beverage" },
  { id: 7, name: "Coca-Cola 2L",      price: 115, stock: 60, cat: "Beverage" },
  { id: 8, name: "Dettol 500ml",      price: 175, stock: 5,  cat: "Health"   },
];

const CART_INIT = [
  { id: 1, name: "Basmati Rice 5kg", price: 650, qty: 2 },
  { id: 7, name: "Coca-Cola 2L",     price: 115, qty: 3 },
];

const CATS = ["সব", "Food", "Home", "Health", "Beverage"];

// Light glass morphism tokens
const glass = {
  card: {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)",
  } as React.CSSProperties,
  sidebar: {
    background: "rgba(255,255,255,0.60)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRight: "1px solid rgba(255,255,255,0.8)",
  } as React.CSSProperties,
};

const ACCENT = "#6366f1";
const ACCENT2 = "#8b5cf6";

export function Desktop() {
  const [page, setPage]     = useState("pos");
  const [cat, setCat]       = useState("সব");
  const [cart, setCart]     = useState(CART_INIT);
  const [search, setSearch] = useState("");

  const filteredProds = PRODUCTS.filter(p => {
    const matchCat    = cat === "সব" || p.cat === cat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
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
      .filter(i => i.qty > 0));
  };

  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif",
      // Soft light gradient background — the "canvas" behind the glass
      background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 40%, #dbeafe 80%, #f0fdf4 100%)",
      overflow: "hidden",
    }}>

      {/* ── SIDEBAR ─────────────────────────── */}
      <aside style={{
        width: 224, flexShrink: 0, display: "flex", flexDirection: "column",
        padding: "20px 12px",
        ...glass.sidebar,
      }}>
        {/* Logo */}
        <div style={{ padding: "4px 8px 22px", borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: `0 6px 18px rgba(99,102,241,0.35)`,
            }}>🏪</div>
            <div>
              <div style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>Dokan360</div>
              <div style={{ color: "#6b7280", fontSize: 11 }}>POS System</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 16, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ color: "#9ca3af", fontSize: 10, fontWeight: 700, letterSpacing: 1.4, padding: "0 10px 8px", textTransform: "uppercase" }}>
            Main Menu
          </div>
          {NAV_ITEMS.map(item => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12,
                border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                background: active
                  ? `linear-gradient(135deg, ${ACCENT}22, ${ACCENT2}18)`
                  : "transparent",
                boxShadow: active ? `inset 0 0 0 1px ${ACCENT}30` : "none",
                transition: "all 0.18s",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(107,114,128,0.09)",
                  fontSize: 15,
                  boxShadow: active ? `0 4px 12px ${ACCENT}40` : "none",
                  transition: "all 0.18s",
                }}>{item.icon}</div>
                <span style={{
                  flex: 1, color: active ? ACCENT : "#374151",
                  fontSize: 13, fontWeight: active ? 700 : 500,
                }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    background: active ? `${ACCENT}22` : "#f3f4f6",
                    color: active ? ACCENT : "#6b7280",
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  }}>{item.badge}</span>
                )}
              </button>
            );
          })}

          <div style={{ marginTop: 14, color: "#9ca3af", fontSize: 10, fontWeight: 700, letterSpacing: 1.4, padding: "0 10px 8px", textTransform: "uppercase" }}>
            Admin
          </div>
          {ADMIN_ITEMS.map(item => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12,
                border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                background: active ? `linear-gradient(135deg, ${ACCENT}22, ${ACCENT2}18)` : "transparent",
                transition: "all 0.18s",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(107,114,128,0.09)",
                  fontSize: 15,
                  boxShadow: active ? `0 4px 12px ${ACCENT}40` : "none",
                }}>{item.icon}</div>
                <span style={{ flex: 1, color: active ? ACCENT : "#374151", fontSize: 13, fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div style={{
          ...glass.card,
          borderRadius: 14, padding: "12px 14px", marginTop: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#fff", fontWeight: 800,
              boxShadow: "0 4px 10px rgba(245,158,11,0.35)",
            }}>R</div>
            <div>
              <div style={{ color: "#1e1b4b", fontSize: 12, fontWeight: 700 }}>Rahman</div>
              <div style={{ color: "#6b7280", fontSize: 10 }}>👑 Admin</div>
            </div>
            <button style={{
              marginLeft: "auto", background: "#fef2f2",
              border: "1px solid #fecaca", borderRadius: 8,
              color: "#ef4444", fontSize: 10, padding: "4px 8px", cursor: "pointer", fontWeight: 600,
            }}>Logout</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.8)",
          boxShadow: "0 1px 0 rgba(99,102,241,0.06)",
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{ color: "#1e1b4b", fontSize: 18, fontWeight: 800, margin: 0 }}>
              {page === "pos" ? "🛒 Point of Sale" :
               page === "products" ? "📦 Products" :
               page === "customers" ? "👥 Customers" :
               page === "reports" ? "📊 Reports" :
               page === "inventory" ? "🏭 Inventory" :
               page === "settings" ? "🔧 Settings" : "⚙️ Admin Panel"}
            </h1>
            <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
              {new Date().toLocaleDateString("bn-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search */}
            <div style={{
              ...glass.card, borderRadius: 12,
              padding: "9px 14px", display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: "#9ca3af", fontSize: 14 }}>🔍</span>
              <input placeholder="Quick search..." style={{
                background: "none", border: "none", outline: "none",
                color: "#374151", fontSize: 13, width: 160,
              }} />
            </div>
            {/* Notification bell */}
            <div style={{
              ...glass.card, borderRadius: 12,
              width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, cursor: "pointer", position: "relative",
            }}>
              🔔
              <div style={{
                position: "absolute", top: 6, right: 7,
                width: 8, height: 8, borderRadius: "50%",
                background: "#ef4444", border: "1.5px solid white",
              }} />
            </div>
          </div>
        </header>

        {/* POS PAGE */}
        {page === "pos" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Products panel */}
            <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Search + camera */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{
                  flex: 1,
                  ...glass.card, borderRadius: 14,
                  padding: "11px 16px", display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ color: "#9ca3af" }}>🔍</span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="নাম বা barcode দিয়ে খুঁজুন..."
                    style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#374151", fontSize: 13 }}
                  />
                </div>
                <button style={{
                  padding: "11px 18px", borderRadius: 14,
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                  border: "none", color: "#fff", fontSize: 18, cursor: "pointer",
                  boxShadow: `0 4px 16px ${ACCENT}45`,
                }}>📷</button>
              </div>

              {/* Category pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{
                    padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, transition: "all 0.18s",
                    background: cat === c
                      ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`
                      : "rgba(255,255,255,0.65)",
                    color: cat === c ? "#fff" : "#374151",
                    boxShadow: cat === c
                      ? `0 4px 14px ${ACCENT}40`
                      : "0 1px 4px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.8)",
                    backdropFilter: "blur(10px)",
                  }}>{c}</button>
                ))}
              </div>

              {/* Products grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {filteredProds.map(p => {
                  const inCart   = cart.find(i => i.id === p.id)?.qty || 0;
                  const oos      = p.stock === 0;
                  const lowStock = p.stock > 0 && p.stock < 10;
                  return (
                    <div key={p.id} onClick={() => addToCart(p)} style={{
                      ...glass.card,
                      borderRadius: 16, padding: "14px 16px", cursor: oos ? "not-allowed" : "pointer",
                      position: "relative", transition: "all 0.18s",
                      background: inCart > 0
                        ? `linear-gradient(135deg, ${ACCENT}18, ${ACCENT2}10)`
                        : oos ? "rgba(254,242,242,0.75)" : "rgba(255,255,255,0.72)",
                      border: inCart > 0
                        ? `1.5px solid ${ACCENT}50`
                        : oos ? "1px solid #fecaca" : "1px solid rgba(255,255,255,0.9)",
                      boxShadow: inCart > 0
                        ? `0 4px 20px ${ACCENT}20`
                        : "0 2px 12px rgba(0,0,0,0.05)",
                    }}>
                      {/* Stock badge */}
                      <div style={{
                        position: "absolute", top: 10, right: 10, fontSize: 10, fontWeight: 700,
                        background: oos ? "#fef2f2" : lowStock ? "#fffbeb" : "#f0fdf4",
                        color: oos ? "#ef4444" : lowStock ? "#d97706" : "#16a34a",
                        border: `1px solid ${oos ? "#fecaca" : lowStock ? "#fde68a" : "#bbf7d0"}`,
                        padding: "2px 8px", borderRadius: 20,
                      }}>{oos ? "শেষ" : `${p.stock} left`}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4, fontWeight: 500 }}>{p.cat}</div>
                      <div style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 13, marginBottom: 8, paddingRight: 48, lineHeight: 1.35 }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: ACCENT, fontWeight: 800, fontSize: 16 }}>{p.price} ৳</span>
                        {inCart > 0 && (
                          <span style={{
                            background: `${ACCENT}20`, color: ACCENT,
                            borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                          }}>×{inCart}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart panel */}
            <div style={{
              width: 320, flexShrink: 0, display: "flex", flexDirection: "column",
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderLeft: "1px solid rgba(255,255,255,0.85)",
              padding: 20,
              boxShadow: "-4px 0 24px rgba(99,102,241,0.06)",
            }}>
              {/* Customer */}
              <div style={{
                ...glass.card, borderRadius: 14, padding: "12px 14px", marginBottom: 16,
              }}>
                <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>👤 CUSTOMER</div>
                <select style={{
                  width: "100%", background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(229,231,235,1)", borderRadius: 10,
                  color: "#374151", padding: "8px 10px", fontSize: 12, outline: "none",
                }}>
                  <option value="">Walk-in Customer</option>
                  <option value="1">Karim (বাকি: ৳ 450)</option>
                  <option value="2">Rina Begum</option>
                </select>
              </div>

              <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>
                🛒 CART ({cart.length} items)
              </div>

              {/* Cart items */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {cart.length === 0 && (
                  <div style={{ textAlign: "center", color: "#d1d5db", marginTop: 40, fontSize: 13 }}>
                    <div style={{ fontSize: 38, marginBottom: 8 }}>🛒</div>Cart খালি আছে
                  </div>
                )}
                {cart.map(item => (
                  <div key={item.id} style={{
                    ...glass.card, borderRadius: 12, padding: "10px 12px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#1e1b4b", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{item.name}</div>
                      <div style={{ color: ACCENT, fontSize: 12, fontWeight: 600 }}>{item.price} ৳ × {item.qty}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <button onClick={() => changeQty(item.id, -1)} style={{
                        width: 26, height: 26, borderRadius: 8, background: "#f3f4f6",
                        border: "1px solid #e5e7eb", color: "#374151",
                        cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>−</button>
                      <span style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 13, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                        border: "none", color: "#fff",
                        cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 2px 8px ${ACCENT}40`,
                      }}>+</button>
                    </div>
                    <div style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 13, minWidth: 55, textAlign: "right" }}>
                      {item.price * item.qty} ৳
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals + checkout */}
              <div style={{ paddingTop: 16, borderTop: "1px solid rgba(229,231,235,0.6)", marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  ...glass.card, borderRadius: 14, padding: "14px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ color: "#6b7280", fontSize: 14, fontWeight: 500 }}>মোট মূল্য</span>
                  <span style={{ color: "#1e1b4b", fontSize: 24, fontWeight: 900 }}>{cartTotal} ৳</span>
                </div>
                <div style={{
                  ...glass.card, borderRadius: 12, padding: "11px 14px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ color: "#9ca3af" }}>💵</span>
                  <input type="number" placeholder={`${cartTotal} ৳ (পুরো টাকা)`} style={{
                    flex: 1, background: "none", border: "none", outline: "none", color: "#374151", fontSize: 14,
                  }} />
                </div>
                <button style={{
                  padding: "14px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff", fontWeight: 800, fontSize: 15,
                  boxShadow: "0 6px 20px rgba(34,197,94,0.35)",
                  letterSpacing: 0.3,
                }}>✅ Checkout করুন</button>
              </div>
            </div>
          </div>
        )}

        {/* OTHER pages placeholder */}
        {page !== "pos" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              ...glass.card, borderRadius: 24,
              textAlign: "center", padding: "48px 56px",
            }}>
              <div style={{ fontSize: 58, marginBottom: 14 }}>
                {NAV_ITEMS.concat(ADMIN_ITEMS).find(i => i.key === page)?.icon}
              </div>
              <div style={{ color: "#1e1b4b", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                {NAV_ITEMS.concat(ADMIN_ITEMS).find(i => i.key === page)?.label}
              </div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>
                এই page-এর নতুন UI apply হবে পুরো project-এ
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
