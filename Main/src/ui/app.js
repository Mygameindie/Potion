;(function(){
  const $ = s=>document.querySelector(s);
  const LOG_MAX = 200;
  function appendLog(msg){
    const box = $('#log'); if (!box) return;
    const d = document.createElement('div'); d.innerHTML = msg; box.appendChild(d);
    // cap log size so the DOM doesn't grow unbounded over a long session
    while (box.childElementCount > LOG_MAX) box.removeChild(box.firstChild);
    // honour the "Auto-scroll Log" setting (default on)
    const auto = window.getSetting ? window.getSetting('autoScrollLog') !== false : true;
    if (auto) box.scrollTop = box.scrollHeight;
  }
  // --- helpers: อ่านข้อมูลฟอร์มจาก DATA_FORMS (รองรับทั้ง object/array) ---
function getFormMeta(id){
  const MAP = window.DATA_FORMS || {};
  if (Array.isArray(MAP)){
    const hit = MAP.find(x => x && x.id === id);
    return hit || { id, name:id, image:null, evoAlt:null, evoOnly:false };
  }
  return MAP[id] || { id, name:id, image:null, evoAlt:null, evoOnly:false };
}
function findBaseOfEvo(evoId){
  const MAP = window.DATA_FORMS || {};
  if (Array.isArray(MAP)){
    return MAP.find(x => x && x.evoAlt === evoId) || null;
  }
  const keys = Object.keys(MAP);
  for (const k of keys){ if (MAP[k] && MAP[k].evoAlt === evoId) return MAP[k]; }
  return null;
}

function updateFormUI(){
  const S = window.ensureSave?.() || { form:{ id:'human' } };
  const formId = S.form?.id || 'human';
  const fm = getFormMeta(formId);

  // ✅ ถ้าเป็นร่างอีโว ให้ใช้ "ร่างฐาน" เพื่อแสดงใน stFormImg
  const baseMeta = findBaseOfEvo(formId);
  const displayMeta = baseMeta || fm;
  const displayName = displayMeta.name || displayMeta.id;

  const elName = document.getElementById('stForm');
  const elNameState = document.getElementById('stFormState');
  const elImg  = document.getElementById('stFormImg');

  // ชื่อ: ใช้ชื่อของ displayMeta (ร่างฐานถ้ามี)
  if (elName) elName.textContent = displayName;
  if (elNameState) elNameState.textContent = displayName;

  // รูป: ใช้รูปของ displayMeta (ร่างฐานถ้ามี)
  if (elImg){
    if (displayMeta.image){
      elImg.style.backgroundImage = `url('${displayMeta.image}')`;
      elImg.style.backgroundSize = 'cover';
      elImg.style.backgroundPosition = 'center';
      elImg.textContent = '';
      elImg.classList.add('has-img');
    }else{
      elImg.style.backgroundImage = 'none';
      elImg.textContent = 'IMG';
      elImg.classList.remove('has-img');
    }
    elImg.setAttribute('aria-label', displayName);
  }
}
  function renderBuffer(){ const b = window.Chain.getBuffer(); $('#stBuffer').textContent = b.length? b.join(' + ') : '—'; }
  function setOutcome(msg){ $('#stOutcome').innerHTML = msg || '—'; }

// ========================
// COUNTERS (First-time only)
// ========================

// สร้าง/คืนค่าโครงตัวนับในเซฟ
window.ensureCounters = function ensureCounters(){
  const S = window.ensureSave?.(); if (!S) return {};
  S.counters = S.counters || {
    keywordsDiscovered: 0,   // ค้นพบคีย์เวิร์ดครั้งแรก (นับจำนวน id ไม่ซ้ำ)
    formsDiscovered:    0,   // ค้นพบฟอร์มครั้งแรก
    endingsDiscovered:  0,   // ค้นพบฉากจบครั้งแรก
    evolutionsDiscovered:0   // ค้นพบ "ร่างอีโว" ครั้งแรก (ดูจาก data)
  };
  return S.counters;
};

// ตัวช่วยดูว่า id นี้เป็น "ร่างอีโว" ของฟอร์มใดหรือไม่ (อ้างอิง DATA_FORMS)
function isEvoFormId(formId){
  const MAP = window.DATA_FORMS || {};
  for (const baseId in MAP){
    if (MAP[baseId]?.evoAlt === formId) return true;
  }
  return false;
}

// ========================
// MARKERS (+ counters update)
// ========================

// ค้นพบคีย์เวิร์ด (รองรับทั้งเดี่ยว/หลาย id)
// เรียกตอน Drink (คุณทำไว้แล้วใน brew.js)
window.markKeywordSeen = function markKeywordSeen(idOrIds){
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  const S = window.ensureSave?.(); if (!S) return;
  const C = window.ensureCounters(); // มีอยู่แล้วจากรอบก่อน

  S.seenKeywords = S.seenKeywords || {};
  let changed = 0;
  for (const id of ids){
    if (!id) continue;
    if (!S.seenKeywords[id]){        // นับเฉพาะครั้งแรก
      S.seenKeywords[id] = 1;
      changed++;
    }
  }
  if (changed){
    C.keywordsDiscovered = (C.keywordsDiscovered||0) + changed;
    window.saveSoon?.();

    // 🔄 รีเฟรช Codex → Keywords และแถบสรุป ถ้ากำลังเปิดอยู่
    rerenderCodexIfViewingKeywords();
  }
};

// ค้นพบฟอร์ม (เรียกใน onTransform / onEvo)
// จะเพิ่ม formsDiscovered ครั้งแรกเท่านั้น
// ถ้า id เป็น "ร่างอีโว" (ตาม DATA_FORMS.evoAlt) จะนับ evolutionsDiscovered ครั้งแรกด้วย
window.markFormSeen = function markFormSeen(formId){
  if (!formId) return;
  const S = window.ensureSave?.(); if (!S) return;
  const C = window.ensureCounters();

  S.seenForms = S.seenForms || {};

  const firstTime = !S.seenForms[formId];
  if (firstTime){
    S.seenForms[formId] = 1;
    C.formsDiscovered = (C.formsDiscovered||0) + 1;

    // ถ้าเป็นร่างอีโว (เช่น dragon_evo) → นับ evolution ครั้งแรก
    if (isEvoFormId(formId)){
      C.evolutionsDiscovered = (C.evolutionsDiscovered||0) + 1;
    }
    window.saveSoon?.();
  }
};

// ค้นพบฉากจบ (เรียกใน onEnd)
// จะเพิ่ม endingsDiscovered ครั้งแรกเท่านั้น
window.markEndingSeen = function markEndingSeen(endingId){
  if (!endingId) return;
  const S = window.ensureSave?.(); if (!S) return;
  const C = window.ensureCounters();

  S.seenEndings = S.seenEndings || {};
  const now = Date.now();

  if (!S.seenEndings[endingId]){        // ครั้งแรก
    S.seenEndings[endingId] = { times:1, lastAt:now };
    C.endingsDiscovered = (C.endingsDiscovered||0) + 1;
  }else{
    // เคยพบแล้ว → อัปเดตสถิติการจบ แต่ไม่เพิ่มตัวนับ "ครั้งแรก"
    const e = S.seenEndings[endingId];
    e.times = (e.times||0) + 1;
    e.lastAt = now;
  }
  window.saveSoon?.();
};

// (ตัวเลือก) utility อ่านสรุปรวมแบบเร็ว
let _totalsCache = null;
function computeTotals(){
  if (_totalsCache) return _totalsCache;
  const totalKeywords =
    Array.isArray(window.DATA_KEYWORDS) ? window.DATA_KEYWORDS.filter(Boolean).length : 0;

  const totalForms = Array.isArray(window.DATA_FORMS)
    ? window.DATA_FORMS.filter(Boolean).length
    : (window.DATA_FORMS ? Object.keys(window.DATA_FORMS).length : 0);

  const totalEndings = Array.isArray(window.DATA_ENDINGS_NEW)
    ? window.DATA_ENDINGS_NEW.filter(Boolean).length
    : (window.DATA_ENDINGS ? Object.keys(window.DATA_ENDINGS).length : 0);

  // cache only once the data scripts have actually loaded
  if (totalKeywords || totalForms || totalEndings){
    _totalsCache = { keywords: totalKeywords, forms: totalForms, endings: totalEndings };
    return _totalsCache;
  }
  return { keywords: totalKeywords, forms: totalForms, endings: totalEndings };
}

window.getDiscoverySummary = function getDiscoverySummary(){
  const S = window.ensureSave?.() || {};
  const C = window.ensureCounters?.() || {};

  // รวมทั้งหมดจาก data (cached — ค่าคงที่หลังโหลด)
  const totals = computeTotals();
  const totalKeywords = totals.keywords;
  const totalForms    = totals.forms;
  const totalEndings  = totals.endings;

  return {
    counters: {
      keywordsDiscovered:   C.keywordsDiscovered   || 0,
      formsDiscovered:      C.formsDiscovered      || 0,
      endingsDiscovered:    C.endingsDiscovered    || 0,
      evolutionsDiscovered: C.evolutionsDiscovered || 0,
    },
    totals: { keywords: totalKeywords, forms: totalForms, endings: totalEndings },
    seen: {
      keywords: Object.keys(S.seenKeywords || {}).length,
      forms:    Object.keys(S.seenForms    || {}).length,
      endings:  Object.keys(S.seenEndings  || {}).length,   // ← แก้: ให้เป็น “ตัวเลข”
    }
  };
};

  // init engine callbacks
  window.Chain.init({
  onTransform: (formId) => {
  // กระพริบดำก่อน แล้วค่อยสลับร่าง + อัปเดต UI เดิมทั้งหมด
  window.Animation?.transformForm(() => {
    const S = window.ensureSave(); S.form.id = formId; window.saveNow();
    window.markFormSeen?.(formId);
    updateFormUI(); 
    renderBuffer(); 
    setOutcome(`Transform → <b>${formId}</b>`);
    rerenderCodexIfViewingForms();   // บรรทัดเดิมของคุณ
  }, { flashes: 3, period: 300 });
},
  onEvo: (evoId)=>{
    const prev = window.ensureSave().form.id;
    const S = window.ensureSave(); S.form.id=evoId; window.saveNow();
    window.markFormSeen?.(evoId);
    updateFormUI(); renderBuffer(); setOutcome(`Evolution → <b>${evoId}</b>`);
    window.overlay?.showEvolutionOverlay?.(evoId, prev);
    rerenderCodexIfViewingForms();           // ⬅️ เพิ่มบรรทัดนี้
  },
  onEnd: (endId)=>{
  window.markEndingSeen?.(endId);
  updateFormUI(); renderBuffer(); setOutcome(`Ending → <b>${endId}</b>`);
  window.overlay?.showEndingOverlayById?.(endId);
  rerenderCodexIfViewingEndings();   // ⬅️ เพิ่มบรรทัดนี้
},
  log: (msg)=>{ appendLog(msg); },
  onBufferChange: (buf)=>{ renderBuffer(); }
});
  
  
  function rerenderCodexIfViewingKeywords(){
  const codexPanel = document.querySelector('#tab-codex');
  if (!codexPanel || codexPanel.hidden) return;
  const activeSub = document.querySelector('.codex-btn[aria-selected="true"]')?.dataset.sub || 'kw';
  if (activeSub === 'kw') {
    window.Codex?.renderKeywords?.();
  }
  window.Codex?.renderSummaryBar?.();
}

  // helper: ถ้ากำลังดู Codex → Forms อยู่ ให้เรนเดอร์ซ้ำ
function rerenderCodexIfViewingForms(){
  const codexPanel = document.querySelector('#tab-codex');
  if (!codexPanel || codexPanel.hidden) return;
  const activeSub = document.querySelector('.codex-btn[aria-selected="true"]')?.dataset.sub || 'kw';
  if (activeSub === 'forms') {
    window.Codex?.renderForms?.();
  }
  window.Codex?.renderSummaryBar?.();     // ✅ เพิ่ม
}

function rerenderCodexIfViewingEndings(){
  const codexPanel = document.querySelector('#tab-codex');
  if (!codexPanel || codexPanel.hidden) return;
  const activeSub = document.querySelector('.codex-btn[aria-selected="true"]')?.dataset.sub || 'kw';
  if (activeSub === 'endings') {
    window.Codex?.renderEndings?.();
  }
  window.Codex?.renderSummaryBar?.();     // ✅ เพิ่ม
}


  // expose helpers for other modules
  window.appendLog = appendLog;
  window.updateFormUI = updateFormUI;

  // controls
  // NOTE: #btnReset is handled centrally in settings.js (correct storage key + reload).
  $('#btnClearBuf')?.addEventListener('click', ()=>{ window.Chain.resetBuffer(); renderBuffer(); setOutcome('—'); appendLog('<span class="mono">[clear buffer]</span>'); });

  // first paint
  window.ensureSave(); updateFormUI(); renderBuffer(); setOutcome('—');
})();


