// v4 demo keywords
const KW_TAGS = {
  "1": {emoji:"💬", label:"Dialogue"},
  "2": {emoji:"🎬", label:"Event"},
  "3": {emoji:"🧬", label:"Evolution"},
  "4": {emoji:"💀", label:"Endings"},
  "5": {emoji:"👤", label:"Transformation"}
};

window.DATA_KEYWORDS = [
{ id:"human",    name:"Human",    synonyms:["default","people"], tag:["1","2","3","4","5"]},
{ id:"abyss",    name:"Abyss",  tag:["1","5"]},
{ id:"heaven",    name:"Heaven", synonyms:["angel","god","jesus"],  tag:["1","3","5"]},
{ id:"hell",    name:"Hell", synonyms:["demon","devil"],  tag:["1","3","5"]},
{ id:"disease",    name:"Disease", synonyms:["cancer","plague"],  tag:["1","3","5"]},
{ id:"ghost",    name:"Ghost", tag:["1","3","5"]},
{ id:"blood",    name:"Blood", tag:["1","3","5"]},
{ id:"bear",    name:"Bear", tag:["1","3","5"]},
{ id:"bee",    name:"Bee", tag:["1","3","5"]},
{ id:"cat",    name:"Cat", tag:["1","3","5"]},
{ id:"crocodile",    name:"Crocodile", tag:["1","3","5"]},
{ id:"dog",    name:"Dog", tag:["1","3","5"]},
{ id:"fish",    name:"Fish", tag:["1","3","5"]},
{ id:"bunny",    name:"Bunny", synonyms:["rabbit"], tag:["1","3","5"]},
{ id:"tree",    name:"Tree", tag:["1","3","5"]},
{ id:"alien",    name:"Alien", tag:["1","3","5"]},
{ id:"octopus",    name:"Octopus", tag:["1","3","5"]},
{ id:"fire",      name:"Fire",      synonyms:["flame"],        tag:["2","3","4","5"], preview:"burned", flavor:"มีรสชาติไหม้ ขมแปลกๆ"},
{ id:"ice",    name:"Ice",   tag:["2","3","4","5"]},
{ id:"teeth",    name:"Teeth", tag:["1","5"]},
{ id:"eye",    name:"Eye", tag:["1","5"]},
{ id:"silence",    name:"Silence", tag:["1","5"]},
{ id:"lovecraft",    name:"Lovecraft", tag:["1","5"]},
{ id:"empower",    name:"Empower", tag:["1","3","5"]}, //Stronghuman/Super Swordmaster 
{ id:"shield",    name:"Shield", tag:["1","3","5"]}, //Swordman/Super Swordmaster 
{ id:"sword",    name:"Sword", tag:["1","3","5"]},
{ id:"shop",    name:"Shop", tag:["1","3","5"]},
{ id:"nerd",    name:"Nerd", tag:["1","3","5"]},
{ id:"grow",    name:"Grow", tag:["1","3","5"]},
//Despair of Darkness
{ id:"despair",    name:"Despair", tag:["1","3","4","5"]}, //Melton
{ id:"void",    name:"Void", tag:["1","4","5"]}, 
{ id:"entropy",    name:"Entropy", tag:["1","4","5"]},
{ id:"oblivion",    name:"Oblivion", tag:["1","4","5"]},
{ id:"pride",    name:"Pride", tag:["1","4","5"]},
{ id:"existence",    name:"Existence", tag:["1","3","4","5"]}, //Ipearter
{ id:"abstraction",    name:"Abstraction", tag:["1","3","4","5"]}, //Spliter
{ id:"mystery",    name:"Mystery", tag:["1","3","4","5"]}, 
{ id:"liminality",    name:"Liminality", tag:["1","3","4","5"]},




{ id:"milk",    name:"Milk",  tag:["1","5"]},
{ id:"cow",    name:"Cow",  tag:["1","5"]},
{ id:"man",    name:"Man",  tag:["1","5"]},
  { id:"dragon",    name:"Dragon",    synonyms:["wyrm","drake"], lethal:false, transform:true,  evoable:true,  dialogue:false },
  { id:"mantis",      name:"mantis",   lethal:true, transform:true,  evoable:true,  dialogue:false },
  { id:"inside",      name:"Inside",   lethal:true, transform:true,  evoable:false,  dialogue:false },
  { id:"outside",      name:"Outside",   lethal:true, transform:true,  evoable:false,  dialogue:false },
  { id:"pressure",      name:"Pressure",   lethal:true, transform:true,  evoable:false,  dialogue:false },
  { id:"potion",      name:"Potion",   lethal:false, transform:true,  evoable:false,  dialogue:false },
 
 
  { id:"light",      name:"Light",     lethal:false, transform:true,  evoable:true,  dialogue:false },
  { id:"evolution", name:"Evolution", synonyms:["evo"],          lethal:false, transform:false, evoable:false, dialogue:false },
  { id:"stone", name:"Stone", synonyms:["Rock"],          lethal:false, transform:true, evoable:false, dialogue:false },
  { id:"death", name:"Death", synonyms:["die"], tag:["4","5"], preview:"reaper" },
  { id:"sun", name:"Sun", synonyms:["sunlight","daylight"], tag:["4","5"] },
  { id:"gravity", name:"Gravity", synonyms:["mass"], tag:["4","5"] },
  { id:"immortality",      name:"Immortality",      synonyms:["immunity"],         lethal:false,  transform:true, evoable:false, dialogue:false }
];


