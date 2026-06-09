/* ========================================================================
   Easter_Eggs.js  —  ระบบ Easter Eggs รวมศูนย์ (เริ่มด้วย Phoenix Shield)
   โหลดหลัง game.js + engine_chain_buffer.js
   ======================================================================== */
(function(){
  // ป้องกันโหลดซ้ำ
  if (window.EE) return;

  const EE = {
    version: '1.0.0',
    cfg:{
      phoenix:{
        formId: 'phoenix',
        // รายชื่อ ending ที่ "ไม่" ถูกโล่กัน เช่น ฉากจบเฉพาะฟีนิกซ์
        ignoreEnds: ['phoenixdeath','zombiephoenixdeath','eternalend'],
        // ข้อความแจ้งเตือนเมื่อโล่ทำงาน
        logText: "The Phoenix’s flames shielded you from death…",
        toastText: "Phoenix Shield ✨",
      }
    },
    // -------- state helpers (เก็บใน SAVE.easter) --------
    ensureSave(){
      window.SAVE = window.SAVE || {};
      SAVE.easter = SAVE.easter || {};
      return SAVE.easter;
    },
    getShield(){
      const es = EE.ensureSave();
      return es.phoenixShield|0;
    },
    setShield(n){
      const es = EE.ensureSave();
      es.phoenixShield = Math.max(0, n|0);
      if (typeof window.saveNow === 'function') saveNow();
    },
    giveShieldOnce(){
      // ให้โล่ 1 ครั้งเมื่อได้ร่างฟีนิกซ์
      if (EE.getShield() <= 0) EE.setShield(1);
    },
    clearShield(){
      EE.setShield(0);
    },

    // -------- core behaviours --------
    isPhoenix(){
      const cur = (window.SAVE?.form?.id) || window.__FORM__ || 'human';
      return cur === EE.cfg.phoenix.formId;
    },
    shouldIgnoreEnd(endId){
      return EE.cfg.phoenix.ignoreEnds.includes(endId);
    },

    // เรียกก่อน “จะจบ” — ถ้าคืน true = กันไว้/จัดการเองแล้ว, ให้ยกเลิก flow ปกติ
    handleBeforeEnd(endId){
      try{
        // กันเฉพาะเคสเป็นฟีนิกซ์ + มีโล่ + ไม่ใช่ฉากจบที่ยกเว้น
        if (EE.isPhoenix() && EE.getShield() > 0 && !EE.shouldIgnoreEnd(endId)){
          // ใช้โล่แล้วตัดทิ้ง ไม่ให้เกิด ending ปกติ
          EE.setShield(EE.getShield() - 1);
          // แจ้งผู้เล่น
          try{ window.appendLog?.(EE.cfg.phoenix.logText); }catch(_){}
          try{ window.showToast?.(EE.cfg.phoenix.toastText); }catch(_){}
          return true; // บอกว่า intercept แล้ว
        }
      }catch(_){}
      return false;
    },

    // ใช้ตอนเปลี่ยนร่าง: เข้า phoenix → ให้โล่, ออกจาก phoenix → เคลียร์โล่
    onSetForm(nextId, prevId){
      const p = EE.cfg.phoenix.formId;
      if (nextId === p && prevId !== p){
        EE.giveShieldOnce();
      }else if (prevId === p && nextId !== p){
        EE.clearShield();
      }
    },

    // -------- installers (ครอบฟังก์ชันระบบเดิมแบบปลอดภัย) --------
    install(){
      // 1) ครอบ setForm (หรือฟังก์ชันเปลี่ยนร่าง) เพื่อจัดการโล่
      if (typeof window.setForm === 'function' && !window.__EE_wrapped_setForm){
        const orig = window.setForm;
        window.setForm = function(nextId){
          const prev = (window.SAVE?.form?.id) || window.__FORM__ || 'human';
          const out = orig.apply(this, arguments);
          try{ EE.onSetForm(nextId, prev); }catch(_){}
          return out;
        };
        window.__EE_wrapped_setForm = true;
      }

      // 2) ครอบ applyOutcome_light (engine chain-buffer) ถ้ามี
      if (typeof window.applyOutcome_light === 'function' && !window.__EE_wrapped_applyOutcome){
        const orig = window.applyOutcome_light;
        window.applyOutcome_light = function(rec){
          try{
            // rec.toEnd คือจะจบ ถ้ากันได้ให้ยุติ
            if (rec && rec.toEnd){
              if (EE.handleBeforeEnd(rec.toEnd)) return true; // กันสำเร็จ → ถือว่า “จัดการแล้ว”
            }
          }catch(_){}
          return orig.apply(this, arguments);
        };
        window.__EE_wrapped_applyOutcome = true;
      }

      // 3) เผื่อโปรเจ็กต์ใช้ applyRecipeOutcome แบบเก่า
      if (typeof window.applyRecipeOutcome === 'function' && !window.__EE_wrapped_applyRecipe){
        const orig = window.applyRecipeOutcome;
        window.applyRecipeOutcome = function(rec){
          try{
            if (rec && rec.toEnd){
              if (EE.handleBeforeEnd(rec.toEnd)) return true;
            }
          }catch(_){}
          return orig.apply(this, arguments);
        };
        window.__EE_wrapped_applyRecipe = true;
      }

      // 4) ครอบ showEndingOverlayById (กรณีใด ๆ หลุดมาก่อน)
      if (typeof window.showEndingOverlayById === 'function' && !window.__EE_wrapped_showEndById){
        const orig = window.showEndingOverlayById;
        window.showEndingOverlayById = function(endId){
          try{
            if (EE.handleBeforeEnd(endId)) return; // กันไว้ ไม่ต้องโชว์ overlay
          }catch(_){}
          return orig.apply(this, arguments);
        };
        window.__EE_wrapped_showEndById = true;
      }

      // 5) ครอบ showEndingOverlay (กรณีเรียกด้วย object)
      if (typeof window.showEndingOverlay === 'function' && !window.__EE_wrapped_showEnd){
        const orig = window.showEndingOverlay;
        window.showEndingOverlay = function(e){
          try{
            const id = e?.id || e?.endingId || e?.key;
            if (id && EE.handleBeforeEnd(id)) return; // กันไว้
          }catch(_){}
          return orig.apply(this, arguments);
        };
        window.__EE_wrapped_showEnd = true;
      }

      // โหลดครั้งแรก: ถ้าอยู่ในร่างฟีนิกซ์ ให้เติมโล่ให้ (กันกรณีโหลดจากเซฟ)
      try{
        if (EE.isPhoenix() && EE.getShield()<=0) EE.giveShieldOnce();
      }catch(_){}

      console.log('[Easter_Eggs] installed', EE.version);
    }
  };

  window.EE = EE;
  // ติดตั้งทันทีเมื่อโหลดไฟล์
  EE.install();
})();