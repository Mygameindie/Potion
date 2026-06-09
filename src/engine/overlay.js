// overlay.js — unified overlay system (Evolution / Endings) + fade curtain

// ===== Fade curtain & helpers =====
(function(){
  function ensureCurtain(){
    let c = document.getElementById('fadeCurtain');
    if (!c) {
      c = document.createElement('div');
      c.id = 'fadeCurtain';
      Object.assign(c.style, {
        position:'fixed', inset:'0',
        background:'rgba(0,0,0,0.8)',   // base สีของม่าน
        opacity:'0',                    // เริ่มโปร่ง
        transition:'opacity 1000ms ease',
        pointerEvents:'none',
        zIndex:'0'                      // เริ่มใต้ทุกอย่าง
      });
      document.body.appendChild(c);
    }
    return c;
  }
  ensureCurtain();

  function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

  async function fadeToBlack(ms=1000){
    const c = ensureCurtain();
    c.style.zIndex = '9999';
    c.style.pointerEvents = 'none';
    // ขึ้นเป็นดำเต็มก่อน แล้วค่อยปรับระดับด้วย setCurtain ภายหลัง
    c.style.opacity = '1';
    await wait(ms);
  }

  async function fadeFromBlack(ms=1000){
    const c = ensureCurtain();
    c.style.opacity = '0';
    await wait(ms);
    c.style.zIndex = '0';
    c.style.pointerEvents = 'none';
  }

  // ให้ส่วนอื่นเรียกปรับความมืด/รีเซ็ตได้สะดวก
  function setCurtain(opacity){
    const c = ensureCurtain();
    c.style.opacity = String(opacity);
    c.style.zIndex = '9999';           // ม่านอยู่ใต้ overlay เสมอ
    c.style.pointerEvents = 'none';    // ไม่บังการคลิก
  }
  function resetCurtain(){
    const c = ensureCurtain();
    c.style.opacity = '0';
    c.style.zIndex  = '0';
    c.style.pointerEvents = 'none';
  }

  window.__fadeToBlack   = fadeToBlack;
  window.__fadeFromBlack = fadeFromBlack;
  window.setCurtain      = setCurtain;
  window.resetCurtain    = resetCurtain;
})();

// ===== Overlay root (single source of truth) =====
(function ensureOverlayRoot(){
  let root = document.getElementById('overlay');
  if (!root){
    root = document.createElement('div');
    root.id = 'overlay';
    Object.assign(root.style, {
      position:'fixed', inset:'0',
      display:'none',                   // เริ่มซ่อน
      alignItems:'center', justifyContent:'center',
      zIndex:'10001'                    // เหนือม่าน
    });
    document.body.appendChild(root);
  } else {
    // เผื่อใน HTML มี class="hidden"
    root.classList.remove('hidden');
    root.removeAttribute('hidden');
    root.style.display = 'none';
    root.style.zIndex  = '10001';
  }
})();

// ===== Minimal typewriter & GameOver (idempotent) =====
window.__typeText = window.__typeText || function(el, text, cps=30){
  return new Promise(resolve=>{
    el.textContent = '';
    let i = 0;
    (function step(){
      if (i >= text.length) return resolve();
      el.textContent += text[i++];
      setTimeout(step, 1000/cps);
    })();
  });
};

window.__ensureGameOver = window.__ensureGameOver || function(){
  let go = document.getElementById('gameOver');
  if (!go){
    go = document.createElement('div');
    go.id = 'gameOver';
    Object.assign(go.style, {
      position:'fixed', inset:'0', display:'none',
      alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,1)', color:'#fff', zIndex:'10002'
    });
    go.innerHTML = `
      <div style="min-width:280px;max-width:820px;text-align:center;padding:18px 22px;">
        <h1 id="goTitle" style="margin:0 6px 12px;font-size:42px;letter-spacing:2px;text-shadow:0 2px 24px rgba(0,0,0,.65);"></h1>
        <p  id="goDesc"  style="margin:0 0 22px;color:#cfcfd6;opacity:.9"></p>
        <button id="goContinue" class="btn" style="padding:10px 18px;font-weight:700;border-radius:10px">CONTINUE</button>
      </div>`;
    document.body.appendChild(go);
  }
  return go;
};

// ===== Core overlay API (new version only) =====
(function(){
  const root = document.getElementById('overlay');

  function clearNode(n){ while(n.firstChild) n.removeChild(n.firstChild); }

  function enqueueOverlay({title='', desc='', image='', actions=[], size='lg', fit='cover'}){
  clearNode(root);

  const card = document.createElement('div');
  card.className = 'overlay-card ' + (size === 'full' ? 'full' : size === 'lg' ? 'lg' : '');
  if (fit === 'contain') card.classList.add('overlay-card','anim-in');         // ถ้ายังไม่ได้ตั้ง class
card.addEventListener('animationend', ()=>card.classList.remove('anim-in'), {once:true});

  const img = document.createElement('div');
  img.className = 'ov-img';
  if (image) {
    img.style.backgroundImage = `url('${image}')`;
  }

  const body = document.createElement('div');
  body.className = 'ov-body';

  const h = document.createElement('h3');
  h.textContent = title || 'Overlay';
  h.style.margin = '0 0 6px';

  const p = document.createElement('p');
  p.textContent = desc || '';
  p.style.margin = '0 0 12px';
  p.style.opacity = '.9';

  const act = document.createElement('div');
  act.className = 'ov-actions';
  (actions||[]).forEach(a=>{
    const b = document.createElement('button');
    b.className = a.className || 'btn';
    b.textContent = a.label || 'OK';
    b.addEventListener('click', ()=> a.onClick && a.onClick());
    act.appendChild(b);
  });

  body.append(h,p,act);
  card.append(img, body);
  root.appendChild(card);

  // force-show
  root.classList.remove('hidden');
  root.removeAttribute('hidden');
  root.style.display    = 'flex';
  root.style.visibility = 'visible';
  root.style.opacity    = '1';
  root.style.zIndex     = '10001';
}

  function hideOverlay(){
  const card = root.firstChild;
  if (card) {
    card.classList.add('anim-out');
    card.addEventListener('animationend', finalize, {once:true});
  } else {
    finalize();
  }
  function finalize(){
    root.setAttribute('hidden','');
    root.style.display='none';
    root.style.visibility='hidden';
    while(root.firstChild) root.removeChild(root.firstChild);
    window.resetCurtain?.();
  }
}

  window.overlay = Object.assign({}, window.overlay, {
    enqueueOverlay,
    hideOverlay,
  });
  window.hideOverlay = hideOverlay; // เผื่อเรียกตรง
})();

