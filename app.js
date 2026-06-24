  // ---- DATA ----
  const EXPENSE_TEMPLATE = [
    {name:'Rent / Housing', icon:'', cost:25000, priority:9},
    {name:'Food & Groceries', icon:'', cost:12000, priority:8},
    {name:'Transport', icon:'', cost:5000, priority:7},
    {name:'Electricity & Gas', icon:'', cost:4000, priority:9},
    {name:'Internet & Phone', icon:'', cost:3000, priority:6},
    {name:'Education', icon:'', cost:8000, priority:8},
    {name:'Health & Medical', icon:'', cost:3500, priority:7},
    {name:'Entertainment', icon:'', cost:4000, priority:4},
    {name:'Clothing', icon:'', cost:3000, priority:3},
    {name:'Savings / Emergency', icon:'', cost:6000, priority:10},
  ];
  let liveExpenses = [...EXPENSE_TEMPLATE];

  let lastDpSelected = new Set();
  let lastLeftover = 0;
  let lastItems = [];

  // helpers
  function getSalary() { return parseInt(document.getElementById('salary')?.value) || 80000; }
  function getPct() { return parseInt(document.getElementById('budgetPct')?.value) / 100; }
  function getBudget() { return Math.floor(getSalary() * getPct()); }
  function fmt(n) { return 'PKR ' + Math.round(n).toLocaleString(); }
  function updateBudgetUI() {
    const pct = document.getElementById('budgetPct').value;
    document.getElementById('budgetPctVal').innerText = pct + '%';
    document.getElementById('availBudget').innerText = fmt(getBudget());
    document.getElementById('preSave').innerText = fmt(getSalary() - getBudget());
    if (window.updateRebalTotalUI) window.updateRebalTotalUI();
  }

  // render expense grid
