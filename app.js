const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const STORAGE_KEY = 'meuControleV31';
const mainScreens = ['screen-home','screen-fluxo','screen-reports','screen-categories','screen-profile'];
const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const defaultState = {
  accounts: [
    { id: crypto.randomUUID(), nome:'Nubank', saldo:26.46, status:'ativa', icon:'nubank' },
    { id: crypto.randomUUID(), nome:'Cofrinho', saldo:0, status:'ativa', icon:'cofrinho' },
    { id: crypto.randomUUID(), nome:'Itaú', saldo:0, status:'arquivada', icon:'itau' },
    { id: crypto.randomUUID(), nome:'BB', saldo:0, status:'arquivada', icon:'bb' }
  ],
  cards: [
    { id: crypto.randomUUID(), nome:'Nubank', fatura:0, disponivel:400, fecha:3, vence:10, icon:'nubank' }
  ],
  categories: [
    { id: crypto.randomUUID(), nome:'Alimentação', tipo:'Despesa', icon:'food' },
    { id: crypto.randomUUID(), nome:'Assinaturas e serviços', tipo:'Despesa', icon:'service' },
    { id: crypto.randomUUID(), nome:'Bares e restaurantes', tipo:'Despesa', icon:'food' },
    { id: crypto.randomUUID(), nome:'Cartão de crédito', tipo:'Despesa', icon:'debt' },
    { id: crypto.randomUUID(), nome:'Casa', tipo:'Despesa', icon:'default' },
    { id: crypto.randomUUID(), nome:'Combustível', tipo:'Despesa', icon:'tax' },
    { id: crypto.randomUUID(), nome:'Empréstimos', tipo:'Receita', icon:'loan' },
    { id: crypto.randomUUID(), nome:'Investimentos', tipo:'Receita', icon:'salary' },
    { id: crypto.randomUUID(), nome:'Outras receitas', tipo:'Receita', icon:'salary' },
    { id: crypto.randomUUID(), nome:'Plantões', tipo:'Receita', icon:'salary' },
    { id: crypto.randomUUID(), nome:'Salário', tipo:'Receita', icon:'salary' },
    { id: crypto.randomUUID(), nome:'Vale', tipo:'Receita', icon:'salary' },
    { id: crypto.randomUUID(), nome:'Vale Alimentação', tipo:'Receita', icon:'salary' }
  ],
  transactions: [
    { id: crypto.randomUUID(), data:'2026-04-05', tipo:'Despesa', descricao:'Energia', valor:79.90, categoria:'Casa', conta:'Nubank', status:'Pago', fixa:true },
    { id: crypto.randomUUID(), data:'2026-04-06', tipo:'Despesa', descricao:'Netflix', valor:39.90, categoria:'Assinaturas e serviços', conta:'Nubank', status:'Pago', fixa:true },
    { id: crypto.randomUUID(), data:'2026-04-10', tipo:'Receita', descricao:'Vale', valor:1022, categoria:'Vale', conta:'Nubank', status:'Pago', fixa:true },
    { id: crypto.randomUUID(), data:'2026-04-15', tipo:'Receita', descricao:'Salário', valor:2200, categoria:'Salário', conta:'Nubank', status:'Pago', fixa:true },
    { id: crypto.randomUUID(), data:'2026-04-16', tipo:'Despesa', descricao:'Combustível', valor:150, categoria:'Combustível', conta:'Nubank', status:'Pago', fixa:false },
    { id: crypto.randomUUID(), data:'2026-04-17', tipo:'Despesa', descricao:'Mercado', valor:220.50, categoria:'Alimentação', conta:'Nubank', status:'Pago', fixa:false },
    { id: crypto.randomUUID(), data:'2026-04-21', tipo:'Despesa', descricao:'Lanche', valor:28.00, categoria:'Bares e restaurantes', conta:'Nubank', status:'Pendente', fixa:false },
    { id: crypto.randomUUID(), data:'2026-04-24', tipo:'Despesa', descricao:'Fatura Nubank', valor:181.20, categoria:'Cartão de crédito', conta:'Nubank', status:'Pendente', fixa:true },
    { id: crypto.randomUUID(), data:'2026-04-28', tipo:'Receita', descricao:'VA', valor:650, categoria:'Vale Alimentação', conta:'Cofrinho', status:'Pago', fixa:true },
    { id: crypto.randomUUID(), data:'2026-05-03', tipo:'Despesa', descricao:'Internet', valor:99.90, categoria:'Assinaturas e serviços', conta:'Nubank', status:'Pendente', fixa:true },
    { id: crypto.randomUUID(), data:'2026-05-05', tipo:'Despesa', descricao:'Água', valor:48, categoria:'Casa', conta:'Nubank', status:'Pendente', fixa:true }
  ],
  meta: {
    hideBalance:false,
    currentMonth:'2026-04',
    reportMonth:'2026-04',
    currentViewMode:'cashflow',
    currentCategoryType:'Despesa',
    reportTab:'categorias',
    filters:{ tipos:[], status:[], accounts:[], categoria:'' },
    period:'month',
    seenReportIntro:false
  }
};

