// recipe_validator.js
(function(global){
  const logH = (h)=> console.log(`%c[VALIDATOR] ${h}`, 'color:#0aa; font-weight:700;');
  const info = (m)=> console.log(`%c[VALIDATOR] ${m}`, 'color:#0aa;');
  const warn = (m)=> console.warn(`[VALIDATOR] ${m}`);
  const err  = (m)=> console.error(`[VALIDATOR] ${m}`);

  const expandSeq = (reqs=[])=>{
    const out=[];
    for (const r of reqs){
      const cup = r?.cup || r?.id;
      const n = Math.max(1, r?.count || 1);
      if (!cup) continue;
      for (let i=0;i<n;i++) out.push(cup);
    }
    return out;
  };

  const seqEquals = (a,b)=> a.length===b.length && a.every((v,i)=>v===b[i]);

  const RecipeValidator = {
    run(recipes){
      if (!Array.isArray(recipes)){ err('recipes is not an array.'); return; }
      logH('Scanning recipes…');

      let ok=0, bad=0;

      // 0) duplicate id
      const idSeen = new Set();
      for (const r of recipes){
        if (!r || typeof r!=='object'){ bad++; err('Invalid recipe object.'); continue; }
        if (!r.id || typeof r.id!=='string'){ bad++; err('Recipe missing string id.'); continue; }
        if (idSeen.has(r.id)){ bad++; err(`Duplicate id "${r.id}".`); } else { idSeen.add(r.id); }
      }

      // 1) field sanity
      for (const r of recipes){
        if (!r || !r.id) continue;

        // outcome exactly one
        const outs = ['toForm','toEnd','toEvo'].filter(k=> r[k]);
        if (outs.length===0){ bad++; warn(`"${r.id}" has no outcome (toForm|toEnd|toEvo).`); }
        if (outs.length>1){ bad++; warn(`"${r.id}" has multiple outcomes ${outs.join(', ')} (choose one).`); }

        // requires present
        if (!Array.isArray(r.requires) || r.requires.length===0){
          bad++; warn(`"${r.id}" has no requires[] steps.`);
        }

        // window shape
        if (r.window){
          if ('contiguousOnly' in r.window && !('contiguous' in r.window)){
            // อแดปเตอร์มัก map แล้ว แต่เตือนเผื่อ data ใส่มาโดยตรง
            warn(`"${r.id}" uses window.contiguousOnly (engine uses "contiguous"). Adapter should map it.`);
          }
          if (r.window.contiguous && typeof r.window.drinks==='number'){
            const needLen = expandSeq(r.requires).length;
            if (r.window.drinks !== needLen){
              warn(`"${r.id}" contiguous=true but window.drinks(${r.window.drinks}) != requires length(${needLen}). Consider aligning.`);
            }
          }
        }

        // deny arrays
        if (r.denyForms && !Array.isArray(r.denyForms)) warn(`"${r.id}" denyForms should be array.`);
        if (r.denyKeywords && !Array.isArray(r.denyKeywords)) warn(`"${r.id}" denyKeywords should be array.`);

        // unreachable by self-deny
        if (r.form && Array.isArray(r.denyForms) && r.denyForms.includes(r.form)){
          warn(`"${r.id}" denies its own required form "${r.form}" → unreachable.`);
        }

        ok++;
      }

      // 2) collisions: form-specific vs generic with same sequence
      //    ถ้า generic.priority >= specific.priority → specific อาจไม่ถูกเลือก
      const bySeq = new Map(); // key = sequence string, val = array of recipes
      for (const r of recipes){
        const seq = expandSeq(r.requires);
        const key = JSON.stringify(seq);
        if (!bySeq.has(key)) bySeq.set(key, []);
        bySeq.get(key).push(r);
      }
      for (const [key, list] of bySeq.entries()){
        const specifics = list.filter(r=> !!r.form);
        const generics  = list.filter(r=> !r.form);
        if (!specifics.length || !generics.length) continue;

        specifics.forEach(sp=>{
          generics.forEach(ge=>{
            const pS = Number(sp.priority||0);
            const pG = Number(ge.priority||0);
            if (pG >= pS){
              warn(`Collision on seq ${key}: generic "${ge.id}" (p=${pG}) >= specific "${sp.id}" (p=${pS}). Prefer raising "${sp.id}" or lowering "${ge.id}" or add denyForms.`);
            }
          });
        });
      }

      // 3) single-cup vs multi-cup that *start with* same first cup
      //    engine เรา deferral อยู่แล้ว, แต่เตือนถ้า single-cup priority สูงเวอร์
      const singles = recipes.filter(r=> expandSeq(r.requires).length===1);
      const multis  = recipes.filter(r=> expandSeq(r.requires).length>1);
      for (const s of singles){
        const cup = expandSeq(s.requires)[0];
        for (const m of multis){
          const seq = expandSeq(m.requires);
          if (seq[0]===cup){
            const pS = Number(s.priority||0);
            const pM = Number(m.priority||0);
            if (pS >= pM + 100){
              // แค่เตือน “อาจ” ทำให้เข้าใจยาก ถ้าไปปรับ comparator แล้วก็โอเค
              warn(`Single-cup "${s.id}" (p=${pS}) shares first cup "${cup}" with multi-cup "${m.id}" (p=${pM}). Deferral protects ordering, but consider not overshooting priority.`);
            }
          }
        }
      }

      // 4) dead-end by denyKeywords (ทุก cup ในสูตรโดน deny)
      for (const r of recipes){
        const seq = expandSeq(r.requires);
        const denyK = new Set(r.denyKeywords||[]);
        if (seq.length && seq.every(c=> denyK.has(c))){
          warn(`"${r.id}" has denyKeywords blocking all cups in its own sequence → likely unreachable.`);
        }
      }

      info(`Scan done. valid≈${ok}, notes=${bad}.`);
    }
  };
  
  (function devScan(){
  if (!window.DEV) return;                  // เปิดเฉพาะโหมด DEV
  const K = new Set((window.DATA_KEYWORDS?.list||window.DATA_KEYWORDS||[]).map(k=>k.id));
  const F = new Set(Object.keys(window.DATA_FORMS||{}));
  const missKw = new Map(), missForm = new Map();

  for (const r of (window.DATA_RECIPES||[])) {
    (r.requires||[]).forEach(q=>{
      if (q.cup && !K.has(q.cup)) (missKw.get(q.cup)||missKw.set(q.cup,[]), missKw.get(q.cup)).push(r.id);
    });
    (r.denyKeywords||[]).forEach(k=>{
      if (!K.has(k)) (missKw.get(k)||missKw.set(k,[]), missKw.get(k)).push(r.id);
    });
    if (r.toForm && !F.has(r.toForm)) (missForm.get(r.toForm)||missForm.set(r.toForm,[]), missForm.get(r.toForm)).push(r.id);
    (r.denyForms||[]).forEach(f=>{
      if (!F.has(f)) (missForm.get(f)||missForm.set(f,[]), missForm.get(f)).push(r.id);
    });
  }
  if (missKw.size) console.warn("[DEV] Missing keywords:", Object.fromEntries(missKw));
  if (missForm.size) console.warn("[DEV] Missing forms:", Object.fromEntries(missForm));
})();

// ====== (เสริม) ตรวจเลข no ของ Forms ======
if (Array.isArray(window.DATA_FORMS) || typeof window.DATA_FORMS === 'object') {
  const formsArr = Array.isArray(window.DATA_FORMS)
    ? window.DATA_FORMS
    : Object.values(window.DATA_FORMS);

  const seenNo = new Map();
  for (const f of formsArr) {
    if (!f || !f.no) continue;
    if (seenNo.has(f.no)) {
      err(`Form "${f.id}" และ "${seenNo.get(f.no)}" ใช้เลข no ซ้ำกัน (${f.no}).`);
    } else {
      seenNo.set(f.no, f.id);
    }
  }
}

  global.RecipeValidator = RecipeValidator;
})(window);