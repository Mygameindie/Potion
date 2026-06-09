// src/ui/codex.js
(function CodexModule(){
  const $  = (s,root=document)=>root.querySelector(s);

  // --- Normalizers ---------------------------------------------------------
  function asArray(x){
    if (!x) return [];
    if (Array.isArray(x)) return x;
    // DATA_FORMS อาจเป็น object mapping id -> meta
    if (typeof x === 'object') return Object.keys(x).map(id => ({ id, ...(x[id]||{}) }));
    return [];
  }
  function safeText(s){ return (s==null? '' : String(s)); }

  // หา path รูปจาก meta (รองรับหลายชื่อฟิลด์)
  function resolveImage(meta){
    const cand = [meta?.image, meta?.img, meta?.icon, meta?.picture, meta?.src];
    const hit = cand.find(Boolean);
    return hit || null;
  }

  // --- Data Accessors -------------------------------------------------------
  function getForms(){
    const raw = window.DATA_FORMS || window.DATA_FORMS_LIST;
    const arr = asArray(raw);
    return arr.map(f => ({
      id: f.id || f.key || '',
      name: f.name || f.title || f.id || '',
      image: resolveImage(f)
    })).filter(x => x.id);
  }

// === Derive "unlocked evo" from discovered endings ===
function deriveUnlockedEvosFromEndings(){
  const S = window.ensureSave?.() || {};
  const seenEnd = S.seenEndings || {}; // <-- ในไฟล์นี้คุณใช้อยู่แล้ว
  // รองรับได้ทั้ง DATA_ENDINGS_NEW (array/object) และ fallback
  const RAW = window.DATA_ENDINGS_NEW || window.DATA_ENDINGS || [];
  const arr = Array.isArray(RAW) ? RAW : Object.keys(RAW).map(k => RAW[k] || { id:k });

  const via = new Set();
  for (const e of arr){
    if (!e || !e.id) continue;
    if (!seenEnd[e.id]) continue;                // ยังไม่ค้นพบ ending นี้ ข้าม
    const links = Array.isArray(e.linkEvos) ? e.linkEvos
                 : (window.POE?.LINK_END_EVO?.[e.id] || []); // เผื่อคุณอยากทำ mapping สำรอง
    links.forEach(id => via.add(id));
  }
  return via;
}

  function getEndings(){
  const src = Array.isArray(window.DATA_ENDINGS_NEW)
    ? window.DATA_ENDINGS_NEW
    : asArray(window.DATA_ENDINGS); // fallback เดิม

  return src.map(e => ({
    id: e.id || '',
    name: e.name || e.title || e.id || '',
    reviveTo: e.rebornTo || e.reviveTo || e.reborn || null,
    image: e.overlay?.image || resolveImage(e) || null, // รองรับ overlay.image
  })).filter(x => x.id);
}

  function getKeywords(){
    const arr = Array.isArray(window.DATA_KEYWORDS?.list)
      ? window.DATA_KEYWORDS.list
      : asArray(window.DATA_KEYWORDS);

    return arr.map(k => {
      // คุณเลือกใช้ tag เป็นตัวเลขล้วนแล้ว (ดีสุด)
      const tag = Array.isArray(k.tag) ? k.tag.slice() : [];
      return {
        id: k.id, name: k.name || k.id,
        tag,
        preview: k.preview || null // formId สำหรับ preview
      };
    }).filter(x => x.id);
  }

// === Codex Summary (เหนือเนื้อหา) ===
window.Codex = window.Codex || {};
window.Codex.renderSummaryBar = function renderSummaryBar(){
  const host = document.getElementById('codex-summary'); if (!host) return;
  const sum = window.getDiscoverySummary?.(); 
  if (!sum){ host.textContent=''; return; }

  const Kx = sum.counters.keywordsDiscovered ?? 0;
  const Ky = sum.totals.keywords ?? 0;
  const Fx = sum.counters.formsDiscovered ?? 0;
  const Fy = sum.totals.forms ?? 0;
  const Ex = sum.counters.endingsDiscovered ?? 0;
  const Ey = sum.totals.endings ?? 0;
  const Evo = sum.counters.evolutionsDiscovered ?? 0;

  host.innerHTML = `
    <span>Keywords <b>${Kx}</b> / ${Ky}</span>
    <span class="dot">•</span>
    <span>Forms <b>${Fx}</b> / ${Fy}</span>
    <span class="dot">•</span>
    <span>Endings <b>${Ex}</b> / ${Ey}</span>
    <span class="dot">•</span>
    <span>Evolutions <b>${Evo}</b></span>
  `;
};

  function renderForms(){
  const $ = (s,root=document)=>root.querySelector(s);
  const root = $('#codex-content'); if (!root) return;

  // ===== STATE =====
  renderForms.state = renderForms.state || { page:0, selectedId:null, evo:false };
  const ST = renderForms.state;

  // ===== DATA =====
const S = window.ensureSave?.() || {};
  const seenForms = new Set(Object.keys(S?.seenForms || {}));

  // 👉 เพิ่มบรรทัดนี้
  const derivedEvos = deriveUnlockedEvosFromEndings();

// ===== DATA (เดิม)
// ==== เตรียมดึงฟิลด์เสริมจาก DATA_FORMS ====
const raw = window.DATA_FORMS || {};
// รองรับทั้งกรณี DATA_FORMS เป็น array หรือ object
const rawById = Array.isArray(raw)
  ? Object.fromEntries(raw.map(f => [f.id, f]))
  : raw;

const formsAll = (typeof getForms === 'function' ? getForms() : [])
  .map(f => {
    const r = rawById[f.id] || {};
    return {
      id: f.id,
      name: f.name || f.id,
      image: f.image || null,
      no: (f.no ?? r.no) || null,
      evoAlt: r.evoAlt || null,
      evoOnly: !!r.evoOnly
    };
  })
  .filter(f => !f.evoOnly)
  .sort((a, b) => {
    if (a.no && b.no) {
      const cmp = String(a.no).localeCompare(String(b.no), undefined, { numeric: true });
      if (cmp !== 0) return cmp;
    } else if (a.no && !b.no) return -1;
    else if (!a.no && b.no)  return 1;
    return (a.name || a.id).localeCompare(b.name || b.id);
  });

// ✅ helper ใหม่: คืนข้อมูลจาก rawMap ได้ แม้จะถูกซ่อนจากกริด
function getByIdAny(id){
  const fromList = formsAll.find(x=>x.id===id);
  if (fromList) return fromList;
  const r = rawById[id];
  return r ? {
    id,
    name: r.name || id,
    image: r.image || null,
    evoAlt: r.evoAlt || null,
    evoOnly: !!r.evoOnly
  } : null;
}

  if (!formsAll.length){ root.textContent = 'No forms available.'; return; }
  if (!ST.selectedId) ST.selectedId = formsAll[0].id;

 const PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(formsAll.length / PER_PAGE));
  const getById = id => formsAll.find(x=>x.id===id) || null;

  // ❗ เปลี่ยนฟังก์ชันเช็คปลดล็อกให้รวม "ปลดผ่าน ending"
  const isDiscovered = id => seenForms.has(id) || derivedEvos.has(id);

  const pageItems = p => formsAll.slice(p*PER_PAGE, p*PER_PAGE + PER_PAGE);
  const setSelected = (id,{resetEvo=true}={}) => { ST.selectedId=id; if(resetEvo) ST.evo=false; paint(); };

  function paintViewer(host){
    const base = getByIdAny(ST.selectedId) || formsAll[0];
    const usingEvo = !!(ST.evo && base?.evoAlt);
    const curId    = usingEvo ? base.evoAlt : base.id;
    const curMeta  = getByIdAny(curId) || { id:curId, name:curId, image:null };

    const discovered = isDiscovered(curId);              // ← ใช้ฟังก์ชันใหม่

    // (ออปชัน) แสดงป้ายหาก "ปลดจาก Ending" แต่ยังไม่อยู่ใน seenForms จริง
    const viaEnding = !seenForms.has(curId) && derivedEvos.has(curId);

    const viewer = document.createElement('div'); viewer.className = 'forms-viewer';
    const img = document.createElement('div'); img.className = 'viewer-img';
    if (discovered && curMeta.image){
  const pic = document.createElement('img');
  pic.src = curMeta.image;
  pic.alt = curMeta.name || curId;
  img.appendChild(pic);
} else {
  img.style.background = '#000';
}

    const name = document.createElement('div'); name.className = 'viewer-name';
    name.textContent = discovered ? (curMeta.name || curId) : '???';

    const acts = document.createElement('div'); acts.className = 'viewer-acts';
    if (viaEnding){
      const tag = document.createElement('span');
      tag.className = 'badge badge-ghost';
      tag.textContent = 'Unlocked via Ending';
      acts.appendChild(tag);
    }

    // ปุ่ม Evolution Preview เดิมจะ "เปิดใช้" อัตโนมัติถ้า evo ปลดจาก ending แล้ว
    if (base?.evoAlt){
      const evoId = base.evoAlt;
      const evoDiscovered = isDiscovered(evoId);         // ← ตรงนี้ก็ได้อานิสงส์
      const btn = document.createElement('button'); btn.className='btn btn-sm';
      if (!evoDiscovered){ btn.textContent = 'Evolution Preview'; btn.disabled = true; btn.title = 'ยังไม่ค้นพบร่างนี้'; }
      else { btn.textContent = usingEvo ? 'Back to Base' : 'Evolution Preview'; btn.addEventListener('click', ()=>{ ST.evo = !usingEvo; paint(); }); }
      acts.appendChild(btn);
    }

    viewer.append(img, name, acts);
    host.appendChild(viewer);
  }

function paintThumbs(host){
  const box = document.createElement('div'); box.className = 'forms-wrap';

  // header / pager
  const head = document.createElement('div'); head.className = 'forms-head';
  const pager = document.createElement('div'); pager.className = 'forms-pager';

  const prev = document.createElement('button');
  prev.className = 'btn btn-sm'; prev.textContent = '← Prev';
  prev.disabled = (ST.page <= 0);
  prev.addEventListener('click', ()=> goto(-1));

  const next = document.createElement('button');
  next.className = 'btn btn-sm'; next.textContent = 'Next →';
  next.disabled = (ST.page >= totalPages - 1);
  next.addEventListener('click', ()=> goto(+1));

  const info = document.createElement('div');
  info.className = 'forms-info';
  info.textContent = `Page ${ST.page+1} / ${totalPages}`;

  pager.append(prev, info, next);
  head.appendChild(pager);
  box.appendChild(head);

  // grid 2 × 6
  const grid = document.createElement('div'); grid.className = 'forms-grid';

  for (const it of pageItems(ST.page)){
    const discovered = isDiscovered(it.id);

    const card = document.createElement('div');
    card.className = 'form-card ' + (discovered ? 'unlocked' : 'locked');
    if (it.id === ST.selectedId) card.classList.add('selected');
    card.title = `id: ${it.id}`; // เก็บ id เป็น tooltip ได้

    const thumb = document.createElement('div');
    thumb.className = 'form-thumb';
    if (discovered && it.image){
  const pic = document.createElement('img');
  pic.src = it.image;
  pic.alt = it.name || it.id;
  thumb.appendChild(pic);
}
    // ไม่มี label ใน thumbnail อีกแล้ว

    card.addEventListener('click', ()=> setSelected(it.id, {resetEvo:true}));

    card.appendChild(thumb);
    grid.appendChild(card);
  }

  box.appendChild(grid);
  host.appendChild(box);
}

  function paint(){
    const container = document.createElement('div');
    paintViewer(container);
    paintThumbs(container);
    root.replaceChildren(container);
  }

  paint();
}

 // เรียกจาก Codex: window.Codex.renderEndings()
function renderEndings(){
  const $  = (s,root=document)=>root.querySelector(s);
  const root = $('#codex-content'); if (!root) return;

  // ==== STATE ====
  renderEndings.state = renderEndings.state || { page:0, selectedId:null };
  const ST = renderEndings.state;

  // ==== DATA (รองรับทั้ง getEndings(), array, object) ====
  const S = window.ensureSave?.() || {};
  const seenMap = S.seenEndings || {};

  const RAW = window.DATA_ENDINGS_NEW || window.DATA_ENDINGS || [];

  let endsAll;
  if (Array.isArray(RAW)) {
    endsAll = RAW.map(e => ({
      id: e.id,
      name: e.name || e.id,
      image: e.overlay?.image || e.image || null,
      rebornTo: e.rebornTo || e.reviveTo || null,
    }));
  } else if (typeof getEndings === 'function') {
    endsAll = getEndings().map(e => ({
      id: e.id,
      name: e.name || e.id,
      image: e.overlay?.image || e.image || null,
      rebornTo: e.rebornTo || e.reviveTo || null,
    }));
  } else {
    endsAll = Object.keys(RAW).map(k => {
      const e = RAW[k] || {};
      return {
        id: e.id || k,
        name: e.name || e.id || k,
        image: e.overlay?.image || e.image || null,
        rebornTo: e.rebornTo || e.reviveTo || null,
      };
    });
  }
  endsAll = (endsAll || []).filter(Boolean).sort((a,b)=> (a.name).localeCompare(b.name));
  if (!endsAll.length){ root.textContent = 'No endings available.'; return; }

  const PER_PAGE = 12; // 2×6
  const totalPages  = Math.max(1, Math.ceil(endsAll.length / PER_PAGE));
  const getById     = id => endsAll.find(x=>x.id===id) || null;
  const isDiscovered= id => !!seenMap[id];
  const pageItems   = p  => endsAll.slice(p*PER_PAGE, p*PER_PAGE + PER_PAGE);

  const setSelected = id => { ST.selectedId = id; paint(); };
  const goto        = d  => { ST.page = Math.min(totalPages-1, Math.max(0, ST.page+d)); paint(); };

  // ==== VIEWER ====
  function paintViewer(host){
    const container = document.createElement('div'); container.className='ending-viewer';

    if (!ST.selectedId){
      // ไม่มีการเลือกใด ๆ เริ่มต้น
      const img  = document.createElement('div'); img.className = 'ending-img';
      const name = document.createElement('div'); name.className = 'ending-name';
      name.textContent = 'เลือกฉากจบจากด้านล่าง';
      container.append(img, name);
      host.appendChild(container);
      return;
    }

    const meta = getById(ST.selectedId) || endsAll[0];
    const discovered = isDiscovered(meta.id);

    const img = document.createElement('div'); img.className = 'ending-img';
    if (meta.image){
  const pic = document.createElement('img');
  pic.src = meta.image;
  pic.alt = meta.name || meta.id;
  img.appendChild(pic);
}
    if (!discovered){ img.classList.add('is-locked'); }

    const name = document.createElement('div'); name.className = 'ending-name';
    name.textContent = discovered ? (meta.name || meta.id) : '???';

    // ไม่มีปุ่ม View/Revive ตามสเปกใหม่

    container.append(img, name);
    host.appendChild(container);
  }

  // ==== GRID (2×6) ====
  function paintThumbs(host){
    const box  = document.createElement('div'); box.className='endings-wrap';

    // header / pager
    const head  = document.createElement('div'); head.className='endings-head';
    const pager = document.createElement('div'); pager.className='endings-pager';

    const prev = document.createElement('button'); prev.className='btn btn-sm'; prev.textContent='← Prev';
    prev.disabled = (ST.page<=0); prev.addEventListener('click', ()=>goto(-1));

    const next = document.createElement('button'); next.className='btn btn-sm'; next.textContent='Next →';
    next.disabled = (ST.page>=totalPages-1); next.addEventListener('click', ()=>goto(+1));

    const info = document.createElement('div'); info.className='endings-info';
    info.textContent = `Page ${ST.page+1} / ${totalPages}`;

    pager.append(prev, info, next);
    head.appendChild(pager);
    box.appendChild(head);

    // grid
    const grid = document.createElement('div'); grid.className='endings-grid';

    for (const it of pageItems(ST.page)){
      const discovered = isDiscovered(it.id);

      const card  = document.createElement('div');
      card.className = 'ending-card' + (it.id===ST.selectedId ? ' selected' : '');
      card.title = `id: ${it.id}`;

      const thumb = document.createElement('div');
      thumb.className = 'ending-thumb' + (it.image ? ' has-img' : '');
      if (it.image){
  const pic = document.createElement('img');
  pic.src = it.image;
  pic.alt = it.name || it.id;
  thumb.appendChild(pic);
}
      if (!discovered) thumb.classList.add('is-locked');

      card.addEventListener('click', ()=>{
        if (!discovered){
          alert('ยังไม่พบฉากจบนี้');
          return;
        }
        setSelected(it.id);
      });

      card.appendChild(thumb);
      grid.appendChild(card);
    }

    box.appendChild(grid);
    host.appendChild(box);
  }

  // ==== PAINT ====
  function paint(){
    const container = document.createElement('div');
    paintViewer(container);
    paintThumbs(container);
    root.replaceChildren(container);
  }

  paint();
}

// helper: เรียกตอนสลับแท็บ Codex → Endings เพื่อให้ "ไม่มีการเลือกก่อน"
window.Codex = window.Codex || {};
window.Codex.resetEndingsSelection = function(){
  if (renderEndings.state){
    renderEndings.state.selectedId = null;
    renderEndings.state.page = 0;
  }
};

  // mapping tag → emoji/label (ใช้ tag เป็นตัวเลขล้วน)
  const KW_TAGS = {
    "1": { emoji:"💬", label:"Dialogue" },
    "2": { emoji:"🎬", label:"Event" },
    "3": { emoji:"🧬", label:"Evolution" },
    "4": { emoji:"💀", label:"Endings" },
    "5": { emoji:"👤", label:"Transformation" }
  };

function renderKeywords(){
  const $  = (s,root=document)=>root.querySelector(s);
  const root = $('#codex-content'); if (!root) return;

  // --- state ภายใน
  renderKeywords.state = renderKeywords.state || { letter:'A', selected:null };
  const ST = renderKeywords.state;

  // --- อ่านสถานะ discovered จาก save (คีย์ที่ถูกต้อง)
  const S = window.ensureSave?.() || {};
  const seenSet = new Set(Object.keys(S.seenKeywords || {}));  // ✅ แก้ตรงนี้

  // --- ดึงข้อมูล + flag discovered
  const itemsAll = getKeywords().map(k => ({
    ...k,
    discovered: seenSet.has(k.id)
  }));

  // --- helper: จัด bucket ตัวแรกเป็น A–Z หรือ '?'
  const bucket = (nameOrId)=>{
    const ch = String(nameOrId||'').trim().charAt(0).toUpperCase();
    return (ch >= 'A' && ch <= 'Z') ? ch : '?';
  };

  // ===== กล่องรายละเอียดด้านบน =====
  const wrap   = document.createElement('div');
  const head   = document.createElement('div'); head.className='kw-head';
  const selBox = document.createElement('div'); selBox.className='kw-selected';
  const title  = document.createElement('div'); title.className='kw-title';
  const tags   = document.createElement('div'); tags.className='kw-tags';
  const acts   = document.createElement('div'); acts.className='kw-actions';

  const sel = ST.selected;
  if (sel){
    if (sel.discovered){
      // ชื่อจริง
      title.textContent = sel.name || sel.id;

      // แสดง emoji/label เฉพาะใน "กล่องบน" เท่านั้น
      (sel.tag||[]).forEach(t=>{
        const info = KW_TAGS?.[t] || { emoji:'❓', label:t };
        const pill = document.createElement('span'); pill.className='kw-tag';
        pill.textContent = `${info.emoji} ${info.label}`;
        pill.title = info.label;
        tags.appendChild(pill);
      });

      // ปุ่ม Brew
      // --- ปุ่ม Brew จากคีย์เวิร์ด ---
const bBrew = document.createElement('button');
bBrew.className = 'btn';
bBrew.textContent = 'Brew from keyword';
bBrew.addEventListener('click', ()=>{
  const keyText = (sel.synonyms?.[0] || sel.name || sel.id || '').toLowerCase();

  const input = document.querySelector('#labelInput') || document.querySelector('#input');
  if (input) {
    input.value = keyText;
    input.focus();
  }

  // ข้าม progress bar: เรียก brew() ตรง ๆ
  window.__brewDirect?.();

  // ไม่กด Brew ให้โดยอัตโนมัติ — ปล่อยให้ผู้เล่นกดเองตามเดิม
  // ถ้าต้องการ auto-brew ให้ปลดคอมเมนต์บรรทัดล่าง:
  // (document.querySelector('#brewBtn') || document.querySelector('#btnBrew'))?.click();
});

const formId = sel.preview;
if (formId){
  const fm = (typeof getForms === 'function' ? getForms() : []).find(f => f.id === formId);

  // อ่านสถานะว่าค้นพบฟอร์มนี้หรือยัง
  const S = window.ensureSave?.() || {};
  const discovered = !!(S.seenForms && S.seenForms[formId]);

  const bPrev = document.createElement('button');
  bPrev.className = 'btn';
  bPrev.textContent = 'Preview';

  if (!fm){
    // ไม่พบข้อมูลฟอร์มใน data → กันพังด้วยการปิดปุ่ม
    bPrev.disabled = true;
    bPrev.title = 'ไม่พบข้อมูลฟอร์มใน data';
  } else if (!discovered){
    // ยังไม่ค้นพบร่างนี้ → ปิดปุ่ม + บอกเหตุผล
    bPrev.disabled = true;
    bPrev.title = 'ยังไม่ค้นพบร่างนี้';
  } else {
    // ค้นพบแล้ว → แสดงพรีวิวได้
    bPrev.addEventListener('click', ()=>{
      const titleTxt = fm.name || formId;       // อย่าใช้ตัวแปรชื่อ title (ชน DOM node)
      const imageUrl = fm.image || null;
      window.overlay?.showPreview?.({ title: titleTxt, image: imageUrl });
    });
  }

  acts.appendChild(bPrev);
}

      acts.appendChild(bBrew);
    }else{
      // ยังไม่ค้นพบ
      selBox.classList.add('is-locked');
      title.textContent = '???';
      const hint = document.createElement('div'); hint.className='hint';
      hint.textContent = 'ยังไม่ค้นพบ — ปลดล็อคโดยใช้คีย์เวิร์ดนี้ให้เกิดผลในเกม';
      selBox.appendChild(hint);
    }
  }else{
    title.textContent = 'เลือกคีย์เวิร์ดจากรายการด้านล่าง';
  }

  selBox.append(title, tags, acts);
  head.appendChild(selBox);

  // ===== A–Z + '?' =====
  const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '?'];
  const az = document.createElement('div'); az.className='kw-az';
  LETTERS.forEach(L=>{
    const b = document.createElement('button'); b.className='az-btn'; b.textContent=L;
    b.setAttribute('aria-pressed', ST.letter===L ? 'true':'false');
    b.addEventListener('click', ()=>{ ST.letter=L; renderKeywords(); });
    az.appendChild(b);
  });
  head.appendChild(az);
  wrap.appendChild(head);

  // ===== ลิสต์ตามตัวอักษรที่เลือก =====
  const list = document.createElement('div'); list.className='kw-list';
  let items = itemsAll.filter(it => bucket(it.name || it.id) === ST.letter);
  items.sort((a,b)=>(a.name||a.id).localeCompare(b.name||b.id));

  for (const it of items){
    const row = document.createElement('div');
    row.className = 'kw-item' + (it.discovered ? '' : ' is-locked');

    // ซ้าย: ชื่อ (ไม่สปอย id ใต้ชื่อ)
    const left = document.createElement('div');
    const nm = document.createElement('div'); nm.className='name';
    nm.textContent = it.discovered ? (it.name || it.id) : '???';
    left.append(nm);

    // เก็บ id ไว้เป็น tooltip สำหรับ dev
    row.title = `id: ${it.id}`;

    // ไม่ใส่ mini-tags ทางขวา (ตัด emoji ออกจากลิสต์)
    row.append(left);

    // รายการที่ยังไม่ค้นพบ → คลิกไม่ได้
    row.addEventListener('click', ()=>{
      if (!it.discovered) return;
      ST.selected = it; renderKeywords();
    });

    list.appendChild(row);
  }

  wrap.appendChild(list);
  root.replaceChildren(wrap);
}
 

  
  window.Codex = window.Codex || {};

// รีเซ็ต state แล้วรีเพนต์ทันทีถ้าผู้เล่นเปิดอยู่ที่ Endings
window.Codex.resetEndingsSelection = function(){
  if (renderEndings.state){
    renderEndings.state.selectedId = null;
    renderEndings.state.page = 0;
  }
  const activeSub = document.querySelector('.codex-btn[aria-selected="true"]')?.dataset.sub;
  const codexVisible = !document.querySelector('#tab-codex')?.hidden;
  if (codexVisible && activeSub === 'endings'){
    window.Codex?.renderEndings?.();
  }
};

// (ย้ำ) อย่าลืม augment แทนการเขียนทับอ็อบเจ็กต์
window.Codex.renderKeywords = renderKeywords;
window.Codex.renderForms    = renderForms;
window.Codex.renderEndings  = renderEndings;
})();