document.addEventListener('DOMContentLoaded',()=>{
  const escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const signUp=document.getElementById('signUpBtn');
  if(signUp) signUp.addEventListener('click',async()=>{const msg=document.getElementById('authMsg');const email=document.getElementById('email')?.value.trim();const password=document.getElementById('password')?.value||'';if(!email){msg.textContent='Enter your email first.';return}if(password.length<6){msg.textContent='Use a password with at least 6 characters.';return}if(!sb){msg.textContent='Login is still loading…';return}msg.textContent='Creating your Moneyology account…';msg.classList.remove('confirm-bubble');const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error){msg.textContent=error.message;return}if(data?.session){msg.textContent='Account created — you’re signed in! 💖';return}msg.classList.add('confirm-bubble');msg.innerHTML=`<strong>Hey! 💌 Go confirm your email!</strong><span>We sent a confirmation link to <b>${escHtml(email)}</b>.</span><span>Tap the link, then come back and press <b>Sign in</b>. ✨</span>`;});

  const nav=document.querySelector('.nav');
  if(nav && !document.querySelector('.mini-cal')){
    const brand=document.querySelector('.brand-art');
    const mini=document.createElement('div');mini.className='mini-cal';
    if(brand) brand.insertAdjacentElement('afterend',mini); else nav.before(mini);
    const buttons=[...nav.querySelectorAll('button')];
    const take=n=>buttons.find(b=>b.dataset.nav===n);
    nav.innerHTML='';
    const groups=[
      ['PLANNING','plan',['calendar','transactions','subscriptions']],
      ['MONEY','money',['dashboard']],
      ['TRACKING','track',['accounts','savings','debts']],
      ['SETUP','setup',['settings']]
    ];
    groups.forEach(([title,cls,names])=>{const g=document.createElement('div');g.className='nav-group '+cls;g.innerHTML=`<div class="nav-label">${title}</div>`;names.forEach(n=>{const b=take(n);if(b){if(n==='transactions')b.innerHTML='🧾 Bills & Planned';if(n==='dashboard')b.innerHTML='💗 Money Home';g.appendChild(b)}});nav.appendChild(g)});
    const menu=document.createElement('div');menu.className='menu-word';menu.innerHTML='<span>M</span><span>E</span><span>N</span><span>U</span>';mini.insertAdjacentElement('afterend',menu);
  }

  let miniDate=new Date();
  function miniCalendar(){const host=document.querySelector('.mini-cal');if(!host)return;const y=miniDate.getFullYear(),m=miniDate.getMonth();const first=new Date(y,m,1);const days=new Date(y,m+1,0).getDate();let cells='';const start=(first.getDay()+6)%7;for(let i=0;i<start;i++)cells+='<i></i>';const today=new Date();for(let d=1;d<=days;d++){const isToday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;cells+=`<b class="${isToday?'today':''}">${d}</b>`}host.innerHTML=`<div class="mini-head"><button data-mini="prev">‹</button><strong>${first.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</strong><button data-mini="next">›</button></div><div class="mini-days"><em>M</em><em>T</em><em>W</em><em>T</em><em>F</em><em>S</em><em>S</em>${cells}</div>`;host.querySelector('[data-mini=prev]').onclick=()=>{miniDate=new Date(y,m-1,1);miniCalendar()};host.querySelector('[data-mini=next]').onclick=()=>{miniDate=new Date(y,m+1,1);miniCalendar()};}
  miniCalendar();

  const hero=document.querySelector('[data-section="dashboard"] .fun-hero');
  if(hero){hero.classList.add('planner-hero');const p=hero.querySelector('p');if(p)p.textContent='';}
  const pageTitle=document.getElementById('pageTitle'); if(pageTitle) pageTitle.classList.add('bubble-title');

  const calSection=document.querySelector('[data-section="calendar"]');
  let calDate=new Date();
  function occurrencesForMonth(tx,y,m){const out=[];if(!tx.date)return out;const start=new Date(tx.date+'T12:00:00');if(isNaN(start))return out;const freq=tx.frequency||'One-time';let d=new Date(start);const end=new Date(y,m+1,0,23,59,59);if(freq==='One-time'){if(d.getFullYear()===y&&d.getMonth()===m)out.push(new Date(d));return out}let guard=0;while(d<=end&&guard++<1000){if(d.getFullYear()===y&&d.getMonth()===m)out.push(new Date(d));if(freq==='Weekly')d.setDate(d.getDate()+7);else if(freq==='Bi-weekly')d.setDate(d.getDate()+14);else if(freq==='Monthly')d.setMonth(d.getMonth()+1);else if(freq==='Quarterly')d.setMonth(d.getMonth()+3);else if(freq==='Yearly')d.setFullYear(d.getFullYear()+1);else break;}return out;}
  function renderBigCalendar(){if(!calSection)return;const y=calDate.getFullYear(),m=calDate.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),start=(first.getDay()+6)%7;let cells='';for(let i=0;i<start;i++)cells+='<div class="cal-cell outside"></div>';for(let d=1;d<=days;d++){const dayTx=[];try{(state.transactions||[]).forEach(t=>{if(['Bills','Subscriptions','Debt Payments','Savings'].includes(t.category)||t.type==='income'){if(occurrencesForMonth(t,y,m).some(o=>o.getDate()===d))dayTx.push(t)}})}catch{}const chips=dayTx.slice(0,5).map(t=>`<span class="cal-chip ${String(t.category||t.type).toLowerCase().replace(/\s+/g,'-')}">${escHtml(t.name)} <b>${money(t.amount)}</b></span>`).join('');cells+=`<div class="cal-cell"><div class="cal-num">${d}</div>${chips}</div>`;}const label=first.toLocaleDateString('en-US',{month:'long',year:'numeric'});calSection.innerHTML=`<div class="calendar-page-head"><div><div class="script-word">smart</div><div class="bubble-calendar">calendar</div><div class="calendar-sub">Scheduled Money</div></div><div class="sun-doodle">☀</div></div><div class="calendar-stats"><div><small>SCHEDULED INCOME</small><strong id="calIncome">$0.00</strong></div><div><small>SCHEDULED OUT</small><strong id="calOut">$0.00</strong></div><div><small>SUBSCRIPTIONS</small><strong>${(state.transactions||[]).filter(t=>t.category==='Subscriptions').length}</strong></div><div><small>TODAY IS</small><strong>${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}</strong></div></div><div class="calendar-card"><div class="calendar-tools"><div class="filter-pills"><span>🎛 Filters:</span><button>All</button><button>Bills</button><button>Subscriptions</button><button>Debts</button></div><button class="primary" data-nav-jump="transactions">＋ Add Planned Item</button></div><div class="month-nav"><button data-cal="prev">‹ Prev</button><strong>${label}</strong><button data-cal="next">Next ›</button></div><div class="weekday-row"><span>Monday</span><span>Tuesday</span><span>Wednesday</span><span>Thursday</span><span>Friday</span><span>Saturday</span><span>Sunday</span></div><div class="big-calendar">${cells}</div></div>`;let inc=0,out=0;try{(state.transactions||[]).forEach(t=>{const n=occurrencesForMonth(t,y,m).length;if(!n)return;if(t.type==='income')inc+=Number(t.amount||0)*n;else if(['Bills','Subscriptions','Debt Payments','Savings'].includes(t.category))out+=Number(t.amount||0)*n})}catch{}calSection.querySelector('#calIncome').textContent=money(inc);calSection.querySelector('#calOut').textContent=money(out);calSection.querySelector('[data-cal=prev]').onclick=()=>{calDate=new Date(y,m-1,1);renderBigCalendar()};calSection.querySelector('[data-cal=next]').onclick=()=>{calDate=new Date(y,m+1,1);renderBigCalendar()};calSection.querySelector('[data-nav-jump]').onclick=()=>navTo('transactions');}
  renderBigCalendar();

  const oldRenderAll=renderAll;renderAll=function(){oldRenderAll();renderBigCalendar();};
  document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>setTimeout(renderBigCalendar,0)));
});