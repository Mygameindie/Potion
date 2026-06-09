window.DATA_ENDINGS_NEW = [
  { 
    id:"ending_void",
    name:"Into the Void",
    priority:100,
    when:()=>false,
    image:"assets/endings/void.png",
    overlay:{ title:"You Died", desc:"ความว่างเปล่ากลืนกินทุกสิ่ง", image:"assets/endings/void.png" },
    rebornTo:"human"
  },

  {
    id:"phoenixdeath",
    name:"Phoenix’s Sacrifice",
    overlay:{ title:"Ashes to Ashes", desc:"จากกองเถ้าก็กลับคืนสู่ไฟ", image:"assets/endings/void.png" },
    rebornTo:"zombiephoenix"
  }, // <<------ ใส่จุลภาคที่นี่

  // เดิมมีอยู่แล้ว
  {
    id:"ending_death",
    name:"Death Comes",
    overlay:{ title:"You Died", desc:"คุณตายแล้ว", image:"assets/endings/void.png" },
    rebornTo:"human"
  },

  // ====== เติมรายการที่สูตรอ้างอิงแต่ยังไม่มี ======
  {
    id:"burned_death",
    name:"Burned to Ash",
    overlay:{ title:"Cremated", desc:"คุณถูกไฟเผาจนกลายเป็นขี้เถ้า", image:"assets/endings/fire.png" },
    rebornTo:"human"
  },
  {
    id:"treeburn",
    name:"Charred Wood",
    overlay:{ title:"Charred", desc:"คุณไหม้เกรียมเป็นถ่านไม้", image:"assets/endings/void.png" },
    rebornTo:"human"
  },
  {
    id:"burninlight",
    name:"Burn in Light",
    overlay:{ title:"Vampire’s Bane", desc:"แสงอาทิตย์แผดเผาคุณจนมอดไหม้", image:"assets/endings/light.png" },
    rebornTo:"human"
  },
  {
    id:"gravity_end",
    name:"Crushed by Gravity",
    overlay:{ title:"Crushed", desc:"แรงโน้มถ่วงที่ผิดปกติบดขยี้คุณ", image:"assets/endings/void.png" },
    rebornTo:"human"
  },

  // เดิมในไฟล์
  { id:"implosion_end", name:"Implosion", priority:100, when:()=>false,
    overlay:{ title:"You implosioned", desc:"คุณถูกระเบิดจากภายใน...", image:"assets/endings/void.png" }, rebornTo:"human" },

  { id:"mantisman_tragedy", name:"Mantisman: Tragedy", priority:100, when:()=>false,
    overlay:{ title:"You Died", desc:"ถูกตั๊กแตนผู้หิวโหย...", image:"assets/endings/void.png" }, rebornTo:"human", linkEvos: ["evo_mantisman"] },

  { id:"zombiephoenixdeath", name:"Phoenix — Second Death", priority:100, when:()=>false,
    overlay:{ title:"You Died but", desc:"คุณได้ตายอีกครั้งในร่างนี้", image:"assets/endings/void.png" }, rebornTo:"phoenixgod" },

  { id:"eternalend", name:"Eternal Being", priority:100, when:()=>false,
    overlay:{ title:"You Can't Die anymore", desc:"คุณไม่สามารถตายได้", image:"assets/endings/void.png" }, rebornTo:"phoenixgod" },
];