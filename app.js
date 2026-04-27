import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const brl = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today = new Date().toISOString().slice(0,10);
const monthNow = new Date().toISOString().slice(0,7);

let state = JSON.parse(localStorage.getItem('finappV2') || 'null') || {
  lancamentos:[
    {id:crypto.randomUUID(),data:today,tipo:'Receita',descricao:'Salário',valor:2500,categoria:'Salário',conta:'Nubank',status:'Pago'},
    {id:crypto.randomUUID(),data:today,tipo:'Despesa',descricao:'Mercado',valor:180,categoria:'Alimentação',conta:'Nubank',status:'Pago'}
  ],
  contas:[{id:crypto.randomUUID(),nome:'Nubank',saldoInicial:0},{id:crypto.randomUUID(),nome:'Dinheiro',saldoInicial:0}],
  cartoes:[{id:crypto.randomUUID(),nome:'Cartão Nubank',limite:1200,fechamento:5,vencimento:10}],
  limites:[{id:crypto.randomUUID(),categoria:'Alimentação',valor:700},{id:crypto.randomUUID(),categoria:'Transporte',valor:400}]
};
let user=null, db=null, auth=null, unsub=null, useCloud=false, saving=false, catChart=null, barChart=null;

function hasFirebaseConfig(){return firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes('COLE_AQUI')}
function saveLocal(){localStorage.setItem('finappV2',JSON.stringify(state))}
async function saveCloud(){if(!useCloud||!user||saving)return; saving=true; await setDoc(doc(db,'users',user.uid),{...state,updatedAt:serverTimestamp()},{merge:true}); saving=false}
async function persist(){saveLocal(); await saveCloud(); renderAll()}

async function initFirebase(){
  if(!hasFirebaseConfig()) return false;
  const app = initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app);
  onAuthStateChanged(auth, async u=>{
    if(u){user=u; useCloud=true; $('#syncBadge').textContent='Nuvem ativa'; showApp(); const ref=doc(db,'users',u.uid); const snap=await getDoc(ref); if(snap.exists()){const data=snap.data(); state={lancamentos:data.lancamentos||[],contas:data.contas||[],cartoes:data.cartoes||[],limites:data.limites||[]}; saveLocal()} else {await saveCloud()} if(unsub)unsub(); unsub=onSnapshot(ref, s=>{if(!s.exists()||saving)return; const d=s.data(); state={lancamentos:d.lancamentos||[],contas:d.contas||[],cartoes:d.cartoes||[],limites:d.limites||[]}; saveLocal(); renderAll()}); renderAll()} else {user=null; useCloud=false; showAuth()}
  });
  return true;
}
function showAuth(){ $('#authScreen').classList.remove('hidden'); $('#app').classList.add('hidden') }
function showApp(){ $('#authScreen').classList.add('hidden'); $('#app').classList.remove('hidden') }

function filtered(){const m=$('#monthFilter').value||monthNow; return state.lancamentos.filter(x=>String(x.data).startsWith(m))}
function despesas(){return filtered().filter(x=>x.tipo==='Despesa')}
function receitas(){return filtered().filter(x=>x.tipo==='Receita')}
function sum(arr){return arr.reduce((a,b)=>a+(Number(b.valor)||0),0)}
function groupBy(arr,key){return arr.reduce((a,b)=>{a[b[key]]= (a[b[key]]||0)+(Number(b.valor)||0); return a},{})}

