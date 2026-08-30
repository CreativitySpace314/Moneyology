// Moneyology pay-period layer
(function(){
  if(!Array.isArray(state.payPeriods)) state.payPeriods=[];
  state.settings={paycheckDate:'',nextPaycheckDate:'',activePayPeriodId:'',...state.settings};
  function ensurePeriods(){
    if(!Array.isArray(state.payPeriods)) state.payPeriods=[];
    if(!state.payPeriods.length&&(state.settings.periodStart||state.settings.periodEnd||state.settings.paycheckAmount)){
      state.payPeriods.push({id:'legacy-current',label:'Paycheck 1',paycheckDate:state.settings.paycheckDate||'',start:state.settings.periodStart||'',end:state.settings.periodEnd||'',nextPaycheckDate:state.settings.nextPaycheckDate||'',expectedAmount:Number(state.settings.paycheckAmount)||0});
      state.settings.activePayPeriodId='legacy-current';
    }
    if(!state.settings.activePayPeriodId&&state.payPeriods[0]) state.settings.activePayPeriodId=state.payPeriods[0].id;
  }
  const activePeriod=()=>state.payPeriods.find(p=>p.id===state.settings.activePayPeriodId)||null;
  const periodLabel=p=>{if(!p)return 'No pay period';const d=p.paycheckDate?new Date(p.paycheckDate+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';return `${p.label||'Paycheck'}${d?' · '+d:''}`};
  const inPeriod=(t,p=activePeriod())=>{if(!p)return true;if(t.payPeriodId)return t.payPeriodId===p.id;if(!t.date||!p.start||!p.end)return false;return t.date>=p.start&&t.date<=p.end};
  function renderPeriods(){
    ensurePeriods(); const p=activePeriod(), sel=$('#payPeriodSelect'), modal=$('#transactionPayPeriod');
    if(sel) sel.innerHTML=state.payPeriods.length?state.payPeriods.map(x=>`<option value="${esc(x.id)}" ${x.id===state.settings.activePayPeriodId?'selected':''}>${esc(periodLabel(x))}</option>`).join(''):'<option value="">No saved pay periods</option>';
    if(modal) modal.innerHTML='<option value="">Unassigned</option>'+state.payPeriods.map(x=>`<option value="${esc(x.id)}">${esc(periodLabel(x))}</option>`).join('');
    if($('#activePeriodBadge')) $('#activePeriodBadge').textContent=p?periodLabel(p):'No pay period selected';
    if($('#paycheckDate')) $('#paycheckDate').value=p?.paycheckDate||state.settings.paycheckDate||'';
    if($('#periodStart')) $('#periodStart').value=p?.start||state.settings.periodStart||'';
    if($('#periodEnd')) $('#periodEnd').value=p?.end||state.settings.periodEnd||'';
    if($('#paycheckAmount')) $('#paycheckAmount').value=Number(p?.expectedAmount??state.settings.paycheckAmount)||'';
  }
  const oldRenderPaycheck=renderPaycheck, oldRenderAll=renderAll, oldOpenTransaction=openTransaction, oldRenderRows=renderRows;
  txByCategory=function(cat){const p=activePeriod(), pool=p?state.transactions.filter(t=>inPeriod(t,p)):state.transactions;return pool.filter(t=>t.category===cat)};
  incomeTx=function(){const p=activePeriod(), pool=p?state.transactions.filter(t=>inPeriod(t,p)):state.transactions;return pool.filter(t=>t.type==='income')};
  getTotals=function(){return {income:sum(incomeTx(),t=>t.amount),savings:sum(txByCategory('Savings'),t=>t.amount),bills:sum(txByCategory('Bills'),t=>t.amount),subs:sum(txByCategory('Subscriptions'),t=>t.amount),debtPay:sum(txByCategory('Debt Payments'),t=>t.amount)}};
  renderPaycheck=function(){const p=activePeriod();if(p) state.settings.paycheckAmount=Number(p.expectedAmount)||0;oldRenderPaycheck();renderPeriods()};
  renderAll=function(){ensurePeriods();oldRenderAll();renderPeriods()};
  openTransaction=function(prefill={}){oldOpenTransaction(prefill);renderPeriods();const f=$('#transactionForm');if(f?.elements.payPeriodId)f.elements.payPeriodId.value=prefill.payPeriodId??state.settings.activePayPeriodId??''};
  renderRows=function(host,items){oldRenderRows(host,items);if(!host)return;[...host.querySelectorAll('.row-card')].forEach((row,i)=>{const t=items[i],p=t&&state.payPeriods.find(x=>x.id===t.payPeriodId);if(p){const meta=row.querySelector('.meta');if(meta&&!meta.textContent.includes('Paycheck'))meta.insertAdjacentHTML('beforeend',` · <span class="period-tag">💵 ${esc(periodLabel(p))}</span>`)}})};
  function savePeriodFromForm(form){const f=new FormData(form),id=uid(),p={id,label:String(f.get('label')).trim(),paycheckDate:f.get('paycheckDate')||'',start:f.get('start')||'',end:f.get('end')||'',nextPaycheckDate:f.get('nextPaycheckDate')||'',expectedAmount:Number(f.get('expectedAmount'))||0};state.payPeriods.push(p);state.settings.activePayPeriodId=id;Object.assign(state.settings,{paycheckDate:p.paycheckDate,periodStart:p.start,periodEnd:p.end,nextPaycheckDate:p.nextPaycheckDate,paycheckAmount:p.expectedAmount});saveLocal();form.reset();toast('Pay period saved 💵')}
  function bindPayPeriods(){
    ensurePeriods();renderPeriods();
    const pf=$('#payPeriodForm'); if(pf)pf.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();savePeriodFromForm(pf)},true);
    $('#payPeriodSelect')?.addEventListener('change',e=>{state.settings.activePayPeriodId=e.target.value;const p=activePeriod();if(p)Object.assign(state.settings,{paycheckDate:p.paycheckDate||'',periodStart:p.start||'',periodEnd:p.end||'',nextPaycheckDate:p.nextPaycheckDate||'',paycheckAmount:Number(p.expectedAmount)||0});saveLocal()});
    const update=(key,val)=>{const p=activePeriod();if(p)p[key]=val;else if(key==='paycheckDate')state.settings.paycheckDate=val;else if(key==='start')state.settings.periodStart=val;else if(key==='end')state.settings.periodEnd=val;else if(key==='expectedAmount')state.settings.paycheckAmount=Number(val)||0;saveLocal()};
    $('#paycheckDate')?.addEventListener('change',e=>update('paycheckDate',e.target.value));
    $('#periodStart')?.addEventListener('change',e=>update('start',e.target.value));
    $('#periodEnd')?.addEventListener('change',e=>update('end',e.target.value));
    $('#paycheckAmount')?.addEventListener('change',e=>update('expectedAmount',Number(e.target.value)||0));
    const tf=$('#transactionForm');if(tf)tf.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const submit=e.submitter,f=new FormData(tf);state.transactions.push({id:uid(),name:String(f.get('name')).trim(),amount:Number(f.get('amount')),type:f.get('type'),category:f.get('category'),date:f.get('date'),priority:f.get('priority'),frequency:f.get('frequency'),notes:f.get('notes'),payPeriodId:f.get('payPeriodId')||'',paid:submit?.value==='paid'});saveLocal();if(submit?.value==='another'){tf.reset();renderPeriods();if(tf.elements.payPeriodId)tf.elements.payPeriodId.value=state.settings.activePayPeriodId||'';toast('Saved — add another ✨')}else{closeTransaction();toast(submit?.value==='paid'?'Saved & marked paid ✓':'Transaction saved ✨')}},true);
    $$('.quick-add[data-quick]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const f=new FormData(form),kind=form.dataset.quick,pid=state.settings.activePayPeriodId||'';if(kind==='income')state.transactions.push({id:uid(),name:String(f.get('name')).trim(),amount:Number(f.get('amount')),type:'income',category:'Income',date:f.get('date')||activePeriod()?.paycheckDate||new Date().toISOString().slice(0,10),frequency:'One-time',payPeriodId:pid});else state.transactions.push({id:uid(),name:String(f.get('name')).trim(),amount:Number(f.get('amount')),type:'expense',category:kind,date:f.get('date')||'',frequency:f.get('frequency')||'One-time',payPeriodId:pid});saveLocal();form.reset();toast(pid?'Added to this paycheck ✨':'Added to planner ✨')},true));
  }
  const css=`.paycheck-meta{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 6px}.paycheck-meta label{display:grid;gap:3px;font-size:10px;font-weight:900;color:#857b82}.paycheck-meta input,.paycheck-meta select{min-width:145px;border:1px solid #e6dbe1;border-radius:10px;padding:7px 9px;background:#fff}.pay-period-planner{margin:14px 0 18px;background:linear-gradient(115deg,#fff7fb,#f1ffff 52%,#fff8e8);border:1px solid #eadfe5;border-radius:18px;padding:15px 17px;box-shadow:0 10px 25px rgba(73,48,63,.06)}.pay-period-planner-head{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:12px}.pay-period-planner-head>div{display:grid;gap:3px}.pay-period-planner-head small{color:#8f858b}.pay-period-planner-head>span,.period-tag{background:#dcf8f6;color:#16868a;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:900}.pay-period-form{display:grid;grid-template-columns:1.15fr repeat(5,1fr) auto;gap:9px;align-items:end}.pay-period-form label{display:grid;gap:5px}.pay-period-form label span{font-size:10px;font-weight:900;color:#82777e;text-transform:uppercase}.pay-period-form input{width:100%;min-width:0;padding:9px 10px;border:1px solid #e3d9df;border-radius:10px}.income-quick{grid-template-columns:1.3fr 1fr 1fr auto!important}.bill-quick{grid-template-columns:1.3fr 1fr .9fr 1fr auto!important}.bill-quick select{padding:8px;border:1px solid #e4dce1;border-radius:9px;background:#fff}@media(max-width:1200px){.pay-period-form{grid-template-columns:repeat(3,1fr)}.pay-period-form .btn{grid-column:1/-1}.income-quick,.bill-quick{grid-template-columns:1fr 1fr!important}}@media(max-width:700px){.pay-period-planner-head{align-items:flex-start;flex-direction:column}.pay-period-form{grid-template-columns:1fr}.pay-period-form .btn{grid-column:auto}.income-quick,.bill-quick{grid-template-columns:1fr!important}}`;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded',bindPayPeriods);
})();
