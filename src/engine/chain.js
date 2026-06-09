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

function matchByFullSequence(){
  const R = window.RECIPES || [];
  let best = null;
  const formId = FORM;
  const bufIds = BUFFER.slice();
  for (const rec of R){
    if (!guardForm(rec, formId) || !guardDeny(rec, bufIds, formId)) continue;
    const need = (rec.requires||[]).map(x=>x.cup);
    if (!need.length) continue;
    if (bufIds.length >= need.length){
      const tail = bufIds.slice(-need.length);
      let ok = true;
      for (let i=0;i<need.length;i++){ if (tail[i] !== need[i]) { ok=false; break; } }
      if (ok){
        // keep your scoring preference
        const rp = rec.priority||0, bp = best ? (best.priority||0) : -1;
        const rl = need.length,       bl = best ? (best.requires||[]).length : -1;
        const rHasForm = !!rec.form,  bHasForm = !!(best && best.form);
        if (!best || rp>bp || (rp===bp && rl>bl) || (rp===bp && rl===bl && rHasForm && !bHasForm)){
          best = rec;
        }
      }
    }
  }
  return best;
}

function isAnyRecipeExpectingMore(){
  const R = window.RECIPES || [];
  const formId = FORM;
  const bufIds = BUFFER.slice();
  for (const rec of R){
    if (!guardForm(rec, formId) || !guardDeny(rec, bufIds, formId)) continue;
    const need = (rec.requires||[]).map(x=>x.cup);
    if (need.length > bufIds.length){
      // prefix match
      let ok = true;
      for (let i=0;i<bufIds.length;i++){ if (need[i] !== bufIds[i]) { ok=false; break; } }
      if (ok) return true;
    }
  }
  return false;
}

function matchSingleCupFallback(lastCup){
  if (!lastCup) return null;
  const R = window.RECIPES || [];
  let best=null;
  const formId = FORM;
  const bufIds = BUFFER.slice();
  for (const rec of R){
    if (!guardForm(rec, formId) || !guardDeny(rec, bufIds, formId)) continue;
    const need = (rec.requires||[]).map(x=>x.cup);
    if (need.length !== 1) continue;
    if (need[0] === lastCup){
      const rp = rec.priority||0, bp = best ? (best.priority||0) : -1;
      const rHasForm = !!rec.form,  bHasForm = !!(best && best.form);
      if (!best || rp>bp || (rp===bp && rHasForm && !bHasForm)){
        best = rec;
      }
    }
  }
  return best;
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
      BUFFER.push(String(cup));
      notifyBuffer();

      // (1) full match?
      const full = matchByFullSequence();
      if (full){
        consumeFromBuffer((full.requires||[]).length);
        applyOutcome(full);
        return true;
      }
      // (2) เชนหลายคัพกำลังรอ → รอ
      if (isAnyRecipeExpectingMore()){
        CB.log && CB.log('…waiting for next cup');
        return false;
      }
      // (3) สูตรคัพเดียว (fallback)
      const single = matchSingleCupFallback(cup);
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