function buildExpenseGrid() {
  const container = document.getElementById('expenseGrid');
  if (!container) return;

  container.innerHTML = EXPENSE_TEMPLATE.map((e, idx) => `
    <div class="expense-tile">
      <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
        <span style="font-weight:700;">
          ${e.icon} ${e.name}
        </span>
        <span id="prioLabel_${idx}">Prio ${e.priority}</span>
      </div>

      <div class="input-group">
        <label>Cost (PKR)</label>
        <input type="number" id="cost_${idx}" value="${e.cost}" step="500">
      </div>

      <div>
        <label>Priority</label>
        <input 
          type="range"
          id="pri_${idx}"
          min="1"
          max="10"
          value="${e.priority}"
          oninput="
            document.getElementById('pv_${idx}').innerText = this.value;
            document.getElementById('prioLabel_${idx}').innerText = 'Prio ' + this.value;
            EXPENSE_TEMPLATE[${idx}].priority = parseInt(this.value);
          "
        >
        <span id="pv_${idx}" style="margin-left:8px;">${e.priority}</span>
      </div>
    </div>
  `).join('');
}

  // knapsack DP
  function knapsackDP(items, W) {
    const n = items.length;
    const dp = Array.from({length: n+1}, () => new Int32Array(W+1));
    for (let i=1;i<=n;i++) {
      const {weight, value} = items[i-1];
      for (let w=0;w<=W;w++) {
        dp[i][w] = dp[i-1][w];
        if(weight <= w && dp[i-1][w-weight] + value > dp[i][w]) dp[i][w] = dp[i-1][w-weight] + value;
      }
    }
    let w = W, selected = new Set();
    for(let i=n;i>=1;i--) {
      if(dp[i][w] !== dp[i-1][w]) { selected.add(i-1); w -= items[i-1].weight; }
    }
    return {maxUtility: dp[n][W], selected};
  }
  function greedyKnapsack(items, W) {
    const sorted = items.map((it,i)=>({...it, idx:i, ratio: it.value/it.weight})).sort((a,b)=>b.ratio - a.ratio);
    let rem=W, util=0, sel=new Set();
    for(let it of sorted) { if(it.weight <= rem) { sel.add(it.idx); rem-=it.weight; util+=it.value; } }
    return {maxUtility: util, selected: sel};
  }

  function runOptimizer() {
    const raw = EXPENSE_TEMPLATE.map((e,i)=>({
      name:e.name, icon:e.icon, cost: parseInt(document.getElementById(`cost_${i}`).value) || e.cost,
      priority: parseInt(document.getElementById(`pri_${i}`).value) || e.priority
    }));
    const budget = getBudget();
    const UNIT = 100;
    const cap = Math.floor(budget / UNIT);
    const items = raw.map(it => ({...it, weight: Math.ceil(it.cost/UNIT), value: it.priority}));
    const dpRes = knapsackDP(items, cap);
    const grRes = greedyKnapsack(items, cap);
    lastDpSelected = dpRes.selected;
    lastItems = raw;
    let totalCost=0, totalUtil=0;
    raw.forEach((it,i)=>{ if(dpRes.selected.has(i)){ totalCost+=it.cost; totalUtil+=it.priority; } });
    const leftover = budget - totalCost;
    lastLeftover = leftover;
    document.getElementById('optMetrics').innerHTML = `
      <div class="metric-tile"><div class="metric-value-large">${fmt(totalCost)}</div><div>Allocated spend</div></div>
      <div class="metric-tile"><div class="metric-value-large">${totalUtil} pts</div><div>Utility score</div></div>
      <div class="metric-tile"><div class="metric-value-large">${fmt(leftover)}</div><div>Remaining for savings</div></div>
      <div class="metric-tile"><div class="metric-value-large">${dpRes.selected.size}/${raw.length}</div><div>Categories funded</div></div>
    `;
    const pctUsed = (totalCost/budget)*100;
    document.getElementById('optProgressFill').style.width = pctUsed+'%';
    const selectedItems = raw.filter((_,idx)=>dpRes.selected.has(idx));
    const maxC = Math.max(...selectedItems.map(s=>s.cost),1);
    document.getElementById('optBarChart').innerHTML = selectedItems.map(it=>`<div class="bar-row"><div style="min-width:130px">${it.icon} ${it.name}</div><div style="flex:1; background:#E2E8F0; border-radius:12px"><div class="bar-fill-modern" style="width:${Math.round((it.cost/maxC)*100)}%; background:#2563EB;">${fmt(it.cost)}</div></div><div class="font-mono" style="font-size:12px">P:${it.priority}</div></div>`).join('');
    document.getElementById('optList').innerHTML = raw.map((it,i)=>`<div class="result-item-modern ${dpRes.selected.has(i)?'included':''}"><span><b>${it.icon} ${it.name}</b> <span style="color:#64748B">Prio ${it.priority}</span></span><span>${fmt(it.cost)} <span style="background:${dpRes.selected.has(i)?'#10B98120':'#E2E8F0'}; padding:2px 8px; border-radius:40px;">${dpRes.selected.has(i)?'Selected':'Excluded'}</span></span></div>`).join('');
    document.getElementById('cmpDP').innerText = dpRes.maxUtility + ' pts';
    document.getElementById('cmpGreedy').innerText = grRes.maxUtility + ' pts';
    document.getElementById('optResultsArea').style.display = 'block';
  }

  // SAVINGS (greedy)
  let goals = [
    {name:'Emergency Fund', target:50000, months:6, priority:9},
    {name:'Education Fee', target:30000, months:2, priority:8},
    {name:'Travel Fund', target:20000, months:12, priority:5},
  ];
  function renderGoals() {
  const container = document.getElementById('goalsGrid');
  if (!container) return;

  container.innerHTML = goals.map((g, i) => `
    <div style="background:#F8FAFE; border-radius:20px; padding:16px; margin-bottom:12px;">
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        
        <div>
          <label style="font-size:12px; color:#64748B;">Goal Name</label>
          <input placeholder="Name" id="gname_${i}" value="${g.name}">
        </div>

        <div>
          <label style="font-size:12px; color:#64748B;">Target Amount (PKR)</label>
          <input type="number" id="gtarget_${i}" value="${g.target}">
        </div>

        <div>
          <label style="font-size:12px; color:#64748B;">Duration (Months)</label>
          <input type="number" id="gmonths_${i}" value="${g.months}">
        </div>

        <div>
          <label style="font-size:12px; color:#64748B;">Priority (1–10)</label>
          <input type="number" id="gpri_${i}" value="${g.priority}">
        </div>

      </div>
    </div>
  `).join('');
}
  window.addGoal = function() { goals.push({name:'New Goal', target:10000, months:6, priority:5}); renderGoals(); };
  function runSavings() {
    const available = lastLeftover > 0 ? lastLeftover : getBudget() * 0.2;
    const curGoals = goals.map((g,i)=>({name: document.getElementById(`gname_${i}`)?.value || g.name, target: parseInt(document.getElementById(`gtarget_${i}`)?.value)||g.target, months: parseInt(document.getElementById(`gmonths_${i}`)?.value)||g.months, priority: parseInt(document.getElementById(`gpri_${i}`)?.value)||g.priority}));
    const sorted = curGoals.map(g=>({...g, urgency: g.priority * (1/g.months), monthly: Math.ceil(g.target/g.months)})).sort((a,b)=>b.urgency - a.urgency);
    let pool = available;
    const allocs = sorted.map(g=>{ let alloc = Math.min(g.monthly, pool); pool-=alloc; return {...g, allocated: alloc, pct: Math.round((alloc/g.monthly)*100)}; });
    document.getElementById('savPoolInfo').innerHTML = `<div class="metric-tile">Available leftover: <strong>${fmt(available)}</strong> | Remaining: ${fmt(pool)}</div>`;
    document.getElementById('savList').innerHTML = allocs.map(g=>`<div style="background:#F8FAFE; border-radius:20px; padding:16px; margin-bottom:12px;"><div style="display:flex; justify-content:space-between;"><span><b>${g.name}</b></span><span>${fmt(g.allocated)} / ${fmt(g.monthly)} monthly</span></div><div class="progress-track" style="margin:10px 0"><div class="progress-fill" style="width:${g.pct}%; background:#0D9488"></div></div><div>Target ${fmt(g.target)} in ${g.months} months</div></div>`).join('');
    document.getElementById('savResultsArea').style.display = 'block';
  }

  // FORECAST WMA
  const FORECAST_CATS = EXPENSE_TEMPLATE.slice(0,6);
  function buildForecastUI() {
    const container = document.getElementById('forecastInputs');
    if(!container) return;
    container.innerHTML = FORECAST_CATS.map((e,i)=>`<div style="display:grid; grid-template-columns:120px repeat(5,1fr); gap:8px; margin-bottom:8px; align-items:center;"><div><b>${e.icon} ${e.name.split('/')[0]}</b></div><input type="number" id="f_${i}_0" value="${22000 - i*1000}" placeholder="M1"><input id="f_${i}_1" value="${23000 - i*800}"><input id="f_${i}_2" value="${24000 - i*500}"><input id="f_pred_${i}" readonly style="background:#EFF6FF"><span id="f_trend_${i}">—</span></div>`).join('');
  }
  function wma(m1,m2,m3) { return (1*m1 + 2*m2 + 3*m3)/6; }
  function runForecast() {
    let totalPred=0, totalPrev=0, rows=[];
    FORECAST_CATS.forEach((e,i)=>{
      let m1=parseFloat(document.getElementById(`f_${i}_0`)?.value)||0, m2=parseFloat(document.getElementById(`f_${i}_1`)?.value)||0, m3=parseFloat(document.getElementById(`f_${i}_2`)?.value)||0;
      let pred = Math.round(wma(m1,m2,m3));
      let trend = m3?((pred-m3)/m3*100).toFixed(1):0;
      document.getElementById(`f_pred_${i}`).value = pred.toLocaleString();
      document.getElementById(`f_trend_${i}`).innerHTML = trend>0?`▲ +${trend}%`:trend<0?`▼ ${trend}%`:'→ 0%';
      totalPred+=pred; totalPrev+=m3; rows.push({name:e.name, icon:e.icon, pred, trend:parseFloat(trend), m1,m2,m3});
    });
    const budget = getBudget();
    const diff = budget-totalPred;
    document.getElementById('foreMetrics').innerHTML = `<div class="metric-tile">Total predicted: ${fmt(totalPred)}</div><div class="metric-tile">vs last month: ${totalPred>totalPrev?'↑':totalPred<totalPrev?'↓':'→'} ${fmt(Math.abs(totalPred-totalPrev))}</div><div class="metric-tile">Budget gap: ${diff>=0?fmt(diff):'-'+fmt(Math.abs(diff))}</div>`;
    document.getElementById('foreTable').innerHTML = `<thead><tr><th>Category</th><th>WMA Forecast</th><th>Trend</th><th>Insight</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.icon} ${r.name}</td><td class="font-mono">${r.pred.toLocaleString()}</td><td style="color:${r.trend>2?'#EF4444':r.trend<-2?'#10B981':'#64748B'}">${r.trend>0?'▲':r.trend<0?'▼':'→'} ${Math.abs(r.trend)}%</td><td>${Math.abs(r.trend)>5?(r.trend>0?'⚠️ risk':'✔️ saving'):'stable'}</td></tr>`).join('')}</tbody>`;
    document.getElementById('forecastResultsArea').style.display = 'block';
  }

  // REBALANCER PQ
function buildOverspendPanel() {
  const container = document.getElementById('overspendInputs');
  if (!container) return;

  container.innerHTML = EXPENSE_TEMPLATE.map((e, i) => `
    <div style="
      display:flex;
      gap:12px;
      align-items:center;
      justify-content:space-between;
      flex-wrap:wrap;
      margin-bottom:12px;
      background:#F8FAFE;
      border-radius:20px;
      padding:12px;
    ">
      
      <span style="flex:1; min-width:180px;">
        ${e.icon} ${e.name}
      </span>

      <input 
        type="number" 
        id="ob_${i}" 
        value="${e.cost}" 
        placeholder="Enter actual spend"
        style="
          flex:1;
          min-width:140px;
          max-width:220px;
          padding:8px 10px;
          border-radius:10px;
          border:1px solid #E2E8F0;
        "
      >
    </div>
  `).join('');

  window.updateRebalTotalUI = function () {
    let total = 0;

    EXPENSE_TEMPLATE.forEach((_, i) => {
      total += parseInt(document.getElementById(`ob_${i}`)?.value) || 0;
    });

    const budget = getBudget();
    const diff = total - budget;

    document.getElementById('rebalBudgetInfo').innerHTML = `
      Budget: ${fmt(budget)} |
      Actual total: ${fmt(total)} |
      ${total > 0
        ? (diff > 0
            ? `Overspent by ${fmt(diff)}`
            : `Under by ${fmt(-diff)}`)
        : `No data entered`}
    `;
  };

  window.updateRebalTotalUI();
}

  function runRebalancer() {
    const budget = getBudget();
    const actualArr = EXPENSE_TEMPLATE.map((e,i)=>({
  name:e.name,
  icon:e.icon,
  priority: EXPENSE_TEMPLATE[i].priority,
  budgeted: EXPENSE_TEMPLATE[i].cost,
  actual: parseInt(document.getElementById(`ob_${i}`)?.value)||0
}));
    const totalActual = actualArr.reduce((s,it)=>s+it.actual,0);
    const deficit = totalActual - budget;
    if(deficit<=0){
      document.getElementById('rebalSummary').innerHTML = `<span style="color:#10B981;">✓ Within budget, surplus ${fmt(-deficit)}.</span>`;
      document.getElementById('rebalList').innerHTML = '';
      document.getElementById('rebalResultsArea').style.display = 'block'; return;
    }
    const sortedCuts = actualArr.filter(it=>it.actual>0).sort((a,b)=>a.priority - b.priority);
    let remain = deficit;
    const adjustments = actualArr.map(it=>({...it, cut:0, final:it.actual}));
    for(let cat of sortedCuts){
      if(remain<=0) break;
      const idx = actualArr.findIndex(it=>it.name===cat.name);
      const maxCut = Math.min(cat.actual, remain);
      adjustments[idx].cut = maxCut;
      adjustments[idx].final = cat.actual - maxCut;
      remain -= maxCut;
    }
    document.getElementById('rebalSummary').innerHTML = `Overspent ${fmt(deficit)} → cuts prioritized from lowest priority. ${remain>0?'⚠️ partial cover.': '✓ balanced.'}`;
    document.getElementById('rebalList').innerHTML = adjustments.map(it=>`<div style="border-left:3px solid ${it.cut? '#EF4444':'#CBD5E1'}; background:#F8FAFE; border-radius:16px; padding:12px; margin-bottom:8px;"><div style="display:flex; justify-content:space-between;"><span><b>${it.icon} ${it.name}</b> (prio ${it.priority})</span><span>Actual ${fmt(it.actual)} | Budget ${fmt(it.budgeted)}</span></div>${it.cut?`<div style="color:#EF4444; margin-top:6px;">✂️ Cut ${fmt(it.cut)} → adjusted to ${fmt(it.final)}</div>`:''}</div>`).join('');
    document.getElementById('rebalResultsArea').style.display = 'block';
  }

  // Tab & UI init
  function initTabs() {
    const btns = document.querySelectorAll('.tab-strip button');
    const panels = {opt:document.getElementById('panel-opt'), sav:document.getElementById('panel-sav'), pred:document.getElementById('panel-pred'), rebal:document.getElementById('panel-rebal')};
    btns.forEach(btn=>{
      btn.addEventListener('click',()=>{
        const tab = btn.getAttribute('data-tab');
        Object.values(panels).forEach(p=>p.classList.remove('active-panel'));
        btns.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        if(tab==='opt') panels.opt.classList.add('active-panel');
        if(tab==='sav') panels.sav.classList.add('active-panel');
        if(tab==='pred') panels.pred.classList.add('active-panel');
        if(tab==='rebal') panels.rebal.classList.add('active-panel');
      });
    });
  }

  document.getElementById('salary')?.addEventListener('input',()=>{updateBudgetUI(); runOptimizer();});
  document.getElementById('budgetPct')?.addEventListener('input',()=>{updateBudgetUI(); runOptimizer();});
  document.getElementById('runKnapBtn')?.addEventListener('click',runOptimizer);
  document.getElementById('addGoalBtn')?.addEventListener('click',()=>{addGoal();});
  document.getElementById('runSavingsBtn')?.addEventListener('click',runSavings);
  document.getElementById('runForecastBtn')?.addEventListener('click',runForecast);
  document.getElementById('runRebalanceBtn')?.addEventListener('click',runRebalancer);
  buildExpenseGrid();
  renderGoals();
  buildForecastUI();
  buildOverspendPanel();
  updateBudgetUI();
  initTabs();
  document.querySelector('.tab-strip button').classList.add('active');
  document.getElementById('panel-opt').classList.add('active-panel');
