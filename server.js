import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const JWT_SECRET = process.env.SESSION_SECRET || "dokan360_secret_key";

/* =========================
   SUPABASE CONFIG
========================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("POS Backend Running ✅");
});

/* =========================
   🔐 AUTH MIDDLEWARE (Phase 5.3)
========================= */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "লগইন করুন।" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token মেয়াদ শেষ। আবার লগইন করুন।" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "শুধু Admin এই কাজ করতে পারবেন।" });
  }
  next();
};

/* =========================
   🔐 AUTH ROUTES (Phase 5.2) — Public
========================= */

// First-time setup — create admin if no users exist
app.post("/auth/setup", async (req, res) => {
  const { data: existing } = await supabase.from("users").select("id").limit(1);
  if (existing && existing.length > 0) {
    return res.status(400).json({ error: "Setup আগেই সম্পন্ন হয়েছে।" });
  }
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username ও password দিন।" });
  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from("users")
    .insert([{ username: username.trim(), password_hash: hash, role: "admin" }])
    .select("id, username, role")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, user: data, message: "Admin তৈরি হয়েছে! এখন লগইন করুন।" });
});

// Login
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username ও password দিন।" });

  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, password_hash, role")
    .eq("username", username.trim())
    .single();

  if (error || !user) return res.status(401).json({ error: "Username বা password ভুল।" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Username বা password ভুল।" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Check token / get current user
app.get("/auth/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

/* =========================
   ⚙️ PUBLIC SETTINGS (no auth needed — for display)
========================= */
app.get("/settings/public", async (req, res) => {
  const publicKeys = ["shop_name", "shop_logo", "shop_address", "shop_phone", "currency_symbol", "language"];
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", publicKeys);
  if (error) return res.status(500).json({ error: error.message });
  const map = {};
  (data || []).forEach(r => { map[r.key] = r.value; });
  res.json(map);
});

/* =========================
   🔐 PROTECTED ROUTES START (Phase 5.4)
   সব route এর নিচে authMiddleware apply হবে
========================= */
app.use(authMiddleware);

/* =========================
   📦 PRODUCTS API
========================= */

// GET all products
app.get("/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// SEARCH products by name or barcode
app.get("/products/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.%${q}%,barcode.eq.${q}`);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ADD product
app.post("/products", async (req, res) => {
  const { name, sell_price, buy_price, stock, barcode, category_id } = req.body;
  if (!name) return res.status(400).json({ error: "নাম দেওয়া আবশ্যক।" });

  const { data, error } = await supabase
    .from("products")
    .insert([{ name, sell_price, buy_price, stock: stock || 0, barcode, category_id: category_id || null }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// EDIT product
app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, sell_price, buy_price, stock, barcode, category_id } = req.body;

  const { data, error } = await supabase
    .from("products")
    .update({ name, sell_price, buy_price, stock, barcode, category_id: category_id || null })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE product
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

/* =========================
   🗂️ CATEGORIES API
========================= */

// GET all categories
app.get("/categories", async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ADD category
app.post("/categories", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "নাম দেওয়া আবশ্যক।" });

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// EDIT category
app.put("/categories/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "নাম দেওয়া আবশ্যক।" });

  const { data, error } = await supabase
    .from("categories")
    .update({ name: name.trim() })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE category
app.delete("/categories/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

/* =========================
   👥 CUSTOMERS API
========================= */

// GET all customers
app.get("/customers", async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, due_amount")
    .order("name");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST — নতুন customer তৈরি (Phase 2.1)
app.post("/customers", async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "নাম দেওয়া আবশ্যক।" });

  // Duplicate phone check
  if (phone && phone.trim()) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone.trim())
      .maybeSingle();

    if (existing) return res.status(400).json({ error: "এই ফোন নম্বর দিয়ে আগে থেকেই customer আছে।" });
  }

  const { data, error } = await supabase
    .from("customers")
    .insert([{ name: name.trim(), phone: phone?.trim() || null, due_amount: 0 }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// EDIT customer
app.put("/customers/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "নাম দেওয়া আবশ্যক।" });

  const { data, error } = await supabase
    .from("customers")
    .update({ name: name.trim(), phone: phone?.trim() || null })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE customer
app.delete("/customers/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET — customer ledger (Phase 2.2)
app.get("/customers/:id/ledger", async (req, res) => {
  const { id } = req.params;

  // Customer info
  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("id, name, phone, due_amount")
    .eq("id", id)
    .single();

  if (custErr || !customer) return res.status(404).json({ error: "Customer পাওয়া যায়নি।" });

  // Sales by this customer (requires customer_id column in sales table)
  const { data: sales, error: saleErr } = await supabase
    .from("sales")
    .select("id, total_amount, paid_amount, customer_id, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const salesList = saleErr ? [] : (sales || []);

  // Payments by this customer
  const { data: payments, error: payErr } = await supabase
    .from("payments")
    .select("id, amount, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  if (payErr) return res.status(500).json({ error: payErr.message });

  const totalSale    = salesList.reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalPaid    = salesList.reduce((s, r) => s + (r.paid_amount  || 0), 0);
  const totalPayment = (payments || []).reduce((s, r) => s + (r.amount || 0), 0);

  res.json({
    customer,
    summary: { totalSale, totalPaid, totalPayment, due: customer.due_amount },
    sales: salesList,
    payments: payments || [],
    schema_warning: saleErr ? "sales table এ customer_id column নেই। নিচের SQL চালান।" : null,
  });
});

/* =========================
   📦 INVENTORY / STOCK API
========================= */

// Phase 3.1 — POST /stock/in — stock কেনা/restock রেকর্ড করা
app.post("/stock/in", async (req, res) => {
  const { product_id, quantity, cost_price, note } = req.body;
  if (!product_id) return res.status(400).json({ error: "product_id দেওয়া আবশ্যক।" });
  if (!quantity || quantity <= 0) return res.status(400).json({ error: "সঠিক পরিমাণ দিন।" });

  // Get current product
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id, name, stock")
    .eq("id", product_id)
    .single();

  if (prodErr || !product) return res.status(404).json({ error: "Product পাওয়া যায়নি।" });

  // Insert stock log
  const { error: logErr } = await supabase
    .from("stock_logs")
    .insert([{
      product_id,
      change_qty: quantity,
      type: "IN",
      note: note || null,
      cost_price: cost_price || null,
    }]);

  if (logErr) return res.status(500).json({ error: logErr.message });

  // Update product stock
  const newStock = (product.stock || 0) + parseInt(quantity);
  const { error: updateErr } = await supabase
    .from("products")
    .update({ stock: newStock, buy_price: cost_price || undefined })
    .eq("id", product_id);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({ success: true, product_name: product.name, new_stock: newStock });
});

// Phase 3.2 — GET /stock/logs — সব stock movement দেখা
app.get("/stock/logs", async (req, res) => {
  const { product_id, type, limit: lim } = req.query;

  let query = supabase
    .from("stock_logs")
    .select("id, product_id, change_qty, type, note, cost_price, created_at, products(name)")
    .order("created_at", { ascending: false })
    .limit(parseInt(lim) || 200);

  if (product_id) query = query.eq("product_id", product_id);
  if (type) query = query.eq("type", type.toUpperCase());

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Phase 3.6 — POST /stock/adjust — manually stock সংশোধন
app.post("/stock/adjust", async (req, res) => {
  const { product_id, new_stock, reason } = req.body;
  if (!product_id) return res.status(400).json({ error: "product_id দেওয়া আবশ্যক।" });
  if (new_stock === undefined || new_stock < 0) return res.status(400).json({ error: "সঠিক stock পরিমাণ দিন।" });

  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id, name, stock")
    .eq("id", product_id)
    .single();

  if (prodErr || !product) return res.status(404).json({ error: "Product পাওয়া যায়নি।" });

  const diff = parseInt(new_stock) - (product.stock || 0);

  // Log the adjustment
  const { error: logErr } = await supabase
    .from("stock_logs")
    .insert([{
      product_id,
      change_qty: diff,
      type: "ADJUST",
      note: reason || "Manual adjustment",
    }]);

  if (logErr) return res.status(500).json({ error: logErr.message });

  // Update stock
  const { error: updateErr } = await supabase
    .from("products")
    .update({ stock: parseInt(new_stock) })
    .eq("id", product_id);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({ success: true, product_name: product.name, old_stock: product.stock, new_stock: parseInt(new_stock), diff });
});

/* =========================
   📊 REPORTS API (Module 4)
========================= */

// Phase 4.1 — GET /reports/daily — দৈনিক বিক্রয় রিপোর্ট
app.get("/reports/daily", async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const from = `${targetDate}T00:00:00.000Z`;
  const to   = `${targetDate}T23:59:59.999Z`;

  // Sales in date range
  const { data: sales, error: saleErr } = await supabase
    .from("sales")
    .select("id, total_amount, paid_amount, created_at")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false });

  if (saleErr) return res.status(500).json({ error: saleErr.message });

  // Sale items for those sales (for profit calc)
  const saleIds = (sales || []).map(s => s.id);
  let profitData = 0;

  if (saleIds.length > 0) {
    const { data: items } = await supabase
      .from("sale_items")
      .select("quantity, price, products(buy_price)")
      .in("sale_id", saleIds);

    if (items) {
      profitData = items.reduce((sum, item) => {
        const buyPrice = item.products?.buy_price || 0;
        return sum + ((item.price - buyPrice) * item.quantity);
      }, 0);
    }
  }

  const totalSales    = (sales || []).length;
  const totalIncome   = (sales || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalCollected = (sales || []).reduce((s, r) => s + (r.paid_amount || 0), 0);
  const totalDue      = totalIncome - totalCollected;

  res.json({
    date: targetDate,
    totalSales,
    totalIncome,
    totalCollected,
    totalDue,
    totalProfit: profitData,
    sales: sales || [],
  });
});

// Phase 4.2 — GET /reports/profit — মুনাফা রিপোর্ট
app.get("/reports/profit", async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const dateTo   = to   || new Date().toISOString().slice(0, 10);

  const { data: items, error } = await supabase
    .from("sale_items")
    .select("quantity, price, products(name, buy_price), sales(created_at)")
    .gte("sales.created_at", `${dateFrom}T00:00:00.000Z`)
    .lte("sales.created_at", `${dateTo}T23:59:59.999Z`);

  if (error) return res.status(500).json({ error: error.message });

  const filtered = (items || []).filter(i => i.sales !== null);

  const totalRevenue = filtered.reduce((s, i) => s + (i.price * i.quantity), 0);
  const totalCost    = filtered.reduce((s, i) => s + ((i.products?.buy_price || 0) * i.quantity), 0);
  const totalProfit  = totalRevenue - totalCost;

  res.json({
    from: dateFrom,
    to: dateTo,
    totalRevenue,
    totalCost,
    totalProfit,
    itemCount: filtered.length,
  });
});

// Phase 4.3 — GET /reports/products — পণ্যভিত্তিক বিক্রয়
app.get("/reports/products", async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const dateTo   = to   || new Date().toISOString().slice(0, 10);

  const { data: items, error } = await supabase
    .from("sale_items")
    .select("quantity, price, product_id, products(name, buy_price), sales(created_at)")
    .gte("sales.created_at", `${dateFrom}T00:00:00.000Z`)
    .lte("sales.created_at", `${dateTo}T23:59:59.999Z`);

  if (error) return res.status(500).json({ error: error.message });

  const filtered = (items || []).filter(i => i.sales !== null);

  // Group by product
  const map = {};
  for (const item of filtered) {
    const pid = item.product_id;
    if (!map[pid]) {
      map[pid] = {
        product_id: pid,
        name: item.products?.name || "Unknown",
        totalQty: 0,
        totalRevenue: 0,
        totalProfit: 0,
      };
    }
    const buyPrice = item.products?.buy_price || 0;
    map[pid].totalQty     += item.quantity;
    map[pid].totalRevenue += item.price * item.quantity;
    map[pid].totalProfit  += (item.price - buyPrice) * item.quantity;
  }

  const result = Object.values(map).sort((a, b) => b.totalQty - a.totalQty);
  res.json({ from: dateFrom, to: dateTo, products: result });
});

// GET /reports/user-wise — user/seller ভিত্তিক বিক্রয় রিপোর্ট
app.get("/reports/user-wise", async (req, res) => {
  const { from, to, user_id } = req.query;
  const dateFrom = from || new Date().toISOString().slice(0, 10);
  const dateTo   = to   || new Date().toISOString().slice(0, 10);
  const fromDT   = `${dateFrom}T00:00:00.000Z`;
  const toDT     = `${dateTo}T23:59:59.999Z`;

  let salesQ = supabase
    .from("sales")
    .select("id, total_amount, paid_amount, sold_by, created_at, users(id, username, name)")
    .gte("created_at", fromDT)
    .lte("created_at", toDT)
    .order("created_at", { ascending: false });

  if (user_id) salesQ = salesQ.eq("sold_by", user_id);

  const { data: sales, error: sErr } = await salesQ;
  if (sErr) return res.status(500).json({ error: sErr.message });

  // Group by user
  const userMap = {};
  (sales || []).forEach(s => {
    const uid  = s.sold_by || "unknown";
    const uName = s.users?.name || s.users?.username || "Unknown";
    if (!userMap[uid]) {
      userMap[uid] = { user_id: uid, user_name: uName, username: s.users?.username || "", sales_count: 0, total_income: 0, total_collected: 0, total_due: 0, sales: [] };
    }
    const due = (s.total_amount || 0) - (s.paid_amount || 0);
    userMap[uid].sales_count++;
    userMap[uid].total_income    += s.total_amount || 0;
    userMap[uid].total_collected += s.paid_amount  || 0;
    userMap[uid].total_due       += due;
    userMap[uid].sales.push(s);
  });

  const users = Object.values(userMap).sort((a, b) => b.total_income - a.total_income);

  res.json({
    from: dateFrom, to: dateTo,
    total_sales: (sales || []).length,
    total_income: users.reduce((s, u) => s + u.total_income, 0),
    users,
  });
});

// GET /reports/outlet-wise — outlet ভিত্তিক বিক্রয় রিপোর্ট
app.get("/reports/outlet-wise", async (req, res) => {
  const { from, to, outlet_id } = req.query;
  const dateFrom = from || new Date().toISOString().slice(0, 10);
  const dateTo   = to   || new Date().toISOString().slice(0, 10);
  const fromDT   = `${dateFrom}T00:00:00.000Z`;
  const toDT     = `${dateTo}T23:59:59.999Z`;

  // Get all outlets
  const { data: outlets } = await supabase.from("outlets").select("id, name, address");

  // Get users with their outlet
  const { data: allUsers } = await supabase.from("users").select("id, username, name, outlet_id");
  const userOutletMap = {};
  (allUsers || []).forEach(u => { userOutletMap[u.id] = u.outlet_id; });

  // Get sales in range
  let salesQ = supabase
    .from("sales")
    .select("id, total_amount, paid_amount, sold_by, created_at")
    .gte("created_at", fromDT)
    .lte("created_at", toDT);

  const { data: sales, error: sErr } = await salesQ;
  if (sErr) return res.status(500).json({ error: sErr.message });

  // Group by outlet
  const outletMap = {};
  // "No outlet" group
  outletMap["none"] = { outlet_id: null, outlet_name: "Outlet নির্ধারিত নেই", sales_count: 0, total_income: 0, total_collected: 0, total_due: 0 };

  (outlets || []).forEach(o => {
    if (!outlet_id || parseInt(outlet_id) === o.id) {
      outletMap[o.id] = { outlet_id: o.id, outlet_name: o.name, outlet_address: o.address, sales_count: 0, total_income: 0, total_collected: 0, total_due: 0 };
    }
  });

  (sales || []).forEach(s => {
    const oid   = userOutletMap[s.sold_by] || "none";
    const target = outletMap[oid] || outletMap["none"];
    const due    = (s.total_amount || 0) - (s.paid_amount || 0);
    target.sales_count++;
    target.total_income    += s.total_amount || 0;
    target.total_collected += s.paid_amount  || 0;
    target.total_due       += due;
  });

  const result = Object.values(outletMap).filter(o => o.sales_count > 0 || !outlet_id);

  res.json({
    from: dateFrom, to: dateTo,
    outlets: result,
    total_income: result.reduce((s, o) => s + o.total_income, 0),
  });
});

// Phase 4.4 — GET /reports/due — customer বাকির রিপোর্ট
app.get("/reports/due", async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, due_amount")
    .gt("due_amount", 0)
    .order("due_amount", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const totalDue = (data || []).reduce((s, c) => s + (c.due_amount || 0), 0);
  res.json({ customers: data || [], totalDue });
});

/* =========================
   💳 MANUAL PAYMENT API (Phase 2.6)
========================= */

// POST — manual payment receive from customer
app.post("/payments", async (req, res) => {
  const { customer_id, amount, note } = req.body;
  if (!customer_id) return res.status(400).json({ error: "customer_id দেওয়া আবশ্যক।" });
  if (!amount || amount <= 0) return res.status(400).json({ error: "সঠিক পরিমাণ দিন।" });

  // Get current due
  const { data: cust, error: custErr } = await supabase
    .from("customers")
    .select("id, due_amount")
    .eq("id", customer_id)
    .single();

  if (custErr || !cust) return res.status(404).json({ error: "Customer পাওয়া যায়নি।" });
  if (amount > cust.due_amount) {
    return res.status(400).json({ error: `বাকির চেয়ে বেশি নেওয়া যাবে না। বর্তমান বাকি: ${cust.due_amount} ৳` });
  }

  // Insert payment record
  const { error: payErr } = await supabase
    .from("payments")
    .insert([{ customer_id, amount, note: note || null }]);

  if (payErr) return res.status(500).json({ error: payErr.message });

  // Reduce due_amount
  const newDue = Math.max(0, cust.due_amount - amount);
  const { error: updateErr } = await supabase
    .from("customers")
    .update({ due_amount: newDue })
    .eq("id", customer_id);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({ success: true, new_due: newDue });
});

/* =========================
   💰 SALES API
========================= */

app.post("/sales", async (req, res) => {
  const { items, total, customer_id, paid_amount } = req.body;

  try {
    // 1. Create sale record — try with sold_by first, fallback without
    const saleRow = { total_amount: total };
    if (customer_id) saleRow.customer_id = customer_id;
    saleRow.paid_amount = paid_amount || total;
    if (req.user?.id) saleRow.sold_by = req.user.id;

    let sale, saleError;
    ({ data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([saleRow])
      .select()
      .single());

    // If sold_by column doesn't exist yet, retry without it
    if (saleError && saleError.message?.includes("sold_by")) {
      const rowWithout = { ...saleRow };
      delete rowWithout.sold_by;
      ({ data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([rowWithout])
        .select()
        .single());
    }

    if (saleError) throw saleError;

    // 2. Process each item
    for (let item of items) {
      const pid = item.product_id || item.id;
      const qty = item.qty;

      await supabase.from("sale_items").insert([{
        sale_id: sale.id,
        product_id: pid,
        quantity: qty,
        price: item.sell_price || item.price,
      }]);

      await supabase.from("stock_logs").insert([{
        product_id: pid,
        change_qty: -qty,
        type: "OUT",
      }]);

      // Try RPC first, fallback to direct update
      const { error: rpcErr } = await supabase.rpc("decrease_stock", { pid, qty });
      if (rpcErr) {
        const { data: prod } = await supabase.from("products").select("stock").eq("id", pid).single();
        const newStock = Math.max(0, (prod?.stock || 0) - qty);
        await supabase.from("products").update({ stock: newStock }).eq("id", pid);
      }
    }

    // 3. Handle due amount if customer selected
    const due = total - (paid_amount || total);

    if (customer_id && due > 0) {
      // Try RPC first, fallback to direct update
      const { error: dueRpcErr } = await supabase.rpc("update_due", { cid: customer_id, new_due: due });
      if (dueRpcErr) {
        const { data: cust } = await supabase.from("customers").select("due_amount").eq("id", customer_id).single();
        const newDue = (cust?.due_amount || 0) + due;
        await supabase.from("customers").update({ due_amount: newDue }).eq("id", customer_id);
      }

      // Try inserting payment with sale_id, fallback without
      const { error: payErr } = await supabase.from("payments").insert([{
        customer_id, sale_id: sale.id, amount: paid_amount,
      }]);
      if (payErr) {
        await supabase.from("payments").insert([{ customer_id, amount: paid_amount }]);
      }
    }

    res.json({
      success: true,
      message: "Sale completed successfully",
      sale_id: sale.id,
      due,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================
   👤 USER MANAGEMENT API — Admin only
========================= */

const BASE_PROFILE_FIELDS = "id, username, role, is_active, name, father_name, mother_name, present_address, permanent_address, email, phone, blood_group, join_date, reference, emergency_contact, nid_number, photo_url, created_at";
let USER_PROFILE_FIELDS = BASE_PROFILE_FIELDS;
let OUTLET_ID_SUPPORTED = false;

// Check at startup if outlet_id column exists; if not, try to create it
(async () => {
  const { error: checkErr } = await supabase.from("users").select("outlet_id").limit(1);
  if (!checkErr) {
    OUTLET_ID_SUPPORTED = true;
    USER_PROFILE_FIELDS = BASE_PROFILE_FIELDS + ", outlet_id";
    console.log("✅ outlet_id column ready");
  } else {
    // Try to add the column via Supabase RPC if available
    const { error: rpcErr } = await supabase.rpc("run_sql", {
      sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS outlet_id INTEGER REFERENCES outlets(id) ON DELETE SET NULL;"
    });
    if (!rpcErr) {
      OUTLET_ID_SUPPORTED = true;
      USER_PROFILE_FIELDS = BASE_PROFILE_FIELDS + ", outlet_id";
      console.log("✅ outlet_id column created and ready");
    } else {
      console.log("⚠️  outlet_id column missing — outlet assignment will be skipped until column is added.");
    }
  }
})();

// GET all users (with profile summary)
app.get("/users", adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, role, is_active, name, phone, email, photo_url, join_date, created_at")
    .order("created_at");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET single user — full profile
app.get("/users/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("users")
    .select(USER_PROFILE_FIELDS)
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "User পাওয়া যায়নি।" });
  res.json(data);
});

// POST — create user (with profile fields)
app.post("/users", adminOnly, async (req, res) => {
  const { username, password, role, name, email, phone, join_date } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username ও password দিন।" });
  if (!["admin", "seller", "viewer"].includes(role)) return res.status(400).json({ error: "Role ভুল।" });

  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from("users")
    .insert([{
      username: username.trim(),
      password_hash: hash,
      role,
      name: name?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      join_date: join_date || null,
      is_active: true,
    }])
    .select("id, username, role, name, email, phone")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT — update user (role, password, and all profile fields)
app.put("/users/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  const {
    role, password, is_active,
    name, father_name, mother_name,
    present_address, permanent_address,
    email, phone, blood_group,
    join_date, reference, emergency_contact, nid_number, outlet_id,
  } = req.body;

  const updates = {};
  if (role !== undefined)      updates.role = role;
  if (password)                updates.password_hash = await bcrypt.hash(password, 10);
  if (is_active !== undefined) updates.is_active = is_active;
  if (name !== undefined)              updates.name = name;
  if (father_name !== undefined)       updates.father_name = father_name;
  if (mother_name !== undefined)       updates.mother_name = mother_name;
  if (present_address !== undefined)   updates.present_address = present_address;
  if (permanent_address !== undefined) updates.permanent_address = permanent_address;
  if (email !== undefined)             updates.email = email;
  if (phone !== undefined)             updates.phone = phone;
  if (blood_group !== undefined)       updates.blood_group = blood_group;
  if (join_date !== undefined)         updates.join_date = join_date;
  if (reference !== undefined)         updates.reference = reference;
  if (emergency_contact !== undefined) updates.emergency_contact = emergency_contact;
  if (nid_number !== undefined)        updates.nid_number = nid_number;
  if (outlet_id !== undefined && OUTLET_ID_SUPPORTED) updates.outlet_id = outlet_id || null;

  if (!Object.keys(updates).length) return res.status(400).json({ error: "কিছু পরিবর্তন করুন।" });

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select(USER_PROFILE_FIELDS)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST — upload photo (base64)
app.post("/users/:id/photo", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { photo_base64 } = req.body;
  if (!photo_base64) return res.status(400).json({ error: "photo_base64 দেওয়া আবশ্যক।" });

  const { data, error } = await supabase
    .from("users")
    .update({ photo_url: photo_base64 })
    .eq("id", id)
    .select("id, photo_url")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, photo_url: data.photo_url });
});

// DELETE — delete user (cannot delete self)
app.delete("/users/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "নিজেকে delete করা যাবে না।" });
  }
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

/* =========================
   🔐 ROLE PERMISSIONS API — Admin only
========================= */

// GET my permissions (current user's role) — all authenticated users
app.get("/permissions/my", async (req, res) => {
  const role = req.user?.role;
  const { data, error } = await supabase
    .from("role_permissions")
    .select("module, can_view, can_add, can_edit, can_delete")
    .eq("role", role);

  if (error) return res.status(500).json({ error: error.message });

  // Convert array → { module: { can_view, can_add, ... } }
  const map = {};
  (data || []).forEach(p => { map[p.module] = p; });
  res.json(map);
});

// GET all permissions (grouped by role)
app.get("/permissions", adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("*")
    .order("role")
    .order("module");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT — update a single role+module permission row
app.put("/permissions/:role/:module", adminOnly, async (req, res) => {
  const { role, module } = req.params;
  const { can_view, can_add, can_edit, can_delete } = req.body;

  const { data, error } = await supabase
    .from("role_permissions")
    .upsert({
      role, module,
      can_view:   !!can_view,
      can_add:    !!can_add,
      can_edit:   !!can_edit,
      can_delete: !!can_delete,
    }, { onConflict: "role,module" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/* =========================
   ⚙️ SETTINGS API — Module 6
========================= */

// GET all settings (key-value map)
app.get("/settings", async (req, res) => {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value");
  if (error) return res.status(500).json({ error: error.message });

  const map = {};
  (data || []).forEach(r => { map[r.key] = r.value; });
  res.json(map);
});

// PUT — upsert a single setting key
app.put("/settings/:key", adminOnly, async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: "value দেওয়া আবশ্যক।" });

  const { data, error } = await supabase
    .from("settings")
    .upsert({ key, value }, { onConflict: "key" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, key, value: data.value });
});

// PUT — bulk update multiple settings at once
app.put("/settings", adminOnly, async (req, res) => {
  const settings = req.body; // { key: value, key2: value2 }
  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ error: "settings object দিন।" });
  }

  const rows = Object.entries(settings).map(([key, value]) => ({ key, value: String(value) }));
  if (rows.length === 0) return res.status(400).json({ error: "কমপক্ষে একটি setting দিন।" });

  const { error } = await supabase
    .from("settings")
    .upsert(rows, { onConflict: "key" });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, updated: rows.length });
});

/* =========================
   🏪 OUTLETS API — Module 6
========================= */

// GET all outlets
app.get("/outlets", async (req, res) => {
  const { data, error } = await supabase
    .from("outlets")
    .select("*")
    .order("created_at");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST — create new outlet
app.post("/outlets", adminOnly, async (req, res) => {
  const { name, address, phone, is_active } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Outlet নাম দেওয়া আবশ্যক।" });

  const { data, error } = await supabase
    .from("outlets")
    .insert([{ name: name.trim(), address: address || null, phone: phone || null, is_active: is_active !== false }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT — update outlet
app.put("/outlets/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, is_active } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Outlet নাম দেওয়া আবশ্যক।" });

  const { data, error } = await supabase
    .from("outlets")
    .update({ name: name.trim(), address: address || null, phone: phone || null, is_active: is_active !== false })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE — outlet
app.delete("/outlets/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("outlets").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

/* =========================
   🎨 USER DISPLAY PREFS API
   Stored in settings table as user_display_{userId}
========================= */

// GET — load current user's display prefs
app.get("/user/display-prefs", async (req, res) => {
  const key = `user_display_${req.user.id}`;
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  try {
    const prefs = data?.value ? JSON.parse(data.value) : {};
    res.json(prefs);
  } catch {
    res.json({});
  }
});

// PUT — save current user's display prefs
app.put("/user/display-prefs", async (req, res) => {
  const { language, font_size, theme } = req.body;
  const prefs = {};
  if (language)  prefs.language  = language;
  if (font_size) prefs.font_size = font_size;
  if (theme)     prefs.theme     = theme;

  const key = `user_display_${req.user.id}`;

  // Load existing first, then merge
  const { data: existing } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  let merged = {};
  try { merged = existing?.value ? JSON.parse(existing.value) : {}; } catch {}
  merged = { ...merged, ...prefs };

  const { error } = await supabase
    .from("settings")
    .upsert({ key, value: JSON.stringify(merged) }, { onConflict: "key" });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, prefs: merged });
});

/* =========================
   📢 NOTICES
========================= */

// GET /notices/active — no auth required, returns currently live notices
app.get("/notices/active", async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("notices")
      .select("id, text, publish_at, expires_at")
      .eq("is_active", true)
      .lte("publish_at", now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("publish_at", { ascending: false });
    if (error) return res.json({ notices: [] });
    res.json({ notices: data || [] });
  } catch { res.json({ notices: [] }); }
});

// GET /notices — all notices (admin)
app.get("/notices", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ notices: data || [] });
});

// POST /notices — create notice (admin)
app.post("/notices", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "শুধু Admin পারবে।" });
  const { text, publish_at, duration_hours } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Notice text দিন।" });

  const publishAt = publish_at ? new Date(publish_at).toISOString() : new Date().toISOString();
  let expiresAt = null;
  if (duration_hours && parseFloat(duration_hours) > 0) {
    const exp = new Date(publishAt);
    exp.setHours(exp.getHours() + parseFloat(duration_hours));
    expiresAt = exp.toISOString();
  }

  const { data, error } = await supabase
    .from("notices")
    .insert([{ text: text.trim(), publish_at: publishAt, expires_at: expiresAt,
               is_active: true, created_by: req.user.username }])
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ notice: data });
});

// PUT /notices/:id — update / toggle (admin)
app.put("/notices/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "শুধু Admin পারবে।" });
  const { id } = req.params;
  const { text, publish_at, duration_hours, is_active } = req.body;
  const updates = {};
  if (text !== undefined)      updates.text      = text.trim();
  if (is_active !== undefined) updates.is_active = is_active;
  if (publish_at !== undefined) {
    updates.publish_at = new Date(publish_at).toISOString();
    if (duration_hours && parseFloat(duration_hours) > 0) {
      const exp = new Date(updates.publish_at);
      exp.setHours(exp.getHours() + parseFloat(duration_hours));
      updates.expires_at = exp.toISOString();
    } else if (duration_hours === 0 || duration_hours === "0") {
      updates.expires_at = null;
    }
  }
  const { data, error } = await supabase
    .from("notices").update(updates).eq("id", id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ notice: data });
});

// DELETE /notices/:id (admin)
app.delete("/notices/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "শুধু Admin পারবে।" });
  const { error } = await supabase.from("notices").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 POS Backend running on port 3000");
});
