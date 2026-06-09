;(function(){
  function adapt(list){
    if (!Array.isArray(list)) return [];
    const out=[];
    for (const r of list){
      if (!r?.requires) continue;
      const req=[];
      for (const step of r.requires){
        const id = step?.cup || step?.id; if (!id) continue;
        const n = Math.max(1, step.count||1);
        for (let i=0;i<n;i++) req.push({cup:String(id)});
      }
      out.push({
        id: r.id,
        form: r.form || null,
        requires: req,
        toForm: r.toForm || null,
        toEvo:  r.toEvo  || null,
        toEnd:  r.toEnd  || null,
        priority: Number(r.priority||0),
        window: r.window ? { drinks:r.window.drinks||req.length, contiguous: !!r.window.contiguousOnly } : null,
        denyForms:    Array.isArray(r.denyForms)? r.denyForms.slice():[],
        denyKeywords: Array.isArray(r.denyKeywords)? r.denyKeywords.slice():[],
      });
    }
    return out;
  }
  const RAW = window.DATA_RECIPES || window.DATA_RECIPES_V44 || [];
  window.RECIPES = adapt(RAW);
  console.log('[ADAPTER] recipes:', window.RECIPES.length);
})();