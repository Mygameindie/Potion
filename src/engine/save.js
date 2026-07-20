;(() => {
  // ===== CONFIG =====
  const KEY = 'poe_v45_save';
  const VERSION = '1.1'; // bump เมื่อเปลี่ยน schema serialization
  const SAVE_DEBOUNCE_MS = 450;
  const SOFT_QUOTA_BYTES = 2_000_000; // ~2MB safety (localStorage ทั่วไป 5–10MB)

  // ===== INTERNAL STATE =====
  let SAVE = null;
  let _saveTimer = null;

  // ===== RUNTIME <-> STORAGE TRANSFORMS =====
  // Runtime: maps { id:1 } = เร็ว/lookup ง่าย
  // Storage: arrays ["id","id2"] = JSON เล็กลง
  function runtimeFromStorage(stored) {
    const S = stored || {};
    const out = {
      version: S.version || VERSION,
      form: S.form && S.form.id ? { id: S.form.id } : { id: 'human' },
      // arrays -> maps
      seenKeywords: arrToMap(S.seenKeywordsArr || S.seenKeywords || []),
      seenForms:    arrToMap(S.seenFormsArr    || S.seenForms    || []),
      seenEndings:  arrToMap(S.seenEndingsArr  || S.seenEndings  || []),
      counters: {
        keywordsDiscovered:   num(S.counters?.keywordsDiscovered, 0),
        formsDiscovered:      num(S.counters?.formsDiscovered, 0),
        endingsDiscovered:    num(S.counters?.endingsDiscovered, 0),
        evolutionsDiscovered: num(S.counters?.evolutionsDiscovered, 0),
      },
      settings: (S.settings && typeof S.settings === 'object') ? { ...S.settings } : {},
    };

    // First-boot guarantee: mark human discovered exactly once
    if (!out.seenForms.human) {
      out.seenForms.human = 1;
      out.counters.formsDiscovered = Math.max(out.counters.formsDiscovered || 0, 1);
    }

    return out;
  }

  function storageFromRuntime(rt) {
    const S = rt || {};
    const payload = {
      version: VERSION,
      form: { id: S.form?.id || 'human' },
      // maps -> arrays (เล็กกว่า)
      seenKeywordsArr: mapToArr(S.seenKeywords || {}),
      seenFormsArr:    mapToArr(S.seenForms    || {}),
      seenEndingsArr:  mapToArr(S.seenEndings  || {}),
      counters: {
        keywordsDiscovered:   num(S.counters?.keywordsDiscovered, 0),
        formsDiscovered:      num(S.counters?.formsDiscovered, 0),
        endingsDiscovered:    num(S.counters?.endingsDiscovered, 0),
        evolutionsDiscovered: num(S.counters?.evolutionsDiscovered, 0),
      },
      settings: { ...(S.settings || {}) },
    };
    return payload;
  }

  function arrToMap(a) {
    if (Array.isArray(a)) {
      const m = {};
      for (const id of a) if (id) m[id] = 1;
      return m;
    }
    if (a && typeof a === 'object') return { ...a };
    return {};
  }
  function mapToArr(m) {
    return Object.keys(m || {}).filter(Boolean).sort();
  }
  function num(v, d=0) {
    return Number.isFinite(v) ? v : d;
  }

  // ====== SAVE / LOAD ======
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveNow() {
    if (!SAVE) return;
    const payload = storageFromRuntime(SAVE);
    let text = '';
    try {
      text = JSON.stringify(payload);
    } catch {
      // last resort: drop to minimal
      text = '{"version":"'+VERSION+'","form":{"id":"'+(SAVE.form?.id||'human')+'"}}';
    }

    // soft-quota warn (ไม่บล็อกการเซฟ แต่เตือน)
    try {
      const bytes = new Blob([text]).size;
      if (bytes > SOFT_QUOTA_BYTES) {
        console.warn('[save] payload ~', (bytes/1024|0), 'KB exceeds soft quota, consider trimming data.');
      }
    } catch {}

    try {
      localStorage.setItem(KEY, text);
    } catch (e) {
      console.warn('[save] localStorage write failed:', e?.message || e);
    }
  }

  function saveSoon(delay = SAVE_DEBOUNCE_MS) {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      saveNow();
    }, delay);
  }

  function ensureSave() {
    if (!SAVE) {
      const stored = loadFromStorage();
      SAVE = runtimeFromStorage(stored);

      // Guarantee human discovered on first boot
      if (!stored) {
        // formsDiscovered อย่างน้อย 1
        if (!SAVE.counters.formsDiscovered) SAVE.counters.formsDiscovered = 1;
        saveNow();
      } else {
        // migrate: ถ้าเดิมไม่มี human ใน seenForms ให้เติม
        if (!SAVE.seenForms.human) {
          SAVE.seenForms.human = 1;
          SAVE.counters.formsDiscovered = (SAVE.counters.formsDiscovered || 0) + 1;
          saveSoon(0);
        }
      }
    }
    return SAVE;
  }

  // ====== PUBLIC API ======
  // ใช้ saveSoon แทน saveNow ในจุดที่เรียกบ่อย (เช่น mark*, events)
  window.ensureSave = ensureSave;
  window.saveNow = saveNow;
  window.saveSoon = saveSoon;

  // ====== OPTIONAL: Hard reset helper (เก็บไว้ให้ app.js เรียก) ======
  window.__hardResetSave = function __hardResetSave() {
    try { localStorage.removeItem(KEY); } catch {}
    SAVE = null;
    const S = ensureSave(); // จะสร้างใหม่ + mark human
    saveNow();
    return S;
  };
})();