// === Quick Brew Buttons: repeat / default / favorite (skip loading) ===
(function addQuickBrewButtons(){
  const input   = document.getElementById('labelInput');
  const brewBtn = document.getElementById('brewBtn');
  if (!input || !brewBtn) return;

  // หาจุดวาง: ใช้ parent เดียวกับปุ่ม Brew
  const host = brewBtn.parentElement || brewBtn.closest('.btns') || brewBtn.parentNode;
  if (!host) return;

  function makeBtn(txt, title){
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = txt;
    if (title) b.title = title;
    return b;
  }

  // 1) ปรุงยาจากคีย์เวิร์ดซ้ำ (ใช้คีย์เวิร์ดล่าสุดที่ brew สำเร็จ)
  const btnRepeat = makeBtn('↻', 'ปรุงจากคีย์เวิร์ดครั้งก่อน (ข้ามโหลด)');
  btnRepeat.addEventListener('click', ()=>{
    let label = (window.__LAST_BREW_LABEL__ || '').trim();
    if (!label && Array.isArray(window.__LAST_BREW_HITS__) && window.__LAST_BREW_HITS__.length){
      // สร้างจาก hits สำรอง
      label = window.__LAST_BREW_HITS__.map(h => h.usedName).join('-');
    }
    if (!label) return; // ยังไม่เคย brew เลย
    input.value = label;
    window.__brewDirect?.(); // ข้าม progress bar
  });

  // 2) ปรุงยาจากคีย์เวิร์ดเริ่มต้น (อ่านจาก Settings)
const btnDefault = makeBtn(' ➕', 'ปรุงจากคำเริ่มต้นใน Settings (ข้ามโหลด)');
btnDefault.addEventListener('click', ()=>{
  // รองรับทั้งกรณีมี getSetting และไม่มี
  const def = (
    (typeof window.getSetting === 'function' && window.getSetting('defaultWord')) ||
    (window.ensureSave?.().settings?.defaultWord) ||
    (typeof window.getSetting === 'function' && window.getSetting('defaultBrewWord')) || // เผื่อเคยใช้ชื่อเก่า
    ''
  ).trim();

  if (!def) {
    alert('ยังไม่ได้ตั้งค่า Default Brew Word ใน Settings');
    return;
  }

  const input = document.getElementById('labelInput') || document.querySelector('#input,#label');
  if (!input) {
    console.warn('ไม่พบช่องกรอกคีย์เวิร์ด (#labelInput)');
    return;
  }

  input.value = def;
  // เรียก brew โดยตรง (ข้าม progress bar 9 วิ)
  window.__brewDirect?.();
});

  // 3) Forms ที่ชื่นชอบ: ตั้ง/โหลด ทันที (ข้ามโหลด + แสดง overlay)
const btnFav = makeBtn('❤', 'ตั้ง/โหลดร่างโปรด (ข้ามโหลด)');
btnFav.addEventListener('click', () => {
  const S = window.ensureSave?.() || {};
  const cur = S.form?.id || 'human';
  const fav = S.settings?.favoriteForm || '';

  // สร้าง overlay ถ้ายังไม่มี
  let ov = document.getElementById('favOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'favOverlay';
    ov.style.position = 'fixed';
    ov.style.inset = '0';
    ov.style.background = 'rgba(0,0,0,0.6)';
    ov.style.display = 'flex';
    ov.style.justifyContent = 'center';
    ov.style.alignItems = 'center';
    ov.style.zIndex = '9999';

    ov.innerHTML = `
      <div style="background:#222;border-radius:12px;padding:16px 24px;min-width:260px;text-align:center;box-shadow:0 0 12px #000a;">
        <h3 style="margin:0 0 10px;font-size:18px;">Favorite Form</h3>
        <p id="favDesc" style="margin:4px 0 16px;color:#ccc;"></p>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button id="btnFavTransform" class="btn">Transform</button>
          <button id="btnFavSave" class="btn">Save new Form</button>
          <button id="btnFavClose" class="btn danger">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(ov);
  }

  // อัปเดตข้อความใน overlay
  const desc = ov.querySelector('#favDesc');
  if (fav && fav !== '') {
    desc.innerHTML = `ร่างโปรดปัจจุบันคือ <b>${fav}</b><br>ร่างปัจจุบันของคุณคือ <b>${cur}</b>`;
  } else {
    desc.innerHTML = `ยังไม่มีร่างโปรด<br>ร่างปัจจุบันของคุณคือ <b>${cur}</b>`;
  }

  ov.style.opacity = '0';
  ov.style.transition = 'opacity 0.2s ease';
  ov.style.display = 'flex';
  setTimeout(() => (ov.style.opacity = '1'), 10);

  // ปุ่มปิด
  ov.querySelector('#btnFavClose').onclick = () => {
    ov.style.opacity = '0';
    setTimeout(() => (ov.style.display = 'none'), 200);
  };

  // ปุ่ม Transform → โหลดร่างโปรดทันที
  ov.querySelector('#btnFavTransform').onclick = () => {
    if (!fav) {
      alert('ยังไม่มีร่างโปรด');
      return;
    }
    window.Chain?.setForm?.(fav);
    const SV = window.ensureSave?.();
    if (SV) {
      SV.form.id = fav;
      window.saveNow?.();
    }
    window.updateFormUI?.();
    window.renderBuffer?.();
    window.setOutcome?.(`Transform → <b>${fav}</b>`);
    ov.querySelector('#btnFavClose').click();
  };

  // ปุ่ม Save new Form → ตั้งร่างปัจจุบันเป็นโปรด
  ov.querySelector('#btnFavSave').onclick = () => {
    S.settings = S.settings || {};
    S.settings.favoriteForm = cur;
    window.saveNow?.();
    window.setOutcome?.(`ตั้ง "${cur}" เป็นร่างโปรดเรียบร้อย`);
    ov.querySelector('#btnFavClose').click();
  };
});

  // แทรกปุ่มเข้า host
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexWrap = 'wrap';
  wrap.style.gap = '8px';
  wrap.style.marginTop = '8px';
  wrap.append(btnRepeat, btnDefault, btnFav);
  host.parentNode.insertBefore(wrap, host.nextSibling);
})();

// ===== Tabs (top + bottom รองรับพร้อมกัน) =====
(function tabSetup(){
  const $  = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
  const TAB_BTNS = $$('.tab-btn[data-tab]');

  TAB_BTNS.forEach(btn=>{
    btn.addEventListener('click', ()=>selectTab(btn.dataset.tab));
  });

  function selectTab(name){
  TAB_BTNS.forEach(b=>b.setAttribute('aria-selected', b.dataset.tab===name));
  ['brew','codex','settings'].forEach(id=>{
    const el = $('#tab-'+id);
    if (el) el.hidden = (id!==name);
  });

  if (name === 'brew') {
    $('#labelInput')?.focus();
    return;
  }

  if (name === 'codex') {
  window.Codex?.renderSummaryBar?.();
    // หาว่า sub-tab ไหน active อยู่ ถ้าไม่เจอใช้ 'kw'
    const active = document.querySelector('.codex-btn[aria-selected="true"]')
                ||  document.querySelector('.codex-btn[data-sub="kw"]');
    const sub = active?.dataset.sub || 'kw';

    // เรนเดอร์ให้ตรงกับ engine จริง (ผ่าน Codex module)
    if (sub === 'kw')       window.Codex?.renderKeywords?.();
    else if (sub === 'forms') window.Codex?.renderForms?.();
    else                     window.Codex?.renderEndings?.();
  }
}

  // เปิด Brew เป็นค่าเริ่มต้น
  selectTab('brew');
})();

function selectCodex(sub){
  document.querySelectorAll('.codex-btn').forEach(b=>
    b.setAttribute('aria-selected', b.dataset.sub===sub)
  );
  if (sub==='kw')        window.Codex?.renderKeywords?.();
  else if (sub==='forms')window.Codex?.renderForms?.();
  else                   window.Codex?.renderEndings?.();

  window.Codex?.renderSummaryBar?.();   // ✅ อัปเดตแถบสรุปทุกครั้งที่เปลี่ยน sub
}

// listener: เหลือแค่นี้พอ
document.querySelectorAll('.codex-btn').forEach(b=>{
  b.addEventListener('click', ()=> selectCodex(b.dataset.sub));
});

/**
 * zeroPadNo - แปลงเลข no ให้เป็น string ที่ zero-pad ตามความยาวที่กำหนด
 * @param {number|string} val  เลขต้นฉบับ เช่น 1 หรือ "23"
 * @param {number} width       ความยาวมาตรฐาน เช่น 4 จะได้ "0001"
 * @returns {string}
 */
function zeroPadNo(val, width=4){
  const num = Number(val);
  if (!Number.isFinite(num)) return String(val); // ถ้าไม่ใช่ตัวเลขก็คืนค่าเดิม
  return String(num).padStart(width, '0');
}