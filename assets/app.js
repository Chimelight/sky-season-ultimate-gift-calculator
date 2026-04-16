(function(){

  // ── Theme toggle ─────────────────────────────────────────────────────────
  (function(){
    const root = document.documentElement;
    const btn  = document.getElementById('theme-btn');
    const MOON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    const SUN  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

    function systemTheme(){ return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
    function effectiveTheme(){ return root.dataset.theme || systemTheme(); }

    function applyTheme(theme){
      root.setAttribute('data-theme', theme);
      btn.innerHTML = theme === 'dark' ? SUN : MOON;
      const label = typeof window.t === 'function'
        ? (theme === 'dark' ? window.t('theme_to_light') : window.t('theme_to_dark'))
        : (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-label', label);
      try { localStorage.setItem('theme', theme); } catch(e){}
    }

    applyTheme(effectiveTheme());
    btn.addEventListener('click', function(){ applyTheme(effectiveTheme() === 'dark' ? 'light' : 'dark'); });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e){
      if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
    });
    // Re-apply aria-label on language change
    window.addEventListener('langchange', function(){ applyTheme(effectiveTheme()); });
  })();
  // ─────────────────────────────────────────────────────────────────────────

  const MAX_SPIRITS = 6;

  let renderQueued = false;
  function scheduleRender(){
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderResult();
    });
  }

  function cloneSeason(s){
    return {
      seasonName: s.seasonName,
      startDate: s.startDate,
      rules: Object.assign({}, s.rules),
      spirits: s.spirits.map(sp => ({name: sp.name, levels: sp.levels.map(l => l.slice())})),
      ultimates: s.ultimates.map(u => Object.assign({}, u)),
      targetIdx: s.targetIdx || 0,
    };
  }

  function defaultState(){
    const seasons = window.SEASONS;
    if (seasons && seasons.length > 0) return cloneSeason(seasons[0]);
    return {
      seasonName: 'Carnival',
      startDate: '2026-04-17',
      rules: { cpd:6, pass:30, heart:3, l1f:4, l1h:2, l2f:6, l2h:3, l3f:8, l3h:4, l4f:10, l4h:5 },
      spirits: [
        {name:'Juggler',         levels:[[4],[19,7],[24,10],[28]]},
        {name:'Athletic dancer', levels:[[4],[19,7],[24,12],[28]]},
        {name:'Puzzle director', levels:[[4],[19,7],[24,10],[28]]},
        {name:'Stunt actor',     levels:[[4],[19,7],[24,10],[28]]},
      ],
      ultimates: [{hearts:2},{hearts:2}],
      targetIdx: 1
    };
  }

  let state = defaultState();

  function escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function shortName(n, idx){
    if (!n) return 'S'+(idx+1);
    const w = n.split(/\s+/).filter(Boolean);
    if (w.length===1) return w[0].length<=10 ? w[0] : w[0].slice(0,9)+'.';
    return w.map(x => x[0].toUpperCase()).join('');
  }

  function enumSpirit(spirit, rules){
    const lvlOpts = [];
    for (let i=0; i<4; i++){
      const items = (spirit.levels[i]||[]).filter(x => x !== undefined && x !== null && !isNaN(x) && x !== '');
      const fk = rules['l'+(i+1)+'f'];
      const hk = rules['l'+(i+1)+'h'];
      if (items.length === 0){
        lvlOpts.push([{cost:0, days:0, buys:[], skips:[], k:'none', lvl:i+1}]);
      } else if (items.length === 1){
        const c = items[0];
        lvlOpts.push([
          {cost:c, days:0, buys:[c], skips:[], k:'buy', lvl:i+1},
          {cost:0, days:fk, buys:[], skips:[c], k:'skip', lvl:i+1},
        ]);
      } else {
        const sorted = items.slice(0,2).sort((a,b)=>b-a);
        const exp = sorted[0], cheap = sorted[1];
        lvlOpts.push([
          {cost:exp+cheap, days:0, buys:[exp,cheap], skips:[], k:'both', lvl:i+1},
          {cost:cheap, days:hk, buys:[cheap], skips:[exp], k:'cheap', lvl:i+1},
          {cost:exp, days:hk, buys:[exp], skips:[cheap], k:'exp', lvl:i+1},
          {cost:0, days:fk, buys:[], skips:[exp,cheap], k:'skipboth', lvl:i+1},
        ]);
      }
    }
    let strats = [{cost: rules.heart, days: 0, opts: []}];
    for (let i=0; i<4; i++){
      const next = [];
      for (const s of strats) for (const o of lvlOpts[i]){
        next.push({cost: s.cost+o.cost, days: s.days+o.days, opts: s.opts.concat([o])});
      }
      strats = next;
    }
    return strats.filter(s => !strats.some(x => x !== s && x.cost <= s.cost && x.days <= s.days && (x.cost < s.cost || x.days < s.days)));
  }

  // Build comparison priority order: target first, then later ultimates
  function priorityOrder(targetIdx, n){
    const out = [targetIdx];
    for (let i = targetIdx + 1; i < n; i++) out.push(i);
    for (let i = targetIdx - 1; i >= 0; i--) out.push(i);
    return out;
  }

  function lessByPriority(a, b, prio){
    if (!b) return true;
    for (const i of prio){
      if (a[i] < b[i]) return true;
      if (a[i] > b[i]) return false;
    }
    return false;
  }

  function bestFirstGroup(picks, k, rules){
    const K = picks.length;
    if (k <= 0) return {T: 0, idxs: []};
    let totalC = 0, totalD = 0;
    for (const p of picks){ totalC += p.strat.cost; totalD += p.strat.days; }
    if (k >= K){
      return {T: Math.max(Math.ceil((totalC - rules.pass)/rules.cpd), totalD), idxs: picks.map((_,i)=>i)};
    }
    let best = null;
    const combo = [];
    function rec(start, cnt, sc, sd){
      if (cnt === k){
        const T = Math.max(Math.ceil((sc - rules.pass)/rules.cpd), sd);
        if (!best || T < best.T) best = {T, idxs: combo.slice()};
        return;
      }
      if (K - start < k - cnt) return;
      for (let i = start; i < K; i++){
        combo.push(i);
        rec(i+1, cnt+1, sc + picks[i].strat.cost, sd + picks[i].strat.days);
        combo.pop();
      }
    }
    rec(0, 0, 0, 0);
    return best;
  }

  function computeTs(picks, order, cumHearts, rules){
    const Ts = [];
    let cumC = 0, cumD = 0, p = 0;
    for (const k of cumHearts){
      while (p < k && p < order.length){
        cumC += picks[order[p]].strat.cost;
        cumD += picks[order[p]].strat.days;
        p++;
      }
      Ts.push(Math.max(Math.ceil((cumC - rules.pass)/rules.cpd), cumD));
    }
    return Ts;
  }

  function bestPermutation(arr, prefix, suffix, picks, cumHearts, rules, prio){
    if (arr.length <= 1){
      const order = prefix.concat(arr, suffix);
      return {order: arr.slice(), Ts: computeTs(picks, order, cumHearts, rules)};
    }
    let bestArr = null, bestTs = null;
    const a = arr.slice();
    function perm(start){
      if (start === a.length){
        const order = prefix.concat(a, suffix);
        const Ts = computeTs(picks, order, cumHearts, rules);
        if (!bestTs || lessByPriority(Ts, bestTs, prio)){
          bestArr = a.slice();
          bestTs = Ts;
        }
        return;
      }
      for (let i = start; i < a.length; i++){
        [a[start], a[i]] = [a[i], a[start]];
        perm(start + 1);
        [a[start], a[i]] = [a[i], a[start]];
      }
    }
    perm(0);
    return {order: bestArr, Ts: bestTs};
  }

  function orderingForTarget(picks, cumHearts, targetIdx, rules){
    const K = picks.length;
    if (K === 0) return {Ts: cumHearts.map(()=>0), order: []};
    const prio = priorityOrder(targetIdx, cumHearts.length);
    const targetCount = Math.min(cumHearts[targetIdx], K);
    const fg = bestFirstGroup(picks, targetCount, rules);
    const firstSet = new Set(fg.idxs);
    const firstArr = fg.idxs.slice();
    const restArr = [];
    for (let i = 0; i < K; i++) if (!firstSet.has(i)) restArr.push(i);

    const restRes = bestPermutation(restArr, firstArr, [], picks, cumHearts, rules, prio);
    const restOrder = restRes.order;
    const firstRes = bestPermutation(firstArr, [], restOrder, picks, cumHearts, rules, prio);
    const order = firstRes.order.concat(restOrder);
    const Ts = computeTs(picks, order, cumHearts, rules);
    return {Ts, order};
  }

  function solve(){
    const spirits = state.spirits;
    const rules = state.rules;
    const N = spirits.length;
    const cumHearts = [];
    let acc = 0;
    for (const u of state.ultimates){ acc += Math.max(0, +u.hearts || 0); cumHearts.push(acc); }
    const K = acc;
    if (state.ultimates.length === 0 || K === 0) return {error: window.t('err_no_ult')};
    if (N === 0) return {error: window.t('err_no_spirit')};
    if (K > N) return {error: window.t('err_hearts', {hearts: K, count: N, more: K-N})};

    const targetIdx = Math.max(0, Math.min(state.targetIdx || 0, state.ultimates.length - 1));
    const targetCount = Math.min(cumHearts[targetIdx], K);
    const prio = priorityOrder(targetIdx, state.ultimates.length);
    const perSpirit = spirits.map(s => enumSpirit(s, rules));
    let best = null;
    const picks = [];

    const minCostOf = perSpirit.map(arr => {
      let m = Infinity; for (const s of arr) if (s.cost < m) m = s.cost; return m;
    });
    const minDaysOf = perSpirit.map(arr => {
      let m = Infinity; for (const s of arr) if (s.days < m) m = s.days; return m;
    });

    function lowerBoundT(nextI){
      if (targetCount <= 0) return 0;
      const costs = [];
      const days = [];
      for (const p of picks){ costs.push(p.strat.cost); days.push(p.strat.days); }
      for (let j = nextI; j < N; j++){
        costs.push(minCostOf[j]);
        days.push(minDaysOf[j]);
      }
      if (costs.length < targetCount) return 0;
      costs.sort((a,b) => a-b);
      days.sort((a,b) => a-b);
      let sumC = 0, sumD = 0;
      for (let t = 0; t < targetCount; t++){ sumC += costs[t]; sumD += days[t]; }
      return Math.max(Math.ceil((sumC - rules.pass)/rules.cpd), sumD);
    }

    function rec(i, used, cost, days){
      if (used > K) return;
      if (N - i + used < K) return;

      if (best){
        const lb = lowerBoundT(i);
        if (lb > best.tScore) return;
        if (lb === best.tScore){
          const partialTmax = Math.max(Math.ceil((cost - rules.pass)/rules.cpd), days);
          if (partialTmax > best.Tmax) return;
        }
      }

      if (i === N){
        if (used !== K) return;
        const r = orderingForTarget(picks, cumHearts, targetIdx, rules);
        const tScore = r.Ts[targetIdx];
        const Tmax = r.Ts[r.Ts.length - 1];
        if (!best ||
            tScore < best.tScore ||
            (tScore === best.tScore && lessByPriority(r.Ts, best.Ts, prio))){
          best = {tScore, Tmax, Ts: r.Ts, picks: picks.slice(), order: r.order};
        }
        return;
      }
      if (N - (i+1) + used >= K){
        rec(i+1, used, cost, days);
      }
      if (used < K){
        for (const s of perSpirit[i]){
          picks.push({spiritIdx: i, strat: s});
          rec(i+1, used+1, cost+s.cost, days+s.days);
          picks.pop();
        }
      }
    }

    rec(0, 0, 0, 0);
    if (!best) return {error: window.t('err_no_plan')};
    return {best, cumHearts, targetIdx};
  }

  // ---------- Date ----------
  function addDays(s, n){ const [y,m,d]=s.split('-').map(Number); const dt=new Date(Date.UTC(y,m-1,d)); dt.setUTCDate(dt.getUTCDate()+n); return dt; }
  function fmtDate(dt){ return window.formatDate(dt); }
  function dayDate(start, n){ try { return fmtDate(addDays(start, n-1)); } catch(e){ return '?'; } }

  // ---------- Translated description for a level option ----------
  function describeOpt(o){
    if (!o || o.k === 'none') return null;
    if (o.k === 'buy')      return window.t('desc_buy',      {c: o.buys[0]});
    if (o.k === 'both')     return window.t('desc_buy_both', {exp: o.buys[0], cheap: o.buys[1]});
    if (o.k === 'cheap')    return window.t('desc_buy_cheap',{cheap: o.buys[0], exp: o.skips[0], d: o.days});
    if (o.k === 'exp')      return window.t('desc_buy_exp',  {exp: o.buys[0], cheap: o.skips[0], d: o.days});
    if (o.k === 'skip')     return window.t('desc_skip',     {c: o.skips[0], d: o.days});
    if (o.k === 'skipboth') return window.t('desc_skip_both',{d: o.days});
    return null;
  }

  // ---------- Renderers ----------
  function renderSeasonInputs(){
    document.getElementById('s-name').value = state.seasonName;
    document.getElementById('s-start').value = state.startDate;
    document.getElementById('r-cpd').value = state.rules.cpd;
    document.getElementById('r-pass').value = state.rules.pass;
    document.getElementById('r-heart').value = state.rules.heart;
    ['l1f','l1h','l2f','l2h','l3f','l3h','l4f','l4h'].forEach(k => {
      document.getElementById('r-'+k).value = state.rules[k];
    });
    document.getElementById('page-title').textContent = window.t('page_title', {name: state.seasonName || window.t('season_fallback')});
  }

  function renderSpirits(){
    const list = document.getElementById('spirits-list');
    list.innerHTML = state.spirits.map((sp, idx) => {
      const lvlsHtml = [0,1,2,3].map(li => {
        const items = sp.levels[li] || [];
        const c1 = (items[0] !== undefined && items[0] !== '') ? items[0] : '';
        const c2 = (items[1] !== undefined && items[1] !== '') ? items[1] : '';
        return '<div class="lvl-row"><span class="lvl-label">'+escHtml(window.t('lv_label', {n: li+1}))+'</span>'+
               '<input type="number" class="sp-cost" data-spirit="'+idx+'" data-lvl="'+li+'" data-pos="0" value="'+c1+'" placeholder="'+escAttr(window.t('cost_placeholder'))+'">'+
               '<input type="number" class="sp-cost" data-spirit="'+idx+'" data-lvl="'+li+'" data-pos="1" value="'+c2+'" placeholder="'+escAttr(window.t('cost2_placeholder'))+'"></div>';
      }).join('');
      return '<div class="card spirit-card">'+
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">'+
          '<input type="text" class="sp-name" data-spirit="'+idx+'" value="'+escAttr(sp.name)+'" style="flex:1;font-weight:500;min-width:0;">'+
          '<button class="btn-x" data-action="rm-spirit" data-idx="'+idx+'" title="'+escAttr(window.t('spirit_remove'))+'">×</button>'+
        '</div>'+ lvlsHtml + '</div>';
    }).join('');

    const countEl = document.getElementById('spirit-count');
    if (countEl) countEl.textContent = window.t('spirit_count', {count: state.spirits.length, max: MAX_SPIRITS});

    const addBtn = document.getElementById('add-spirit');
    if (addBtn){
      const atMax = state.spirits.length >= MAX_SPIRITS;
      addBtn.disabled = atMax;
      addBtn.style.opacity = atMax ? '0.4' : '1';
      addBtn.style.cursor = atMax ? 'not-allowed' : 'pointer';
      addBtn.title = atMax ? window.t('spirit_capped', {max: MAX_SPIRITS}) : '';
    }
  }

  function renderUltimates(){
    const list = document.getElementById('ults-list');
    if (state.targetIdx >= state.ultimates.length) state.targetIdx = state.ultimates.length - 1;
    if (state.targetIdx < 0) state.targetIdx = 0;
    list.innerHTML = state.ultimates.map((u, idx) => {
      const checked = idx === state.targetIdx ? ' checked' : '';
      return '<div class="ult-row">'+
        '<span style="min-width:90px;font-size:13px;">'+escHtml(window.t('ult_nth', {ord: window.ordinal(idx+1)}))+'</span>'+
        '<span class="lbl-sm">+</span>'+
        '<input type="number" class="ult-h" data-idx="'+idx+'" value="'+u.hearts+'" min="0" style="width:60px;">'+
        '<span class="lbl-sm">'+escHtml(window.t('ult_season_hearts'))+'</span>'+
        '<label class="tgt"><input type="radio" name="tgt-ult" class="tgt-r" data-idx="'+idx+'"'+checked+'>'+escHtml(window.t('ult_prioritize'))+'</label>'+
        '<button class="btn-x" data-action="rm-ult" data-idx="'+idx+'" title="'+escAttr(window.t('ult_remove'))+'">×</button>'+
        '</div>';
    }).join('');
    let acc = 0;
    const cumStr = state.ultimates.map(u => (acc += +u.hearts || 0)).join(', ');
    const totalNeed = acc;
    const tIdx = state.targetIdx;
    const ultNth = window.t('ult_nth', {ord: window.ordinal(tIdx+1)});
    document.getElementById('ult-summary').innerHTML = state.ultimates.length
      ? window.t('ult_summary', {cumStr, done: totalNeed, total: state.spirits.length, ultNth})
      : window.t('ult_summary_empty');
  }

  function strategyBadge(opt){
    if (!opt) return '—';
    if (opt.k === 'none' && opt.buys.length === 0 && opt.skips.length === 0) return '<span class="lbl-sm">—</span>';
    if (opt.k === 'buy' || opt.k === 'both') return '<span class="pill pb">'+escHtml(window.t('badge_buy', {c: opt.buys.join('+')}))+'</span>';
    if (opt.k === 'skip' || opt.k === 'skipboth') return '<span class="pill ps">'+escHtml(window.t('badge_skip', {d: opt.days}))+'</span>';
    return '<span class="pill pb">'+escHtml(window.t('badge_buy', {c: opt.buys.join('+')}))+'</span>'+
           '<span class="pill ps">'+escHtml(window.t('badge_skip', {d: opt.days}))+'</span>';
  }

  function stageInfo(opt){
    if (!opt || (opt.k === 'none' && opt.buys.length === 0 && opt.skips.length === 0)) return {kind:'buy', text: window.t('stage_none')};
    if (opt.k === 'buy')      return {kind:'buy',   text: window.t('stage_buy',       {c: opt.buys[0]})};
    if (opt.k === 'both')     return {kind:'buy',   text: window.t('stage_buy',       {c: opt.buys.join('+')})};
    if (opt.k === 'skip')     return {kind:'skip',  text: window.t('stage_skip',      {d: opt.days})};
    if (opt.k === 'skipboth') return {kind:'skip',  text: window.t('stage_skip_both', {d: opt.days})};
    return {kind:'mixed', text: window.t('stage_mixed', {b: opt.buys[0], s: opt.skips[0], d: opt.days})};
  }

  function renderSvg(best, completedMap){
    const usedIdxs = best.order.map(pi => best.picks[pi].spiritIdx);
    const Nu = usedIdxs.length;
    if (Nu === 0) return '';
    const colWmin = 120;
    const w = Math.max(560, 100 + Nu * colWmin);
    const rowH = 54, topPad = 24, leftPad = 88;
    const colW = (w - leftPad - 16) / Nu;
    const levels = [
      window.t('svg_lv5'), window.t('svg_lv4'), window.t('svg_lv3'),
      window.t('svg_lv2'), window.t('svg_lv1')
    ];
    const h = topPad + rowH * 5 + 16;
    let svg = '<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;margin:8px 0;">';
    for (let li=0; li<5; li++){
      const y = topPad + li*rowH + rowH/2 + 4;
      svg += '<text x="8" y="'+y+'" style="font-size:12px;fill:var(--color-text-secondary);">'+escHtml(levels[li])+'</text>';
    }

    function cell(x, y, w, h, kind, text, fs){
      fs = fs || 11;
      let fill, stroke, txt;
      if (kind === 'buy') { fill='#EAF3DE'; stroke='#639922'; txt='#27500A'; }
      else { fill='#FAEEDA'; stroke='#BA7517'; txt='#633806'; }
      const lines = text.split('\n');
      let textSvg = '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="'+fill+'" stroke="'+stroke+'" stroke-opacity="0.5" stroke-width="0.8"/>';
      const lineHeight = fs * 1.2;
      lines.forEach((line, idx) => {
        const lineY = y + h/2 + fs*0.36 + (idx - (lines.length-1)/2) * lineHeight;
        textSvg += '<text x="'+(x+w/2)+'" y="'+lineY+'" text-anchor="middle" style="font-size:'+fs+'px;fill:'+txt+';">'+escHtml(line)+'</text>';
      });
      return textSvg;
    }

    usedIdxs.forEach((spIdx, col) => {
      const sp = state.spirits[spIdx];
      const info = completedMap.get(spIdx);
      const xc = leftPad + colW*col + colW/2;
      svg += '<text x="'+xc+'" y="16" text-anchor="middle" style="font-size:12px;font-weight:500;fill:var(--color-text-primary);">'+'#'+(col+1)+' '+escHtml(shortName(sp.name, spIdx))+'</text>';
      const opts = info.strat.opts;

      for (let li = 0; li < 5; li++){
        const x = leftPad + colW*col + 6;
        const y = topPad + li*rowH + 6;
        const cw = colW - 12, ch = rowH - 12;

        if (li === 0){
          svg += cell(x, y, cw, ch, 'buy', window.t('svg_heart', {c: state.rules.heart}));
          continue;
        }

        const opt = opts[4 - li]; // li=1 -> Lv4 (opts[3]), li=4 -> Lv1 (opts[0])
        if (!opt || (opt.buys.length === 0 && opt.skips.length === 0 && opt.k === 'none')){
          continue;
        }

        if (opt.k === 'cheap' || opt.k === 'exp'){
          const gap = 2;
          const subW = (cw - gap) / 2;
          svg += cell(x,          y, subW, ch, 'buy',  window.t('svg_buy_line',  {c: opt.buys[0]}),            9);
          svg += cell(x+subW+gap, y, subW, ch, 'skip', window.t('svg_skip_line', {c: opt.skips[0], d: opt.days}), 9);
        } else if (opt.k === 'buy'){
          svg += cell(x, y, cw, ch, 'buy',  window.t('badge_buy',          {c: opt.buys[0]}));
        } else if (opt.k === 'skip'){
          svg += cell(x, y, cw, ch, 'skip', window.t('svg_skip_days',      {d: opt.days}));
        } else if (opt.k === 'both'){
          svg += cell(x, y, cw, ch, 'buy',  window.t('svg_buy_both',       {a: opt.buys[0], b: opt.buys[1]}));
        } else if (opt.k === 'skipboth'){
          svg += cell(x, y, cw, ch, 'skip', window.t('svg_skip_both_days', {d: opt.days}));
        }
      }
    });
    svg += '</svg>';
    return svg;
  }

  function genPost(best, cumHearts, targetIdx){
    const rules = state.rules;
    const totalCost = best.picks.reduce((s,p)=>s+p.strat.cost,0);
    const totalDays = best.picks.reduce((s,p)=>s+p.strat.days,0);
    const earned = rules.pass + rules.cpd * best.Tmax;
    let p = window.t('post_header', {name: state.seasonName}) + '\n\n';
    p += window.t('post_tldr', {ord: window.ordinal(targetIdx+1)}) + '\n';
    best.Ts.forEach((T, i) => {
      const mark = i === targetIdx ? ' ★' : '';
      p += window.t('post_ult_line', {ord: window.ordinal(i+1), hearts: cumHearts[i], day: T, date: dayDate(state.startDate, T), mark}) + '\n';
    });
    p += '\n' + window.t('post_requires', {pass: rules.pass, spiritCount: state.spirits.length, totalHearts: cumHearts[cumHearts.length-1]}) + '\n\n';
    p += window.t('post_per_spirit') + '\n';
    best.order.forEach((pi, i) => {
      const pick = best.picks[pi];
      const sp = state.spirits[pick.spiritIdx];
      const s = pick.strat;
      p += '\n' + window.t('post_spirit_entry', {n: i+1, name: sp.name, cost: s.cost, days: s.days});
      for (let li=0; li<4; li++){
        const o = s.opts[li];
        if (o && o.k !== 'none'){
          const desc = describeOpt(o);
          if (desc) p += '\n' + window.t('post_lv_entry', {n: li+1, desc});
        }
      }
      p += '\n' + window.t('post_lv5', {heart: rules.heart}) + '\n';
    });
    const usedSet = new Set(best.picks.map(pk => pk.spiritIdx));
    const unused = state.spirits.filter((_,i)=>!usedSet.has(i));
    if (unused.length){
      p += '\n' + window.t('post_skipped', {names: unused.map(s=>s.name).join(', ')}) + '\n';
    }
    p += '\n' + window.t('post_schedule_header') + '\n```\n';
    let day = 1;
    let nextUlt = 0;
    let cumDone = 0;
    for (let oi=0; oi<best.order.length; oi++){
      const pi = best.order[oi];
      const pick = best.picks[pi];
      const s = pick.strat;
      const nm = state.spirits[pick.spiritIdx].name;
      const phases = [];
      for (let li=0; li<4; li++){
        if (s.opts[li] && s.opts[li].days) phases.push([s.opts[li].lvl, s.opts[li].days]);
      }
      if (phases.length === 0){
        p += window.t('post_no_invites', {name: nm}) + '\n';
      } else {
        for (const ph of phases){
          const end = day + ph[1] - 1;
          const dayStr = day === end
            ? window.t('post_day_single', {day})
            : window.t('post_day_range',  {start: day, end});
          p += window.t('post_invite_line', {dayStr, name: nm, d: ph[1], lv: ph[0]}) + '\n';
          day = end + 1;
        }
      }
      cumDone++;
      while (nextUlt < cumHearts.length && cumDone >= cumHearts[nextUlt]){
        const T = best.Ts[nextUlt];
        p += window.t('post_ult_milestone', {ord: window.ordinal(nextUlt+1), day: T, date: dayDate(state.startDate, T)}) + '\n';
        nextUlt++;
      }
    }
    if (day <= best.Tmax){
      const dayStr = day === best.Tmax
        ? window.t('post_day_single', {day})
        : window.t('post_day_range',  {start: day, end: best.Tmax});
      p += window.t('post_accumulate', {dayStr}) + '\n';
    }
    p += '```\n\n';
    p += window.t('post_candle_header') + '\n';
    p += window.t('post_earned',      {day: best.Tmax, earned, pass: rules.pass, cpd: rules.cpd, tmax: best.Tmax}) + '\n';
    p += window.t('post_spent',       {cost: totalCost}) + '\n';
    p += window.t('post_surplus',     {surplus: earned - totalCost}) + '\n';
    p += window.t('post_invite_used', {used: totalDays, avail: best.Tmax}) + '\n';
    return p;
  }

  function copyText(text, btn){
    const flash = m => { btn.textContent = m; setTimeout(() => btn.textContent = window.t('btn_copy'), 1400); };
    function fb(){
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position='fixed'; ta.style.left='-9999px';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        flash(ok ? window.t('copy_copied') : window.t('copy_failed'));
      } catch(e){ flash(window.t('copy_failed')); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(() => flash(window.t('copy_copied'))).catch(fb);
    } else fb();
  }

  function renderResult(){
    const out = document.getElementById('result-out');
    let r;
    try { r = solve(); } catch(e){ out.innerHTML = '<div class="card" style="border-color:var(--color-border-danger);"><div style="color:var(--color-text-danger);font-size:13px;">'+escHtml(window.t('err_solver'))+escHtml(e.message)+'</div></div>'; return; }
    if (r.error){
      out.innerHTML = '<div class="card" style="border-color:var(--color-border-danger);"><div style="color:var(--color-text-danger);font-size:13px;">'+escHtml(r.error)+'</div></div>';
      return;
    }
    const {best, cumHearts} = r;
    const rules = state.rules;
    const totalCost = best.picks.reduce((s,p)=>s+p.strat.cost,0);
    const totalDays = best.picks.reduce((s,p)=>s+p.strat.days,0);
    const earned = rules.pass + rules.cpd * best.Tmax;

    let html = '<div class="mg">';
    best.Ts.forEach((T, i) => {
      const date = dayDate(state.startDate, T);
      const isTarget = i === r.targetIdx;
      const tgtPill = isTarget ? '<span class="target-badge">'+escHtml(window.t('target_badge'))+'</span>' : '';
      html += '<div class="m"><div class="ml">'+escHtml(window.t('ult_hearts_label', {ord: window.ordinal(i+1), hearts: cumHearts[i]}))+tgtPill+'</div>'+
              '<div class="mv">'+escHtml(window.t('day_prefix', {n: T}))+'</div>'+
              '<div class="ms">'+date+'</div></div>';
    });
    html += '<div class="m"><div class="ml">'+escHtml(window.t('total_candles'))+'</div>'+
            '<div class="mv">'+totalCost+'C</div>'+
            '<div class="ms">'+escHtml(window.t('earned_surplus', {day: best.Tmax, earned, surplus: earned-totalCost}))+'</div></div>';
    html += '<div class="m"><div class="ml">'+escHtml(window.t('invite_days'))+'</div>'+
            '<div class="mv">'+totalDays+' / '+best.Tmax+'</div>'+
            '<div class="ms">'+escHtml(window.t('invite_rate'))+'</div></div>';
    html += '</div>';

    const completedMap = new Map();
    best.picks.forEach((p, pi) => completedMap.set(p.spiritIdx, {orderInPlan: best.order.indexOf(pi), strat: p.strat}));

    html += '<h4>'+escHtml(window.t('section_strategy'))+'</h4>';
    html += '<div class="card" style="overflow-x:auto;"><table class="t"><thead><tr>'+
      '<th>'+escHtml(window.t('th_spirit'))+'</th>'+
      '<th style="text-align: center;">'+escHtml(window.t('th_lv1'))+'</th>'+
      '<th style="text-align: center;">'+escHtml(window.t('th_lv2'))+'</th>'+
      '<th style="text-align: center;">'+escHtml(window.t('th_lv3'))+'</th>'+
      '<th style="text-align: center;">'+escHtml(window.t('th_lv4'))+'</th>'+
      '<th>'+escHtml(window.t('th_cost'))+'</th>'+
      '<th>'+escHtml(window.t('th_days'))+'</th>'+
      '</tr></thead><tbody>';
    const usedSpirits = [];
    const unusedSpirits = [];
    state.spirits.forEach((sp, idx) => {
      if (completedMap.has(idx)) {
        usedSpirits.push({sp, idx, order: completedMap.get(idx).orderInPlan});
      } else {
        unusedSpirits.push({sp, idx});
      }
    });
    usedSpirits.sort((a,b) => a.order - b.order);
    [...usedSpirits, ...unusedSpirits].forEach(({sp, idx}) => {
      const info = completedMap.get(idx);
      if (info){
        html += '<tr><td style="font-weight:500;"><span class="pill pw">#'+(info.orderInPlan+1)+'</span> '+escHtml(sp.name)+'</td>';
        for (let li=0; li<4; li++) html += '<td style="text-align: center;">'+strategyBadge(info.strat.opts[li])+'</td>';
        html += '<td>'+info.strat.cost+'C</td><td>'+info.strat.days+'D</td></tr>';
      } else {
        html += '<tr style="opacity:0.45;"><td>'+escHtml(sp.name)+'</td>'+
                '<td colspan="4" style="font-style:italic;color:var(--color-text-secondary);">'+escHtml(window.t('not_used'))+'</td>'+
                '<td>—</td><td>—</td></tr>';
      }
    });
    html += '</tbody></table></div>';
    html += '<div class="note">'+escHtml(window.t('note_lv5', {heart: rules.heart}))+'</div>';

    html += '<h4>'+escHtml(window.t('section_treemap'))+'</h4>';
    html += '<div class="card" style="overflow-x:auto;">'+renderSvg(best, completedMap)+
            '<div class="legend">'+
            '<span><span class="pill pb">■</span> '+escHtml(window.t('legend_buy'))+'</span>'+
            '<span><span class="pill ps">■</span> '+escHtml(window.t('legend_skip'))+'</span>'+
            '</div></div>';

    html += '<h4>'+escHtml(window.t('section_discord'))+'</h4>';
    const post = genPost(best, cumHearts, r.targetIdx);
    html += '<div class="post-w"><button class="cpy btn-sm" id="cpy-btn">'+escHtml(window.t('btn_copy'))+'</button><pre class="post">'+escHtml(post)+'</pre></div>';

    out.innerHTML = html;
    document.getElementById('cpy-btn').addEventListener('click', () => copyText(post, document.getElementById('cpy-btn')));
  }

  function bindStaticInputs(){
    document.getElementById('s-name').addEventListener('input', e => {
      state.seasonName = e.target.value;
      document.getElementById('page-title').textContent = window.t('page_title', {name: state.seasonName || window.t('season_fallback')});
      scheduleRender();
    });
    document.getElementById('s-start').addEventListener('input', e => {
      state.startDate = e.target.value || '2026-04-17';
      scheduleRender();
    });
    ['cpd','pass','heart','l1f','l1h','l2f','l2h','l3f','l3h','l4f','l4h'].forEach(k => {
      document.getElementById('r-'+k).addEventListener('input', e => {
        state.rules[k] = +e.target.value || 0;
        scheduleRender();
      });
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
      const seasons = window.SEASONS || [];
      const idx = +document.getElementById('season-picker').value || 0;
      state = seasons[idx] ? cloneSeason(seasons[idx]) : defaultState();
      renderSeasonInputs();
      renderSpirits();
      renderUltimates();
      scheduleRender();
    });
    document.getElementById('add-spirit').addEventListener('click', () => {
      if (state.spirits.length >= MAX_SPIRITS) return;
      const tmpl = state.spirits[state.spirits.length-1];
      const newLevels = tmpl ? tmpl.levels.map(l => l.slice()) : [[4],[19,7],[24,10],[28]];
      state.spirits.push({name: window.t('spirit_name_default', {n: state.spirits.length+1}), levels: newLevels});
      renderSpirits();
      renderUltimates();
      scheduleRender();
    });
    document.getElementById('add-ult').addEventListener('click', () => {
      state.ultimates.push({hearts:1});
      renderUltimates();
      scheduleRender();
    });

    document.getElementById('spirits-list').addEventListener('input', e => {
      const t = e.target;
      if (t.classList.contains('sp-name')){
        const idx = +t.dataset.spirit;
        state.spirits[idx].name = t.value;
        scheduleRender();
      } else if (t.classList.contains('sp-cost')){
        const idx = +t.dataset.spirit, lvl = +t.dataset.lvl, pos = +t.dataset.pos;
        const v = t.value.trim();
        const cur = state.spirits[idx].levels[lvl] || [];
        if (pos === 0){
          if (v === ''){ state.spirits[idx].levels[lvl] = cur.slice(1); }
          else { state.spirits[idx].levels[lvl] = [+v || 0].concat(cur.slice(1)); }
        } else {
          if (v === ''){ state.spirits[idx].levels[lvl] = cur.slice(0,1); }
          else { state.spirits[idx].levels[lvl] = [(cur[0] !== undefined ? cur[0] : 0), +v || 0]; }
        }
        scheduleRender();
      }
    });
    document.getElementById('spirits-list').addEventListener('click', e => {
      const t = e.target;
      if (t.dataset && t.dataset.action === 'rm-spirit'){
        if (state.spirits.length <= 1) return;
        state.spirits.splice(+t.dataset.idx, 1);
        renderSpirits();
        renderUltimates();
        scheduleRender();
      }
    });
    document.getElementById('ults-list').addEventListener('input', e => {
      const t = e.target;
      if (t.classList.contains('ult-h')){
        state.ultimates[+t.dataset.idx].hearts = Math.max(0, +t.value || 0);
        let acc=0;
        const cumStr = state.ultimates.map(u=>(acc+=+u.hearts||0)).join(', ');
        const tIdx = state.targetIdx;
        const ultNth = window.t('ult_nth', {ord: window.ordinal(tIdx+1)});
        document.getElementById('ult-summary').innerHTML = window.t('ult_summary', {cumStr, done: acc, total: state.spirits.length, ultNth});
        scheduleRender();
      }
    });
    document.getElementById('ults-list').addEventListener('change', e => {
      const t = e.target;
      if (t.classList.contains('tgt-r') && t.checked){
        state.targetIdx = +t.dataset.idx;
        renderUltimates();
        scheduleRender();
      }
    });
    document.getElementById('ults-list').addEventListener('click', e => {
      const t = e.target;
      if (t.dataset && t.dataset.action === 'rm-ult'){
        if (state.ultimates.length <= 1) return;
        state.ultimates.splice(+t.dataset.idx, 1);
        renderUltimates();
        scheduleRender();
      }
    });
  }

  // Init
  (function initSeasonPicker(){
    const seasons = window.SEASONS || [];
    const picker = document.getElementById('season-picker');
    if (seasons.length === 0 || !picker) return;
    picker.innerHTML = seasons.map((s, i) =>
      '<option value="'+i+'">'+escAttr(s.label || s.seasonName)+'</option>'
    ).join('');
    if (seasons.length > 1) picker.style.display = '';
    picker.addEventListener('change', () => {
      const idx = +picker.value || 0;
      if (seasons[idx]){
        state = cloneSeason(seasons[idx]);
        renderSeasonInputs();
        renderSpirits();
        renderUltimates();
        scheduleRender();
      }
    });
  })();
  renderSeasonInputs();
  renderSpirits();
  renderUltimates();
  bindStaticInputs();
  renderResult();

  // Re-render all dynamic content when language changes
  window.addEventListener('langchange', function(){
    renderSeasonInputs();
    renderSpirits();
    renderUltimates();
    renderResult();
  });
})();
