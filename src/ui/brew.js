// ==== Fast keyword check (build once) ====
function __buildKnownKeywordSet(){
  if (window.__KNOWN_KEYS__) return window.__KNOWN_KEYS__;
  const set = new Set();

  // 1) จาก DATA_KEYWORDS (รองรับทั้ง array/object)
  const DK = window.DATA_KEYWORDS || window.DATA_KW || {};
  if (Array.isArray(DK)) {
    for (const k of DK) {
      if (!k) continue;
      if (k.id) set.add(String(k.id).toLowerCase());
      if (k.name) set.add(String(k.name).toLowerCase());
      if (Array.isArray(k.synonyms)) {
        for (const s of k.synonyms) set.add(String(s).toLowerCase());
      }
    }
  } else {
    for (const id of Object.keys(DK)) {
      const k = DK[id]; if (!k) continue;
      set.add(id.toLowerCase());
      if (k.name) set.add(String(k.name).toLowerCase());
      if (Array.isArray(k.synonyms)) {
        for (const s of k.synonyms) set.add(String(s).toLowerCase());
      }
    }
  }

  // 2) เผื่อ codex สร้าง mapping ไว้แล้ว
  if (window.Codex?.allKeywords) {
    for (const s of window.Codex.allKeywords) set.add(String(s).toLowerCase());
  }

  return (window.__KNOWN_KEYS__ = set);
}

function isKnownLabel(label){
  if (!label) return false;
  const k = String(label).trim().toLowerCase();
  try { return __buildKnownKeywordSet().has(k); } catch { return false; }
}

// === Lock/Unlock Brew controls ===
function lockBrewControls(lock) {
  const input  = document.getElementById('labelInput');
  const brew   = document.getElementById('brewBtn');
  if (lock) {
    brew?.setAttribute('disabled', 'true');
    input?.setAttribute('disabled', 'true');
  } else {
    brew?.removeAttribute('disabled');
    input?.removeAttribute('disabled');
  }
}

// === Keyword index with synonyms support ===
window.KW_INDEX = (function buildKeywordIndex(){
  const raw = (window.DATA_KEYWORDS?.list || window.DATA_KEYWORDS || []);
  const map = Object.create(null);

  function addAlias(alias, base){
    if (!alias || !base?.id) return;
    const key = String(alias).trim().toLowerCase();
    if (!key) return;
    // ใช้ชื่อที่จะแสดงใน UI: name > usedName > id
    map[key] = { id: base.id, usedName: base.name || base.usedName || base.id };
  }

  for (const k of raw){
    if (!k?.id) continue;
    addAlias(k.id, k);
    addAlias(k.name, k);
    addAlias(k.usedName, k);
    (k.synonyms || []).forEach(s => addAlias(s, k));
  }
  return map;
})();

