IRONWOOD 3D PRODUCT DEMO (STATIC) — v2 (Product Info + Filters + Share Links)

What's in here:
- index.html
- styles.css
- app.js
- models/
    - models.json  (list of models + product info)
    - ironwood-demo.glb  (your current model)
- assets/
    - logo.png (optional: drop your website logo here to match your branding even more)

FASTEST FREE HOSTING (Netlify Drop):
1) Go to Netlify and use Deploy / drag-and-drop.
2) Drag THIS WHOLE FOLDER in (or the ZIP).
3) You'll get a shareable URL instantly.

GITHUB PAGES:
1) Create a public repo
2) Upload these files/folders
3) Repo Settings → Pages → Deploy from branch → main → /(root)

LOCAL PREVIEW (optional):
If you have Python installed:
  python -m http.server 8000
Then open:
  http://localhost:8000

ADD ANOTHER PRODUCT (.glb):
1) Put your new .glb into /models (example: new-product.glb)
2) Edit /models/models.json and add an entry.

Example entry:

{
  "id": "new-product",
  "title": "Contempra Post (Sample)",
  "subtitle": "42\" guard post • Side-mount",
  "description": "Short description for the demo.",
  "category": "Railings",
  "sku": "IW-CP-042",
  "material": "Steel",
  "finish": "Matte black powder coat",
  "dimensions": "2-5/8\" square • 42\" high",
  "weight": "—",
  "lead_time": "—",
  "price_note": "Call for pricing",
  "tags": ["guard", "matte-black", "side-mount"],
  "highlights": [
    "Clean modern profile",
    "Side-mount plates available",
    "Meets typical guard heights (verify site conditions)"
  ],
  "downloads": [
    { "label": "Spec Sheet (PDF)", "href": "assets/specs/iw-cp-042.pdf" },
    { "label": "Install Notes (PDF)", "href": "assets/specs/iw-install.pdf" }
  ],
  "images": [
    "assets/photos/iw-cp-042-1.jpg",
    "assets/photos/iw-cp-042-2.jpg"
  ],
  "src": "models/new-product.glb",
  "updated": "2026-01-07"
}

SHARE LINKS:
- Click the Share pill (top of the library) to copy a link.
- Links look like: https://your-site/?id=new-product
  (so someone at work can open directly to a specific product)


TROUBLESHOOT:
- If buttons don't work, ensure app.js uploaded and hard refresh (Ctrl+Shift+R).
- If running locally by double-clicking index.html, fetch() will fail; run a local server (python -m http.server).
