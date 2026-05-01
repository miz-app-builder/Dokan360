import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

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
    // 1. Create sale record
    // Note: customer_id & paid_amount columns added via SQL migration
    const saleRow = { total_amount: total };
    if (customer_id) saleRow.customer_id = customer_id;
    saleRow.paid_amount = paid_amount || total;

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([saleRow])
      .select()
      .single();

    if (saleError) throw saleError;

    // 2. Insert sale items + update stock
    for (let item of items) {
      await supabase.from("sale_items").insert([{
        sale_id: sale.id,
        product_id: item.product_id || item.id,
        quantity: item.qty,
        price: item.sell_price || item.price,
      }]);

      await supabase.from("stock_logs").insert([{
        product_id: item.product_id || item.id,
        change_qty: -item.qty,
        type: "OUT",
      }]);

      await supabase.rpc("decrease_stock", {
        pid: item.product_id || item.id,
        qty: item.qty,
      });
    }

    // 3. Handle due amount if customer selected
    const due = total - (paid_amount || total);

    if (customer_id && due > 0) {
      await supabase.rpc("update_due", {
        cid: customer_id,
        new_due: due,
      });

      await supabase.from("payments").insert([{
        customer_id,
        sale_id: sale.id,
        amount: paid_amount,
      }]);
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
   🚀 START SERVER
========================= */
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 POS Backend running on port 3000");
});
