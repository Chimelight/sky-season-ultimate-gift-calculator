(function(){

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

  function defaultState(){
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

  function ordinal(n){
    const s=['th','st','nd','rd'], v=n%100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
  }
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
        lvlOpts.push([{cost:0, days:0, desc:'(no items at this level)', buys:[], skips:[], k:'none', lvl:i+1}]);
      } else if (items.length === 1){
        const c = items[0];
        lvlOpts.push([
          {cost:c, days:0, desc:'Buy '+c+'c', buys:[c], skips:[], k:'buy', lvl:i+1},
          {cost:0, days:fk, desc:'Skip '+c+'c ('+fk+'d)', buys:[], skips:[c], k:'skip', lvl:i+1},
        ]);
      } else {
        const sorted = items.slice(0,2).sort((a,b)=>b-a);
        const exp = sorted[0], cheap = sorted[1];
        lvlOpts.push([
          {cost:exp+cheap, days:0, desc:'Buy both '+exp+'+'+cheap+'c', buys:[exp,cheap], skips:[], k:'both', lvl:i+1},
          {cost:cheap, days:hk, desc:'Buy '+cheap+'c, skip '+exp+'c ('+hk+'d)', buys:[cheap], skips:[exp], k:'cheap', lvl:i+1},
          {cost:exp, days:hk, desc:'Buy '+exp+'c, skip '+cheap+'c ('+hk+'d)', buys:[exp], skips:[cheap], k:'exp', lvl:i+1},
          {cost:0, days:fk, desc:'Skip both ('+fk+'d)', buys:[], skips:[exp,cheap], k:'skipboth', lvl:i+1},
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

  function lexLessTs(a, b){
    if (!b) return true;
    for (let i = a.length-1; i >= 0; i--){
      if (a[i] !== b[i]) return a[i] < b[i];
    }
    return false;
  }

  // Find the k-subset of picks that minimizes max(ceil((sumC - pass)/cpd), sumD)
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

  // Produce an ordering that minimizes T[targetIdx] as the primary metric.
  // Other Ts are determined by greedy sort within/around the target group.
  function orderingForTarget(picks, cumHearts, targetIdx, rules){
    const K = picks.length;
    if (K === 0) return {Ts: cumHearts.map(()=>0), order: []};
    const score = i => picks[i].strat.cost + rules.cpd * picks[i].strat.days;
    const targetCount = Math.min(cumHearts[targetIdx], K);
    const fg = bestFirstGroup(picks, targetCount, rules);
    const firstSet = new Set(fg.idxs);
    const first = fg.idxs.slice().sort((a,b) => score(a) - score(b));
    const rest = [];
    for (let i = 0; i < K; i++) if (!firstSet.has(i)) rest.push(i);
    rest.sort((a,b) => score(a) - score(b));
    const order = first.concat(rest);
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
    if (state.ultimates.length === 0 || K === 0) return {error: 'Add at least one ultimate gift.'};
    if (N === 0) return {error: 'Add at least one spirit.'};
    if (K > N) return {error: 'Need '+K+' season hearts but only '+N+' spirit(s) configured. Add '+(K-N)+' more spirit(s) or reduce ultimate heart costs.'};

    const targetIdx = Math.max(0, Math.min(state.targetIdx || 0, state.ultimates.length - 1));
    const targetCount = Math.min(cumHearts[targetIdx], K);
    const perSpirit = spirits.map(s => enumSpirit(s, rules));
    let best = null;
    const picks = [];

    // Per-spirit independent minima over its pareto set — used for a SAFE lower
    // bound on T[target]. Taking min cost and min days separately is valid
    // because for any chosen strategy s: s.cost >= minCost and s.days >= minDays,
    // so any real sumC >= sum of minCost and any real sumD >= sum of minDays.
    // (Using a single combined score like cost+cpd*days would NOT be a valid bound.)
    const minCostOf = perSpirit.map(arr => {
      let m = Infinity; for (const s of arr) if (s.cost < m) m = s.cost; return m;
    });
    const minDaysOf = perSpirit.map(arr => {
      let m = Infinity; for (const s of arr) if (s.days < m) m = s.days; return m;
    });

    function lowerBoundT(nextI){
      if (targetCount <= 0) return 0;
      // Candidate pool: current picks (exact) + all remaining spirits (optimistic)
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

      // Safe target-aware pruning: if even the optimistic lower bound on T[target]
      // for any completion of this branch already meets or exceeds the best tScore,
      // nothing in this subtree can improve. Requires a VALID lower bound — see above.
      if (best){
        const lb = lowerBoundT(i);
        if (lb > best.tScore) return;
        // Also prune on Tmax (= final sumC, sumD over all K picks) for tiebreakers
        // when lb == best.tScore: if the partial Tmax already exceeds best.Tmax,
        // the full Tmax can only grow, so no improvement on the secondary metric either.
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
            (tScore === best.tScore && Tmax < best.Tmax) ||
            (tScore === best.tScore && Tmax === best.Tmax && lexLessTs(r.Ts, best.Ts))){
          best = {tScore, Tmax, Ts: r.Ts, picks: picks.slice(), order: r.order};
        }
        return;
      }
      // Skip spirit i (don't use it in the plan)
      if (N - (i+1) + used >= K){
        rec(i+1, used, cost, days);
      }
      // Use spirit i with each Pareto-optimal strategy
      if (used < K){
        for (const s of perSpirit[i]){
          picks.push({spiritIdx: i, strat: s});
          rec(i+1, used+1, cost+s.cost, days+s.days);
          picks.pop();
        }
      }
    }

    rec(0, 0, 0, 0);
    if (!best) return {error: 'No feasible plan found.'};
    return {best, cumHearts, targetIdx};
  }

  // ---------- Date ----------
  function addDays(s, n){ const [y,m,d]=s.split('-').map(Number); const dt=new Date(Date.UTC(y,m-1,d)); dt.setUTCDate(dt.getUTCDate()+n); return dt; }
  function fmtDate(dt){ return dt.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'})+' '+dt.getUTCDate(); }
  function dayDate(start, n){ try { return fmtDate(addDays(start, n-1)); } catch(e){ return '?'; } }

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
    document.getElementById('page-title').textContent = (state.seasonName || 'Season') + ' — graduation calculator';
  }

  function renderSpirits(){
    const list = document.getElementById('spirits-list');
    list.innerHTML = state.spirits.map((sp, idx) => {
      const lvlsHtml = [0,1,2,3].map(li => {
        const items = sp.levels[li] || [];
        const c1 = (items[0] !== undefined && items[0] !== '') ? items[0] : '';
        const c2 = (items[1] !== undefined && items[1] !== '') ? items[1] : '';
        return '<div class="lvl-row"><span class="lvl-label">Lv '+(li+1)+'</span>'+
               '<input type="number" class="sp-cost" data-spirit="'+idx+'" data-lvl="'+li+'" data-pos="0" value="'+c1+'" placeholder="cost">'+
               '<input type="number" class="sp-cost" data-spirit="'+idx+'" data-lvl="'+li+'" data-pos="1" value="'+c2+'" placeholder="(2nd)"></div>';
      }).join('');
      return '<div class="card spirit-card">'+
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">'+
          '<input type="text" class="sp-name" data-spirit="'+idx+'" value="'+escAttr(sp.name)+'" style="flex:1;font-weight:500;min-width:0;">'+
          '<button class="btn-x" data-action="rm-spirit" data-idx="'+idx+'" title="Remove spirit">×</button>'+
        '</div>'+ lvlsHtml + '</div>';
    }).join('');

    const countEl = document.getElementById('spirit-count');
    if (countEl) countEl.textContent = '('+state.spirits.length+' / '+MAX_SPIRITS+')';

    const addBtn = document.getElementById('add-spirit');
    if (addBtn){
      const atMax = state.spirits.length >= MAX_SPIRITS;
      addBtn.disabled = atMax;
      addBtn.style.opacity = atMax ? '0.4' : '1';
      addBtn.style.cursor = atMax ? 'not-allowed' : 'pointer';
      addBtn.title = atMax ? 'Capped at '+MAX_SPIRITS+' to keep computation fast' : '';
    }
  }

  function renderUltimates(){
    const list = document.getElementById('ults-list');
    if (state.targetIdx >= state.ultimates.length) state.targetIdx = state.ultimates.length - 1;
    if (state.targetIdx < 0) state.targetIdx = 0;
    list.innerHTML = state.ultimates.map((u, idx) => {
      const checked = idx === state.targetIdx ? ' checked' : '';
      return '<div class="ult-row">'+
        '<span style="min-width:90px;font-size:13px;">'+ordinal(idx+1)+' ultimate</span>'+
        '<span class="lbl-sm">+</span>'+
        '<input type="number" class="ult-h" data-idx="'+idx+'" value="'+u.hearts+'" min="0" style="width:60px;">'+
        '<span class="lbl-sm">season hearts</span>'+
        '<label class="tgt"><input type="radio" name="tgt-ult" class="tgt-r" data-idx="'+idx+'"'+checked+'>prioritize</label>'+
        '<button class="btn-x" data-action="rm-ult" data-idx="'+idx+'" title="Remove">×</button>'+
        '</div>';
    }).join('');
    let acc = 0;
    const cumStr = state.ultimates.map(u => (acc += +u.hearts || 0)).join(', ');
    const totalNeed = acc;
    const tIdx = state.targetIdx;
    document.getElementById('ult-summary').innerHTML = state.ultimates.length
      ? 'Cumulative hearts at each ultimate: '+cumStr+'. Plan completes '+totalNeed+' / '+state.spirits.length+' spirits. Optimizing for: <b>'+ordinal(tIdx+1)+' ultimate</b> (earliest available).'
      : 'Add at least one ultimate gift.';
  }

  function strategyBadge(opt){
    if (!opt) return '—';
    if (opt.k === 'none' && opt.buys.length === 0 && opt.skips.length === 0) return '<span class="lbl-sm">—</span>';
    if (opt.k === 'buy' || opt.k === 'both') return '<span class="pill pb">Buy '+opt.buys.join('+')+'c</span>';
    if (opt.k === 'skip' || opt.k === 'skipboth') return '<span class="pill ps">Skip ('+opt.days+'d)</span>';
    return '<span class="pill pb">Buy '+opt.buys.join('+')+'c</span><span class="pill ps">Skip '+opt.skips.join('+')+'c ('+opt.days+'d)</span>';
  }

  function stageInfo(opt){
    if (!opt || (opt.k === 'none' && opt.buys.length === 0 && opt.skips.length === 0)) return {kind:'buy', text:'(no items)'};
    if (opt.k === 'buy') return {kind:'buy', text:'Buy '+opt.buys[0]+'c'};
    if (opt.k === 'both') return {kind:'buy', text:'Buy '+opt.buys.join('+')+'c'};
    if (opt.k === 'skip') return {kind:'skip', text:'Skip ('+opt.days+'d)'};
    if (opt.k === 'skipboth') return {kind:'skip', text:'Skip both ('+opt.days+'d)'};
    return {kind:'mixed', text:'Buy '+opt.buys[0]+'c | skip '+opt.skips[0]+'c ('+opt.days+'d)'};
  }

  function renderSvg(best, completedMap){
    const usedIdxs = state.spirits.map((_,i)=>i).filter(i => completedMap.has(i));
    const Nu = usedIdxs.length;
    if (Nu === 0) return '';
    const colWmin = 120;
    const w = Math.max(560, 100 + Nu * colWmin);
    const rowH = 54, topPad = 24, leftPad = 88;
    const colW = (w - leftPad - 16) / Nu;
    const levels = ['Lv 5 heart','Lv 4','Lv 3','Lv 2','Lv 1'];
    const h = topPad + rowH * 5 + 16;
    let svg = '<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;margin:8px 0;">';
    for (let li=0; li<5; li++){
      const y = topPad + li*rowH + rowH/2 + 4;
      svg += '<text x="8" y="'+y+'" style="font-size:12px;fill:var(--color-text-secondary);">'+levels[li]+'</text>';
    }

    function cell(x, y, w, h, kind, text, fs){
      fs = fs || 11;
      let fill, stroke, txt;
      if (kind === 'buy') { fill='#EAF3DE'; stroke='#639922'; txt='#27500A'; }
      else { fill='#FAEEDA'; stroke='#BA7517'; txt='#633806'; }
      return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="'+fill+'" stroke="'+stroke+'" stroke-opacity="0.5" stroke-width="0.8"/>'
           + '<text x="'+(x+w/2)+'" y="'+(y+h/2+fs*0.36)+'" text-anchor="middle" style="font-size:'+fs+'px;fill:'+txt+';">'+escHtml(text)+'</text>';
    }

    usedIdxs.forEach((spIdx, col) => {
      const sp = state.spirits[spIdx];
      const info = completedMap.get(spIdx);
      const xc = leftPad + colW*col + colW/2;
      svg += '<text x="'+xc+'" y="16" text-anchor="middle" style="font-size:12px;font-weight:500;fill:var(--color-text-primary);">'+escHtml(shortName(sp.name, spIdx))+'</text>';
      const opts = info.strat.opts;

      for (let li = 0; li < 5; li++){
        const x = leftPad + colW*col + 6;
        const y = topPad + li*rowH + 6;
        const cw = colW - 12, ch = rowH - 12;

        if (li === 0){
          svg += cell(x, y, cw, ch, 'buy', 'Heart '+state.rules.heart+'c');
          continue;
        }

        const opt = opts[4 - li]; // li=1 -> Lv4 (opts[3]), li=4 -> Lv1 (opts[0])
        if (!opt || (opt.buys.length === 0 && opt.skips.length === 0 && opt.k === 'none')){
          continue;
        }

        if (opt.k === 'cheap' || opt.k === 'exp'){
          // mixed: split vertically — green buy cell on top, amber skip cell below
          const gap = 2;
          const subH = (ch - gap) / 2;
          svg += cell(x, y, cw, subH, 'buy', 'Buy '+opt.buys[0]+'c', 10);
          svg += cell(x, y + subH + gap, cw, subH, 'skip', 'Skip '+opt.skips[0]+'c ('+opt.days+'d)', 10);
        } else if (opt.k === 'buy'){
          svg += cell(x, y, cw, ch, 'buy', 'Buy '+opt.buys[0]+'c');
        } else if (opt.k === 'skip'){
          svg += cell(x, y, cw, ch, 'skip', 'Skip ('+opt.days+'d)');
        } else if (opt.k === 'both'){
          svg += cell(x, y, cw, ch, 'buy', 'Buy '+opt.buys.join('+')+'c');
        } else if (opt.k === 'skipboth'){
          svg += cell(x, y, cw, ch, 'skip', 'Skip both ('+opt.days+'d)');
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
    let p = '🎁 ' + state.seasonName + ' — Fastest Graduation Route\n\n';
    p += '**TL;DR** (optimizing for '+ordinal(targetIdx+1)+' ultimate earliest)\n';
    best.Ts.forEach((T, i) => {
      const mark = i === targetIdx ? ' ★' : '';
      p += '• ' + ordinal(i+1) + ' Ultimate (' + cumHearts[i] + ' season hearts): Day ' + T + ' (' + dayDate(state.startDate, T) + ')' + mark + '\n';
    });
    p += '\n_Requires Season Pass (+'+rules.pass+' candle starter). '+state.spirits.length+' spirits available, '+cumHearts[cumHearts.length-1]+' hearts needed for full graduation._\n\n';
    p += '**Per-spirit strategy** (in completion order)\n';
    best.order.forEach((pi, i) => {
      const pick = best.picks[pi];
      const sp = state.spirits[pick.spiritIdx];
      const s = pick.strat;
      p += '\n__'+(i+1)+'. '+sp.name+'__ — '+s.cost+'c, '+s.days+' invite days';
      for (let li=0; li<4; li++){
        const o = s.opts[li];
        if (o && o.desc !== '(no items at this level)') p += '\n  Lv '+(li+1)+': '+o.desc;
      }
      p += '\n  Lv 5: Buy heart ('+rules.heart+'c)\n';
    });
    const usedSet = new Set(best.picks.map(pk => pk.spiritIdx));
    const unused = state.spirits.filter((_,i)=>!usedSet.has(i));
    if (unused.length){
      p += '\n_Skipped entirely: '+unused.map(s=>s.name).join(', ')+' (not needed)._\n';
    }
    p += '\n**Invite schedule** (1 invite/day, sequential)\n```\n';
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
        p += '('+nm+': no invites — buying everything)\n';
      } else {
        for (const ph of phases){
          const end = day + ph[1] - 1;
          p += 'Day '+(day===end?day:day+'-'+end)+': invite '+nm+' ('+ph[1]+'d, Lv '+ph[0]+' skip)\n';
          day = end + 1;
        }
      }
      cumDone++;
      while (nextUlt < cumHearts.length && cumDone >= cumHearts[nextUlt]){
        const T = best.Ts[nextUlt];
        p += '   → '+ordinal(nextUlt+1)+' Ultimate available @ Day '+T+' ('+dayDate(state.startDate, T)+')\n';
        nextUlt++;
      }
    }
    if (day <= best.Tmax) p += 'Day '+(day===best.Tmax?day:day+'-'+best.Tmax)+': accumulate candles\n';
    p += '```\n\n';
    p += '**Candle accounting**\n';
    p += '• Earned by Day '+best.Tmax+': '+earned+'c ('+rules.pass+' pass + '+rules.cpd+'×'+best.Tmax+')\n';
    p += '• Spent: '+totalCost+'c\n';
    p += '• Surplus: '+(earned-totalCost)+'c\n';
    p += '• Invite days used: '+totalDays+' / '+best.Tmax+' available\n';
    return p;
  }

  function copyText(text, btn){
    const flash = m => { btn.textContent = m; setTimeout(()=>btn.textContent='Copy', 1400); };
    function fb(){
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position='fixed'; ta.style.left='-9999px';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        flash(ok ? 'Copied' : 'Failed');
      } catch(e){ flash('Failed'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=>flash('Copied')).catch(fb);
    } else fb();
  }

  function renderResult(){
    const out = document.getElementById('result-out');
    let r;
    try { r = solve(); } catch(e){ out.innerHTML = '<div class="card" style="border-color:var(--color-border-danger);"><div style="color:var(--color-text-danger);font-size:13px;">Solver error: '+escHtml(e.message)+'</div></div>'; return; }
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
      const tgtPill = isTarget ? '<span class="target-badge target-badge--corner">target</span>' : '';
      html += '<div class="m">'+tgtPill+'<div class="ml">'+ordinal(i+1)+' ultimate ('+cumHearts[i]+' hearts)</div><div class="mv">Day '+T+'</div><div class="ms">'+date+'</div></div>';
    });
    html += '<div class="m"><div class="ml">Total candles spent</div><div class="mv">'+totalCost+'c</div><div class="ms">Earned by D'+best.Tmax+': '+earned+'c (surplus '+(earned-totalCost)+')</div></div>';
    html += '<div class="m"><div class="ml">Invite days used</div><div class="mv">'+totalDays+' / '+best.Tmax+'</div><div class="ms">1 invite per day</div></div>';
    html += '</div>';

    const completedMap = new Map();
    best.picks.forEach((p, pi) => completedMap.set(p.spiritIdx, {orderInPlan: best.order.indexOf(pi), strat: p.strat}));

    html += '<h4>Per-spirit strategy</h4>';
    html += '<div class="card" style="overflow-x:auto;"><table class="t"><thead><tr><th>Spirit</th><th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Cost</th><th>Days</th></tr></thead><tbody>';
    state.spirits.forEach((sp, idx) => {
      const info = completedMap.get(idx);
      if (info){
        html += '<tr><td style="font-weight:500;">'+escHtml(sp.name)+' <span class="pill pw">#'+(info.orderInPlan+1)+'</span></td>';
        for (let li=0; li<4; li++) html += '<td>'+strategyBadge(info.strat.opts[li])+'</td>';
        html += '<td>'+info.strat.cost+'c</td><td>'+info.strat.days+'d</td></tr>';
      } else {
        html += '<tr style="opacity:0.45;"><td>'+escHtml(sp.name)+'</td><td colspan="4" style="font-style:italic;color:var(--color-text-secondary);">Not used in plan</td><td>—</td><td>—</td></tr>';
      }
    });
    html += '</tbody></table></div>';
    html += '<div class="note">Plus Lv 5 heart ('+rules.heart+'c) per used spirit. Pill #N = completion order in the plan.</div>';

    html += '<h4>Tree map (bottom-up, used spirits only)</h4>';
    html += '<div class="card" style="overflow-x:auto;">'+renderSvg(best, completedMap)+'<div class="legend"><span><span class="pill pb">■</span> buy</span><span><span class="pill ps">■</span> friendship-skip</span></div></div>';

    html += '<h4>Discord post (English)</h4>';
    const post = genPost(best, cumHearts, r.targetIdx);
    html += '<div class="post-w"><button class="cpy btn-sm" id="cpy-btn">Copy</button><pre class="post">'+escHtml(post)+'</pre></div>';

    out.innerHTML = html;
    document.getElementById('cpy-btn').addEventListener('click', () => copyText(post, document.getElementById('cpy-btn')));
  }

  function bindStaticInputs(){
    document.getElementById('s-name').addEventListener('input', e => {
      state.seasonName = e.target.value;
      document.getElementById('page-title').textContent = (state.seasonName || 'Season') + ' — graduation calculator';
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
      state = defaultState();
      renderSeasonInputs();
      renderSpirits();
      renderUltimates();
      scheduleRender();
    });
    document.getElementById('add-spirit').addEventListener('click', () => {
      if (state.spirits.length >= MAX_SPIRITS) return;
      const tmpl = state.spirits[state.spirits.length-1];
      const newLevels = tmpl ? tmpl.levels.map(l => l.slice()) : [[4],[19,7],[24,10],[28]];
      state.spirits.push({name:'Spirit '+(state.spirits.length+1), levels: newLevels});
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
        // Update summary text without re-rendering inputs
        let acc=0;
        const cumStr = state.ultimates.map(u=>(acc+=+u.hearts||0)).join(', ');
        const tIdx = state.targetIdx;
        document.getElementById('ult-summary').innerHTML = 'Cumulative hearts at each ultimate: '+cumStr+'. Plan completes '+acc+' / '+state.spirits.length+' spirits. Optimizing for: <b>'+ordinal(tIdx+1)+' ultimate</b> (earliest available).';
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
  renderSeasonInputs();
  renderSpirits();
  renderUltimates();
  bindStaticInputs();
  renderResult();
})();