function renderDashboard(){
  const rec=sum(receitas()), desp=sum(despesas()), saldo=(state.contas.reduce((a,c)=>a+(Number(c.saldoInicial)||0),0)+rec-desp), prev=sum(filtered().filter(x=>x.status==='Pendente'));
  $('#kpiSaldo').textContent=brl(saldo); $('#kpiReceitas').textContent=brl(rec); $('#kpiDespesas').textContent=brl(desp); $('#kpiPrevisto').textContent=brl(prev);
  const cat=groupBy(despesas(),'categoria'); updatePie(cat); updateBar(rec,desp);
  const next=state.lancamentos.filter(x=>x.status==='Pendente').sort((a,b)=>a.data.localeCompare(b.data)).slice(0,6);
  $('#dueList').innerHTML=next.length?next.map(x=>`<div class="item"><div><strong>${x.descricao}</strong><br><small>${x.data} • ${x.categoria}</small></div><strong>${brl(x.valor)}</strong></div>`).join(''):'<p>Nenhum vencimento pendente.</p>';
}
function updatePie(data){const labels=Object.keys(data), values=Object.values(data); if(catChart)catChart.destroy(); catChart=new Chart($('#catChart'),{type:'doughnut',data:{labels,datasets:[{data:values}]},options:{plugins:{legend:{position:'bottom'}}}})}
function updateBar(rec,desp){if(barChart)barChart.destroy(); barChart=new Chart($('#barChart'),{type:'bar',data:{labels:['Mês selecionado'],datasets:[{label:'Receitas',data:[rec]},{label:'Despesas',data:[desp]}]},options:{plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}})}

function renderLancamentos(){
  const rows=state.lancamentos.slice().sort((a,b)=>b.data.localeCompare(a.data));
  $('#tblLancamentos').innerHTML='<tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Status</th><th>Valor</th><th></th></tr>'+rows.map(x=>`<tr><td>${x.data}</td><td>${x.tipo}</td><td>${x.descricao}</td><td>${x.categoria}</td><td>${x.conta}</td><td>${x.status}</td><td>${brl(x.valor)}</td><td><button class="danger" data-del="${x.id}">Excluir</button></td></tr>`).join('');
  $$('[data-del]').forEach(b=>b.onclick=async()=>{state.lancamentos=state.lancamentos.filter(x=>x.id!==b.dataset.del); await persist()});
}
function renderLists(){
  $('#contasList').innerHTML=state.contas.map(c=>`<div class="item"><div><strong>${c.nome}</strong><br><small>Saldo inicial: ${brl(c.saldoInicial)}</small></div><button class="danger" data-conta="${c.id}">Excluir</button></div>`).join('')||'<p>Nenhuma conta cadastrada.</p>';
  $('#cartoesList').innerHTML=state.cartoes.map(c=>`<div class="item"><div><strong>${c.nome}</strong><br><small>Limite: ${brl(c.limite)} • Fecha dia ${c.fechamento||'-'} • Vence dia ${c.vencimento||'-'}</small></div><button class="danger" data-cartao="${c.id}">Excluir</button></div>`).join('')||'<p>Nenhum cartão cadastrado.</p>';
  const gastos=groupBy(despesas(),'categoria');
  $('#limitesList').innerHTML=state.limites.map(l=>`<div class="item"><div><strong>${l.categoria}</strong><br><small>Gasto: ${brl(gastos[l.categoria]||0)} de ${brl(l.valor)}</small></div><button class="danger" data-limite="${l.id}">Excluir</button></div>`).join('')||'<p>Nenhum limite cadastrado.</p>';
  $$('[data-conta]').forEach(b=>b.onclick=async()=>{state.contas=state.contas.filter(x=>x.id!==b.dataset.conta); await persist()});
  $$('[data-cartao]').forEach(b=>b.onclick=async()=>{state.cartoes=state.cartoes.filter(x=>x.id!==b.dataset.cartao); await persist()});
  $$('[data-limite]').forEach(b=>b.onclick=async()=>{state.limites=state.limites.filter(x=>x.id!==b.dataset.limite); await persist()});
  const cats=[...new Set([...state.lancamentos.map(x=>x.categoria),...state.limites.map(x=>x.categoria)])];
  $('#categoriasList').innerHTML=cats.map(c=>`<option value="${c}">`).join('');
}
function renderReports(){
  const cat=groupBy(despesas(),'categoria'), contas=groupBy(filtered(),'conta');
  $('#reportCategorias').innerHTML=Object.entries(cat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="item"><span>${k}</span><strong>${brl(v)}</strong></div>`).join('')||'<p>Sem despesas no mês.</p>';
  $('#reportContas').innerHTML=Object.entries(contas).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="item"><span>${k}</span><strong>${brl(v)}</strong></div>`).join('')||'<p>Sem lançamentos no mês.</p>';
}
function renderAll(){renderDashboard(); renderLancamentos(); renderLists(); renderReports()}

