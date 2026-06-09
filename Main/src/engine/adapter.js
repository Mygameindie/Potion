;(function(){
  function adaptRecipes(rawList){
    if (!Array.isArray(rawList)) return [];
    const out=[];
    for (const r of rawList){
      if (!r || !r.requires) continue;
      const req = [];
      for (const step of r.requires){
        const id = (step && (step.id||step.cup)) ? String(step.id||step.cup) : null;
        if (!id) continue;
        const n = Math.max(1, step.count||1);
        for (let i=0;i<n;i++) req.push({ cup:id });
      }
      out.push({
        id: r.id,
        form: r.form || null,
        requires: req,
        toForm: r.toForm || null,
        // accept both `toEvo` and the legacy `toEvoOneOf` spelling
        toEvo:  r.toEvo || r.toEvoOneOf || null,
        toEnd:  r.toEnd  || null,
        priority: Number(r.priority||0),
        repeatable: !!r.repeatable,
        window: r.window ? {
          drinks: r.window.drinks || req.length,
          contiguous: !!(r.window.contiguous || r.window.contiguousOnly),
          // preserve lookback so guardDeny() can honour it
          ...(typeof r.window.lookback === 'number' ? { lookback: r.window.lookback } : {})
        } : null,
        denyForms: Array.isArray(r.denyForms)? r.denyForms.slice() : [],
        denyKeywords: Array.isArray(r.denyKeywords)? r.denyKeywords.slice() : [],
      });
    }
    return out;
  }
  const RAW = window.DATA_RECIPES || window.DATA_RECIPES_V44 || window.DATA_RECIPES_LIST || [];
  window.RECIPES = adaptRecipes(RAW);
  try{
    console.log('[ADAPTER] recipes adapted:', window.RECIPES.length);
    if (window.RECIPES[0]) console.log('[ADAPTER] sample:', window.RECIPES[0]);
  }catch(_){}
})();