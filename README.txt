IRONWOOD 3D PRODUCT DEMO (STATIC)

What's in here:
- index.html
- styles.css
- app.js
- models/
    - models.json  (list of models)
    - ironwood-demo.glb  (your current model)
- assets/
    - logo.png (optional: drop your website logo here to match your branding even more)

FASTEST FREE HOSTING (Netlify Drop):
1) Go to Netlify and use Deploy / drag-and-drop.
2) Drag THIS WHOLE FOLDER in (or the ZIP).
3) You'll get a shareable URL instantly.

LOCAL PREVIEW (optional):
If you have Python installed:
  python -m http.server 8000
Then open:
  http://localhost:8000

ADD ANOTHER MODEL:
1) Put your new .glb into /models (example: new-product.glb)
2) Edit /models/models.json and add an entry, like:

[
  {
    "id": "demo",
    "title": "Demo Model",
    "description": "Uploaded from Polycam (.glb). Rotate, zoom, and inspect details.",
    "src": "models/ironwood-demo.glb"
  },
  {
    "id": "new",
    "title": "New Product",
    "description": "Short description here.",
    "src": "models/new-product.glb"
  }
]

That's it.
