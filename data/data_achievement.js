window.ACHIEVEMENTS = [
  // ---- Milestone ----
  {
    id: "first_sip",
    type: "milestone",
    title: "First Sip",
    desc: "ทดลองดื่ม Potion ครั้งแรก",
    text: "ยินดีต้อนรับสู่การผจญภัยแห่งการปรุงยา!",
    trigger: { on: "drink", goal: 1 }
  },
  {
    id: "first_ending",
    type: "milestone",
    title: "First Ending",
    desc: "ค้นพบฉากจบครั้งแรก",
    text: "คุณได้ก้าวผ่านครั้งแรกและอาจไม่ใช่ครั้งสุดท้าย...",
    trigger: { on: "ending", goal: 1, unique: true }
  },
  {
    id: "first_evo",
    type: "milestone",
    title: "First Evolution",
    desc: "ประสบความสำเร็จในการวิวัฒนาการครั้งแรก",
    text: "การเปลี่ยนแปลงคือก้าวสู่การเริ่มต้นใหม่",
    trigger: { on: "evo", goal: 1 }
  },

  // ---- Transformation (Dragon Forms) ----
  {
    id: "become_stone_dragon",
    type: "transformation",
    title: "Stone Dragon Awakened",
    desc: "กลายร่างเป็น Stone Dragon",
    text: "หินผายักษ์แห่งตำนานมีชีวิตขึ้นอีกครั้ง",
    trigger: { on: "formChange",  to: "stone_dragon" }
  },
  {
    id: "become_ice_dragon",
    type: "transformation",
    title: "Ice Dragon Awakened",
    desc: "กลายร่างเป็น Ice Dragon",
    text: "ความเย็นยะเยือกแผ่ซ่านไปทั่วอากาศ",
    trigger: { on: "formChange", to: "ice_dragon" }
  },
  {
    id: "become_fire_dragon",
    type: "transformation",
    title: "Fire Dragon Awakened",
    desc: "กลายร่างเป็น Fire Dragon",
    text: "เปลวเพลิงแห่งมังกรลุกโชนไม่สิ้นสุด",
    trigger: { on: "formChange", to: "fire_dragon" }
  },

  // ---- Group Achievement ----
  {
  id: "dragon_collector_half",
  type: "group",
  title: "Dragon Collector (2/3)",
  desc: "ค้นพบมังกรอย่างน้อย 2 ตัว",
  text: "คุณเริ่มเข้าใจพลังของเหล่ามังกรแล้ว",
  trigger: { 
    on: "formChange", 
    where: { group: "dragon" }, 
    goal: 2 
  }
}
];