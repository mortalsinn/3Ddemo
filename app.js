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
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(child=>{
    if(child === null || child === undefined) return;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  });
  return node;
}

function setActiveItem(listEl, id){
  [...listEl.querySelectorAll(".item")].forEach(i=>i.classList.toggle("active", i.dataset.id === id));
}

function safeLetter(title){
  return (title || "?").trim().charAt(0).toUpperCase() || "?";
}

function setViewer(model){
  const mv = document.getElementById("mv");
  const titleEl = document.getElementById("modelTitle");
  const descEl = document.getElementById("modelDesc");

  mv.setAttribute("src", model.src);
  titleEl.textContent = model.title || "Model";
  descEl.textContent = model.description || "";

  // Reset camera to a nice default view after model swap
  // (model-viewer needs a tick)
  setTimeout(()=> {
    try { mv.resetTurntableRotation(); } catch(e) {}
    try { mv.jumpCameraToGoal(); } catch(e) {}
  }, 150);
}

async function main(){
  const listEl = document.getElementById("modelList");

  let models = [];
  try {
    models = await loadModels();
  } catch (err){
    console.error(err);
    listEl.appendChild(el("div", { class:"item active", "data-id":"err" }, [
      el("div", { class:"badge" }, "!"),
      el("div", {}, [
        el("div", { class:"name" }, "models.json missing"),
        el("div", { class:"desc" }, "Make sure models/models.json exists and is valid JSON.")
      ])
    ]));
    return;
  }

  if(!Array.isArray(models) || models.length === 0){
    listEl.appendChild(el("div", { class:"item active", "data-id":"none" }, [
      el("div", { class:"badge" }, "?"),
      el("div", {}, [
        el("div", { class:"name" }, "No models found"),
        el("div", { class:"desc" }, "Add .glb files to /models and list them in models/models.json.")
      ])
    ]));
    return;
  }

  // render list
  models.forEach((m, idx)=>{
    const item = el("div", { class:"item"+(idx===0?" active":""), "data-id": m.id || String(idx) }, [
      el("div", { class:"badge" }, safeLetter(m.title)),
      el("div", {}, [
        el("div", { class:"name" }, m.title || `Model ${idx+1}`),
        el("div", { class:"desc" }, m.description || "")
      ])
    ]);
    item.addEventListener("click", ()=>{
      setActiveItem(listEl, item.dataset.id);
      setViewer(m);
    });
    listEl.appendChild(item);
  });

  // set first model
  setViewer(models[0]);

  // Controls
  const mv = document.getElementById("mv");
  document.getElementById("btnReset").addEventListener("click", ()=> mv.resetTurntableRotation());
  document.getElementById("btnAuto").addEventListener("click", ()=>{
    mv.autoRotate = !mv.autoRotate;
    document.getElementById("btnAuto").textContent = mv.autoRotate ? "Stop Rotate" : "Auto Rotate";
  });
  document.getElementById("btnFit").addEventListener("click", ()=>{
    try { mv.jumpCameraToGoal(); } catch(e) {}
  });

  // once user moves camera, stop auto rotate (feels nicer)
  mv.addEventListener("camera-change", () => { mv.autoRotate = false; document.getElementById("btnAuto").textContent = "Auto Rotate"; }, { once: true });
}

main();
