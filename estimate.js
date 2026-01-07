/* Ironwood 3D Product Demo • Estimate Builder • v10 • 2026-01-06 */
const VERSION = "v10";
const BUILD_DATE = "2026-01-06";
const STORAGE_KEY = "ironwood_demo_estimate_v1";

function $(id){ return document.getElementById(id); }

function toast(msg){
  const t = $("toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=> t.classList.remove("show"), 1200);
}

function money(n){
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { style:"currency", currency:"CAD" });
}

function clamp(n, a, b){ return Math.min(b, Math.max(a, n)); }

function uuidShort(){
  return Math.random().toString(16).slice(2, 6).toUpperCase() + "-" + Math.random().toString(16).slice(2, 6).toUpperCase();
}

function nowISODate(){
  const d = new Date();
  const pad = (v)=> String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

async function loadCatalog(){
  const res = await fetch(`./estimate_catalog.json?v=${VERSION}`, { cache: "no-store" });
  if(!res.ok) throw new Error("Could not load estimate_catalog.json");
  return await res.json();
}

function encodeShare(obj){
  const s = JSON.stringify(obj);
  // base64url
  const b64 = btoa(unescape(encodeURIComponent(s))).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
  return b64;
}

function decodeShare(b64url){
  const b64 = b64url.replaceAll("-","+").replaceAll("_","/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const s = decodeURIComponent(escape(atob(b64 + pad)));
  return JSON.parse(s);
}

function download(filename, text, mime="application/json"){
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(a.href), 800);
}

function lineRow(line, idx, onChange, onRemove){
  const wrap = document.createElement("div");
  wrap.className = "dl";
  wrap.style.alignItems = "stretch";
  wrap.style.gap = "10px";
  wrap.style.flexDirection = "column";

  const top = document.createElement("div");
  top.style.display = "grid";
  top.style.gridTemplateColumns = "1fr 110px 130px 46px";
  top.style.gap = "10px";
  top.style.alignItems = "center";

  const name = document.createElement("input");
  name.className = "input";
  name.value = line.name || "";
  name.placeholder = "Line name";
  name.addEventListener("input", ()=> onChange(idx, { name: name.value }));

  const qty = document.createElement("input");
  qty.className = "input";
  qty.type = "number";
  qty.step = "1";
  qty.value = line.qty ?? 1;
  qty.addEventListener("input", ()=> onChange(idx, { qty: clamp(Number(qty.value || 0), 0, 999999) }));

  const unit = document.createElement("input");
  unit.className = "input";
  unit.type = "number";
  unit.step = "0.01";
  unit.value = line.unit_price ?? 0;
  unit.addEventListener("input", ()=> onChange(idx, { unit_price: Number(unit.value || 0) }));

  const del = document.createElement("button");
  del.className = "btn";
  del.textContent = "✕";
  del.title = "Remove line";
  del.addEventListener("click", ()=> onRemove(idx));

  top.appendChild(name);
  top.appendChild(qty);
  top.appendChild(unit);
  top.appendChild(del);

  const bottom = document.createElement("div");
  bottom.style.display = "grid";
  bottom.style.gridTemplateColumns = "1fr 240px";
  bottom.style.gap = "10px";

  const note = document.createElement("input");
  note.className = "input";
  note.value = line.note || "";
  note.placeholder = "Note (optional)";
  note.addEventListener("input", ()=> onChange(idx, { note: note.value }));

  const ext = document.createElement("div");
  ext.style.display = "flex";
  ext.style.justifyContent = "space-between";
  ext.style.alignItems = "center";
  ext.style.gap = "10px";
  ext.innerHTML = `<div style="color: rgba(255,255,255,.65); font-size:12px;">Extended</div><div style="font-weight:900;">${money((line.qty||0)*(line.unit_price||0))}</div>`;

  bottom.appendChild(note);
  bottom.appendChild(ext);

  wrap.appendChild(top);
  wrap.appendChild(bottom);
  return wrap;
}

function calcTotals(state){
  const lines = state.lines || [];
  const sub = lines.reduce((a,l)=> a + (Number(l.qty||0)*Number(l.unit_price||0)), 0);
  const markupPct = Number(state.markup_pct || 0);
  const discount = Number(state.discount_amt || 0);
  const taxPct = Number(state.tax_pct || 0);

  const markup = sub * (markupPct/100);
  const preTax = Math.max(0, sub + markup - discount);
  const tax = preTax * (taxPct/100);
  const total = preTax + tax;

  return { sub, markup, discount, preTax, tax, total };
}

function renderTotals(state){
  const t = $("totals");
  if(!t) return;
  const x = calcTotals(state);
  t.innerHTML = "";

  const rows = [
    ["Subtotal", money(x.sub)],
    ["Markup", `${money(x.markup)} (${state.markup_pct||0}%)`],
    ["Discount", `- ${money(x.discount)}`],
    ["Pre-tax", money(x.preTax)],
    ["Tax", `${money(x.tax)} (${state.tax_pct||0}%)`],
    ["Total", money(x.total)]
  ];

  for(const [k,v] of rows){
    const dk = document.createElement("div"); dk.className="k"; dk.textContent=k;
    const dv = document.createElement("div"); dv.className="v"; dv.textContent=v;
    if(k==="Total") dv.style.fontSize="16px";
    t.appendChild(dk); t.appendChild(dv);
  }
}

function getStateFromUI(state){
  state.client = $("clientName")?.value || "";
  state.project = $("projectName")?.value || "";
  state.address = $("siteAddress")?.value || "";
  state.date = $("estDate")?.value || nowISODate();
  state.valid_days = Number($("validDays")?.value || 30);
  state.notes = $("notes")?.value || "";
  state.markup_pct = Number($("markupPct")?.value || 0);
  state.discount_amt = Number($("discountAmt")?.value || 0);
  state.tax_pct = Number($("taxPct")?.value || 0);
  return state;
}

function setUIFromState(state){
  $("clientName").value = state.client || "";
  $("projectName").value = state.project || "";
  $("siteAddress").value = state.address || "";
  $("estDate").value = state.date || nowISODate();
  $("validDays").value = String(state.valid_days ?? 30);
  $("notes").value = state.notes || "";
  $("markupPct").value = String(state.markup_pct ?? 0);
  $("discountAmt").value = String(state.discount_amt ?? 0);
  $("taxPct").value = String(state.tax_pct ?? 5);
}

function renderLines(state){
  const host = $("lines");
  if(!host) return;
  host.innerHTML = "";
  const lines = state.lines || [];
  if(lines.length === 0){
    const empty = document.createElement("div");
    empty.className = "dl";
    empty.innerHTML = `<div><div class="label">No line items yet</div><div class="hint">Add items from the catalog or create a custom line.</div></div>`;
    host.appendChild(empty);
    renderTotals(state);
    return;
  }

  lines.forEach((line, idx)=>{
    host.appendChild(lineRow(line, idx,
      (i, patch)=>{ state.lines[i] = {...state.lines[i], ...patch}; saveDraft(state); renderLines(state); },
      (i)=>{ state.lines.splice(i,1); saveDraft(state); renderLines(state); }
    ));
  });

  renderTotals(state);
}

function saveDraft(state){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

function loadDraft(){
  try{
    const s = localStorage.getItem(STORAGE_KEY);
    if(!s) return null;
    return JSON.parse(s);
  }catch(e){ return null; }
}

function newEstimate(){
  return {
    id: uuidShort(),
    client: "",
    project: "",
    address: "",
    date: nowISODate(),
    valid_days: 30,
    notes: "",
    markup_pct: 0,
    discount_amt: 0,
    tax_pct: 5,
    lines: []
  };
}

async function renderDiagnostics(){
  const versionEl = $("demoVersion");
  const statusEl = $("diagStatus");
  const listEl = $("diagList");

  const baseLine = `Demo ${VERSION} • Build ${BUILD_DATE}`;
  if(versionEl) versionEl.textContent = baseLine;

  try{
    const res = await fetch(`./manifest.json?v=${VERSION}`, { cache: "no-store" });
    if(!res.ok) throw new Error("manifest.json fetch failed");
    const manifest = await res.json();

    if(versionEl) versionEl.textContent = `${baseLine} • Manifest OK (generated ${manifest.generated_at_utc})`;
    if(statusEl) statusEl.textContent = "Checking expected files…";

    const entries = Object.entries(manifest.files || {});
    let ok = 0;
    const lines = [];
    for(const [path, meta] of entries){
      try{
        const r = await fetch(`./${path}?v=${VERSION}`, { method: "GET", cache: "no-store" });
        const good = r.ok;
        if(good) ok++;
        lines.push(`${good ? "✅" : "❌"} ${path}  (${meta.bytes} bytes)`);
      } catch(e) {
        lines.push(`❌ ${path}  (fetch error)`);
      }
    }
    if(statusEl) statusEl.textContent = `${ok} / ${entries.length} files reachable`;
    if(listEl) listEl.textContent = lines.join("\n");
  }catch(e){
    if(versionEl) versionEl.textContent = `${baseLine} • Manifest ERROR`;
    if(statusEl) statusEl.textContent = "Could not load manifest.json (check repo root).";
    if(listEl) listEl.textContent = "";
  }
}

async function main(){
  $("estDate").value = nowISODate();

  let state = loadDraft() || newEstimate();

  // Share link import
  const sp = new URL(window.location.href).searchParams.get("q");
  if(sp){
    try{
      state = decodeShare(sp);
      toast("Loaded from share link");
      saveDraft(state);
    }catch(e){}
  }

  $("estNo").textContent = `(#${state.id})`;
  setUIFromState(state);

  const catalog = await loadCatalog();

  function syncFromUI(){
    getStateFromUI(state);
    $("estNo").textContent = `(#${state.id})`;
    saveDraft(state);
    renderTotals(state);
  }

  ["clientName","projectName","siteAddress","estDate","validDays","notes","markupPct","discountAmt","taxPct"].forEach(id=> {
    $(id).addEventListener("input", syncFromUI);
    $(id).addEventListener("change", syncFromUI);
  });

  $("btnNew").addEventListener("click", ()=> {
    state = newEstimate();
    saveDraft(state);
    setUIFromState(state);
    $("estNo").textContent = `(#${state.id})`;
    renderLines(state);
    toast("New estimate");
  });

  $("btnSave").addEventListener("click", ()=> {
    syncFromUI();
    toast("Saved");
  });

  $("btnClearLines").addEventListener("click", ()=> {
    state.lines = [];
    saveDraft(state);
    renderLines(state);
    toast("Cleared lines");
  });

  $("btnAddCustom").addEventListener("click", ()=> {
    state.lines.push({ name:"Custom line", qty:1, unit_price:0, note:"" });
    saveDraft(state);
    renderLines(state);
  });

  $("btnAddCatalog").addEventListener("click", ()=> {
    // Simple prompt-based picker (fast + reliable for demo)
    const choices = catalog.items.map((x,i)=> `${i+1}) ${x.name} — ${money(x.unit_price)}`);
    const pick = window.prompt("Pick an item by number:\n\n" + choices.join("\n"));
    const n = Number(pick);
    if(!n || n<1 || n>catalog.items.length) return;
    const item = catalog.items[n-1];
    state.lines.push({
      name: item.name,
      qty: 1,
      unit_price: item.unit_price,
      note: item.note || ""
    });
    saveDraft(state);
    renderLines(state);
  });

  $("btnExportJson").addEventListener("click", ()=> {
    syncFromUI();
    download(`ironwood-estimate-${state.id}.json`, JSON.stringify({...state, totals: calcTotals(state)}, null, 2), "application/json");
  });

  $("btnExportCsv").addEventListener("click", ()=> {
    syncFromUI();
    const lines = state.lines || [];
    const header = ["Name","Qty","Unit Price","Extended","Note"];
    const rows = lines.map(l=>[
      (l.name||"").replaceAll('"','""'),
      String(l.qty||0),
      String(l.unit_price||0),
      String((Number(l.qty||0)*Number(l.unit_price||0)).toFixed(2)),
      (l.note||"").replaceAll('"','""')
    ].map(v=> `"${v}"`).join(","));
    const csv = header.join(",") + "\n" + rows.join("\n");
    download(`ironwood-estimate-${state.id}.csv`, csv, "text/csv");
  });

  $("btnShare").addEventListener("click", async ()=> {
    syncFromUI();
    const payload = encodeShare(state);
    const u = new URL(window.location.href);
    u.searchParams.set("q", payload);
    try{
      await navigator.clipboard.writeText(u.toString());
      toast("Copied share link");
    }catch(e){
      window.prompt("Copy this link:", u.toString());
    }
  });

  $("btnPrint").addEventListener("click", ()=> {
    syncFromUI();
    window.print();
  });

  renderLines(state);
  renderDiagnostics();
}

main().catch(err=> {
  console.error(err);
  toast("Estimate builder error — check console");
});
