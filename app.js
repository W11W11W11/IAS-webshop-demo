/* Bean & Byte – demo webshop (static, no backend)
 * Cart is stored in the browser (localStorage). No real orders or payments.
 */

const PRODUCTS = [
  { id: "house-blend", name: "House Blend", price: 9.9, emoji: "☕", color: "#ead7c3", category: "Coffee beans",
    description: "Our everyday roast. Chocolatey, round and easy to love. 250 g whole beans." },
  { id: "ethiopia-light", name: "Ethiopia Light Roast", price: 12.5, emoji: "🌸", color: "#f3dfe3", category: "Coffee beans",
    description: "Floral and fruity single origin with notes of jasmine and blueberry. 250 g." },
  { id: "espresso-dark", name: "Espresso Dark", price: 11.0, emoji: "🔥", color: "#e3d2c8", category: "Coffee beans",
    description: "Bold, low-acid dark roast built for espresso machines. 250 g." },
  { id: "mug", name: "Stoneware Mug", price: 14.0, emoji: "🫖", color: "#d9e6ea", category: "Accessories",
    description: "Hand-glazed 300 ml mug. Dishwasher safe." },
  { id: "pour-over", name: "Pour-Over Dripper", price: 24.0, emoji: "⏳", color: "#e2e8d5", category: "Equipment",
    description: "Ceramic dripper for clean, bright filter coffee. Includes 40 filters." },
  { id: "grinder", name: "Hand Grinder", price: 39.0, emoji: "⚙️", color: "#e6e1ef", category: "Equipment",
    description: "Steel burr hand grinder with 18 grind settings. Fits in a backpack." }
];

const CURRENCY = "EUR";
const CART_KEY = "bb-cart";
const ORDER_KEY = "bb-last-order";

/* ---------- Tracking hook ----------
 * Every interaction in the shop calls track().
 * Right now it only logs to the console. Once the GA4 and Matomo
 * snippets are added to the pages, events are forwarded automatically.
 */
function track(name, params = {}) {
  console.log("[track]", name, params);
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
  if (Array.isArray(window._paq)) {
    const evt = ["trackEvent", "Shop", name];
    const label = params.item_id || params.transaction_id || params.file_name || params.label;
    if (label) evt.push(String(label));
    if (typeof params.value === "number") { if (!label) evt.push(""); evt.push(params.value); }
    window._paq.push(evt);
  }
}

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const money = (n) => n.toLocaleString("en-IE", { style: "currency", currency: CURRENCY });
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage unavailable */ }
  updateCartCount();
}
const cartCount = (cart) => cart.reduce((s, i) => s + i.qty, 0);
const cartTotal = (cart) => cart.reduce((s, i) => s + (findProduct(i.id)?.price || 0) * i.qty, 0);

function updateCartCount() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = cartCount(loadCart())));
}

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

function addToCart(id, qty = 1) {
  const p = findProduct(id);
  if (!p) return;
  const cart = loadCart();
  const line = cart.find((i) => i.id === id);
  if (line) line.qty += qty; else cart.push({ id, qty });
  saveCart(cart);
  track("add_to_cart", { item_id: p.id, item_name: p.name, quantity: qty, value: p.price * qty, currency: CURRENCY });
  toast(`${p.name} added to cart`);
}

function productTile(p) {
  return `<div class="tile" style="background:${p.color}" aria-hidden="true">${p.emoji}</div>`;
}

/* ---------- Pages ---------- */
function renderHome() {
  const grid = $("#product-grid");
  grid.innerHTML = PRODUCTS.map((p) => `
    <article class="card">
      <a href="product.html?id=${p.id}" class="card-link" data-select-item="${p.id}">
        ${productTile(p)}
        <p class="category">${p.category}</p>
        <h3>${p.name}</h3>
      </a>
      <div class="card-foot">
        <span class="price">${money(p.price)}</span>
        <button class="btn btn-small" data-add-to-cart="${p.id}">Add to cart</button>
      </div>
    </article>`).join("");
  track("view_item_list", { item_list_name: "Home" });
}

function renderProduct() {
  const id = new URLSearchParams(location.search).get("id");
  const p = findProduct(id);
  const root = $("#product");
  if (!p) {
    root.innerHTML = `<p>Product not found. <a href="index.html">Back to the shop</a></p>`;
    return;
  }
  document.title = `${p.name} – Bean & Byte`;
  root.innerHTML = `
    <div class="product">
      ${productTile(p)}
      <div>
        <p class="category">${p.category}</p>
        <h1>${p.name}</h1>
        <p class="price big">${money(p.price)}</p>
        <p>${p.description}</p>
        <div class="buy-row">
          <label>Qty <input type="number" id="qty" min="1" max="20" value="1"></label>
          <button class="btn" id="add">Add to cart</button>
        </div>
        <p><a href="index.html">← Continue shopping</a></p>
      </div>
    </div>`;
  $("#add").addEventListener("click", () => {
    const qty = Math.max(1, Math.min(20, parseInt($("#qty").value, 10) || 1));
    addToCart(p.id, qty);
  });
  track("view_item", { item_id: p.id, item_name: p.name, value: p.price, currency: CURRENCY });
}

