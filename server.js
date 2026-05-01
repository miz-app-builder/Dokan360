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
  const { name, sell_price, buy_price, stock, barcode } = req.body;

  const { data, error } = await supabase
    .from("products")
    .insert([{ name, sell_price, buy_price, stock, barcode }])
    .select();

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

/* =========================
   💰 SALES API
========================= */

app.post("/sales", async (req, res) => {
  const { items, total, customer_id, paid_amount } = req.body;

  try {
    // 1. Create sale record
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([{
        total_amount: total,
        customer_id: customer_id || null,
        paid_amount: paid_amount || total,
      }])
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
