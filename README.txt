IRONWOOD 3D PRODUCT DEMO — v15
Build: 2026-01-07

What this is
- A static (no server) demo site that:
  1) Shows 3D products (GLB) with rotate/zoom/pan
  2) Includes an Estimate Builder (scopes + line items + export + print/PDF)
  3) Supports Zoho CRM integration via Zoho Flow webhook (optional)

Folder structure (IMPORTANT)
- Upload the *contents* of this folder to your repo ROOT so URLs match:
  index.html
  app.js
  styles.css
  manifest.json
  estimate.html
  estimate.js
  estimate_catalog.json
  estimate_scopes.json
  /models/*
  /assets/* (if present)

GitHub Pages (recommended)
1) Repo Settings → Pages
2) Source: Deploy from a branch (usually main) / root
3) Visit your Pages URL

Clean update steps (prevents stale-cache issues)
1) In your repo, DELETE old files (especially index.html, app.js, styles.css, manifest.json, /models/)
2) Upload ALL files from this package into repo ROOT
3) Commit changes
4) Hard refresh:
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R
   - Or open in Incognito

Quick verification (use your live Pages URL)
- /manifest.json?v=v15  → should show "version": "v15"
- /models/models.json?v=v15 → should list 3 items
- Footer should show: Demo v15 • Build 2026-01-07

Adding a new 3D model
1) Put the .glb file in /models/
2) Add a new entry in /models/models.json with the correct "src": "models/your-file.glb"
3) Commit and refresh

Zoho CRM hookup (optional)
- Use Zoho Flow incoming webhook, then Flow → Zoho CRM "Create Record".
- In Estimate Builder page, set webhook URL via Zoho Setup, then Send to Zoho CRM.

