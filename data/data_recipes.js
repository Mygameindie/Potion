// v4.2 unified recipes (anyOf/group removed; linear routes)
window.DATA_RECIPES = [
{ id:"human", requires:[{cup:"human"}], toForm:"human", priority:100 },
{ id:"evohuman", form:"human", requires:[{cup:"evolution"}], toEvo:"evo_human" },

{ id:"demon", requires:[{cup:"hell"}], toForm:"demon" },
{ id:"evodemon", form:"demon", requires:[{cup:"evolution"}], toEvo:"evo_demon" },

{ id:"angel", requires:[{cup:"heaven"}], toForm:"angel" },
{ id:"evoangel", form:"angel", requires:[{cup:"evolution"}], toEvo:"evo_angel" },

  { id:"burned", requires:[{cup:"fire"}], toForm:"burned", priority:5, denyForms:["burned"]},
  { id:"ghost", requires:[{cup:"ghost"},{cup:"death"}], toForm:"ghost", priority:100},
  { id:"tree", requires:[{cup:"tree"}], toForm:"tree" },
  { id:"dragon", requires:[{cup:"dragon"}], toForm:"dragon" },
  { id:"firedra", form:"dragon", requires:[{cup:"fire"}], toForm:"fire_dragon", priority:50},
 { id:"dragonevo", form:"dragon", requires:[{cup:"evolution"}], toEvo:"evo_dragon" },
 { id:"mantisman", requires:[{cup:"mantis"}], toForm:"mantisman" },
 { id:"mantismanevo", form:"mantisman", requires:[{cup:"evolution"}], toEnd:"mantisman_tragedy" },
  { id:"burned_end", form:"burned", requires:[{cup:"fire"}], toEnd:"burned_death", priority:10, denyKeywords:["immortality"]},
  { id:"fire_elem", requires:[{cup:"immortality"},{cup:"fire"}], toForm:"fire_elemental", priority:100 },
  { id:"phoenix", form:"burned", requires:[{cup:"immortality"}], toForm:"phoenix", priority:100, denyForms:["human","fire_elemental"]},
  { id:"phoenixdeath", form:"phoenix", requires:[{cup:"death"}], window:{drinks:1,contiguous:true}, toEnd:"phoenixdeath", priority:100 },
  { id:"zpheoend", form:"zombiephoenix", requires:[{cup:"death"}], toEnd:"zombiephoenixdeath", priority:150, denyForms:["phoenix"] },
  { id:"eternalending", form:"phoenixgod", requires:[{cup:"death"}], toEnd:"eternalend", priority:200, denyForms:["zombiephoenix"] },
  { id:"mixer", requires:[{cup:"immortality"},{cup:"blood"},{cup:"immortality"}], window:{drinks:3,contiguous:true}, toForm:"something", priority:150 },
  { id:"tree1", form:"tree", requires:[{cup:"grow"},{cup:"grow"},{cup:"grow"}], window:{drinks:3,contiguous:true}, toForm:"treesap", priority:150 },
  { id:"nulltaion", requires:[{cup:"potion"},{cup:"potion"},{cup:"potion"},{cup:"potion"},{cup:"potion"},{cup:"potion"},{cup:"potion"},{cup:"potion"}], window:{drinks:8,contiguous:true}, toForm:"nulltation", priority:150 },
  { id:"vampire", requires:[{cup:"blood"},{cup:"blood"}], window:{drinks:2,contiguous:true}, toForm:"vampire", priority:100,denyForms:["vampire"] },
  { id:"vampirelord", form:"vampire", requires:[{cup:"blood"},{cup:"blood"},{cup:"blood"},{cup:"blood"}], window:{drinks:4,contiguous:true}, toForm:"vampirelord", priority:150 },
  { id:"cow", requires:[{cup:"cow"}], toForm:"cow", priority:100 },
  { id:"void_elem", requires:[{cup:"immortality"},{cup:"void"}], toForm:"void_elemental", priority:100 },
  { id:"pressurevoid", requires:[{cup:"immortality"},{cup:"pressure"}], window:{drinks:2,contiguous:true}, toForm:"domius" },
  { id:"r_zombie", requires:[{cup:"immortality"},{cup:"death"}], window:{drinks:2,contiguous:true}, toForm:"zombie", priority:100, denyForms:["zombie"]},
  { id:"r_reaper", form:"zombie", requires:[{cup:"death"},{cup:"death"}], window:{drinks:2,contiguous:true}, toForm:"reaper", priority:150},
  { id:"void_end", requires:[{cup:"void"}], toEnd:"ending_void", priority:10, denyForms:["phoenix"]},
  {
  id: "death_end",
  requires: [{ cup: "death" }],
  toEnd: "ending_death",
  priority: 5,
  denyForms: ["phoenix","zombie"],
  denyKeywords: ["immortality"],
  window: { drinks: 1, contiguous: true, lookback: 2 } // มองทั้งเชน
},
  {
    id:"evo_dual_reaper",
    form:"reaper",
    requires:[ { cup:"evolution" } ],
    toEvo:[ "chain_reaper_evo", "chaos_reaper_evo" ]
  },
  {
    id:"evo_cow_milk_to_mily_tank",
    form:"cow",
    requires:[ { cup:"milk" } ],
    toEvo:"milkytank_evo",
    priority: 200 // ให้ชนะสูตรสุ่ม (กันชน)
  },
  {
    id:"evo_cow_dual",
    form:"cow",
    requires:[ { cup:"evolution" } ],
    toEvo: ["cowman_evo", "milkytank_evo"],   // ← ใช้ []
    priority:100
  },
  { id:"gravity_end", requires:[{cup:"gravity"}], toEnd:"gravity_end", priority:5, denyKeywords:["immortality"] },
  { id:"treedeath", form:"tree", requires:[{cup:"death"}], window:{drinks:1,contiguous:true}, toEnd:"treeburn", priority: 10},
  { id:"vampriedeath", form:"vampire", requires:[{cup:"sun"}], window:{drinks:1,contiguous:true}, toEnd:"burninlight" },
  { id:"vamprielorddeath", form:"vampirelord", requires:[{cup:"sun"}], window:{drinks:1,contiguous:true}, toEnd:"burninlight" }
];