function renderCart() {
  const root = $("#cart");
  const cart = loadCart();
  if (cart.length === 0) {
    root.innerHTML = `<p class="empty">Your cart is empty. <a href="index.html">Go shopping</a></p>`;
    return;
  }
  root.innerHTML = `
    <table class="cart-table">
      <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
      <tbody>
        ${cart.map((i) => {
          const p = findProduct(i.id);
          if (!p) return "";
          return `<tr>
            <td><a href="product.html?id=${p.id}">${p.emoji} ${p.name}</a></td>
            <td>${money(p.price)}</td>
            <td><input type="number" min="1" max="20" value="${i.qty}" data-qty="${p.id}" aria-label="Quantity"></td>
            <td>${money(p.price * i.qty)}</td>
            <td><button class="link" data-remove="${p.id}">Remove</button></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
    <div class="cart-summary">
      <p>Total: <strong>${money(cartTotal(cart))}</strong></p>
      <a class="btn" href="checkout.html" id="to-checkout">Proceed to checkout</a>
    </div>`;

  root.querySelectorAll("[data-qty]").forEach((input) =>
    input.addEventListener("change", () => {
      const c = loadCart();
      const line = c.find((x) => x.id === input.dataset.qty);
      line.qty = Math.max(1, Math.min(20, parseInt(input.value, 10) || 1));
      saveCart(c);
      renderCart();
    })
  );
  root.querySelectorAll("[data-remove]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.remove;
      saveCart(loadCart().filter((x) => x.id !== id));
      track("remove_from_cart", { item_id: id });
      renderCart();
    })
  );
  track("view_cart", { value: cartTotal(cart), currency: CURRENCY });
}

function renderCheckout() {
  const cart = loadCart();
  if (cart.length === 0) { location.href = "cart.html"; return; }
  const total = cartTotal(cart);
  $("#order-summary").innerHTML = `
    <ul class="summary-list">
      ${cart.map((i) => { const p = findProduct(i.id); return `<li><span>${i.qty} × ${p.name}</span><span>${money(p.price * i.qty)}</span></li>`; }).join("")}
    </ul>
    <p class="summary-total"><span>Total</span><strong>${money(total)}</strong></p>`;

  track("begin_checkout", { value: total, currency: CURRENCY });

  $("#checkout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const order = {
      id: "BB-" + Date.now().toString().slice(-6),
      items: cart,
      total,
      name: form.name.value.trim(),
      payment: form.payment.value
    };
    try { sessionStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch (err) {}
    track("purchase", { transaction_id: order.id, value: total, currency: CURRENCY, payment_type: order.payment });
    saveCart([]);
    location.href = "thankyou.html";
  });
}

function renderThanks() {
  let order = null;
  try { order = JSON.parse(sessionStorage.getItem(ORDER_KEY)); } catch (e) {}
  const root = $("#thanks");
  if (!order) {
    root.innerHTML = `<p>No recent order found. <a href="index.html">Back to the shop</a></p>`;
    return;
  }
  root.innerHTML = `
    <h1>Thank you, ${order.name.split(" ")[0] || "friend"}!</h1>
    <p>Your demo order <strong>${order.id}</strong> over <strong>${money(order.total)}</strong> was received.</p>
    <p class="note">This is a demo shop – nothing will be shipped or charged.</p>
    <a class="btn" href="index.html">Back to the shop</a>`;
}

/* ---------- Global listeners ---------- */
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add-to-cart]");
  if (add) { addToCart(add.dataset.addToCart); return; }

  const sel = e.target.closest("[data-select-item]");
  if (sel) track("select_item", { item_id: sel.dataset.selectItem });

  const dl = e.target.closest("[data-download]");
  if (dl) track("file_download", { file_name: dl.dataset.download });
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest("[data-newsletter]");
  if (!form) return;
  e.preventDefault();
  track("newsletter_signup", { label: "footer" });
  form.innerHTML = `<p>Thanks for subscribing! (demo – no email is sent)</p>`;
});

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  const page = document.body.dataset.page;
  ({ home: renderHome, product: renderProduct, cart: renderCart, checkout: renderCheckout, thanks: renderThanks }[page] || (() => {}))();
});
