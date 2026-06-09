;(function(){
  // ========= State (engine-local) =========
  let FORM = 'human';
  let BUFFER = [];
  let CB = { onTransform:null, onEvo:null, onEnd:null, log:null, onBufferChange:null };

  // ---- helper: แจ้ง UI ว่าบัฟเฟอร์เปลี่ยน ----
  function notifyBuffer(){
    try { CB.onBufferChange && CB.onBufferChange(BUFFER.slice()); } catch(_) {}
  }
  
  // ช่วยคิดคะแนน โดยให้สูตรที่ล็อกฟอร์ม > สูตรทั่วไป
function scoreRecipe(rec, curForm){
  const len = (rec.requires || []).length;
  let s = (rec.priority || 0);
  // โบนัสเล็ก ๆ ตามความยาว (กันสูตร 1 ขวดแซง multi โดยไม่ตั้งใจ)
  s += Math.min(len, 4);

  // สำคัญ: ถ้าสูตรผูก form และตรงกับฟอร์มปัจจุบัน ให้บวกหนัก ๆ
  if (rec.form && rec.form === curForm) s += 10000;
  return s;
}

// แทนที่ chooseBest เดิมทั้งหมดด้วยอันนี้
function chooseBest(recipes){
  if (!Array.isArray(recipes) || recipes.length === 0) return null;

  const scoreType = r => r.toEnd ? 0 : (r.toEvo ? 2 : 1); // end < form < evo

  // ไม่แก้ของเดิมในที่เรียกใช้: sort บนสำเนา
  const list = recipes.slice();
  list.sort((a,b)=>{
    // 1) priority มากก่อน
    const pa = a.priority || 0, pb = b.priority || 0;
    if (pb !== pa) return pb - pa;

    // 2) สูตรยาวกว่า (requires มากกว่า) มาก่อน
    const la = (a.requires && a.requires.length) || 0;
    const lb = (b.requires && b.requires.length) || 0;
    if (lb !== la) return lb - la;

    // 3) ชนิดผลลัพธ์: end < form < evo
    const ta = scoreType(a), tb = scoreType(b);
    if (tb !== ta) return tb - ta;

    // 4) ผูกไทด้วย id เพื่อความนิ่งของผลลัพธ์ (optional)
    const ia = String(a.id||''), ib = String(b.id||'');
    return ia.localeCompare(ib);
  });

  return list[0] || null;
}

  // ========= Utils =========
  const cupsOf = r => (r.requires||[]).map(x=>x.cup);
  const startsWith = (full, prefix)=> prefix.length<=full.length
    && prefix.every((v,i)=> full[i]===prefix[i]);
  const endsWith = (arr, tail)=> tail.length<=arr.length
    && tail.every((v,i)=> arr[arr.length-tail.length+i]===v);

  const any = (a,f)=>Array.isArray(a)&&a.some(f);

  // ก่อน: function guardDeny(rec){ ... ใช้ BUFFER และ FORM ตรงๆ ... }
// หลัง: ให้รับ snapshot เข้ามาเสมอ
function guardForm(rec, formId){
  return !rec.form || rec.form === formId;
}

function guardDeny(rec, bufIds, formId){
  if (rec.denyForms && rec.denyForms.includes(formId)) return false;

  if (rec.denyKeywords && rec.denyKeywords.length){
    // ใช้ window.lookback ถ้ามี, ไม่งั้นใช้ window.drinks หรือความยาว requires
    const seqLen   = (rec.requires || []).length;
    const winDrinks= (rec.window && rec.window.drinks) || seqLen;
    const lookback =
      (rec.window && typeof rec.window.lookback === 'number')
        ? rec.window.lookback
        : winDrinks;

    const slice = bufIds.slice(-Math.max(1, lookback));
    if (slice.some(k => rec.denyKeywords.includes(k))) return false;
  }
  return true;
}

// Single pass over RECIPES that resolves all three questions at once:
//  - full   : best recipe whose `requires` fully matches the buffer tail
//  - expecting : true if some recipe is a longer chain still waiting for cups
//  - single : best 1-cup fallback recipe for the cup just fed
// (Previously this was three separate full scans of the recipe list.)
function analyze(lastCup){
  const R = window.RECIPES || [];
  const formId = FORM;
  const bufIds = BUFFER;            // read-only here; no need to copy
  const blen = bufIds.length;

  let full = null, expecting = false, single = null;

  for (const rec of R){
    if (!guardForm(rec, formId) || !guardDeny(rec, bufIds, formId)) continue;
    const reqs = rec.requires || [];
    const nlen = reqs.length;
    if (!nlen) continue;

    if (blen >= nlen){
      // full tail match
      let ok = true;
      for (let i=0;i<nlen;i++){ if (bufIds[blen-nlen+i] !== reqs[i].cup){ ok=false; break; } }
      if (ok){
        const rp = rec.priority||0, bp = full ? (full.priority||0) : -1;
        const bl = full ? (full.requires||[]).length : -1;
        const rHasForm = !!rec.form, bHasForm = !!(full && full.form);
        if (!full || rp>bp || (rp===bp && nlen>bl) || (rp===bp && nlen===bl && rHasForm && !bHasForm)){
          full = rec;
        }
      }
      // single-cup fallback candidate
      if (nlen === 1 && lastCup && reqs[0].cup === lastCup){
        const rp = rec.priority||0, bp = single ? (single.priority||0) : -1;
        const rHasForm = !!rec.form, bHasForm = !!(single && single.form);
        if (!single || rp>bp || (rp===bp && rHasForm && !bHasForm)){
          single = rec;
        }
      }
    } else if (!expecting){
      // longer chain → prefix match means it is still waiting for more cups
      let ok = true;
      for (let i=0;i<blen;i++){ if (reqs[i].cup !== bufIds[i]){ ok=false; break; } }
      if (ok) expecting = true;
    }
  }

  return { full, expecting, single };
}

  function consumeFromBuffer(n){
    if (!n) return;
    BUFFER.splice(BUFFER.length - n, n);
    notifyBuffer();
  }

// helpers
function _normalizeEvoList(raw){
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.slice();
  if (typeof raw === "string") return raw.split(",").map(s=>s.trim()).filter(Boolean);
  return [];
}
function _pickWeighted(list){
  if (!list.length) return null;
  if (typeof list[0] === "string"){
    return list[(Math.random()*list.length)|0];
  }
  var norm=list.map(it=>{
    if (Array.isArray(it)) return {id:it[0], w:+it[1]||1};
    if (it && typeof it==="object" && it.id) return {id:it.id, w:+it.w||1};
    return null;
  }).filter(Boolean);
  var sum=0, acc=[]; for (var i=0;i<norm.length;i++){ sum+=norm[i].w; acc.push(sum); }
  var r=Math.random()*sum, idx=0; while(idx<acc.length && r>=acc[idx]) idx++;
  return norm[Math.max(0,idx)].id;
}

function applyOutcome(rec){
  // --- log headline (แสดง OneOf(N) ถ้ามีหลายตัว) ---
  var evoList = _normalizeEvoList(rec.toEvo);
  var out = rec.toForm ? ("Transform → "+rec.toForm)
          : rec.toEnd  ? ("Ending → "+rec.toEnd)
          : rec.toEvo  ? (evoList.length>1?("Evolution → OneOf("+evoList.length+")"):("Evolution → "+rec.toEvo))
          : "—";
  CB.log && CB.log(out);

  // toForm
  if (rec.toForm){
    FORM = rec.toForm; CB.onTransform && CB.onTransform(rec.toForm);
    BUFFER.length=0; notifyBuffer(); return;
  }

// --- inside applyOutcome(rec) ---
if (rec.toEvo){
  var list   = _normalizeEvoList(rec.toEvo);
  var chosen = (list.length<=1) ? (list[0] || rec.toEvo) : _pickWeighted(list);

  FORM = chosen;
  CB.onEvo && CB.onEvo(chosen);   // ← ส่ง id ที่สุ่มแล้ว
  BUFFER.length = 0; notifyBuffer();
  return;
}

  // toEnd
  if (rec.toEnd){
    CB.onEnd && CB.onEnd(rec.toEnd);
    BUFFER.length=0; notifyBuffer(); return;
  }
}

  // ========= Public API =========
  const Chain = {
    init(cb){
      CB = Object.assign(
        { onTransform:null, onEvo:null, onEnd:null, log:null, onBufferChange:null },
        cb||{}
      );
      const S = window.ensureSave?.() || (window.SAVE={form:{id:'human'}});
      FORM = S.form?.id || 'human';
      BUFFER = [];
      notifyBuffer();
    },
    getForm(){ return FORM; },
    setForm(id){ FORM = id; },
    getBuffer(){ return BUFFER.slice(); },
    resetBuffer(){ BUFFER.length = 0; notifyBuffer(); },

    feed(cup){
      const c = String(cup);
      BUFFER.push(c);
      notifyBuffer();

      const { full, expecting, single } = analyze(c);

      // (1) full match?
      if (full){
        consumeFromBuffer((full.requires||[]).length);
        applyOutcome(full);
        return true;
      }
      // (2) เชนหลายคัพกำลังรอ → รอ
      if (expecting){
        CB.log && CB.log('…waiting for next cup');
        return false;
      }
      // (3) สูตรคัพเดียว (fallback)
      if (single){
        consumeFromBuffer(1);
        applyOutcome(single);
        return true;
      }
      // (4) ดีฟอลต์
      CB.log && CB.log('Something has changed a little bit');
      return false;
    }
  };

  window.Chain = Chain;
})();