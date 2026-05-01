import { useEffect, useState } from "react";
import { API } from "./api";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  // =========================
  // LOAD PRODUCTS
  // =========================
  useEffect(() => {
    API.get("/products")
      .then(res => setProducts(res.data))
      .catch(err => console.log(err));
  }, []);

  // =========================
  // ADD TO CART
  // =========================
  const addToCart = (product) => {
    const exist = cart.find(i => i.id === product.id);

    if (exist) {
      setCart(cart.map(i =>
        i.id === product.id
          ? { ...i, qty: i.qty + 1 }
          : i
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // =========================
  // INCREASE
  // =========================
  const increase = (id) => {
    setCart(cart.map(i =>
      i.id === id ? { ...i, qty: i.qty + 1 } : i
    ));
  };

  // =========================
  // DECREASE
  // =========================
  const decrease = (id) => {
    setCart(cart.map(i =>
      i.id === id && i.qty > 1
        ? { ...i, qty: i.qty - 1 }
        : i
    ));
  };

  // =========================
  // REMOVE
  // =========================
  const remove = (id) => {
    setCart(cart.filter(i => i.id !== id));
  };

  // =========================
  // TOTAL
  // =========================
  const total = cart.reduce(
    (sum, i) => sum + i.sell_price * i.qty,
    0
  );

  // =========================
  // CHECKOUT
  // =========================
  const checkout = () => {
    API.post("/sales", {
      items: cart,
      total,
      paid_amount: total
    })
    .then(() => {
      alert("Sale Completed ✅");
      setCart([]);
    })
    .catch(err => console.log(err));
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ display: "flex", padding: 10, gap: 20 }}>

      {/* PRODUCTS */}
      <div style={{ width: "45%" }}>
        <h2>📦 Products</h2>

        {products.map(p => (
          <div key={p.id} style={{
            border: "1px solid #ddd",
            padding: 10,
            marginBottom: 10
          }}>
            <b>{p.name}</b>
            <p>{p.sell_price} ৳</p>

            <button onClick={() => addToCart(p)}>
              ➕ Add
            </button>
          </div>
        ))}
      </div>

      {/* CART */}
      <div style={{ width: "45%" }}>
        <h2>🛒 Cart</h2>

        {cart.map(i => (
          <div key={i.id} style={{
            borderBottom: "1px solid #ccc",
            padding: 10
          }}>
            <b>{i.name}</b>

            <div>
              <button onClick={() => decrease(i.id)}>-</button>
              <span> {i.qty} </span>
              <button onClick={() => increase(i.id)}>+</button>
            </div>

            <p>Subtotal: {i.qty * i.sell_price}</p>

            <button onClick={() => remove(i.id)}>
              ❌ Remove
            </button>
          </div>
        ))}

        <hr />

        <h3>💰 Total: {total} ৳</h3>

        <button onClick={checkout}>
          ✅ Checkout
        </button>
      </div>

    </div>
  );
}