// ===== Evolution (fade-in, Devolve only) =====
async function showEvolutionOverlay(newId, prevId){
  // ปิดมินิโอเวอร์เลย์ (ถ้าค้าง)
  window.closeBrewMiniOverlay?.();

  await window.__fadeToBlack?.(1000);              // มืดเข้า
  const f = (window.DATA_FORMS && window.DATA_FORMS[newId]) || null;


window.overlay.enqueueOverlay({
  title: `Evolution → ${f?.name || newId}`,
  desc:  `วิวัฒนาการสำเร็จ (จาก ${window.DATA_FORMS?.[prevId]?.name||prevId})`,
  image: f?.image || 'assets/evolution_placeholder.png',
  actions: [{ label:'Devolve', onClick: async ()=>{
          const S = window.ensureSave?.(); 
          if (S){ S.form.id = prevId; window.saveNow?.(); }
          try{
            window.Chain?.setForm?.(prevId);
            window.Chain?.resetBuffer && window.Chain.resetBuffer();
          }catch(_){}
          window.updateFormUI?.();
          window.appendLog?.(`Devolve → ${prevId}`);

          await window.__fadeFromBlack?.(1000);     // สว่างกลับ
          window.overlay.hideOverlay();             // จะ resetCurtain ให้ด้วย
        } 
      }
    ],
  size: 'lg',         // ⬅ ใหญ่
  fit:  'cover'       // หรือ 'contain' ถ้าภาพตั้ง
});

  // ให้พื้นหลังมืดพอดี (ไม่กลืนการ์ด)
  requestAnimationFrame(()=>{
  window.setCurtain?.(0.75);
  document.getElementById('fadeCurtain')?.classList.add('pulse');
  setTimeout(()=>document.getElementById('fadeCurtain')?.classList.remove('pulse'), 2000);
});
}

// ===== Endings (fade-in → overlay 5s → GameOver → Continue=reborn) =====
async function showEndingOverlayById(endId){
  window.closeBrewMiniOverlay?.();

  const list = window.DATA_ENDINGS_NEW || window.DATA_ENDINGS || [];
  const e = Array.isArray(list) ? list.find(x=>x.id===endId) : null;
  const overlay = e?.overlay || {};
  const reborn  = e?.rebornTo || 'human';

  await window.__fadeToBlack?.(1000);

  window.overlay.enqueueOverlay({
    title: overlay.title || e?.name || 'Ending',
    desc:  overlay.desc  || '',
    image: overlay.image || 'assets/ending_default.png',
    actions: [],
    size: 'lg',
    fit:  'cover'
  });

  requestAnimationFrame(()=>{
    window.setCurtain?.(0.85);
    // ⬇️ ใช้ overlay root จาก DOM แทน root ที่ไม่มีในสโคปนี้
    document.getElementById('overlay')
      ?.querySelector('.ov-img')
      ?.classList.add('kenburns');
  });

  clearTimeout(window.__endingTO);
  window.__endingTO = setTimeout(async ()=>{
    window.overlay.hideOverlay();

    const go = window.__ensureGameOver();
    go.style.display = 'flex';
    go.style.opacity = '0';
    go.style.transition = 'opacity 350ms ease';
    requestAnimationFrame(()=> go.style.opacity = '1');

    const titleText = (overlay.title || e?.name || 'GAME OVER!').toUpperCase();
    const descText  = overlay.desc || '';
    const h1 = go.querySelector('#goTitle');
    const p  = go.querySelector('#goDesc');

    await window.__typeText(h1, titleText, 40);
    if (descText) await window.__typeText(p, descText, 45);

    const btn = go.querySelector('#goContinue');
    btn.classList.add('appear');
    setTimeout(()=>btn.classList.remove('appear'), 600);
    btn.disabled = false;

    btn.onclick = async ()=>{
      btn.disabled = true;

      const S = window.ensureSave?.();
      if (S){ S.form.id = reborn; window.saveNow?.(); }
      try{
        window.Chain?.setForm?.(reborn);
        window.Chain?.resetBuffer && window.Chain.resetBuffer();
      }catch(_){}
      window.updateFormUI?.();
      window.renderBuffer?.();
      window.setOutcome?.(`Reborn → <b>${reborn}</b>`);
      try{
        const f = (window.DATA_FORMS && window.DATA_FORMS[reborn]) || null;
        if (!f || !f.evoOnly) window.markFormSeen?.(reborn);
      }catch(_){}

      // ⬇️ เฟดออกจริง ๆ
      go.style.opacity = '0';
      setTimeout(()=>{ go.style.display = 'none'; }, 350);
      await window.__fadeFromBlack?.(1000);
      window.resetCurtain?.();
      window.closeBrewMiniOverlay?.();
    };
  }, 5000);
}

window.overlay = Object.assign({}, window.overlay, {
  showEvolutionOverlay,
  showEndingOverlayById,
});