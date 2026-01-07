async function loadModels(){
  const res = await fetch("./models/models.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Could not load models/models.json");
  return await res.json();
}

function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k === "class") node.className = v;
    else if(k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if(k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(child=>{
    if(child === null || child === undefined) return;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  });
  return node;
}

function toast(msg){
  const t = document.getElementById("toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=> t.classList.remove("show"), 1200);
}

function normalize(str){ return String(str || "").toLowerCase().trim(); }
function modelId(m, idx){ return m.id || String(idx); }
function safeLetter(title){ return (title || "?").trim().charAt(0).toUpperCase() || "?"; }

function setActiveItem(listEl, id){
  [...listEl.querySelectorAll(".item")].forEach(i=>i.classList.toggle("active", i.dataset.id === id));
}

function currentShareUrl(id){
  const u = new URL(window.location.href);
  u.searchParams.set("id", id);
  return u.toString();
}

async function copyShareLink(id){
  const url = currentShareUrl(id);
  try{
    await navigator.clipboard.writeText(url);
    toast("Copied link");
  }catch(e){
    window.prompt("Copy this link:", url);
  }
}

/** ===== Robust viewer controls (always wired) ===== */
async function wireViewerControls(){
  const mv = document.getElementById("mv");
  if(!mv) return;

  // Store initial camera values so Reset is truly "back to start"
  const initial = {
    orbit: mv.getAttribute("camera-orbit") || "0deg 75deg 105%",
    target: mv.getAttribute("camera-target") || "auto auto auto",
    fov: mv.getAttribute("field-of-view") || null
  };

  const btnReset = document.getElementById("btnReset");
  const btnFit   = document.getElementById("btnFit");
  const btnAuto  = document.getElementById("btnAuto");
  const btnFull  = document.getElementById("btnFull");

  async function ensureFraming(){
    try{
      if (typeof mv.updateFraming === "function") await mv.updateFraming();
      if (typeof mv.jumpCameraToGoal === "function") mv.jumpCameraToGoal();
    }catch(e){
      console.warn("Framing error:", e);
    }
  }

  btnReset?.addEventListener("click", async ()=>{
    try{
      // Reset camera + rotation to initial
      mv.setAttribute("camera-target", initial.target);
      mv.setAttribute("camera-orbit", initial.orbit);
      if(initial.fov) mv.setAttribute("field-of-view", initial.fov);
      if (typeof mv.resetTurntableRotation === "function") mv.resetTurntableRotation();
      await ensureFraming();
    }catch(e){ console.warn("Reset failed:", e); }
  });

  btnFit?.addEventListener("click", async ()=>{
    try{
      // Tight framing using % distance (100% = tight fit)
      mv.setAttribute("camera-target", "auto auto auto");
      mv.setAttribute("camera-orbit", "0deg 75deg 100%");
      await ensureFraming();
    }catch(e){ console.warn("Fit failed:", e); }
  });

  btnAuto?.addEventListener("click", ()=>{
    try{
      mv.autoRotate = !mv.autoRotate;
      btnAuto.textContent = mv.autoRotate ? "Stop Rotate" : "Auto Rotate";
    }catch(e){ console.warn("Auto-rotate toggle failed:", e); }
  });

  // Fullscreen:
  // - Prefer browser fullscreen API
  // - Always toggle "presentation mode" so it visibly changes even if fullscreen is blocked
  async function syncFullLabel(){
    if(!btnFull) return;
    const isFs = !!document.fullscreenElement;
    const isPresent = document.body.classList.contains("present");
    btnFull.textContent = (isFs || isPresent) ? "Exit Fullscreen" : "Fullscreen";
  }

  btnFull?.addEventListener("click", async ()=>{
    // Always toggle present mode for a reliable visual change
    document.body.classList.toggle("present");

    try{
      if(!document.fullscreenElement && document.documentElement.requestFullscreen){
        await document.documentElement.requestFullscreen();
      } else if(document.fullscreenElement && document.exitFullscreen){
        await document.exitFullscreen();
      }
    }catch(e){
      // ignore; present mode still works
    }finally{
      syncFullLabel();
    }
  });

  document.addEventListener("fullscreenchange", syncFullLabel);
  syncFullLabel();

  // If user interacts with camera, stop auto-rotate once (nice feel)
  mv.addEventListener("camera-change", () => {
    try{
      mv.autoRotate = false;
      if(btnAuto) btnAuto.textContent = "Auto Rotate";
    }catch(e){}
  }, { once: true });
}

/** ===== Product panel rendering ===== */
function renderChips(model){
  const chips = document.getElementById("chips");
  if(!chips) return;
  chips.innerHTML = "";

  const parts = [
    model.category ? {k:"Category", v:model.category} : null,
    model.sku ? {k:"SKU", v:model.sku} : null,
    model.material ? {k:"Material", v:model.material} : null,
    model.updated ? {k:"Updated", v:model.updated} : null,
  ].filter(Boolean);

  parts.forEach(p=>{
    chips.appendChild(el("span", { class:"chip" }, [
      el("strong", {}, p.k + ": "),
      document.createTextNode(p.v)
    ]));
  });

  (model.tags || []).slice(0, 6).forEach(tag=>{
    chips.appendChild(el("span", { class:"chip" }, ["#", tag]));
  });
}

function renderKV(model){
  const kv = document.getElementById("kv");
  if(!kv) return;
  kv.innerHTML = "";

  const rows = [
    ["Profile", model.profile],
    ["Material", model.material],
    ["Finish", model.finish],
    ["Dimensions", model.dimensions],
    ["Weight", model.weight],
    ["Lead time", model.lead_time],
    ["Price", model.price_note],
    ["Notes", model.subtitle]
  ].filter(r => r[1] && String(r[1]).trim() !== "—" && String(r[1]).trim() !== "");

  if(rows.length === 0){
    kv.appendChild(el("div", { class:"k", text:"No product info yet." }));
    kv.appendChild(el("div", { class:"v", text:"Add fields in models/models.json." }));
    return;
  }

  rows.forEach(([k,v])=>{
    kv.appendChild(el("div", { class:"k", text:k }));
    kv.appendChild(el("div", { class:"v", text:String(v) }));
  });
}

function renderHighlights(model){
  const ul = document.getElementById("highlights");
  if(!ul) return;
  ul.innerHTML = "";
  const items = Array.isArray(model.highlights) ? model.highlights : [];
  if(items.length === 0){
    ul.appendChild(el("li", {}, ["Add highlights in models/models.json (array)."]));
    return;
  }
  items.forEach(h => ul.appendChild(el("li", {}, [String(h)])));
}

function renderDownloads(model){
  const dl = document.getElementById("downloads");
  if(!dl) return;
  dl.innerHTML = "";

  const items = Array.isArray(model.downloads) ? model.downloads : [];
  const valid = items.filter(x => x && (x.label || x.href));

  if(valid.length === 0){
    dl.appendChild(el("div", { class:"dl" }, [
      el("div", {}, [
        el("div", { class:"label", text:"No files added yet" }),
        el("div", { class:"hint", text:"Add downloads[] in models/models.json (PDFs, images, etc.)" })
      ]),
      el("span", { class:"btn", style:"opacity:.55; cursor:default;" }, ["—"])
    ]));
    return;
  }

  valid.forEach(x=>{
    const hasLink = x.href && String(x.href).trim() !== "";
    dl.appendChild(el("div", { class:"dl" }, [
      el("div", {}, [
        el("div", { class:"label", text: x.label || "Download" }),
        el("div", { class:"hint", text: hasLink ? (x.hint || "Opens in a new tab") : "Add href to enable" })
      ]),
      hasLink
        ? el("a", { class:"btn", href: x.href, target:"_blank", rel:"noreferrer" }, ["Open"])
        : el("span", { class:"btn", style:"opacity:.5; cursor:not-allowed;" }, ["Missing link"])
    ]));
  });
}

function renderGallery(model){
  const g = document.getElementById("gallery");
  if(!g) return;
  g.innerHTML = "";

  const imgs = Array.isArray(model.images) ? model.images : [];
  if(imgs.length === 0){
    g.appendChild(el("div", { class:"thumb" }, ["Add images[] paths (optional)"]));
    g.appendChild(el("div", { class:"thumb" }, ["ex: assets/product-1.jpg"]));
    g.appendChild(el("div", { class:"thumb" }, ["or leave blank"]));
    return;
  }

  imgs.slice(0, 6).forEach(src=>{
    const img = el("img", { src, alt:"Product photo" });
    g.appendChild(el("div", { class:"thumb" }, [img]));
  });
}

function setViewer(model){
  const mv = document.getElementById("mv");
  const titleEl = document.getElementById("modelTitle");
  const descEl = document.getElementById("modelDesc");

  if(mv && model?.src) mv.setAttribute("src", model.src);
  if(titleEl) titleEl.textContent = model.title || "Model";
  if(descEl) descEl.textContent = model.description || "";

  renderChips(model);
  renderKV(model);
  renderHighlights(model);
  renderDownloads(model);
  renderGallery(model);

  // Re-frame after swapping
  setTimeout(async ()=> {
    try{
      if (mv && typeof mv.updateFraming === "function") await mv.updateFraming();
      if (mv && typeof mv.jumpCameraToGoal === "function") mv.jumpCameraToGoal();
    }catch(e){}
  }, 150);
}

function buildListItem(m, idx){
  const id = modelId(m, idx);
  const top = m.title || `Model ${idx+1}`;
  const sub = [m.category, m.material, m.sku].filter(Boolean).join(" • ");
  const desc = m.description || "";

  return el("div", { class:"item", "data-id": id }, [
    el("div", { class:"badge" }, safeLetter(m.title)),
    el("div", {}, [
      el("div", { class:"name" }, top),
      el("div", { class:"desc" }, [sub ? (sub + (desc ? " — " : "")) : "", desc].join(""))
    ])
  ]);
}

function matches(m, q, cat){
  const nq = normalize(q);
  const ncat = normalize(cat);
  if(ncat && normalize(m.category) !== ncat) return false;
  if(!nq) return true;

  const hay = [
    m.title, m.subtitle, m.description, m.category, m.sku, m.material, m.finish,
    ...(m.tags || [])
  ].map(normalize).join(" | ");

  return hay.includes(nq);
}

function buildCategoryOptions(models){
  const catSel = document.getElementById("cat");
  if(!catSel) return;
  catSel.querySelectorAll("option:not([value=''])").forEach(o=>o.remove());
  const cats = [...new Set(models.map(m => m.category).filter(Boolean))].sort((a,b)=> a.localeCompare(b));
  cats.forEach(c=> catSel.appendChild(el("option", { value: c, text: c })));
}

async function main(){
  const listEl = document.getElementById("modelList");
  const qEl = document.getElementById("q");
  const catEl = document.getElementById("cat");

  let models = [];
  try{
    models = await loadModels();
  }catch(err){
    console.error(err);
    // Still show a helpful message, but controls remain wired
    listEl?.appendChild(el("div", { class:"item active", "data-id":"err" }, [
      el("div", { class:"badge" }, "!"),
      el("div", {}, [
        el("div", { class:"name" }, "models.json not loading"),
        el("div", { class:"desc" }, "If you're running locally, use a local server. If on GitHub Pages, ensure models/models.json exists." )
      ])
    ]));
    return;
  }

  if(!Array.isArray(models) || models.length === 0){
    listEl?.appendChild(el("div", { class:"item active", "data-id":"none" }, [
      el("div", { class:"badge" }, "?"),
      el("div", {}, [
        el("div", { class:"name" }, "No models found"),
        el("div", { class:"desc" }, "Add .glb files to /models and list them in models/models.json.")
      ])
    ]));
    return;
  }

  buildCategoryOptions(models);

  const urlId = new URL(window.location.href).searchParams.get("id");
  const startIdx = urlId ? Math.max(0, models.findIndex((m,i)=> modelId(m,i) === urlId)) : 0;

  function render(){
    const q = qEl ? qEl.value : "";
    const cat = catEl ? catEl.value : "";
    if(listEl) listEl.innerHTML = "";

    const filtered = models
      .map((m,i)=> ({m,i,id:modelId(m,i)}))
      .filter(x => matches(x.m, q, cat));

    if(filtered.length === 0){
      listEl?.appendChild(el("div", { class:"item active", "data-id":"none" }, [
        el("div", { class:"badge" }, "0"),
        el("div", {}, [
          el("div", { class:"name" }, "No matches" ),
          el("div", { class:"desc" }, "Try a different search or clear the filters." )
        ])
      ]));
      return;
    }

    filtered.forEach((x, idx)=>{
      const item = buildListItem(x.m, x.i);
      if(idx === 0){
        item.classList.add("active");
        setViewer(x.m);
        history.replaceState({}, "", currentShareUrl(x.id));
      }
      item.addEventListener("click", ()=>{
        setActiveItem(listEl, x.id);
        setViewer(x.m);
        history.replaceState({}, "", currentShareUrl(x.id));
      });
      listEl?.appendChild(item);
    });
  }

  // Initial view
  if(urlId && startIdx >= 0){
    // render full list (no filters) and pick the one in URL
    if(qEl) qEl.value = "";
    if(catEl) catEl.value = "";
    if(listEl) listEl.innerHTML = "";
    models.forEach((m,i)=>{
      const id = modelId(m,i);
      const item = buildListItem(m,i);
      if(id === urlId){
        item.classList.add("active");
        setViewer(m);
      }
      item.addEventListener("click", ()=>{
        setActiveItem(listEl, id);
        setViewer(m);
        history.replaceState({}, "", currentShareUrl(id));
      });
      listEl?.appendChild(item);
    });
  }else{
    render(); // will pick first filtered as active
  }

  // Search / filter
  qEl?.addEventListener("input", ()=> render());
  catEl?.addEventListener("change", ()=> render());

  // Share pill
  const sharePill = document.querySelector(".searchbar .pill");
  if(sharePill){
    sharePill.style.cursor = "pointer";
    sharePill.title = "Copy a link that opens the currently-selected product";
    sharePill.addEventListener("click", ()=>{
      const active = listEl?.querySelector(".item.active");
      const id = active ? active.dataset.id : modelId(models[0], 0);
      copyShareLink(id);
    });
  }

  // Keyboard shortcut: "/" focuses search
  document.addEventListener("keydown", (e)=>{
    if(e.key === "/" && qEl){
      e.preventDefault();
      qEl.focus();
    }
  });
}

// Run: wire controls first so buttons always work
wireViewerControls();
main();