function addForm(id, collection, map){$(id).addEventListener('submit',async e=>{e.preventDefault(); const fd=Object.fromEntries(new FormData(e.target).entries()); state[collection].push({id:crypto.randomUUID(),...map(fd)}); e.target.reset(); await persist()})}
addForm('#formLancamento','lancamentos',f=>({...f,valor:Number(f.valor||0)}));
addForm('#formConta','contas',f=>({nome:f.nome,saldoInicial:Number(f.saldoInicial||0)}));
addForm('#formCartao','cartoes',f=>({nome:f.nome,limite:Number(f.limite||0),fechamento:f.fechamento,vencimento:f.vencimento}));
addForm('#formLimite','limites',f=>({categoria:f.categoria,valor:Number(f.valor||0)}));

$$('.nav').forEach(b=>b.onclick=()=>{$$('.nav').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $$('.page').forEach(p=>p.classList.remove('active-page')); $('#'+b.dataset.page).classList.add('active-page'); $('#pageTitle').textContent=b.textContent; $('#pageSub').textContent=b.dataset.page==='dashboard'?'Visão geral das suas finanças.':'Gerencie seus dados financeiros.'; renderAll()});
$('#monthFilter').value=monthNow; $('#monthFilter').onchange=renderAll;
$('#btnLocal').onclick=()=>{useCloud=false; $('#syncBadge').textContent='Local'; showApp(); renderAll()};
$('#btnLogin').onclick=async()=>{try{if(!auth) throw new Error('Configure o Firebase primeiro em firebase-config.js'); await signInWithEmailAndPassword(auth,$('#email').value,$('#password').value)}catch(e){$('#authMsg').textContent=e.message}};
$('#btnRegister').onclick=async()=>{try{if(!auth) throw new Error('Configure o Firebase primeiro em firebase-config.js'); await createUserWithEmailAndPassword(auth,$('#email').value,$('#password').value)}catch(e){$('#authMsg').textContent=e.message}};
$('#btnLogout').onclick=async()=>{if(auth&&user) await signOut(auth); else showAuth()};

function exportExcel(){
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.lancamentos),'Lancamentos');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.contas),'Contas');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.cartoes),'Cartoes');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(state.limites),'Limites');
  XLSX.writeFile(wb,'meu_controle_financeiro.xlsx');
}
$('#btnExportExcel').onclick=exportExcel;
$('#btnBackup').onclick=()=>{const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})); a.download='backup-financeiro.json'; a.click()};
$('#importJson').onchange=e=>{const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=async()=>{state=JSON.parse(r.result); await persist()}; r.readAsText(f)};
$('#importExcel').onchange=e=>{const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=async(ev)=>{const wb=XLSX.read(ev.target.result,{type:'array'}); const sheet=n=>XLSX.utils.sheet_to_json(wb.Sheets[n]||{}); state={lancamentos:sheet('Lancamentos').map(x=>({id:x.id||crypto.randomUUID(),...x,valor:Number(x.valor||0)})),contas:sheet('Contas').map(x=>({id:x.id||crypto.randomUUID(),...x,saldoInicial:Number(x.saldoInicial||0)})),cartoes:sheet('Cartoes').map(x=>({id:x.id||crypto.randomUUID(),...x,limite:Number(x.limite||0)})),limites:sheet('Limites').map(x=>({id:x.id||crypto.randomUUID(),...x,valor:Number(x.valor||0)}))}; await persist()}; r.readAsArrayBuffer(f)};
$('#btnClear').onclick=async()=>{if(confirm('Limpar todos os dados deste navegador?')){localStorage.removeItem('finappV2'); location.reload()}};

initFirebase().then(ok=>{if(!ok) $('#authMsg').textContent='Firebase ainda não configurado. Você pode usar o modo offline.'; renderAll()});
