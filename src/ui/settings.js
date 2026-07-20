(function(){
  const S = window.ensureSave?.() || (window.SAVE = { state:{}, settings:{} });
  S.settings = Object.assign({
    compactUI: false,
    highContrast: false,
    instantOverlay: true,
    autoScrollLog: true
  }, S.settings||{});
  window.saveNow && window.saveNow();

  const $ = s => document.querySelector(s);
  const elCompact  = $('#setCompact');
  const elContrast = $('#setContrast');
  const elInstant  = $('#setInstant');
  const elAuto     = $('#setAutoScroll');
  const btnReset   = $('#btnReset');

  // === Default Brew Word ===
  const elDefault = document.querySelector('#setDefaultWord');
  if (elDefault) elDefault.value = S.settings.defaultWord || '';
  elDefault?.addEventListener('input', e => {
    S.settings.defaultWord = String(e.target.value || '').trim();
    saveNow();
  });
  
  // sync -> UI
  if (elCompact)  elCompact.checked  = !!S.settings.compactUI;
  if (elContrast) elContrast.checked = !!S.settings.highContrast;
  if (elInstant)  elInstant.checked  = !!S.settings.instantOverlay;
  if (elAuto)     elAuto.checked     = !!S.settings.autoScrollLog;

  // apply to DOM
  function apply(){
    const root = document.documentElement;
    root.classList.toggle('compact-ui',   !!S.settings.compactUI);
    root.classList.toggle('high-contrast',!!S.settings.highContrast);
    root.classList.toggle('instant-overlay', !!S.settings.instantOverlay);
  }
  apply();

  // UI -> save
  elCompact?.addEventListener('change',  e=>{ S.settings.compactUI    = e.target.checked; saveNow(); apply(); });
  elContrast?.addEventListener('change', e=>{ S.settings.highContrast = e.target.checked; saveNow(); apply(); });
  elInstant?.addEventListener('change',  e=>{ S.settings.instantOverlay = e.target.checked; saveNow(); apply(); });
  elAuto?.addEventListener('change',     e=>{ S.settings.autoScrollLog = e.target.checked; saveNow(); });

  // ให้คนอื่นเรียกใช้ค่านี้ได้สะดวก
  window.getSetting = (k)=> (window.ensureSave?.().settings||{})[k];
})();

(function(){
  // จับคลิกทั้งหน้าให้ชัวร์ (มีปุ่มแยก Soft/Hard เพราะมือถือกด Shift ไม่ได้)
  document.addEventListener('click', function(e){
    const btn = e.target.closest?.('#btnReset, #btnSoftReset');
    if (!btn) return;
    e.preventDefault();

    const hard = btn.id === 'btnReset';
    const msg  = hard
      ? 'Hard Reset: ล้างข้อมูลทั้งหมด (รวม Settings) — แน่ใจหรือไม่?'
      : 'Soft Reset: ล้างความคืบหน้า (เก็บ Settings) — แน่ใจหรือไม่?';
    if (!confirm(msg)) return;

    btn.disabled = true;
    if (hard) {
      // ✅ ใช้ API จาก save.js ลบคีย์ poe_v45_save แล้วสร้างเซฟใหม่อัตโนมัติ
      try { window.__hardResetSave?.(); } catch(e){ console.warn(e); }
    } else {
      // ✅ Soft reset: รีเซ็ต "runtime state" ให้กลับค่าเริ่ม (ชนิดต้องเป็น map)
      const S = window.ensureSave?.();
      if (S) {
        S.form = { id: 'human' };
        S.seenKeywords = {};                // maps (ไม่ใช่ arrays)
        S.seenForms    = { human: 1 };      // human ถูกค้นพบ 1 ครั้ง
        S.seenEndings  = {};
        S.counters = {
          keywordsDiscovered: 0,
          formsDiscovered:    1,            // อย่างน้อย human 1
          endingsDiscovered:  0,
          evolutionsDiscovered: 0
        };
        try { window.saveNow?.(); } catch(e){ console.warn(e); }
      }
    }

    // รีเซ็ตเอนจิน/UI ให้สะอาด
    try { window.overlay?.close?.(); } catch(_){}
    try { window.Chain?.resetBuffer?.(); } catch(_){}
    try { window.Chain?.setForm?.('human'); } catch(_){}
    try { window.updateFormUI?.(); } catch(_){}
    try { window.appendLog?.('[System] Save reset.'); } catch(_){}

    // รีโหลดเพื่อการันตีว่าโหลดเซฟใหม่จาก poe_v45_save
    setTimeout(()=>location.reload(), 60);
  });
})();