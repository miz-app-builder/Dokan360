import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   🔴 SUPABASE CONFIG
========================= */
const supabase = createClient(
  "https://YOUR_PROJECT.supabase.co",
  "YOUR_SUPABASE_ANON_KEY"
);

/* =========================
   🟢 TEST ROUTE
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

// ADD product
app.post("/products", async (req, res) => {
  const { name, sell_price, buy_price, stock, barcode } = req.body;

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name,
        sell_price,
        buy_price,
        stock,
        barcode,
      },
    ])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

/* =========================
   💰 SALES API (CORE LOGIC)
========================= */

app.post("/sales", async (req, res) => {
  const { items, total, customer_id, paid_amount } = req.body;

  try {
    // 1️⃣ Create sale
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([{ total_amount: total }])
      .select()
      .single();

    if (saleError) throw saleError;

    // 2️⃣ Loop items
    for (let item of items) {
      // sale_items insert
      await supabase.from("sale_items").insert([
        {
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.qty,
          price: item.price,
        },
      ]);

      // stock log
      await supabase.from("stock_logs").insert([
        {
          product_id: item.product_id,
          change_qty: -item.qty,
          type: "OUT",
        },
      ]);

      // stock decrease
      await supabase.rpc("decrease_stock", {
        pid: item.product_id,
        qty: item.qty,
      });
    }

    // 3️⃣ Baki calculation
    const due = total - paid_amount;

    if (customer_id && due > 0) {
      await supabase.rpc("update_due", {
        cid: customer_id,
        new_due: due,
      });

      await supabase.from("payments").insert([
        {
          customer_id,
          amount: paid_amount,
        },
      ]);
    }

    res.json({
      success: true,
      message: "Sale completed successfully",
      sale_id: sale.id,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* =========================
   🚀 START SERVER
========================= */

app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 POS Backend running on port 3000");
});