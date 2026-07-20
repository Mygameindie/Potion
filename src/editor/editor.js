/* ============================================================================
   Data Editor — build Keyword / Forms / Endings / Recipe data without code.
   Loads the current game data, lets you edit visually, and exports ready-to-use
   data_*.js files that you drop into /data. Work autosaves to localStorage.
   ========================================================================== */
(function(){
  'use strict';

  const LS_KEY = 'poe_editor_db_v1';
  const $  = s => document.querySelector(s);

  // ---- default tag legend (fallback if KW_TAGS is missing) ----
  const DEFAULT_KW_TAGS = {
    "1": {emoji:"💬", label:"Dialogue"},
    "2": {emoji:"🎬", label:"Event"},
    "3": {emoji:"🧬", label:"Evolution"},
    "4": {emoji:"💀", label:"Endings"},
    "5": {emoji:"👤", label:"Transformation"}
  };

  // ===========================================================================
  // Seed the working DB from the live game globals (flattened for easy editing)
  // ===========================================================================
  function arr(a){ return Array.isArray(a) ? a.slice() : []; }

  function seedFromGlobals(){
    const kw = (typeof window.DATA_KEYWORDS !== 'undefined' && window.DATA_KEYWORDS) || [];
    const fm = (typeof window.DATA_FORMS    !== 'undefined' && window.DATA_FORMS)    || {};
    const en = (typeof window.DATA_ENDINGS_NEW !== 'undefined' && window.DATA_ENDINGS_NEW) || [];
    const rc = (typeof window.DATA_RECIPES  !== 'undefined' && window.DATA_RECIPES)  || [];
    const tags = (typeof KW_TAGS !== 'undefined' && KW_TAGS) || DEFAULT_KW_TAGS;

    return {
      kwTags: JSON.parse(JSON.stringify(tags)),

      keywords: kw.map(k => ({
        id:k.id||'', name:k.name||'',
        synonyms:arr(k.synonyms), tag:arr(k.tag).map(String),
        flavor:k.flavor||'', preview:k.preview||'',
        lethal:!!k.lethal, transform:!!k.transform, evoable:!!k.evoable, dialogue:!!k.dialogue
      })),

      forms: Object.entries(fm).map(([key,f]) => ({
        __key:key, id:f.id||'', name:f.name||'', no:f.no||'',
        image:f.image||'', evoAlt:f.evoAlt||'', evoTag:f.evoTag||'',
        evoOnly:!!f.evoOnly, group:arr(f.group)
      })),

      endings: en.map(e => ({
        id:e.id||'', name:e.name||'',
        priority:(e.priority ?? ''),
        __whenFalse: typeof e.when === 'function',
        image:e.image||'',
        overlayTitle:e.overlay?.title||'', overlayDesc:e.overlay?.desc||'', overlayImage:e.overlay?.image||'',
        rebornTo:e.rebornTo||'', linkEvos:arr(e.linkEvos)
      })),

      recipes: rc.map(r => ({
        id:r.id||'', form:r.form||'',
        requires: arr(r.requires).map(c => (c && c.cup) || '').filter(Boolean),
        toForm:r.toForm||'',
        toEvo: r.toEvo == null ? [] : (Array.isArray(r.toEvo) ? r.toEvo.slice() : [r.toEvo]),
        toEnd:r.toEnd||'',
        priority:(r.priority ?? ''),
        winDrinks:(r.window?.drinks ?? ''),
        winContiguous:!!r.window?.contiguous,
        winLookback:(r.window?.lookback ?? ''),
        denyForms:arr(r.denyForms), denyKeywords:arr(r.denyKeywords)
      }))
    };
  }

  // ===========================================================================
  // Persistence
  // ===========================================================================
  let DB = null;
  function load(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if (raw){ const d = JSON.parse(raw); if (d && d.keywords) return d; }
    }catch(_){}
    return seedFromGlobals();
  }
  function persist(){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(DB)); }catch(_){}
    flagDirty();
  }
  let dirtyTO = null;
  function flagDirty(){
    const el = $('#edStatus');
    if (!el) return;
    el.textContent = 'บันทึกร่างอัตโนมัติแล้ว ✓';
    clearTimeout(dirtyTO);
    dirtyTO = setTimeout(()=> el.textContent = 'พร้อมใช้งาน', 1500);
  }

  // ===========================================================================
  // Field schemas (model keys are already flattened)
  // ===========================================================================
  const TAG_OPTIONS = () => Object.entries(DB.kwTags).map(([id,t]) => ({
    value:id, label:`${t.emoji||''} ${t.label||id}`.trim()
  }));

  const SCHEMAS = {
    keywords: [
      { k:'id',    label:'id', type:'text', req:true, hint:'ตัวพิมพ์เล็ก ไม่มีเว้นวรรค เช่น fire' },
      { k:'name',  label:'name', type:'text', req:true },
      { k:'synonyms', label:'synonyms (บรรทัด/จุลภาค คั่น)', type:'listLines', full:true },
      { k:'tag',   label:'tag', type:'tags', full:true },
      { k:'flavor', label:'flavor (ข้อความตอนดื่ม)', type:'textarea', full:true },
      { k:'preview', label:'preview (form id ที่โชว์ใน Codex)', type:'text', list:'dl-forms' },
      { k:'lethal', label:'lethal', type:'bool' },
      { k:'transform', label:'transform', type:'bool' },
      { k:'evoable', label:'evoable', type:'bool' },
      { k:'dialogue', label:'dialogue', type:'bool' },
    ],
    forms: [
      { k:'__key', label:'Key (ตัวระบุใน DATA_FORMS)', type:'text', req:true, hint:'ปกติเหมือน id เช่น dragon' },
      { k:'id',    label:'id', type:'text', req:true },
      { k:'name',  label:'name', type:'text', req:true },
      { k:'no',    label:'no (เลขในเดกซ์ เช่น 0001)', type:'text' },
      { k:'image', label:'image', type:'text', full:true, placeholder:'assets/forms/xxx.png' },
      { k:'evoAlt', label:'evoAlt (Key ของร่างอีโว)', type:'text', list:'dl-forms' },
      { k:'evoTag', label:'evoTag (เช่น evo0001)', type:'text' },
      { k:'evoOnly', label:'evoOnly (ร่างอีโวล้วน ไม่โชว์ในลิสต์หลัก)', type:'bool' },
      { k:'group', label:'group (form keys, คั่นบรรทัด)', type:'listLines', full:true },
    ],
    endings: [
      { k:'id',    label:'id', type:'text', req:true },
      { k:'name',  label:'name', type:'text' },
      { k:'priority', label:'priority', type:'number' },
      { k:'rebornTo', label:'rebornTo (เกิดใหม่เป็น form)', type:'text', list:'dl-forms' },
      { k:'overlayTitle', label:'Overlay title (หัวข้อฉากจบ)', type:'text', full:true },
      { k:'overlayDesc', label:'Overlay desc (ข้อความฉากจบ)', type:'textarea', full:true },
      { k:'overlayImage', label:'Overlay image', type:'text', full:true, placeholder:'assets/endings/xxx.png' },
      { k:'image', label:'image (สำรอง ระดับบนสุด)', type:'text', full:true, placeholder:'assets/endings/xxx.png' },
      { k:'linkEvos', label:'linkEvos (evo form keys)', type:'listLines' },
      { k:'__whenFalse', label:'when:()=>false (ไม่ให้ trigger อัตโนมัติ)', type:'bool' },
    ],
    recipes: [
      { k:'id',    label:'id', type:'text', req:true },
      { k:'form',  label:'form: (ต้องอยู่ในร่างนี้ก่อน)', type:'text', list:'dl-forms' },
      { k:'requires', label:'requires — cups (คีย์เวิร์ด บรรทัดละ 1)', type:'listLines', full:true, list:'dl-keywords', req:true },
      { k:'toForm', label:'→ toForm', type:'text', list:'dl-forms' },
      { k:'toEvo', label:'→ toEvo (หลายอัน = สุ่ม/แยกสาย)', type:'listLines', list:'dl-forms' },
      { k:'toEnd', label:'→ toEnd', type:'text', list:'dl-endings' },
      { k:'priority', label:'priority', type:'number' },
      { k:'winDrinks', label:'window.drinks', type:'number' },
      { k:'winContiguous', label:'window.contiguous', type:'bool' },
      { k:'winLookback', label:'window.lookback', type:'number' },
      { k:'denyForms', label:'denyForms', type:'listLines', list:'dl-forms' },
      { k:'denyKeywords', label:'denyKeywords', type:'listLines', list:'dl-keywords' },
    ],
  };

  // Blank entry factory per tab
  function blankEntry(tab){
    switch(tab){
      case 'keywords': return { id:'', name:'', synonyms:[], tag:[], flavor:'', preview:'', lethal:false, transform:false, evoable:false, dialogue:false };
      case 'forms':    return { __key:'', id:'', name:'', no:'', image:'', evoAlt:'', evoTag:'', evoOnly:false, group:[] };
      case 'endings':  return { id:'', name:'', priority:'', __whenFalse:false, image:'', overlayTitle:'', overlayDesc:'', overlayImage:'', rebornTo:'', linkEvos:[] };
      case 'recipes':  return { id:'', form:'', requires:[], toForm:'', toEvo:[], toEnd:'', priority:'', winDrinks:'', winContiguous:false, winLookback:'', denyForms:[], denyKeywords:[] };
    }
  }

  // ===========================================================================
  // UI state
  // ===========================================================================
  const state = { tab:'keywords', selected:-1, search:'' };

  function currentList(){ return DB[state.tab]; }
  function itemLabel(tab, e){
    if (tab === 'forms')   return { id:(e.__key||e.id||'—'), sub:(e.name||'') };
    if (tab === 'recipes') return { id:(e.id||'—'), sub:(e.requires||[]).join('+') + (e.toForm?` → ${e.toForm}`:'') + (e.toEnd?` ⇒ ${e.toEnd}`:'') + ((e.toEvo&&e.toEvo.length)?` ⇒ ${e.toEvo.join('/')}`:'') };
    return { id:(e.id||'—'), sub:(e.name||'') };
  }

  // ---- list ----
  function renderList(){
    const box = $('#edList');
    box.innerHTML = '';
    const list = currentList();
    const q = state.search.trim().toLowerCase();

    const rows = list
      .map((e,i)=>({e,i}))
      .filter(({e})=>{
        if (!q) return true;
        const {id,sub} = itemLabel(state.tab, e);
        return (id+' '+sub).toLowerCase().includes(q);
      });

    if (!rows.length){
      box.innerHTML = `<div class="ed-empty">ไม่มีรายการ${q?' ที่ตรงกับคำค้น':''}</div>`;
      return;
    }

    for (const {e,i} of rows){
      const {id,sub} = itemLabel(state.tab, e);
      const el = document.createElement('div');
      el.className = 'ed-item' + (i===state.selected?' active':'');
      el.innerHTML = `<div class="ed-item-main">
          <div class="ed-item-id"></div>
          <div class="ed-item-sub"></div>
        </div>`;
      el.querySelector('.ed-item-id').textContent = id;
      el.querySelector('.ed-item-sub').textContent = sub;
      el.addEventListener('click', ()=>{ state.selected = i; renderList(); renderForm(); });
      box.appendChild(el);
    }
  }

  // ---- datalists ----
  function refreshDatalists(){
    const setOpts = (id, values) => {
      const dl = document.getElementById(id);
      if (!dl) return;
      const uniq = [...new Set(values.filter(Boolean))].sort();
      dl.innerHTML = uniq.map(v=>`<option value="${v.replace(/"/g,'&quot;')}">`).join('');
    };
    const formKeys = DB.forms.flatMap(f=>[f.__key, f.id]);
    setOpts('dl-forms', formKeys);
    setOpts('dl-keywords', DB.keywords.map(k=>k.id));
    setOpts('dl-endings', DB.endings.map(e=>e.id));
  }

  // ---- form ----
  function splitList(text){
    return String(text||'').split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
  }

  function renderForm(){
    const form = $('#edForm');
    const head = $('#edFormTitle');
    const actions = $('#edFormActions');
    form.innerHTML = '';

    if (state.selected < 0 || !currentList()[state.selected]){
      head.textContent = 'เลือกหรือสร้างรายการ';
      actions.hidden = true;
      form.innerHTML = `<div class="ed-form-empty">← เลือกรายการทางซ้าย หรือกด <b>+ New</b> เพื่อสร้างใหม่</div>`;
      return;
    }

    const entry = currentList()[state.selected];
    const {id} = itemLabel(state.tab, entry);
    head.textContent = `แก้ไข: ${id}`;
    actions.hidden = false;

    for (const f of SCHEMAS[state.tab]){
      form.appendChild(makeField(f, entry));
    }
    const msg = document.createElement('div');
    msg.className = 'ed-form-msg';
    msg.id = 'edFormMsg';
    form.appendChild(msg);
    validateEntry(entry);
  }

  function makeField(f, entry){
    const wrap = document.createElement('div');
    wrap.className = 'ed-field' + (f.full?' full':'');

    const commit = ()=>{ persist(); refreshDatalists();
      const {id,sub} = itemLabel(state.tab, entry);
      // update the active list row + head live
      renderList();
      $('#edFormTitle').textContent = `แก้ไข: ${id}`;
      validateEntry(entry);
    };

    if (f.type === 'bool'){
      const lab = document.createElement('label');
      lab.className = 'ed-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = !!entry[f.k];
      cb.addEventListener('change', ()=>{ entry[f.k] = cb.checked; commit(); });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(' ' + f.label));
      wrap.appendChild(lab);
      return wrap;
    }

    const label = document.createElement('label');
    label.innerHTML = f.label + (f.req?' <span class="req">*</span>':'');
    wrap.appendChild(label);

    if (f.type === 'tags'){
      const box = document.createElement('div');
      box.className = 'ed-tags';
      for (const opt of TAG_OPTIONS()){
        const l = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.value = opt.value;
        cb.checked = (entry[f.k]||[]).includes(opt.value);
        cb.addEventListener('change', ()=>{
          const set = new Set(entry[f.k]||[]);
          cb.checked ? set.add(opt.value) : set.delete(opt.value);
          entry[f.k] = [...set].sort();
          commit();
        });
        l.appendChild(cb);
        l.appendChild(document.createTextNode(' ' + opt.label));
        box.appendChild(l);
      }
      wrap.appendChild(box);
      return wrap;
    }

    let input;
    if (f.type === 'textarea' || f.type === 'listLines'){
      input = document.createElement('textarea');
      input.value = (f.type === 'listLines') ? (entry[f.k]||[]).join('\n') : (entry[f.k]||'');
    } else {
      input = document.createElement('input');
      input.type = (f.type === 'number') ? 'number' : 'text';
      input.value = (entry[f.k] === '' || entry[f.k] == null) ? '' : entry[f.k];
    }
    if (f.placeholder) input.placeholder = f.placeholder;
    if (f.list) input.setAttribute('list', f.list);

    input.addEventListener('input', ()=>{
      if (f.type === 'listLines') entry[f.k] = splitList(input.value);
      else if (f.type === 'number') entry[f.k] = (input.value === '') ? '' : Number(input.value);
      else entry[f.k] = input.value;
      // live label refresh only when identity-ish fields change
      if (['id','name','__key'].includes(f.k) || state.tab==='recipes') commit();
      else { persist(); if (f.list) refreshDatalists(); validateEntry(entry); }
    });
    wrap.appendChild(input);

    if (f.hint){
      const h = document.createElement('div');
      h.className = 'ed-hint'; h.textContent = f.hint;
      wrap.appendChild(h);
    }
    return wrap;
  }

  function validateEntry(entry){
    const msg = $('#edFormMsg'); if (!msg) return;
    const problems = [];
    if (state.tab === 'forms'){
      if (!entry.__key) problems.push('ต้องมี Key');
      if (!entry.id) problems.push('ต้องมี id');
      const dupKey = DB.forms.filter(f=>f.__key && f.__key===entry.__key).length > 1;
      if (dupKey) problems.push('Key ซ้ำกับรายการอื่น');
    } else {
      if (!entry.id) problems.push('ต้องมี id');
      const dup = DB[state.tab].filter(e=>e.id && e.id===entry.id).length > 1;
      if (dup) problems.push('id ซ้ำกับรายการอื่น');
    }
    if (state.tab === 'recipes'){
      if (!entry.requires || !entry.requires.length) problems.push('ต้องมี requires อย่างน้อย 1 cup');
      if (!entry.toForm && !entry.toEnd && (!entry.toEvo||!entry.toEvo.length)) problems.push('ต้องมีผลลัพธ์: toForm / toEvo / toEnd');
    }
    msg.textContent = problems.length ? ('⚠ ' + problems.join(' · ')) : '';
  }

  // ---- add / delete / duplicate ----
  function addNew(){
    const e = blankEntry(state.tab);
    currentList().push(e);
    state.selected = currentList().length - 1;
    persist(); renderList(); renderForm();
  }
  function deleteCurrent(){
    if (state.selected < 0) return;
    const {id} = itemLabel(state.tab, currentList()[state.selected]);
    if (!confirm(`ลบ "${id}" ?`)) return;
    currentList().splice(state.selected, 1);
    state.selected = -1;
    persist(); refreshDatalists(); renderList(); renderForm();
  }
  function duplicateCurrent(){
    if (state.selected < 0) return;
    const copy = JSON.parse(JSON.stringify(currentList()[state.selected]));
    if ('id' in copy && copy.id) copy.id = copy.id + '_copy';
    if ('__key' in copy && copy.__key) copy.__key = copy.__key + '_copy';
    currentList().splice(state.selected+1, 0, copy);
    state.selected = state.selected + 1;
    persist(); refreshDatalists(); renderList(); renderForm();
  }

  // ===========================================================================
  // Serializers → exact data_*.js text
  // ===========================================================================
  const jsStr = s => JSON.stringify(String(s));
  const idSafe = k => /^[A-Za-z_$][\w$]*$/.test(k) ? k : jsStr(k);

  function pairs(){
    const a = [];
    return {
      str(k,v){ if (v!=null && v!=='') a.push(`${k}:${jsStr(v)}`); },
      num(k,v){ if (v!=='' && v!=null && !Number.isNaN(Number(v))) a.push(`${k}:${Number(v)}`); },
      boolT(k,v){ if (v) a.push(`${k}:true`); },
      arrStr(k,arr){ if (arr && arr.length) a.push(`${k}:[${arr.map(jsStr).join(',')}]`); },
      raw(k,rawVal){ if (rawVal!=null) a.push(`${k}:${rawVal}`); },
      join(){ return '{ ' + a.join(', ') + ' }'; },
      empty(){ return a.length===0; }
    };
  }

  function serializeKeywords(){
    const tagLines = Object.entries(DB.kwTags).map(([id,t]) =>
      `  ${jsStr(id)}: {emoji:${jsStr(t.emoji||'')}, label:${jsStr(t.label||'')}}`).join(',\n');

    const items = DB.keywords.map(k=>{
      const p = pairs();
      p.str('id', k.id); p.str('name', k.name);
      p.arrStr('synonyms', k.synonyms);
      p.arrStr('tag', k.tag);
      p.str('flavor', k.flavor);
      p.str('preview', k.preview);
      p.boolT('lethal', k.lethal); p.boolT('transform', k.transform);
      p.boolT('evoable', k.evoable); p.boolT('dialogue', k.dialogue);
      return '  ' + p.join();
    }).join(',\n');

    return `// Auto-generated by the in-game Data Editor (editor.html).
const KW_TAGS = {
${tagLines}
};

window.DATA_KEYWORDS = [
${items}
];
`;
  }

  function serializeForms(){
    const items = DB.forms.map(f=>{
      const p = pairs();
      p.str('id', f.id); p.str('name', f.name); p.str('no', f.no);
      p.str('image', f.image);
      p.str('evoAlt', f.evoAlt); p.str('evoTag', f.evoTag);
      p.boolT('evoOnly', f.evoOnly);
      p.arrStr('group', f.group);
      return `  ${idSafe(f.__key||f.id)}:${p.join()}`;
    }).join(',\n');

    return `// Auto-generated by the in-game Data Editor (editor.html).
window.DATA_FORMS = {
${items}
};
`;
  }

  function serializeEndings(){
    const items = DB.endings.map(e=>{
      const parts = [];
      parts.push(`id:${jsStr(e.id)}`);
      if (e.name) parts.push(`name:${jsStr(e.name)}`);
      if (e.priority!=='' && e.priority!=null) parts.push(`priority:${Number(e.priority)}`);
      if (e.__whenFalse) parts.push(`when:()=>false`);
      if (e.image) parts.push(`image:${jsStr(e.image)}`);
      // overlay
      const ov = [];
      if (e.overlayTitle) ov.push(`title:${jsStr(e.overlayTitle)}`);
      if (e.overlayDesc)  ov.push(`desc:${jsStr(e.overlayDesc)}`);
      if (e.overlayImage) ov.push(`image:${jsStr(e.overlayImage)}`);
      if (ov.length) parts.push(`overlay:{ ${ov.join(', ')} }`);
      if (e.rebornTo) parts.push(`rebornTo:${jsStr(e.rebornTo)}`);
      if (e.linkEvos && e.linkEvos.length) parts.push(`linkEvos:[${e.linkEvos.map(jsStr).join(',')}]`);
      return `  { ${parts.join(', ')} }`;
    }).join(',\n');

    return `// Auto-generated by the in-game Data Editor (editor.html).
window.DATA_ENDINGS_NEW = [
${items}
];
`;
  }

  function serializeRecipes(){
    const items = DB.recipes.map(r=>{
      const parts = [];
      parts.push(`id:${jsStr(r.id)}`);
      if (r.form) parts.push(`form:${jsStr(r.form)}`);
      parts.push(`requires:[${(r.requires||[]).map(c=>`{cup:${jsStr(c)}}`).join(',')}]`);
      if (r.toForm) parts.push(`toForm:${jsStr(r.toForm)}`);
      if (r.toEvo && r.toEvo.length){
        parts.push(`toEvo:${r.toEvo.length===1 ? jsStr(r.toEvo[0]) : '['+r.toEvo.map(jsStr).join(',')+']'}`);
      }
      if (r.toEnd) parts.push(`toEnd:${jsStr(r.toEnd)}`);
      // window
      if (r.winDrinks!=='' && r.winDrinks!=null){
        const w = [`drinks:${Number(r.winDrinks)}`];
        if (r.winContiguous) w.push(`contiguous:true`);
        if (r.winLookback!=='' && r.winLookback!=null) w.push(`lookback:${Number(r.winLookback)}`);
        parts.push(`window:{${w.join(',')}}`);
      }
      if (r.priority!=='' && r.priority!=null) parts.push(`priority:${Number(r.priority)}`);
      if (r.denyForms && r.denyForms.length) parts.push(`denyForms:[${r.denyForms.map(jsStr).join(',')}]`);
      if (r.denyKeywords && r.denyKeywords.length) parts.push(`denyKeywords:[${r.denyKeywords.map(jsStr).join(',')}]`);
      return `  { ${parts.join(', ')} }`;
    }).join(',\n');

    return `// Auto-generated by the in-game Data Editor (editor.html).
window.DATA_RECIPES = [
${items}
];
`;
  }

  const FILES = {
    keywords: { name:'data_keywords.js', gen:serializeKeywords },
    forms:    { name:'data_forms.js',    gen:serializeForms },
    endings:  { name:'data_endings_new.js', gen:serializeEndings },
    recipes:  { name:'data_recipes.js',  gen:serializeRecipes },
  };

  // ===========================================================================
  // Export modal + download
  // ===========================================================================
  function download(name, text){
    const blob = new Blob([text], {type:'text/javascript'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function openExport(){
    const file = FILES[state.tab];
    const text = file.gen();
    $('#edModalTitle').textContent = file.name;
    $('#edModalHint').textContent = `วางไฟล์นี้ทับที่ data/${file.name} แล้วรีโหลดเกม`;
    const ta = $('#edModalText');
    ta.value = text;
    ta.dataset.filename = file.name;
    $('#edModal').hidden = false;
  }

  function exportAll(){
    Object.values(FILES).forEach((f,i)=> setTimeout(()=>download(f.name, f.gen()), i*250));
    flagDirty();
    $('#edStatus').textContent = 'ดาวน์โหลดครบ 4 ไฟล์ — วางทับในโฟลเดอร์ data/';
  }

  // ===========================================================================
  // Tabs + wiring
  // ===========================================================================
  function switchTab(tab){
    state.tab = tab; state.selected = -1; state.search = '';
    $('#edSearch').value = '';
    document.querySelectorAll('.tabs .tab-btn').forEach(b=>{
      const on = b.dataset.etab === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    renderList(); renderForm();
  }

  function boot(){
    DB = load();
    refreshDatalists();

    document.querySelectorAll('.tabs .tab-btn').forEach(b=>{
      b.addEventListener('click', ()=> switchTab(b.dataset.etab));
    });
    $('#edSearch').addEventListener('input', e=>{ state.search = e.target.value; renderList(); });
    $('#edAdd').addEventListener('click', addNew);
    $('#edDelete').addEventListener('click', deleteCurrent);
    $('#edDuplicate').addEventListener('click', duplicateCurrent);
    $('#edExport').addEventListener('click', openExport);
    $('#edExportAll').addEventListener('click', exportAll);
    $('#edReset').addEventListener('click', ()=>{
      if (!confirm('ล้างร่างทั้งหมดแล้วโหลดข้อมูลจากเกมปัจจุบันใหม่?')) return;
      DB = seedFromGlobals(); persist(); refreshDatalists(); switchTab(state.tab);
    });

    $('#edModalClose').addEventListener('click', ()=> $('#edModal').hidden = true);
    $('#edModal').addEventListener('click', e=>{ if (e.target.id === 'edModal') $('#edModal').hidden = true; });
    $('#edCopy').addEventListener('click', async ()=>{
      const ta = $('#edModalText');
      try{ await navigator.clipboard.writeText(ta.value); $('#edCopy').textContent = 'Copied ✓'; }
      catch(_){ ta.select(); document.execCommand('copy'); $('#edCopy').textContent = 'Copied ✓'; }
      setTimeout(()=> $('#edCopy').textContent = 'Copy', 1200);
    });
    $('#edDownload').addEventListener('click', ()=>{
      const ta = $('#edModalText'); download(ta.dataset.filename || 'data.js', ta.value);
    });

    switchTab('keywords');
  }

  // data files load with `defer`, so DOMContentLoaded fires after they run
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