let state = loadState();
let screenHistory = ['screen-home'];
let selectedTransactionId = null;
let reportsSlideIndex = 0;
let expensesChart, incomeChart, balanceChart;

function loadState(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? mergeState(saved) : structuredClone(defaultState);
  } catch(e){
    return structuredClone(defaultState);
  }
}

function mergeState(saved){
  const merged = structuredClone(defaultState);
  Object.assign(merged, saved);
  merged.meta = { ...defaultState.meta, ...(saved.meta || {}) };
  merged.accounts = Array.isArray(saved.accounts) ? saved.accounts : defaultState.accounts;
  merged.cards = Array.isArray(saved.cards) ? saved.cards : defaultState.cards;
  merged.categories = Array.isArray(saved.categories) ? saved.categories : defaultState.categories;
  merged.transactions = Array.isArray(saved.transactions) ? saved.transactions : defaultState.transactions;
  return merged;
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function brl(value){
  return Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}

function signedBrl(tx){
  const prefix = tx.tipo === 'Despesa' ? '- ' : '+ ';
  return prefix + brl(tx.valor).replace('R$','R$').trim();
}

function getMonthNameByString(monthStr){
  const [,m] = monthStr.split('-').map(Number);
  return monthNames[(m || 1) - 1];
}

function shiftMonth(monthStr, delta){
  const [y,m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function dateLabel(dateString){
  const d = new Date(dateString + 'T12:00:00');
  return `${String(d.getDate()).padStart(2,'0')} de ${monthNames[d.getMonth()].toLowerCase()}`;
}

function getCategoryIcon(category){
  const found = state.categories.find(c => c.nome === category);
  return found?.icon || 'default';
}

function getCategoryBadge(category){
  const icon = getCategoryIcon(category);
  const map = {
    food:'🍽', service:'◔', debt:'💳', tax:'🚗', salary:'★', loan:'$'
  };
  return { className: icon, label: map[icon] || '%' };
}

function activeAccounts(){ return state.accounts.filter(a => a.status === 'ativa'); }
function archivedAccounts(){ return state.accounts.filter(a => a.status === 'arquivada'); }

function computeHomeBalance(){
  return activeAccounts().reduce((sum,a) => sum + Number(a.saldo || 0), 0);
}

function getMonthTransactions(monthStr, period = 'month'){
  const list = [...state.transactions].sort((a,b)=>a.data.localeCompare(b.data));
  if(period === 'month'){
    return list.filter(tx => tx.data.startsWith(monthStr));
  }
  const today = new Date('2026-04-27T12:00:00');
  if(period === 'today'){
    const ref = today.toISOString().slice(0,10);
    return list.filter(tx => tx.data === ref);
  }
  if(period === 'year'){
    const year = monthStr.slice(0,4);
    return list.filter(tx => tx.data.startsWith(year));
  }
  const numeric = Number(period);
  if([7,15,30].includes(numeric)){
    const start = new Date(today);
    start.setDate(start.getDate() - numeric + 1);
    return list.filter(tx => {
      const d = new Date(tx.data + 'T12:00:00');
      return d >= start && d <= today;
    });
  }
  return list.filter(tx => tx.data.startsWith(monthStr));
}

function getFilteredTransactions(){
  const { currentMonth, period, filters, currentViewMode } = state.meta;
  let items = getMonthTransactions(currentMonth, period);

  if(filters.tipos.length) items = items.filter(tx => filters.tipos.includes(tx.tipo));
  if(filters.status.length) items = items.filter(tx => filters.status.includes(tx.status));
  if(filters.accounts.length) items = items.filter(tx => filters.accounts.includes(tx.conta));
  if(filters.categoria) items = items.filter(tx => tx.categoria === filters.categoria);

  if(currentViewMode === 'cashflow') {
    items = items.sort((a,b)=>a.data.localeCompare(b.data));
  } else {
    items = items.sort((a,b)=>b.data.localeCompare(a.data));
  }
  return items;
}

function groupTransactionsByDate(items){
  const map = new Map();
  items.forEach(tx => {
    if(!map.has(tx.data)) map.set(tx.data, []);
    map.get(tx.data).push(tx);
  });
  return [...map.entries()];
}

function updateMainNav(activeId){
  $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.openScreen === activeId));
}

function openScreen(id, push = true){
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  if(push){
    const last = screenHistory[screenHistory.length - 1];
    if(last !== id) screenHistory.push(id);
  }
  if(mainScreens.includes(id)) updateMainNav(id);
  if(id === 'screen-reports' && !state.meta.seenReportIntro){
    $('#reportIntroDialog').showModal();
  }
}

function goBack(){
  if(screenHistory.length > 1) screenHistory.pop();
  const previous = screenHistory[screenHistory.length - 1] || 'screen-home';
  openScreen(previous, false);
}

function toggleHide(){
  state.meta.hideBalance = !state.meta.hideBalance;
  saveState();
  renderAll();
}

function maybeHidden(value){
  return state.meta.hideBalance ? 'R$ ••••' : brl(value);
}

function renderHome(){
  const monthItems = getMonthTransactions(state.meta.currentMonth, 'month');
  const income = monthItems.filter(tx => tx.tipo === 'Receita').reduce((a,b)=>a + Number(b.valor || 0), 0);
  const expense = monthItems.filter(tx => tx.tipo === 'Despesa').reduce((a,b)=>a + Number(b.valor || 0), 0);
  const balance = computeHomeBalance();

  $('#homeTotalBalance').textContent = maybeHidden(balance);
  $('#homeIncome').textContent = maybeHidden(income);
  $('#homeExpense').textContent = maybeHidden(expense);
  $('#homeForecast').textContent = maybeHidden(income - expense);
  $('#btnToggleHideBalance').textContent = state.meta.hideBalance ? 'Mostrar' : 'Ocultar';

  $('#homeAccountsList').innerHTML = activeAccounts().map(account => `
    <div class="account-row">
      <div class="row-left">
        <div class="logo-badge ${account.icon || 'default'}">${account.nome.slice(0,2).toLowerCase()}</div>
        <div>
          <div class="row-title">${account.nome}</div>
          <div class="row-sub">Conta manual</div>
        </div>
      </div>
      <div class="row-right">
        <strong>${maybeHidden(account.saldo)}</strong>
        <span>saldo atual</span>
      </div>
    </div>`).join('');

  $('#homeCardsList').innerHTML = state.cards.map(card => `
    <div class="card-row">
      <div class="row-left">
        <div class="logo-badge ${card.icon || 'default'}">nu</div>
        <div>
          <div class="row-title">${card.nome}</div>
          <div class="row-sub">Fecha dia ${card.fecha} - Vence dia ${card.vence}</div>
        </div>
      </div>
      <div class="row-right">
        <strong>${maybeHidden(card.disponivel)}</strong>
        <span>disponível</span>
      </div>
    </div>`).join('');
}

function renderAccountsScreens(){
  $('#accountsScreenList').innerHTML = activeAccounts().map(account => `
    <div class="card-box">
      <div class="row-left">
        <div class="logo-badge ${account.icon || 'default'}">${account.nome.slice(0,2).toLowerCase()}</div>
        <div class="card-box-body">
          <div class="row-title">${account.nome}</div>
          <div class="row-sub">Conta manual</div>
          <hr>
          <div class="card-box-meta">
            <div class="col"><span>Saldo atual</span><strong>${maybeHidden(account.saldo)}</strong></div>
            <button class="chevron" data-archive-account="${account.id}">›</button>
          </div>
        </div>
      </div>
    </div>`).join('') || '<div class="section-card">Nenhuma conta ativa.</div>';

  $('#archivedAccountsList').innerHTML = archivedAccounts().map(account => `
    <div class="card-box">
      <div class="row-left">
        <div class="logo-badge ${account.icon || 'default'}">${account.nome.slice(0,2).toLowerCase()}</div>
        <div class="card-box-body">
          <div class="row-title">${account.nome}</div>
          <div class="row-sub">Conta manual</div>
          <hr>
          <div class="card-box-meta">
            <div class="col"><span>Saldo atual</span><strong>${maybeHidden(account.saldo)}</strong></div>
            <button class="chevron" data-unarchive-account="${account.id}">⋮</button>
          </div>
        </div>
      </div>
    </div>`).join('') || '<div class="section-card">Nenhuma conta arquivada.</div>';

  $$('[data-archive-account]').forEach(btn => btn.onclick = () => {
    const item = state.accounts.find(a => a.id === btn.dataset.archiveAccount);
    if(item){ item.status = 'arquivada'; saveState(); renderAll(); }
  });
  $$('[data-unarchive-account]').forEach(btn => btn.onclick = () => {
    const item = state.accounts.find(a => a.id === btn.dataset.unarchiveAccount);
    if(item){ item.status = 'ativa'; saveState(); renderAll(); }
  });
}

function renderCardsScreens(){
  $('#cardsScreenList').innerHTML = state.cards.map(card => `
    <div class="card-box">
      <div class="row-left">
        <div class="logo-badge ${card.icon || 'default'}">nu</div>
        <div class="card-box-body">
          <div class="row-title">${card.nome}</div>
          <div class="row-sub">Fecha dia ${card.fecha} - Vence dia ${card.vence}</div>
          <hr>
          <div class="card-box-meta">
            <div class="col"><span>Fatura atual</span><strong>${maybeHidden(card.fatura)}</strong></div>
            <div class="col"><span>Disponível</span><strong>${maybeHidden(card.disponivel)}</strong></div>
          </div>
        </div>
      </div>
    </div>`).join('') || '<div class="section-card">Nenhum cartão cadastrado.</div>';
}

function renderCategories(){
  const currentType = state.meta.currentCategoryType;
  $$('#categorySegmented .segment').forEach(btn => btn.classList.toggle('active', btn.dataset.catType === currentType));
  const items = state.categories.filter(c => c.tipo === currentType);
  $('#categoriesList').innerHTML = items.map(cat => {
    const badge = getCategoryBadge(cat.nome);
    return `
      <div class="category-row">
        <div class="row-left">
          <div class="category-badge tx-icon ${badge.className}">${badge.label}</div>
          <div class="row-title">${cat.nome}</div>
        </div>
      </div>`;
  }).join('');
}

function renderFlow(){
  $('#labelCurrentMonth').textContent = getMonthNameByString(state.meta.currentMonth);
  $('#labelPrevMonth').textContent = getMonthNameByString(shiftMonth(state.meta.currentMonth,-1));
  $('#labelNextMonth').textContent = getMonthNameByString(shiftMonth(state.meta.currentMonth,1));

  const items = getFilteredTransactions();
  const groups = groupTransactionsByDate(items);
  $('#cashflowList').innerHTML = groups.length ? groups.map(([date, list]) => `
    <div class="day-group">
      <div class="day-label">${dateLabel(date)}</div>
      ${list.map(tx => {
        const badge = getCategoryBadge(tx.categoria);
        const valueClass = tx.tipo === 'Receita' ? 'positive' : 'negative';
        const statusText = tx.status === 'Pago'
          ? (tx.tipo === 'Receita' ? 'recebido' : 'pago')
          : (tx.tipo === 'Receita' ? 'não recebido' : 'não pago');
        return `
          <button class="tx-row" data-open-tx="${tx.id}">
            <div class="tx-main">
              <div class="tx-icon ${badge.className}">${badge.label}</div>
              <div class="tx-meta">
                <strong>${tx.descricao}</strong>
                <span>${tx.conta}</span>
              </div>
            </div>
            <div class="tx-right">
              <strong class="${valueClass}">${state.meta.hideBalance ? 'R$ ••••' : signedBrl(tx)}</strong>
              <span>${statusText}</span>
            </div>
          </button>`;
      }).join('')}
    </div>`).join('') : `<div class="section-card"><h2>Sem lançamentos</h2><p style="margin-top:8px;color:#777">Nenhum lançamento encontrado neste período.</p></div>`;

  const entradas = items.filter(tx => tx.tipo === 'Receita').reduce((a,b)=>a + Number(b.valor||0), 0);
  const saidas = items.filter(tx => tx.tipo === 'Despesa').reduce((a,b)=>a + Number(b.valor||0), 0);
  const paid = items.filter(tx => tx.status === 'Pago');
  const prevEntradas = paid.filter(tx => tx.tipo === 'Receita').reduce((a,b)=>a + Number(b.valor||0), 0);
  const prevSaidas = paid.filter(tx => tx.tipo === 'Despesa').reduce((a,b)=>a + Number(b.valor||0), 0);

  $('#flowEntradas').textContent = maybeHidden(entradas);
  $('#flowSaidas').textContent = maybeHidden(saidas);
  $('#flowSaldo').textContent = maybeHidden(entradas - saidas);
  $('#flowPrevEntradas').textContent = maybeHidden(prevEntradas);
  $('#flowPrevSaidas').textContent = maybeHidden(prevSaidas);
  $('#flowPrevSaldo').textContent = maybeHidden(prevEntradas - prevSaidas);

  $$('.tx-row[data-open-tx]').forEach(btn => btn.onclick = () => openTransactionDetail(btn.dataset.openTx));
}

function totalsByCategory(list, tipo){
  const totals = {};
  list.filter(tx => tx.tipo === tipo).forEach(tx => {
    totals[tx.categoria] = (totals[tx.categoria] || 0) + Number(tx.valor || 0);
  });
  return Object.entries(totals).sort((a,b)=>b[1]-a[1]);
}

function buildCategoryLines(targetId, rows, total){
  $(targetId).innerHTML = rows.map(([category, value]) => {
    const badge = getCategoryBadge(category);
    return `<div class="category-line">
      <div class="row-left"><div class="tx-icon ${badge.className}">${badge.label}</div><div><div class="row-title">${category}</div></div></div>
      <div class="row-right"><strong>${maybeHidden(value)}</strong><span>${total ? Math.round((value/total)*100) : 0}%</span></div>
    </div>`;
  }).join('') || '<div class="category-line"><div style="color:#888">Sem dados no período.</div></div>';
}

function renderReports(){
  $('#reportsCurrentLabel').textContent = getMonthNameByString(state.meta.reportMonth);
  $('#reportsPrevLabel').textContent = getMonthNameByString(shiftMonth(state.meta.reportMonth,-1));
  $('#reportsNextLabel').textContent = getMonthNameByString(shiftMonth(state.meta.reportMonth,1));
  $$('.tab-option').forEach(btn => btn.classList.toggle('active', btn.dataset.reportTab === state.meta.reportTab));
  $$('.report-tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === `reportTab${capitalize(state.meta.reportTab)}`));

  const list = getMonthTransactions(state.meta.reportMonth, 'month');
  const expenseRows = totalsByCategory(list, 'Despesa');
  const incomeRows = totalsByCategory(list, 'Receita');
  const expenseTotal = expenseRows.reduce((sum,[,value]) => sum + value, 0);
  const incomeTotal = incomeRows.reduce((sum,[,value]) => sum + value, 0);

  buildCategoryLines('#expenseCategoryList', expenseRows, expenseTotal);
  buildCategoryLines('#incomeCategoryList', incomeRows, incomeTotal);
  $('#expenseTotal').textContent = maybeHidden(expenseTotal);
  $('#incomeTotal').textContent = maybeHidden(incomeTotal);
  $('#tagsExpenseTotal').textContent = maybeHidden(expenseTotal);
  $('#tagsIncomeTotal').textContent = maybeHidden(incomeTotal);

  drawDoughnut('#expensesChart', expenseRows.map(r=>r[0]), expenseRows.map(r=>r[1]), 'Despesas', 'expensesChart');
  drawDoughnut('#incomeChart', incomeRows.map(r=>r[0]), incomeRows.map(r=>r[1]), 'Receitas', 'incomeChart');

  const body = $('#balanceTableBody');
  body.innerHTML = '';
  for(let i=2; i>=0; i--){
    const month = shiftMonth(state.meta.reportMonth, -i);
    const monthTx = getMonthTransactions(month, 'month');
    const ent = monthTx.filter(t=>t.tipo==='Receita').reduce((a,b)=>a+Number(b.valor||0),0);
    const sai = monthTx.filter(t=>t.tipo==='Despesa').reduce((a,b)=>a+Number(b.valor||0),0);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${getMonthNameByString(month)}</td><td>${maybeHidden(ent)}</td><td>${maybeHidden(sai)}</td><td>${maybeHidden(ent-sai)}</td>`;
    body.appendChild(tr);
  }
  drawBalanceChart();
}

function drawDoughnut(selector, labels, values, label, key){
  const ctx = $(selector);
  const palette = ['#4ecb71','#7ec4ff','#f07fa5','#f4aa6b','#b17cf3','#7c8cff','#f0da61'];
  if(key === 'expensesChart' && expensesChart) expensesChart.destroy();
  if(key === 'incomeChart' && incomeChart) incomeChart.destroy();
  const chart = new Chart(ctx, {
    type:'doughnut',
    data:{ labels: labels.length ? labels : ['Sem dados'], datasets:[{ data: values.length ? values : [1], backgroundColor: values.length ? palette.slice(0,values.length) : ['#dedede'], borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, color:'#555', font:{size:12} } } }, cutout:'62%' }
  });
  if(key === 'expensesChart') expensesChart = chart;
  if(key === 'incomeChart') incomeChart = chart;
}

function drawBalanceChart(){
  const ctx = $('#balanceChart');
  if(balanceChart) balanceChart.destroy();
  const labels = [];
  const incomes = [];
  const expenses = [];
  for(let i=2; i>=0; i--){
    const month = shiftMonth(state.meta.reportMonth, -i);
    const monthTx = getMonthTransactions(month, 'month');
    labels.push(getMonthNameByString(month));
    incomes.push(monthTx.filter(t=>t.tipo==='Receita').reduce((a,b)=>a+Number(b.valor||0),0));
    expenses.push(monthTx.filter(t=>t.tipo==='Despesa').reduce((a,b)=>a+Number(b.valor||0),0));
  }
  balanceChart = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ label:'Entradas', data:incomes, backgroundColor:'#48c466', borderRadius:10 },{ label:'Saídas', data:expenses, backgroundColor:'#f07c83', borderRadius:10 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:'#555' } } }, scales:{ x:{ grid:{ display:false }, ticks:{ color:'#666' } }, y:{ grid:{ color:'#ececec' }, ticks:{ color:'#666', callback:v => 'R$ ' + v } } } }
  });
}

function renderDetailDialog(tx){
  if(!tx) return;
  const badge = getCategoryBadge(tx.categoria);
  $('#detailCategoryIcon').className = `detail-icon tx-icon ${badge.className}`;
  $('#detailCategoryIcon').textContent = badge.label;
  $('#detailDescription').textContent = tx.descricao;
  $('#detailValue').textContent = state.meta.hideBalance ? 'R$ ••••' : signedBrl(tx);
  $('#detailValue').className = `detail-value ${tx.tipo === 'Receita' ? 'positive' : 'negative'}`;
  $('.detail-fixed-pill').textContent = tx.fixa ? 'Lançamento fixo' : 'Lançamento avulso';
  $('#btnToggleTransactionStatus').querySelector('small').textContent = tx.status === 'Pago' ? 'Pendência' : 'Baixar';
  $('#detailGrid').innerHTML = [
    ['Tipo', tx.tipo],
    ['Data', dateLabel(tx.data)],
    ['Status', tx.status],
    ['Conta', tx.conta],
    ['Categoria', tx.categoria],
    ['Recorrência', tx.fixa ? 'Mensal' : 'Nenhuma']
  ].map(([k,v]) => `<div class="detail-item"><span>${k}</span><strong>${v}</strong></div>`).join('');
}

function openTransactionDetail(id){
  selectedTransactionId = id;
  const tx = state.transactions.find(item => item.id === id);
  renderDetailDialog(tx);
  $('#transactionDetailDialog').showModal();
}

function fillTransactionForm(tx = null){
  const form = $('#transactionForm');
  form.reset();
  const els = form.elements;
  $('#transactionFormTitle').textContent = tx ? 'Editar lançamento' : 'Novo lançamento';
  els['id'].value = tx?.id || '';
  els['data'].value = tx?.data || state.meta.currentMonth + '-15';
  els['tipo'].value = tx?.tipo || 'Despesa';
  populateFormSelects();
  els['descricao'].value = tx?.descricao || '';
  els['valor'].value = tx?.valor ?? '';
  els['categoria'].value = tx?.categoria || state.categories.find(c => c.tipo === els['tipo'].value)?.nome || '';
  els['conta'].value = tx?.conta || activeAccounts()[0]?.nome || '';
  els['status'].value = tx?.status || 'Pendente';
}

function populateFormSelects(){
  const categorySelect = $('#transactionCategorySelect');
  const accountSelect = $('#transactionAccountSelect');
  const selectedType = $('#transactionForm [name="tipo"]').value || 'Despesa';
  categorySelect.innerHTML = state.categories.filter(c => c.tipo === selectedType).map(cat => `<option value="${cat.nome}">${cat.nome}</option>`).join('');
  accountSelect.innerHTML = activeAccounts().map(acc => `<option value="${acc.nome}">${acc.nome}</option>`).join('');
}

function populateFilterOptions(){
  const form = $('#filterForm');
  $('#filterAccounts').innerHTML = activeAccounts().map(acc => `<label class="bank-pill"><input type="checkbox" name="account" value="${acc.nome}">${acc.nome}</label>`).join('');
  const select = $('#filterForm select[name="categoria"]');
  select.innerHTML = '<option value="">Todas as categorias</option>' + state.categories.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');

  $$('input[name="tipo"]', form).forEach(input => input.checked = state.meta.filters.tipos.includes(input.value));
  $$('input[name="status"]', form).forEach(input => input.checked = state.meta.filters.status.includes(input.value));
  $$('input[name="account"]', form).forEach(input => input.checked = state.meta.filters.accounts.includes(input.value));
  select.value = state.meta.filters.categoria || '';
}

function renderReportIntro(){
  const slides = $$('.report-intro-slide');
  slides.forEach((slide, index) => slide.classList.toggle('active', index === reportsSlideIndex));
  const dots = $('#reportIntroDots');
  dots.innerHTML = slides.map((_, index) => `<span class="${index === reportsSlideIndex ? 'active' : ''}"></span>`).join('');
}

function capitalize(text){ return text.charAt(0).toUpperCase() + text.slice(1); }

function renderAll(){
  renderHome();
  renderAccountsScreens();
  renderCardsScreens();
  renderCategories();
  renderFlow();
  renderReports();
  populateFilterOptions();
  renderReportIntro();
}

function exportExcel(){
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.transactions), 'Lancamentos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.accounts), 'Contas');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.cards), 'Cartoes');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.categories), 'Categorias');
  XLSX.writeFile(wb, 'meu-controle-v31.xlsx');
}

// Navigation
$$('[data-open-screen]').forEach(btn => btn.addEventListener('click', () => openScreen(btn.dataset.openScreen)));
$$('[data-back]').forEach(btn => btn.addEventListener('click', goBack));
$('#btnToggleHideBalance').addEventListener('click', toggleHide);
$('#btnPrevMonth').addEventListener('click', () => { state.meta.currentMonth = shiftMonth(state.meta.currentMonth,-1); saveState(); renderFlow(); renderHome(); });
$('#btnNextMonth').addEventListener('click', () => { state.meta.currentMonth = shiftMonth(state.meta.currentMonth,1); saveState(); renderFlow(); renderHome(); });
$('#labelPrevMonth').addEventListener('click', () => { state.meta.currentMonth = shiftMonth(state.meta.currentMonth,-1); saveState(); renderFlow(); renderHome(); });
$('#labelNextMonth').addEventListener('click', () => { state.meta.currentMonth = shiftMonth(state.meta.currentMonth,1); saveState(); renderFlow(); renderHome(); });
$('#btnReportsPrevMonth').addEventListener('click', () => { state.meta.reportMonth = shiftMonth(state.meta.reportMonth,-1); saveState(); renderReports(); });
$('#btnReportsNextMonth').addEventListener('click', () => { state.meta.reportMonth = shiftMonth(state.meta.reportMonth,1); saveState(); renderReports(); });
$('#reportsPrevLabel').addEventListener('click', () => { state.meta.reportMonth = shiftMonth(state.meta.reportMonth,-1); saveState(); renderReports(); });
$('#reportsNextLabel').addEventListener('click', () => { state.meta.reportMonth = shiftMonth(state.meta.reportMonth,1); saveState(); renderReports(); });

$('#fabAddTransaction').addEventListener('click', () => {
  fillTransactionForm();
  $('#btnDuplicateInForm').classList.add('hidden');
  $('#transactionFormDialog').showModal();
});

// Dialog openers
$('#btnOpenFlowMenu').addEventListener('click', () => $('#flowMenuDialog').showModal());
$('#btnOpenViewMode').addEventListener('click', () => $('#viewModeDialog').showModal());
$('#btnOpenFilterDialog').addEventListener('click', () => { $('#flowMenuDialog').close(); populateFilterOptions(); $('#filterDialog').showModal(); });
$('#btnOpenPeriodDialog').addEventListener('click', () => { $('#flowMenuDialog').close(); $('#periodDialog').showModal(); });
$('#btnOpenAccountForm').addEventListener('click', () => $('#accountFormDialog').showModal());
$('#btnOpenCardForm').addEventListener('click', () => $('#cardFormDialog').showModal());
$('#btnOpenCategoryForm').addEventListener('click', () => $('#categoryFormDialog').showModal());
$('#btnCreateCategory').addEventListener('click', () => $('#categoryFormDialog').showModal());
$$('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => $('#' + btn.dataset.closeDialog).close()));

// View mode dialog
const viewModeTextMap = {
  cashflow:[
    'Lançamentos organizados pela data em que afetam o saldo.',
    'Resumo do resultado do período logo abaixo da lista.',
    'Ideal para acompanhar o saldo do mês em ordem cronológica.'
  ],
  all:[
    'Todos os lançamentos aparecem em uma lista única.',
    'Os itens mais recentes ficam no topo da listagem.',
    'Ideal para revisar rapidamente tudo o que foi lançado.'
  ]
};
function renderViewModeDialog(){
  const mode = state.meta.currentViewMode;
  $$('#viewModeSegmented .segment').forEach(btn => btn.classList.toggle('active', btn.dataset.viewMode === mode));
  $('#viewModeText').innerHTML = viewModeTextMap[mode].map(line => `<li>${line}</li>`).join('');
}
$$('#viewModeSegmented .segment').forEach(btn => btn.addEventListener('click', () => {
  state.meta.currentViewMode = btn.dataset.viewMode;
  renderViewModeDialog();
}));
$('#btnApplyViewMode').addEventListener('click', () => { saveState(); $('#viewModeDialog').close(); renderFlow(); });
$('#viewModeDialog').addEventListener('close', renderViewModeDialog);

// Form interactions
$('#transactionForm [name="tipo"]').addEventListener('change', populateFormSelects);
$('#transactionForm').addEventListener('submit', event => {
  event.preventDefault();
  const fd = new FormData(event.target);
  const payload = {
    id: fd.get('id') || crypto.randomUUID(),
    data: fd.get('data'),
    tipo: fd.get('tipo'),
    descricao: fd.get('descricao'),
    valor: Number(fd.get('valor') || 0),
    categoria: fd.get('categoria'),
    conta: fd.get('conta'),
    status: fd.get('status'),
    fixa: true
  };
  const index = state.transactions.findIndex(tx => tx.id === payload.id);
  if(index >= 0) state.transactions[index] = { ...state.transactions[index], ...payload };
  else state.transactions.push(payload);
  saveState();
  renderAll();
  $('#transactionFormDialog').close();
  openScreen('screen-fluxo');
});

$('#btnDuplicateInForm').addEventListener('click', () => {
  const form = $('#transactionForm');
  const els = form.elements;
  els['id'].value = '';
  els['descricao'].value = `${els['descricao'].value} (cópia)`;
  $('#transactionFormTitle').textContent = 'Duplicar lançamento';
});

$('#accountForm').addEventListener('submit', event => {
  event.preventDefault();
  const fd = new FormData(event.target);
  state.accounts.unshift({
    id: crypto.randomUUID(),
    nome: fd.get('nome'),
    saldo: Number(fd.get('saldo') || 0),
    status: fd.get('status'),
    icon: 'default'
  });
  event.target.reset();
  saveState();
  renderAll();
  $('#accountFormDialog').close();
});

$('#cardForm').addEventListener('submit', event => {
  event.preventDefault();
  const fd = new FormData(event.target);
  state.cards.unshift({
    id: crypto.randomUUID(),
    nome: fd.get('nome'),
    fatura: Number(fd.get('fatura') || 0),
    disponivel: Number(fd.get('disponivel') || 0),
    fecha: fd.get('fecha'),
    vence: fd.get('vence'),
    icon: 'default'
  });
  event.target.reset();
  saveState();
  renderAll();
  $('#cardFormDialog').close();
});

$('#categoryForm').addEventListener('submit', event => {
  event.preventDefault();
  const fd = new FormData(event.target);
  state.categories.push({ id: crypto.randomUUID(), nome: fd.get('nome'), tipo: fd.get('tipo'), icon: 'default' });
  event.target.reset();
  saveState();
  renderAll();
  $('#categoryFormDialog').close();
});

$('#filterForm').addEventListener('submit', event => {
  event.preventDefault();
  state.meta.filters = {
    tipos: $$('input[name="tipo"]:checked', event.target).map(i => i.value),
    status: $$('input[name="status"]:checked', event.target).map(i => i.value),
    accounts: $$('input[name="account"]:checked', event.target).map(i => i.value),
    categoria: $('select[name="categoria"]', event.target).value
  };
  saveState();
  renderFlow();
  $('#filterDialog').close();
});

$('#btnApplyPeriod').addEventListener('click', () => {
  const selected = $('input[name="periodOption"]:checked')?.value || 'month';
  const map = { today:'today', month:'month', year:'year', 7:'7', 15:'15', 30:'30', custom:'month' };
  state.meta.period = map[selected] || 'month';
  saveState();
  renderFlow();
  $('#periodDialog').close();
});

$('#btnToggleExpected').addEventListener('click', () => {
  $('#flowExpectedBar').classList.toggle('collapsed');
  $('#btnToggleExpected').textContent = $('#flowExpectedBar').classList.contains('collapsed') ? '⌃' : '⌄';
});


const closeTxDetailBtn = $('#btnCloseTransactionDetail');
if(closeTxDetailBtn){
  closeTxDetailBtn.addEventListener('click', () => $('#transactionDetailDialog').close());
}

// Fecha qualquer painel/modal ao clicar na área escura fora do card
$$('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if(event.target === dialog) dialog.close();
  });
});

// Detail dialog actions
$('#btnEditTransaction').addEventListener('click', () => {
  const tx = state.transactions.find(item => item.id === selectedTransactionId);
  fillTransactionForm(tx);
  $('#btnDuplicateInForm').classList.remove('hidden');
  $('#transactionDetailDialog').close();
  $('#transactionFormDialog').showModal();
});

$('#btnDeleteTransaction').addEventListener('click', () => {
  if(!selectedTransactionId) return;
  state.transactions = state.transactions.filter(tx => tx.id !== selectedTransactionId);
  saveState();
  renderAll();
  $('#transactionDetailDialog').close();
});

$('#btnDuplicateTransaction').addEventListener('click', () => {
  const tx = state.transactions.find(item => item.id === selectedTransactionId);
  if(!tx) return;
  const clone = { ...tx, id: crypto.randomUUID(), descricao: tx.descricao + ' (cópia)' };
  state.transactions.push(clone);
  saveState();
  renderAll();
  renderDetailDialog(clone);
});

$('#btnToggleTransactionStatus').addEventListener('click', () => {
  const tx = state.transactions.find(item => item.id === selectedTransactionId);
  if(!tx) return;
  tx.status = tx.status === 'Pago' ? 'Pendente' : 'Pago';
  saveState();
  renderAll();
  renderDetailDialog(tx);
});

// Report tabs and intro
$$('.tab-option').forEach(btn => btn.addEventListener('click', () => {
  state.meta.reportTab = btn.dataset.reportTab;
  saveState();
  renderReports();
}));

function closeReportIntro(){
  state.meta.seenReportIntro = true;
  saveState();
  $('#reportIntroDialog').close();
}
$('#btnReportSlidePrev').addEventListener('click', () => { reportsSlideIndex = Math.max(0, reportsSlideIndex - 1); renderReportIntro(); });
$('#btnReportSlideNext').addEventListener('click', () => { reportsSlideIndex = Math.min(3, reportsSlideIndex + 1); renderReportIntro(); });
$('#btnSkipReportIntro').addEventListener('click', closeReportIntro);
$('#btnCloseReportIntro').addEventListener('click', closeReportIntro);

// Category segmented control
$$('#categorySegmented .segment').forEach(btn => btn.addEventListener('click', () => {
  state.meta.currentCategoryType = btn.dataset.catType;
  saveState();
  renderCategories();
}));

// Extras
window.addEventListener('keydown', event => {
  if(event.key === 'Escape') return;
  if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e'){
    event.preventDefault();
    exportExcel();
  }
});



/* ===== Correção 3.1.4: alternância de tema ===== */
function applyThemePreference(){
  state.meta.theme = state.meta.theme || 'system';
  document.body.classList.remove('theme-light','theme-dark');

  let resolved = state.meta.theme;
  if(resolved === 'system'){
    resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.body.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light');

  const visualRows = $$('.toggle-card .toggle-row.radio').filter(row => {
    const text = row.textContent.trim();
    return text.includes('Usar do sistema') || text.includes('Modo escuro') || text.includes('Modo claro');
  });

  visualRows.forEach(row => {
    const text = row.textContent.trim();
    const isOn =
      (state.meta.theme === 'system' && text.includes('Usar do sistema')) ||
      (state.meta.theme === 'dark' && text.includes('Modo escuro')) ||
      (state.meta.theme === 'light' && text.includes('Modo claro'));
    row.classList.toggle('on', isOn);
  });
}

function bindThemeRows(){
  const visualRows = $$('.toggle-card .toggle-row.radio').filter(row => {
    const text = row.textContent.trim();
    return text.includes('Usar do sistema') || text.includes('Modo escuro') || text.includes('Modo claro');
  });

  visualRows.forEach(row => {
    row.addEventListener('click', () => {
      const text = row.textContent.trim();
      if(text.includes('Usar do sistema')) state.meta.theme = 'system';
      if(text.includes('Modo escuro')) state.meta.theme = 'dark';
      if(text.includes('Modo claro')) state.meta.theme = 'light';
      saveState();
      applyThemePreference();
      renderAll();
    });
  });

  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if((state.meta.theme || 'system') === 'system'){
        applyThemePreference();
      }
    });
  }
}


// Init
applyThemePreference();
bindThemeRows();
renderViewModeDialog();
renderAll();
openScreen('screen-home', false);
