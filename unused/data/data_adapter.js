/* data_adapter_patch.js
 * Adapter ชั้นกลาง: รวม/ทำให้ DATA_* เป็นทรงมาตรฐาน, เติมข้อมูล endings จาก recipes,
 * รองรับ alias id (เช่น unknows vs unknowns), sync จาก SAVE, และมี diagnostics แบบไม่ทำเกมล้ม
 */
(function(){
  const DEV_MODE = true; // ตั้ง false หากไม่อยากเห็น log เตือน

  // -------- Utils --------
  const asArray = x => !x ? [] : (Array.isArray(x) ? x : Object.values(x));
  const safeName = x => x?.name || x?.usedName || x?.label || x?.id || '???';

  // -------- อ่าน RAW --------
  const RAW = {
    KW:      asArray(window.DATA_KEYWORDS?.list ?? window.DATA_KEYWORDS),
    FORMS:   asArray(window.DATA_FORMS),
    ENDS:    asArray(window.DATA_ENDINGS_NEW ?? window.DATA_ENDINGS),
    RECIPES: asArray(window.DATA_RECIPES ?? window.RECIPES),
  };

  // -------- alias/canonical id --------
  // ปรับตรงนี้ถ้ามีสะกดหลายแบบ ให้ไป canonical เดียว (เลือก canonical = 'unknows' ตามโปรเจกต์)
  const ID_ALIASES = {
    'unknowns': 'unknows',
    'unknows':  'unknows',
  };
  const canon = id => (id && ID_ALIASES[String(id)]) || id;

  // -------- Views (read-only) --------
  const KW = RAW.KW.map(k=>({
    id: k.id,
    name: safeName(k),
    lethal: !!k.lethal,
    transform: !!k.transform,
    evoable: !!k.evoable,
    dialogue: !!k.dialogue,
    found: !!k.found,
  }));

  const FORMS = RAW.FORMS.map(f=>({
    id: canon(f.id),
    name: safeName(f),
    image: f.image || f.img || '',
    groups: Array.isArray(f.group||f.groups) ? (f.group||f.groups) : (f.group ? [f.group] : []),
    discovered: !!f.discovered,
    evoAlt: f.evoAlt || null,
  }));

  const ENDS = RAW.ENDS.map(e=>({
    id: e.id,
    name: e.name || e.overlay?.title || e.id,
    image: e.overlay?.image || e.img || '',
    discovered: !!e.discovered,
    reqForm: e.reqForm || e.requiredForm || '', // จะเติมจาก recipe ถ้าว่าง
    combo:   e.combo || '',                      // จะเติมจาก recipe ถ้าว่าง
    rebornTo: e.rebornTo || '',
  }));

  const MAP = {
    KW:     Object.fromEntries(KW.map(x=>[x.id, x])),
    FORMS:  Object.fromEntries(FORMS.map(x=>[x.id, x])),
    ENDS:   Object.fromEntries(ENDS.map(x=>[x.id, x])),
  };

  // -------- เติม reqForm/combo ให้ Endings จาก RECIPES --------
  RAW.RECIPES.forEach(r=>{
    const endId = r.toEnd || r.toEnding;
    if (!endId) return;
    const E = MAP.ENDS[endId];
    if (!E) return;
    if (!E.reqForm && r.form) E.reqForm = canon(r.form);
    if (!E.combo && Array.isArray(r.requires)){
      E.combo = r.requires.map(s=>{
        const c = s.count || 1;
        const id = canon(s.id);
        return c>1 ? `${id}×${c}` : id;
      }).join(' + ');
    }
  });

  // -------- Sync “ค้นพบแล้ว” จาก SAVE (ไม่แตะ SAVE) --------
  function syncFromSave(){
    try{
      const S = window.SAVE || {};
      const seenKW    = new Set(Object.keys(S.seenKeywords||{}));
      const seenForms = new Set(Object.keys(S.seenForms   ||{}));
      const seenEnds  = new Set(Object.keys(S.seenEndings ||{}));
      KW.forEach(k=>{ if (seenKW.has(k.id))    k.found = true; });
      FORMS.forEach(f=>{ if (seenForms.has(f.id)) f.discovered = true; });
      ENDS.forEach(e=>{ if (seenEnds.has(e.id))  e.discovered = true; });
    }catch(_){}
  }
  syncFromSave();

  // -------- Public helpers --------
  function getKeywordById(id){ return MAP.KW[canon(id)] || null; }
  function getFormById(id){ return MAP.FORMS[canon(id)] || null; }
  function getEndingById(id){ return MAP.ENDS[id] || null; }

  function getCounts(){
    return {
      keywords: { found: KW.filter(x=>x.found).length, total: KW.length },
      forms:    { found: FORMS.filter(x=>x.discovered).length, total: FORMS.length },
      endings:  { found: ENDS.filter(x=>x.discovered).length, total: ENDS.length },
    };
  }

  function refreshFromSave(){
    syncFromSave();
    // ถ้ามี CodexUI → แจ้งให้รีเฟรชด้วย
    window.CodexUI?.refreshFromSave?.();
    window.CodexUI?.forceRerender?.();
  }

  // -------- Diagnostics (เตือน ไม่ throw) --------
  function diag(){
    if (!DEV_MODE) return;
    const warn = (...a)=> console.warn('[DATA DIAG]', ...a);

    RAW.RECIPES.forEach(r=>{
      (r.requires||[]).forEach(s=>{
        if (!MAP.KW[canon(s.id)]) warn('requires → keyword not found:', s.id, 'in recipe:', r.id);
      });
      if (r.form && !MAP.FORMS[canon(r.form)]) warn('form guard not found:', r.form, 'in recipe:', r.id);
      if (r.toForm && !MAP.FORMS[canon(r.toForm)]) warn('toForm not found:', r.toForm, 'in recipe:', r.id);
      const endId = r.toEnd || r.toEnding;
      if (endId && !MAP.ENDS[endId]) warn('toEnd not found:', endId, 'in recipe:', r.id);
    });

    // รายงาน alias ที่ถูกใช้งาน
    const aliasUsed = Object.keys(ID_ALIASES).filter(a=> MAP.FORMS[a] || MAP.KW[a]);
    if (aliasUsed.length) warn('alias in effect for ids:', aliasUsed);
  }
  diag();

  // -------- Expose (ไม่รบกวนของเดิม) --------
  window.$DATA = Object.freeze({
    RAW, KW, FORMS, ENDS,
    getKeywordById, getFormById, getEndingById,
    getCounts, refreshFromSave, canon,
  });
  // เผื่อ engine เก่า
  window.getKeywordById = window.getKeywordById || getKeywordById;
  window.getFormById    = window.getFormById    || getFormById;
  window.getEndingById  = window.getEndingById  || getEndingById;

  if (DEV_MODE) console.log('[DATA ADAPTER] ready:', $DATA.getCounts());
})();