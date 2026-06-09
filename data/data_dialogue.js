/* =========================================================
   Dialogue Data — pre-triggers for End/Evo/Form
   ========================================================= */
// dialogue_data_pre_triggers.js
DLG.register([
  {
    id: 'scorch',
    trigger: { on: 'postDrink', keyword: 'fire', form: 'human' },
    title: 'รู้สึกถึงความเผ็ดร้อน',
    lines: [
      { speaker: '???', text: 'ลิ้นเริ่มชา… ควรทำอย่างไรต่อดี?' },
      { speaker: '???', text: 'อ๊ากกกกกก!' }
    ]
  },

  // ก่อน Ending เฉพาะไอดี
  {
    id: 'dlg_before_void_end',
    trigger: { on:'beforeEnd', endingId:'ending_void' },
    title: 'ก่อนล่มสลาย',
    lines: [
      { speaker:'Void', text:'ความว่างเปล่าคือคำตอบสุดท้ายของทุกสิ่ง…' },
      { speaker:'Void', text:'จงมองเป็นบทเรียน ไม่ใช่จุดจบ' }
    ],
    after: ()=>console.log('[dlg] pre-void-end done')
  },

  // ก่อน Evolution ไปยังร่างอีโวเป้าหมาย
  {
    id: 'dlg_before_evo_mantis',
    trigger: { on:'beforeEvo', toEvo:'evo_mantisman' },
    title: 'สัญญาณวิวัฒน์',
    lines: [
      { speaker:'Mantis', text:'กรีด… ผิวหนังเก่าเริ่มแตกออกแล้ว' }
    ]
  },
  
  {
    id: 'mantisdeath',
    trigger: { on:'beforeEnd', toEnd:'mantisman_tragedy' },
    title: 'ความกระหาย',
    lines: [
      { speaker:'Mantis', text:'เริ่มรู้สึกหิว' }
    ]
  },

  // ก่อน Transform เป็นร่างใหม่ (toForm)
  {
    id: 'dlg_before_form_undying_phoenix',
    trigger: { on:'beforeForm', toForm:'undying_phoenix' },
    title: 'ไฟนิรันดร์',
    lines: [
      { speaker:'Flame', text:'อย่ากลัวความตาย—เพราะนั่นคือทางผ่าน' }
    ]
  }
]);