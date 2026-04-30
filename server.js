import express from "express";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET PRODUCTS
app.get("/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ADD PRODUCT
app.post("/products", async (req, res) => {
  const { name, sell_price } = req.body;
  const { data, error } = await supabase
    .from("products")
    .insert([{ name, sell_price }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// CREATE SALE
app.post("/sales", async (req, res) => {
  const { items, total } = req.body;

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert([{ total_amount: total }])
    .select()
    .single();

  if (saleError) return res.status(500).json({ error: saleError.message });

  for (let item of items) {
    const { error: itemError } = await supabase.from("sale_items").insert([
      {
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.qty,
        price: item.price,
      },
    ]);

    if (itemError) return res.status(500).json({ error: itemError.message });

    const { error: stockError } = await supabase.rpc("decrease_stock", {
      pid: item.product_id,
      qty: item.qty,
    });

    if (stockError) return res.status(500).json({ error: stockError.message });
  }

  res.json({ success: true });
});

app.listen(3000, () => console.log("Server running on port 3000..."));
