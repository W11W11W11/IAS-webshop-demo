# Bean & Byte – demo webshop

A static demo webshop (HTML, CSS, JavaScript – no backend) for testing web analytics
with Google Analytics 4 and Matomo. Runs on GitHub Pages.

## Pages
| File | What it does |
|---|---|
| `index.html` | Product grid, brochure download, newsletter form |
| `product.html?id=…` | Product details, add to cart |
| `cart.html` | Change quantities, remove items |
| `checkout.html` | Shipping form + fake payment choice |
| `thankyou.html` | Order confirmation |

The cart lives in the browser's localStorage. Nothing is sent anywhere.

## Built-in tracking hooks
Every interaction calls `track()` in `app.js` and logs it to the browser console
(F12 → Console). As soon as the GA4 and Matomo snippets are on the pages, the same
events are forwarded to both tools automatically.

| Event | When |
|---|---|
| `view_item_list` | Home page loads |
| `select_item` | Product card clicked |
| `view_item` | Product page loads |
| `add_to_cart` | "Add to cart" clicked |
| `remove_from_cart` | Item removed in cart |
| `view_cart` | Cart page loads |
| `begin_checkout` | Checkout page loads |
| `purchase` | Order placed |
| `file_download` | Brochure downloaded |
| `newsletter_signup` | Newsletter form submitted |

## Put it on GitHub Pages
1. Create a free account at github.com.
2. Click **New repository**, name it e.g. `webshop-demo`, set it to **Public**, create it.
3. Click **uploading an existing file**, drag in all files from this folder
   (not the folder itself – `index.html` must be at the top level), then **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment* choose
   **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
5. After about a minute the site is live at
   `https://<your-username>.github.io/webshop-demo/`.

Every new commit redeploys the site automatically.

## Run it locally
Open `index.html` in a browser, or from this folder run:

```
python -m http.server 8000
```

and open http://localhost:8000.
