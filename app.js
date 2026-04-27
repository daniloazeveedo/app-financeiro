const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const STORAGE_KEY = 'meuControleV31';
const mainScreens = ['screen-home','screen-fluxo','screen-reports','screen-categories','screen-profile','screen-news'];
const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const defaultState = {
  accounts: [
    { id: crypto.randomUUID(), nome:'Nubank', saldo:26.46, status:'ativa', icon:'nubank' },
    { id: crypto.randomUUID(), nome:'Cofrinho', saldo:0, status:'ativa', icon:'cofrinho' },
    { id: crypto.randomUUID(), nome:'Itaú', saldo:0, status:'arquivada', icon:'itau' },
    { id: crypto.randomUUID(), nome:'BB', saldo:0, status:'arquivada', icon:'bb' }
  ],
  cards: [
    { id: crypto.randomUUID(), nome:'Nubank', fatura:0, faturaAtual:0, disponivel:400, fecha:3, vence:10, icon:'nubank', final:'1234', bandeira:'VISA' }
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
    theme:'system',
    showMarketTicker:true,
    marketAutoRefresh:true,
    favoriteAssets:['IBOV','USD-BRL','EUR-BRL','BTC-BRL','PETR4'],
    marketLastUpdated:null,
    profile:{
      name:'Danilo & Isabella',
      subtitle:'Seu controle financeiro estilo Organizze',
      avatarText:'D&I',
      avatarImage:''
    },
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
  merged.meta.profile = { ...defaultState.meta.profile, ...((saved.meta && saved.meta.profile) || {}) };
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
  $$('.desktop-links button').forEach(btn => btn.classList.toggle('active-nav', btn.dataset.openScreen === activeId));
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

function initialsFromName(name){
  const cleaned = String(name || '').trim();
  if(!cleaned) return 'MC';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if(parts.length === 1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getProfile(){
  const profile = state.meta.profile || {};
  const name = profile.name || 'Danilo & Isabella';
  return {
    name,
    subtitle: profile.subtitle || 'Seu controle financeiro estilo Organizze',
    avatarText: profile.avatarText || initialsFromName(name),
    avatarImage: profile.avatarImage || ''
  };
}

function inferBankIcon(name){
  const value = String(name || '').toLowerCase();
  if(value.includes('nubank') || value.includes('nuconta')) return 'nubank';
  if(value.includes('itaú') || value.includes('itau')) return 'itau';
  if(value.includes('santander')) return 'santander';
  if(value.includes('caixa')) return 'caixa';
  if(value.includes('inter')) return 'inter';
  if(value.includes('brasil') || value === 'bb' || value.includes('banco do brasil')) return 'bb';
  if(value.includes('cofrinho')) return 'cofrinho';
  return 'default';
}

function bankLogoMarkup(icon, name, extraClass = ''){
  const normalized = icon || inferBankIcon(name);
  const valid = ['nubank','cofrinho','itau','bb','santander','caixa','inter','default'].includes(normalized) ? normalized : 'default';
  return `<div class="logo-badge brand-${valid} ${extraClass}" aria-label="${name}"><img src="assets/banks/${valid}.svg" alt="${name}" loading="lazy"></div>`;
}

function renderAvatar(el, profile){
  if(!el) return;
  if(profile.avatarImage){
    el.innerHTML = `<img src="${profile.avatarImage}" alt="Foto do perfil" class="avatar-inner-img">`;
    el.classList.add('has-image');
  } else {
    el.textContent = profile.avatarText;
    el.classList.remove('has-image');
  }
}

function renderProfileUI(){
  const profile = getProfile();
  if($('#homeProfileName')) $('#homeProfileName').textContent = profile.name;
  if($('#homeProfileSubtitle')) $('#homeProfileSubtitle').textContent = profile.subtitle;
  if($('#profileName')) $('#profileName').textContent = profile.name;
  if($('#profileSubtitle')) $('#profileSubtitle').textContent = profile.subtitle;
  renderAvatar($('#homeAvatar'), profile);
  renderAvatar($('#profileAvatar'), profile);

  const desktopText = $('#desktopAvatarText');
  const desktopImage = $('#desktopAvatarImage');
  if(desktopText && desktopImage){
    if(profile.avatarImage){
      desktopImage.src = profile.avatarImage;
      desktopImage.classList.remove('hidden');
      desktopText.classList.add('hidden');
    } else {
      desktopText.textContent = profile.avatarText;
      desktopText.classList.remove('hidden');
      desktopImage.classList.add('hidden');
      desktopImage.removeAttribute('src');
    }
  }
}

let profilePhotoDraft = null;

function fillProfileForm(){
  const profile = getProfile();
  profilePhotoDraft = profile.avatarImage || '';
  if($('#profileNameInput')) $('#profileNameInput').value = profile.name;
  if($('#profileSubtitleInput')) $('#profileSubtitleInput').value = profile.subtitle;
  renderAvatar($('#profilePreviewAvatar'), { avatarImage: profilePhotoDraft, avatarText: profile.avatarText });
}

function renderHome(){
  const monthItems = getMonthTransactions(state.meta.currentMonth, 'month');
  const income = monthItems.filter(tx => tx.tipo === 'Receita').reduce((a,b)=>a + Number(b.valor || 0), 0);
  const expense = monthItems.filter(tx => tx.tipo === 'Despesa').reduce((a,b)=>a + Number(b.valor || 0), 0);
  const balance = computeHomeBalance();
  const cardsTotal = state.cards.reduce((sum, card) => sum + Number((card.faturaAtual ?? card.fatura) || 0), 0);
  const currentMonthLabel = getMonthNameByString(state.meta.currentMonth);
  const profile = getProfile();
  const hideLabel = state.meta.hideBalance ? 'Mostrar' : 'Ocultar';

  const setText = (selector, text) => { const el = $(selector); if(el) el.textContent = text; };

  // Mobile/original layout
  setText('#homeTotalBalance', maybeHidden(balance));
  setText('#homeIncome', maybeHidden(income));
  setText('#homeExpense', maybeHidden(expense));
  setText('#homeForecast', maybeHidden(income - expense));
  setText('#btnToggleHideBalance', hideLabel);

  const mobileAccounts = $('#homeAccountsList');
  if(mobileAccounts){
    mobileAccounts.innerHTML = activeAccounts().map(account => `
      <div class="account-row">
        <div class="row-left">
          ${bankLogoMarkup(account.icon || inferBankIcon(account.nome), account.nome)}
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
  }

  const mobileCards = $('#homeCardsList');
  if(mobileCards){
    mobileCards.innerHTML = state.cards.map(card => `
      <div class="card-row">
        <div class="row-left">
          ${bankLogoMarkup(card.icon || inferBankIcon(card.nome), card.nome)}
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

  // Desktop 3.2.1 dashboard
  if($('#desktopHelloName')){
    $('#desktopHelloName').textContent = profile.name;
    $('#desktopMonthlyIncome').textContent = maybeHidden(income);
    $('#desktopMonthlyExpense').textContent = maybeHidden(expense);
    $('#desktopBalanceValue').textContent = maybeHidden(balance);
    $('#desktopCardsHeaderLabel').textContent = `Faturas de ${currentMonthLabel}`;
    $('#desktopCardsTotal').textContent = maybeHidden(cardsTotal);

    const connections = [
      ...activeAccounts().slice(0, 2).map(account => ({ nome: account.nome, icon: account.icon || inferBankIcon(account.nome), plus: false })),
      { plus: true }
    ];
    $('#desktopConnections').innerHTML = connections.map(item => item.plus
      ? `<button class="connection321-add" data-open-screen="screen-accounts"><span>＋</span><small>Adicionar<br>conexão</small></button>`
      : `<div class="connection321-item">${bankLogoMarkup(item.icon, item.nome, 'connection321-logo')}<small>${item.nome}</small></div>`
    ).join('');

    $('#desktopAccountsList').innerHTML = activeAccounts().map(account => `
      <button class="account321-row" data-open-screen="screen-accounts">
        <div class="account321-left">
          ${bankLogoMarkup(account.icon || inferBankIcon(account.nome), account.nome, 'account321-logo')}
          <div>
            <strong>${account.nome}</strong>
            <span>${account.nome === 'Cofrinho' ? 'Conta poupança' : 'Conta corrente'}</span>
          </div>
        </div>
        <div class="account321-right">
          <strong>${maybeHidden(account.saldo)}</strong>
          <span>›</span>
        </div>
      </button>
    `).join('');

    $('#desktopCardsList').innerHTML = state.cards.map((card, index) => {
      const invoice = Number((card.faturaAtual ?? card.fatura) || 0);
      const final = card.final || (index === 0 ? '1234' : '9876');
      const cardName = card.nome === 'Nubank' ? 'Nubank Visa Platinum' : card.nome;
      return `
        <div class="card321-item">
          <div class="card321-top">
            <div class="credit321-thumb credit321-${inferBankIcon(card.nome)}">
              ${bankLogoMarkup(card.icon || inferBankIcon(card.nome), card.nome, 'credit321-logo')}
              <span>•••• ${final}</span>
              <b>${card.bandeira || 'VISA'}</b>
            </div>
            <div class="card321-info">
              <strong>${cardName}</strong>
              <span>Final ${final}</span>
            </div>
            <button class="invoice321-btn" data-open-screen="screen-cards">Ver fatura</button>
          </div>
          <div class="card321-summary">
            <div>
              <span>Limite Disponível</span>
              <strong>${maybeHidden(card.disponivel)}</strong>
            </div>
            <div>
              <span>Fatura atual</span>
              <strong class="${invoice > 0 ? 'negative' : ''}">${maybeHidden(invoice)}</strong>
            </div>
          </div>
        </div>`;
    }).join('');

    $$('#screen-home [data-open-screen]').forEach(btn => btn.onclick = () => openScreen(btn.dataset.openScreen));
  }
}

function renderAccountsScreens(){
  $('#accountsScreenList').innerHTML = activeAccounts().map(account => `
    <div class="card-box">
      <div class="row-left">
        ${bankLogoMarkup(account.icon || inferBankIcon(account.nome), account.nome)}
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
        ${bankLogoMarkup(account.icon || inferBankIcon(account.nome), account.nome)}
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
        ${bankLogoMarkup(card.icon || inferBankIcon(card.nome), card.nome)}
        <div class="card-box-body">
          <div class="row-title">${card.nome}</div>
          <div class="row-sub">Fecha dia ${card.fecha} - Vence dia ${card.vence}</div>
          <hr>
          <div class="card-box-meta">
            <div class="col"><span>Fatura atual</span><strong>${maybeHidden(card.faturaAtual ?? card.fatura)}</strong></div>
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



const marketAssetsCatalog = [
  { id:'IBOV', symbol:'IBOV', name:'Ibovespa', type:'index', source:'brapi', query:'^BVSP', currency:'BRL' },
  { id:'USD-BRL', symbol:'DÓLAR', name:'Dólar comercial', type:'currency', source:'awesome', query:'USD-BRL', currency:'BRL' },
  { id:'EUR-BRL', symbol:'EURO', name:'Euro comercial', type:'currency', source:'awesome', query:'EUR-BRL', currency:'BRL' },
  { id:'BTC-BRL', symbol:'BTC', name:'Bitcoin', type:'crypto', source:'awesome', query:'BTC-BRL', currency:'BRL' },
  { id:'PETR4', symbol:'PETR4', name:'Petrobras PN', type:'stock', source:'brapi', query:'PETR4', currency:'BRL' },
  { id:'VALE3', symbol:'VALE3', name:'Vale ON', type:'stock', source:'brapi', query:'VALE3', currency:'BRL' },
  { id:'ITUB4', symbol:'ITUB4', name:'Itaú PN', type:'stock', source:'brapi', query:'ITUB4', currency:'BRL' },
  { id:'SP500', symbol:'S&P 500', name:'S&P 500', type:'index', source:'stooq', query:'^spx', currency:'USD' },
  { id:'NASDAQ', symbol:'NASDAQ', name:'Nasdaq Composite', type:'index', source:'stooq', query:'^ndq', currency:'USD' }
];

const marketFallbackMap = {
  'IBOV': { symbol:'IBOV', name:'Ibovespa', price:'134.000', change:'+0,46%', rawChange:0.46, currency:'BRL', source:'fallback' },
  'USD-BRL': { symbol:'DÓLAR', name:'Dólar comercial', price:'5,42', change:'+0,82%', rawChange:0.82, currency:'BRL', source:'fallback' },
  'EUR-BRL': { symbol:'EURO', name:'Euro comercial', price:'5,85', change:'+0,41%', rawChange:0.41, currency:'BRL', source:'fallback' },
  'BTC-BRL': { symbol:'BTC', name:'Bitcoin', price:'382.091', change:'-2,23%', rawChange:-2.23, currency:'BRL', source:'fallback' },
  'PETR4': { symbol:'PETR4', name:'Petrobras PN', price:'38,42', change:'+1,15%', rawChange:1.15, currency:'BRL', source:'fallback' },
  'VALE3': { symbol:'VALE3', name:'Vale ON', price:'61,80', change:'-0,38%', rawChange:-0.38, currency:'BRL', source:'fallback' },
  'ITUB4': { symbol:'ITUB4', name:'Itaú PN', price:'33,25', change:'+0,26%', rawChange:0.26, currency:'BRL', source:'fallback' },
  'SP500': { symbol:'S&P 500', name:'S&P 500', price:'5.420', change:'+0,52%', rawChange:0.52, currency:'USD', source:'fallback' },
  'NASDAQ': { symbol:'NASDAQ', name:'Nasdaq Composite', price:'17.890', change:'+0,77%', rawChange:0.77, currency:'USD', source:'fallback' }
};


const fallbackMarketData = [
  { symbol:'USD/BRL', price:'5,61', change:'+0,24%' },
  { symbol:'EUR/BRL', price:'6,02', change:'-0,11%' },
  { symbol:'BTC/BRL', price:'520.000', change:'+1,18%' },
  { symbol:'Ibovespa', price:'134.000', change:'+0,46%' }
];

const marketNews = [
  { title:'Dólar, euro e bitcoin no radar do dia', desc:'Acompanhe as principais variações para planejar melhor seus gastos e investimentos.', tag:'Cotações', icon:'↗' },
  { title:'Mercado financeiro: juros, inflação e renda variável', desc:'Resumo rápido para entender o que pode afetar seu orçamento no mês.', tag:'Mercado', icon:'◷' },
  { title:'Organização financeira pessoal', desc:'Veja alertas de contas, cartões e projeção de saldo antes de assumir novos gastos.', tag:'Finanças', icon:'✓' }
];

function tickerClass(change){
  const text = String(change || '');
  if(text.startsWith('+')) return 'ticker-up';
  if(text.startsWith('-')) return 'ticker-down';
  return 'ticker-flat';
}


function formatNumberBR(value, currency = 'BRL'){
  const num = Number(value);
  if(!Number.isFinite(num)) return '--';
  if(currency === 'USD'){
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizePercent(value){
  const num = Number(value);
  if(!Number.isFinite(num)) return '0,00%';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function favoriteAssetIds(){
  const ids = state.meta.favoriteAssets;
  return Array.isArray(ids) && ids.length ? ids : ['IBOV','USD-BRL','EUR-BRL','BTC-BRL','PETR4'];
}

function getAssetById(id){
  return marketAssetsCatalog.find(asset => asset.id === id) || marketAssetsCatalog[0];
}

function currencyPrefix(asset){
  if(asset.currency === 'USD') return 'US$';
  if(asset.currency === 'BRL') return 'R$';
  return '';
}

function fallbackForAsset(id){
  const asset = getAssetById(id);
  const fallback = marketFallbackMap[id] || marketFallbackMap[asset.id] || marketFallbackMap.IBOV;
  return { ...fallback, id: asset.id, type: asset.type, currency: asset.currency };
}

async function fetchAwesomeAssets(assets){
  if(!assets.length) return {};
  const pairs = assets.map(a => a.query).join(',');
  const response = await fetch(`https://economia.awesomeapi.com.br/last/${pairs}`);
  if(!response.ok) throw new Error('AwesomeAPI indisponível');
  const json = await response.json();
  const result = {};
  assets.forEach(asset => {
    const key = asset.query.replace('-', '');
    const item = json[key];
    if(item){
      const rawChange = Number(item.pctChange || 0);
      result[asset.id] = {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        price: formatNumberBR(item.bid, asset.currency),
        change: normalizePercent(rawChange),
        rawChange,
        currency: asset.currency,
        source: 'awesome'
      };
    }
  });
  return result;
}

async function fetchBrapiAssets(assets){
  if(!assets.length) return {};
  const result = {};
  await Promise.all(assets.map(async asset => {
    try{
      const response = await fetch(`https://brapi.dev/api/quote/${encodeURIComponent(asset.query)}?range=1d&interval=1d`);
      if(!response.ok) throw new Error('Brapi indisponível');
      const json = await response.json();
      const item = json.results?.[0];
      if(item){
        const rawChange = Number(item.regularMarketChangePercent || 0);
        result[asset.id] = {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          price: formatNumberBR(item.regularMarketPrice, asset.currency),
          change: normalizePercent(rawChange),
          rawChange,
          currency: asset.currency,
          source: 'brapi'
        };
      }
    }catch(error){
      result[asset.id] = fallbackForAsset(asset.id);
    }
  }));
  return result;
}

async function fetchStooqAssets(assets){
  if(!assets.length) return {};
  const result = {};
  await Promise.all(assets.map(async asset => {
    try{
      const url = `https://stooq.com/q/l/?s=${encodeURIComponent(asset.query)}&f=sd2t2ohlcv&h&e=csv`;
      const response = await fetch(url);
      if(!response.ok) throw new Error('Stooq indisponível');
      const text = await response.text();
      const lines = text.trim().split(/\r?\n/);
      if(lines.length < 2) throw new Error('Sem dados');
      const cols = lines[1].split(',');
      const close = Number(cols[6]);
      const open = Number(cols[3]);
      const rawChange = open && close ? ((close - open) / open) * 100 : 0;
      result[asset.id] = {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        price: formatNumberBR(close, asset.currency),
        change: normalizePercent(rawChange),
        rawChange,
        currency: asset.currency,
        source: 'stooq'
      };
    }catch(error){
      result[asset.id] = fallbackForAsset(asset.id);
    }
  }));
  return result;
}

async function loadMarketData(){
  const ids = favoriteAssetIds();
  const selectedAssets = ids.map(getAssetById);
  const groups = {
    awesome: selectedAssets.filter(asset => asset.source === 'awesome'),
    brapi: selectedAssets.filter(asset => asset.source === 'brapi'),
    stooq: selectedAssets.filter(asset => asset.source === 'stooq')
  };

  const results = {};
  try{ Object.assign(results, await fetchAwesomeAssets(groups.awesome)); }catch(error){
    groups.awesome.forEach(asset => results[asset.id] = fallbackForAsset(asset.id));
  }
  try{ Object.assign(results, await fetchBrapiAssets(groups.brapi)); }catch(error){
    groups.brapi.forEach(asset => results[asset.id] = fallbackForAsset(asset.id));
  }
  try{ Object.assign(results, await fetchStooqAssets(groups.stooq)); }catch(error){
    groups.stooq.forEach(asset => results[asset.id] = fallbackForAsset(asset.id));
  }

  state.meta.marketLastUpdated = new Date().toISOString();
  saveState();

  return ids.map(id => results[id] || fallbackForAsset(id));
}

function tickerClass(change){
  const text = String(change || '');
  return text.includes('-') ? 'negative' : 'positive';
}

function timeAgoLabel(iso){
  if(!iso) return 'Atualizando agora';
  const diffMs = Date.now() - new Date(iso).getTime();
  if(!Number.isFinite(diffMs) || diffMs < 45000) return 'Atualizado agora';
  const min = Math.floor(diffMs / 60000);
  if(min < 60) return `Atualizado há ${min} min`;
  const hours = Math.floor(min / 60);
  return `Atualizado há ${hours} h`;
}

function renderTickerMeta(){
  const meta = $('#tickerMeta');
  if(meta) meta.innerHTML = `<span>${timeAgoLabel(state.meta.marketLastUpdated)}</span><i></i>`;
}


let lastMarketData = null;

function getFallbackMarketData(){
  return favoriteAssetIds().map(fallbackForAsset);
}

function paintMarket(data){
  lastMarketData = data && data.length ? data : getFallbackMarketData();

  if($('#tickerTrack')){
    $('#tickerTrack').innerHTML = lastMarketData.map(item => `<span class="ticker-item"><strong>${item.symbol}</strong><span>${currencyPrefix(item)} ${item.price}</span><span class="${tickerClass(item.change)}">${item.change}</span></span>`).join('');
  }
  renderTickerMeta();

  if($('#marketCards')){
    $('#marketCards').innerHTML = lastMarketData.map(item => `
      <div class="market-card favorite-card">
        <div class="asset-card-head">
          <span>${item.symbol}</span>
          <button class="remove-favorite" data-remove-asset="${item.id}" title="Remover dos favoritos">×</button>
        </div>
        <strong>${currencyPrefix(item)} ${item.price}</strong>
        <small class="${tickerClass(item.change)}">${item.change}</small>
        <em>${item.name}</em>
      </div>`).join('');

    $$('[data-remove-asset]').forEach(btn => btn.addEventListener('click', () => {
      state.meta.favoriteAssets = favoriteAssetIds().filter(id => id !== btn.dataset.removeAsset);
      if(!state.meta.favoriteAssets.length) state.meta.favoriteAssets = ['USD-BRL'];
      saveState();
      paintMarket(getFallbackMarketData());
      renderAssetOptions();
      refreshMarket(true);
    }));
  }

  if($('#newsList')){
    $('#newsList').innerHTML = marketNews.map(item => `<article class="news-item"><div class="news-icon">${item.icon}</div><div><h3>${item.title}</h3><p>${item.desc}</p></div><span class="news-tag">${item.tag}</span></article>`).join('');
  }
}

async function refreshMarket(forceRemote = false){
  const fallback = getFallbackMarketData();
  if(!lastMarketData || forceRemote){
    paintMarket(fallback);
  }

  try{
    const remote = await loadMarketData();
    paintMarket(remote);
  }catch(error){
    paintMarket(fallback);
  }
}

async function renderMarket(){
  const show = state.meta.showMarketTicker !== false;
  const ticker = $('#marketTicker');
  if(ticker) ticker.classList.toggle('hidden', !show);
  const switchEl = $('#marketTickerSwitch');
  if(switchEl) switchEl.classList.toggle('on', show);
  const autoEl = $('#marketAutoRefreshSwitch');
  if(autoEl) autoEl.classList.toggle('on', state.meta.marketAutoRefresh !== false);

  paintMarket(getFallbackMarketData());
  refreshMarket();
}

function renderAssetOptions(){
  const list = $('#assetOptions');
  if(!list) return;
  const term = ($('#assetSearchInput')?.value || '').toLowerCase().trim();
  const selected = new Set(favoriteAssetIds());
  const filtered = marketAssetsCatalog.filter(asset => {
    const haystack = `${asset.symbol} ${asset.name} ${asset.type}`.toLowerCase();
    return !term || haystack.includes(term);
  });

  list.innerHTML = filtered.map(asset => `
    <label class="asset-option">
      <input type="checkbox" value="${asset.id}" ${selected.has(asset.id) ? 'checked' : ''}>
      <div>
        <strong>${asset.symbol}</strong>
        <span>${asset.name}</span>
      </div>
      <small>${asset.type}</small>
    </label>`).join('');
}

function capitalize(text){ return text.charAt(0).toUpperCase() + text.slice(1); }

function renderAll(){
  applyThemePreference();
  renderProfileUI();
  renderHome();
  renderAccountsScreens();
  renderCardsScreens();
  renderCategories();
  renderFlow();
  renderReports();
  populateFilterOptions();
  renderReportIntro();
  renderMarket();
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
if ($('#btnDesktopToggleHideBalance')) $('#btnDesktopToggleHideBalance').addEventListener('click', toggleHide);
if ($('#btnDesktopToggleHideBalanceAlt')) $('#btnDesktopToggleHideBalanceAlt').addEventListener('click', toggleHide);
if ($('#marketTickerSwitch')) $('#marketTickerSwitch').addEventListener('click', () => { state.meta.showMarketTicker = state.meta.showMarketTicker === false; saveState(); renderMarket(); });
if ($('#btnRefreshMarket')) $('#btnRefreshMarket').addEventListener('click', renderMarket);
if ($('#btnOpenNewsSearch')) $('#btnOpenNewsSearch').addEventListener('click', () => window.open('https://news.google.com/search?q=mercado%20financeiro%20Brasil', '_blank'));
setInterval(renderMarket, 60000);
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
    icon: inferBankIcon(fd.get('nome'))
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
    icon: inferBankIcon(fd.get('nome')),
    faturaAtual: Number(fd.get('fatura') || 0)
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




// Perfil
if($('#btnOpenEditProfile')){
  $('#btnOpenEditProfile').addEventListener('click', () => {
    fillProfileForm();
    $('#profileFormDialog').showModal();
  });
}
if($('#desktopAvatarButton')){
  $('#desktopAvatarButton').addEventListener('click', () => openScreen('screen-profile'));
}
if($('#profilePhotoInput')){
  $('#profilePhotoInput').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      profilePhotoDraft = reader.result;
      const profile = getProfile();
      renderAvatar($('#profilePreviewAvatar'), { avatarImage: profilePhotoDraft, avatarText: profile.avatarText });
    };
    reader.readAsDataURL(file);
  });
}
if($('#btnRemoveProfilePhoto')){
  $('#btnRemoveProfilePhoto').addEventListener('click', () => {
    profilePhotoDraft = '';
    const draftName = $('#profileNameInput')?.value || getProfile().name;
    renderAvatar($('#profilePreviewAvatar'), { avatarImage: '', avatarText: initialsFromName(draftName) });
    if($('#profilePhotoInput')) $('#profilePhotoInput').value = '';
  });
}
if($('#profileNameInput')){
  $('#profileNameInput').addEventListener('input', event => {
    if(profilePhotoDraft) return;
    renderAvatar($('#profilePreviewAvatar'), { avatarImage: '', avatarText: initialsFromName(event.target.value) });
  });
}
if($('#profileForm')){
  $('#profileForm').addEventListener('submit', event => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const name = String(fd.get('nome') || '').trim() || 'Danilo & Isabella';
    state.meta.profile = {
      name,
      subtitle: String(fd.get('subtitle') || '').trim() || 'Seu controle financeiro estilo Organizze',
      avatarText: initialsFromName(name),
      avatarImage: profilePhotoDraft || ''
    };
    saveState();
    renderAll();
    $('#profileFormDialog').close();
  });
}

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
