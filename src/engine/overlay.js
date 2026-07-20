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
    // ต้องตั้ง position:fixed ให้ element ที่มาจาก HTML ด้วย
    // ไม่งั้นหน้าต่างจะไปต่อท้ายหน้า (หลุดนอกจอ) แทนที่จะลอยกลางจอ
    Object.assign(root.style, {
      position:'fixed', inset:'0',
      display:'none',
      alignItems:'center', justifyContent:'center',
      zIndex:'10001'
    });
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

  // ฉากเต็มจอ (เฟดดำ → ภาพข้างบนกลาง → ข้อความ → ปุ่ม)
  // คืน element ต่าง ๆ ให้ผู้เรียกไปเติมข้อความ/ผูกปุ่มเอง
  function showSceneOverlay({title='', desc='', image='', actions=[]}){
    clearNode(root);

    const scene = document.createElement('div');
    scene.className = 'scene-full';

    const img = document.createElement('div');
    img.className = 'scene-img';
    if (image) img.style.backgroundImage = `url('${image}')`;

    const h = document.createElement('h1');
    h.textContent = title;

    const p = document.createElement('p');
    p.textContent = desc;

    const act = document.createElement('div');
    act.className = 'ov-actions';
    const buttons = (actions||[]).map(a=>{
      const b = document.createElement('button');
      b.className = a.className || 'btn';
      b.textContent = a.label || 'OK';
      b.addEventListener('click', ()=> a.onClick && a.onClick(b));
      act.appendChild(b);
      return b;
    });

    scene.append(img, h, p, act);
    root.appendChild(scene);

    root.classList.remove('hidden');
    root.removeAttribute('hidden');
    root.style.display    = 'flex';
    root.style.visibility = 'visible';
    root.style.opacity    = '1';
    root.style.zIndex     = '10001';

    requestAnimationFrame(()=> scene.classList.add('show'));
    return { scene, imgEl:img, titleEl:h, descEl:p, buttons };
  }

  function hideOverlay(){
  const card = root.firstChild;
  let done = false;
  if (card && card.classList.contains('scene-full')) {
    // ฉากเต็มจอ: เฟดออกด้วย transition ของ opacity
    if (!card.classList.contains('show')) { finalize(); }
    else {
      card.classList.remove('show');
      card.addEventListener('transitionend', finalize, {once:true});
      setTimeout(finalize, 800); // กัน transitionend ไม่ยิง
    }
  } else if (card) {
    card.classList.add('anim-out');
    card.addEventListener('animationend', finalize, {once:true});
  } else {
    finalize();
  }
  function finalize(){
    if (done) return;
    done = true;
    root.setAttribute('hidden','');
    root.style.display='none';
    root.style.visibility='hidden';
    while(root.firstChild) root.removeChild(root.firstChild);
    window.resetCurtain?.();
  }
}

  window.overlay = Object.assign({}, window.overlay, {
    enqueueOverlay,
    showSceneOverlay,
    hideOverlay,
  });
  window.hideOverlay = hideOverlay; // เผื่อเรียกตรง
})();

// ===== ปิดฉากเต็มจอ: ฉากจางออก → ม่านจางออก → เก็บกวาด =====
function __sceneWait(ms){ return new Promise(r=>setTimeout(r, ms)); }
async function __closeScene(){
  const scene = document.querySelector('#overlay .scene-full');
  if (scene) scene.classList.remove('show');
  await __sceneWait(650);
  await window.__fadeFromBlack?.(1000);
  window.overlay.hideOverlay();
}

// ===== Evolution (เฟดดำ → ภาพร่างอีโวข้างบนกลาง → "Evolution Complete" → ปุ่ม Devolve) =====
async function showEvolutionOverlay(newId, prevId){
  // ปิดมินิโอเวอร์เลย์ (ถ้าค้าง)
  window.closeBrewMiniOverlay?.();

  await window.__fadeToBlack?.(1000);              // เฟดดำ
  const f    = (window.DATA_FORMS && window.DATA_FORMS[newId])  || null;
  const prev = (window.DATA_FORMS && window.DATA_FORMS[prevId]) || null;

  window.overlay.showSceneOverlay({
    title: 'Evolution Complete',
    desc:  `${prev?.name || prevId} → ${f?.name || newId}`,
    image: f?.image || 'assets/evolution_placeholder.png',
    actions: [{ label:'Devolve', onClick: async (btn)=>{
      btn.disabled = true;
      const S = window.ensureSave?.();
      if (S){ S.form.id = prevId; window.saveNow?.(); }
      try{
        window.Chain?.setForm?.(prevId);
        window.Chain?.resetBuffer && window.Chain.resetBuffer();
      }catch(_){}
      window.updateFormUI?.();
      window.appendLog?.(`Devolve → ${prevId}`);
      await __closeScene();
    }}]
  });
}

// ===== Endings (เฟดดำ → ภาพฉากจบข้างบนกลาง → พิมพ์สตริงฉากจบ → ปุ่ม Reborn) =====
async function showEndingOverlayById(endId){
  window.closeBrewMiniOverlay?.();

  const list = window.DATA_ENDINGS_NEW || window.DATA_ENDINGS || [];
  const e = Array.isArray(list) ? list.find(x=>x.id===endId) : null;
  const overlay = e?.overlay || {};
  const reborn  = e?.rebornTo || 'human';

  await window.__fadeToBlack?.(1000);

  const titleText = (overlay.title || e?.name || 'GAME OVER!').toUpperCase();
  const descText  = overlay.desc || '';

  const ui = window.overlay.showSceneOverlay({
    image: overlay.image || 'assets/ending_default.png',
    actions: [{ label:'Reborn', onClick: async (btn)=>{
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

      await __closeScene();
      window.closeBrewMiniOverlay?.();
    }}]
  });

  // ซ่อนปุ่มไว้ก่อน พิมพ์สตริงฉากจบเสร็จค่อยโชว์
  const btn = ui.buttons[0];
  btn.style.visibility = 'hidden';
  ui.imgEl.classList.add('kenburns');

  await __sceneWait(650);                              // รอฉากเฟดเข้า
  await window.__typeText(ui.titleEl, titleText, 40);
  if (descText) await window.__typeText(ui.descEl, descText, 45);

  btn.style.visibility = 'visible';
  btn.classList.add('appear');
  setTimeout(()=>btn.classList.remove('appear'), 600);
}

// ===== Preview (จาก Codex → Keywords: แสดงหน้าต่างภาพฟอร์มตามดาต้า preview ของ keyword) =====
function showPreview({ title = 'Preview', desc = '', image = null } = {}){
  window.closeBrewMiniOverlay?.();

  window.overlay.enqueueOverlay({
    title,
    desc,
    image: image || 'assets/evolution_placeholder.png',
    actions: [{ label:'Close', onClick: ()=> window.overlay.hideOverlay() }],
    size: 'lg',
    fit:  'cover'
  });

  // ม่านมืดเบา ๆ ให้การ์ดเด่นขึ้น (hideOverlay จะ resetCurtain ให้เอง)
  requestAnimationFrame(()=> window.setCurtain?.(0.6));
}

window.overlay = Object.assign({}, window.overlay, {
  showEvolutionOverlay,
  showEndingOverlayById,
  showPreview,
});