;(function(){
  const $ = s=>document.querySelector(s);
  const LOOKUP = (()=> {
    const list = Array.isArray(window.DATA_KEYWORDS?.list) ? window.DATA_KEYWORDS.list
               : Array.isArray(window.DATA_KEYWORDS) ? window.DATA_KEYWORDS
               : [];
    const map = Object.create(null);
    for (const k of list){ const key=(k.usedName||k.name||k.id||'').toLowerCase(); if (key) map[key] = k; }
    return map;
  })();

  function tokensFromLabel(label){
    return (label||'').trim().split(/[\s\-]+/).filter(Boolean).map(s=>s.toLowerCase());
  }

  // === Flavor text: map keyword id → flavor (จาก DATA_KEYWORDS) ===
  const FLAVOR_BY_ID = (()=>{
    const list = Array.isArray(window.DATA_KEYWORDS?.list) ? window.DATA_KEYWORDS.list
               : Array.isArray(window.DATA_KEYWORDS) ? window.DATA_KEYWORDS
               : [];
    const map = Object.create(null);
    for (const k of list){ if (k?.id && k.flavor) map[k.id] = k.flavor; }
    return map;
  })();

  // รอให้ผู้เล่นแตะกล่อง Log เพื่อดำเนินการต่อ (ใช้คั่นก่อนแปลงร่าง/ตาย)
  function waitForLogTap(){
    return new Promise(resolve=>{
      const box = document.getElementById('log');
      if (!box){ resolve(); return; }

      const hint = document.createElement('div');
      hint.className = 'log-continue';
      hint.textContent = '▼ แตะเพื่อดำเนินการต่อ';
      box.appendChild(hint);
      box.scrollTop = box.scrollHeight;
      box.classList.add('awaiting-tap');

      box.addEventListener('click', function onTap(){
        box.classList.remove('awaiting-tap');
        hint.remove();
        resolve();
      }, { once:true });
    });
  }

  function brew(){
  const input  = $('#labelInput');
  const result = $('#resultBox');
  const drink  = $('#drinkBtn');

  // ดึง "คำดิบ" ที่ผู้เล่นพิมพ์ (รักษาเคสและสะกดตามจริง)
  const rawTokens = (input.value || '').trim().split(/[\s\-]+/).filter(Boolean);
  if (!rawTokens.length){
    result.textContent = 'ใส่อะไรสักอย่างก่อน…';
    return;
  }

  // ใช้ตัวพิมพ์เล็กเฉพาะตอน lookup
  const normTokens = rawTokens.map(t => t.toLowerCase());

  // ตรวจ unknown จาก normTokens
  const unknown = normTokens.filter(t => !window.KW_INDEX[t]);
  if (unknown.length){
    result.innerHTML = `<span class="warn">ไม่รู้จัก: ${unknown.join(', ')}</span>`;
    drink.disabled = true;
    return;
  }

  // สร้าง hits: id จาก index, แต่ usedName คือ "คำดิบ" ที่ผู้เล่นพิมพ์
  const hits = normTokens.map((norm, i) => {
    const k = window.KW_INDEX[norm];
    return {
      id: k.id,
      usedName: rawTokens[i]   // ← แสดงตามที่พิมพ์จริง (Flame ก็แสดง Flame)
    };
  });
  window.__LAST_BREW_HITS__ = hits;


  result.textContent = `ได้: Potion of ${hits.map(h => h.usedName).join('-')}`;
  // ... (โค้ดตั้งผลลัพธ์เดิมของคุณ)
// เปิด Drink ได้ตามเดิม
document.getElementById('drinkBtn')?.removeAttribute('disabled');

// 🔒 ล็อก Brew & ช่องกรอก จนกว่าจะ Drink หรือ Discard
lockBrewControls(true);
// เก็บคีย์เวิร์ดล่าสุด (ถ้ายังไม่ได้เก็บ)
window.__LAST_BREW_LABEL__ = (document.getElementById('labelInput')?.value || '').trim();

// ให้แน่ใจว่ามีปุ่ม Discard และผูก handler
ensureDiscardButton();
}

  async function drink(){
  const hits = Array.isArray(window.__LAST_BREW_HITS__)? window.__LAST_BREW_HITS__ : [];
  if (!hits.length){ window.appendLog?.('Nothing to drink.'); return; }

  // กันกดซ้ำระหว่างรอผู้เล่นแตะ Log
  $('#drinkBtn').disabled = true;
  document.getElementById('discardBtn')?.setAttribute('disabled', 'true');

  // ส่งให้เอนจิน (ตามลำดับเดิมของคุณ) + แสดง flavor text ใน Log ตอนดื่มแต่ละคัพ
  // ถ้ามี flavor → แสดงก่อน แล้ว "หยุดรอ" ให้ผู้เล่นแตะกล่อง Log
  // ค่อยดำเนินการต่อ (แปลงร่าง/ตาย ฯลฯ)
  for (const h of hits){
    const flavor = FLAVOR_BY_ID[h.id];
    if (flavor){
      window.appendLog?.(`<span class="flavor">${flavor}</span>`);
      await waitForLogTap();
    }
    window.Chain.feed(h.id);
  }

  // สรุปเป็น ids ของคีย์เวิร์ด
  const ids = hits.map(h=>h.id).filter(Boolean);

  // มาร์ค “ครั้งแรกเท่านั้น” + รีเฟรช Codex หากผู้เล่นอยู่ที่แท็บ Keywords
  if (ids.length){
    window.markKeywordSeen?.(ids);
    // ⬇️ รีเฟรช Codex → Keywords + แถบสรุป (ถ้ากำลังเปิดอยู่)
    if (typeof rerenderCodexIfViewingKeywords === 'function'){
      rerenderCodexIfViewingKeywords();
    }else{
      // เผื่อยังไม่มี helper: อย่างน้อยอัปเดตแถบสรุปไว้ก่อน
      window.Codex?.renderSummaryBar?.();
    }
  }

  // ล้างอินพุต / ปิดปุ่มดื่ม
  $('#labelInput').value = '';
  $('#drinkBtn').disabled = true;
  
lockBrewControls(false);
document.getElementById('discardBtn')?.setAttribute('disabled', 'true');
}

  // === ผูกปุ่ม Brew + Drink ===
window.__brewDirect = brew; // ให้ที่อื่นเรียกตรงได้ (เช่นจาก Codex)

// ===== Mini Brew Overlay (ข้อความสุ่ม + แถบโหลดด้านใน + ปุ่ม Skip) =====
(function(){
  const BREW_QUOTES = [
    "กำลังกวนน้ำยา… อย่าให้ไหม้หม้อ!",
    "ใส่ส่วนผสมลับ… ห้ามบอกใคร",
    "เดือดพอดี ๆ กำลังดีเลย",
    "กลิ่นเหมือนความลับกำลังสุก",
    "ฟองพุ่งปุด ๆ นี่แหละใช่",
    "อย่ากระพริบตา—ช่วงสำคัญ!"
  ];
  const randMsg = () => BREW_QUOTES[Math.floor(Math.random() * BREW_QUOTES.length)];

  // state ภายใน overlay
  let rafId = null, endTime = 0, running = false;

  function showBrewMiniOverlay(durationMs, onDone){
    let ov = document.getElementById('miniBrewOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'miniBrewOverlay';
      Object.assign(ov.style, {
        position:'fixed', inset:'0', display:'flex',
        alignItems:'center', justifyContent:'center',
        background:'rgba(0,0,0,0.55)', zIndex:'8000',
        opacity:'0', transition:'opacity 200ms ease'
      });
      
      ov.innerHTML = `
    <div style="min-width:260px;max-width:380px;background:#111;border-radius:14px;padding:14px 16px;box-shadow:0 12px 36px rgba(0,0,0,.4)">
    <div id="miniBrewMsg" style="font-weight:700;margin-bottom:8px">Brewing…</div>
    <div id="miniBar" class="miniBar"><div class="fill" id="miniFill"></div></div>
    <div style="text-align:right;margin-top:10px">
      <button id="miniSkip" class="btn">Skip</button>
    </div>
  </div>`;
      document.body.appendChild(ov);
    }

    // ตั้งข้อความสุ่ม
    ov.querySelector('#miniBrewMsg').textContent = randMsg();

    // รีเซ็ตแถบ
    const bar = ov.querySelector('#miniBar');
    bar.style.width = '0%';
    bar.style.animation = 'none';
    // glow animation
    bar.offsetWidth; // reflow
    bar.style.animation = 'miniGlow 1.2s linear infinite';

    // เปิด overlay
    ov.style.display = 'flex';
    requestAnimationFrame(()=> ov.style.opacity = '1');

    // เริ่มนับเวลาแบบ rAF (จะอยู่ใน overlay ไม่ใช้แถบ global)
    running = true;
    const start = performance.now();
    endTime = start + durationMs;

    const tick = (now)=>{
      if (!running) return;
      const t = Math.min(1, (now - start) / durationMs);
      bar.style.width = (t*100).toFixed(3) + '%';
      if (t >= 1) {
        running = false;
        close();
        onDone && onDone();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    function close(){
      ov.style.opacity = '0';
      setTimeout(()=>{ ov.style.display = 'none'; }, 200);
    }
    function cancel(){
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  close();
  delete document.body.dataset.brewing;
}
window.closeBrewMiniOverlay = cancel; // ← ให้ overlay.js
    // bind ปุ่ม Skip
    ov.querySelector('#miniSkip').onclick = ()=>{
      // ข้ามทันที
      cancel();
      onDone && onDone();
      delete document.body.dataset.brewing;
    };
  }

  // keyframes สำหรับ glow (วางแบบ inline)
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes miniGlow {
      from { background-position: 200% 0; }
      to   { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(styleTag);

  // เปิดใช้จากภายนอก
  window.showBrewMiniOverlay = showBrewMiniOverlay;
})();


// === ปุ่ม Brew: ใช้มินิโอเวอร์เลย์ + แถบโหลดด้านใน (ไม่มี Close, มีแค่ Skip) ===
const btnBrew = document.getElementById('brewBtn');
if (btnBrew) {
  btnBrew.replaceWith(btnBrew.cloneNode(true)); // กัน event ซ้อน
}
document.getElementById('brewBtn')?.addEventListener('click', () => {
  // 9 วินาทีตามสเปค (เฉพาะ Brew ปกติ)
  const DURATION = 9000;
  if (document.body.dataset.brewing === '1') return;
document.body.dataset.brewing = '1';

  // เปิด overlay เล็ก + แถบโหลดในตัว
  const mini = window.showBrewMiniOverlay?.(DURATION, () => {
    // ครบเวลา (หรือ skip) → ต้มเสร็จทันที
    (window.__brewDirect || window.brew || function(){})();
    delete document.body.dataset.brewing;
  });
});

function ensureDiscardButton() {
  let btn = document.getElementById('discardBtn');
  if (!btn) {
    // สร้างปุ่มใหม่วางข้างๆ drinkBtn
    const drink = document.getElementById('drinkBtn');
    const host  = drink?.parentElement || document.querySelector('#brewBar .btns') || drink?.parentNode || document.body;
    btn = document.createElement('button');
    btn.id = 'discardBtn';
    btn.className = 'btn danger';
    btn.textContent = 'Discard';
    btn.style.marginLeft = '8px';
    btn.addEventListener('click', discardPotion);
    host?.appendChild(btn);
  }
  // เปิดใช้งานทันทีหลังปรุงเสร็จ
  btn.removeAttribute('disabled');
}

function discardPotion() {
  // ล้างสถานะขวดปัจจุบัน (ไม่ดื่ม แต่ทิ้งเพื่อเริ่มใหม่)
  try {
    // ล้างบัฟเฟอร์คอมโบที่เกิดจากชุดปรุงล่าสุด (ถ้ามีระบบนี้)
    window.Chain?.resetBuffer && window.Chain.resetBuffer();
  } catch(_) {}

  // ล้างผลลัพธ์ใน UI (ปรับให้ตรงกับ element ของคุณ)
const result = document.getElementById('resultBox');
  if (result) result.textContent = '';

  // ปิดปุ่ม Drink เริ่มใหม่
  document.getElementById('drinkBtn')?.setAttribute('disabled', 'true');

  // ✅ ปลดล็อก Brew & ช่องกรอก ให้เริ่มปรุงรอบใหม่ได้
  lockBrewControls(false);

  // ปิดปุ่ม Discard เองป้องกันกดซ้ำ (จะถูกเปิดอีกครั้งเมื่อปรุงรอบใหม่)
  document.getElementById('discardBtn')?.setAttribute('disabled', 'true');

  // log เล็กน้อย
  window.appendLog?.('Discard the potion bottle');
}

// ปุ่ม Drink → เรียกตามเดิม
document.getElementById('drinkBtn')?.addEventListener('click', drink);
})();

