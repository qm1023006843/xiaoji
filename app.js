/* 小记 v2.6.1 · app：界面与各模块（后续分家继续从这里往外搬） */
'use strict';
/* ---- 类型小助手（读 D，先住这，搬任务模块时一起走） ---- */
function catOf(id){ return D.cats.find(c=>c.id===id) || {id:null,n:'未分类',c:-1}; }
function catColor(c){ return (!c||c.c<0)?'var(--faint)':`var(--p${c.c})`; }
function dotColor(id){ return id===undefined?'var(--apricot-ink)':catColor(catOf(id)); }
function tagHTML(id,extra){
  if(extra) return `<span class="tag" style="color:var(--apricot-ink);background:color-mix(in srgb, var(--apricot-ink) 12%, var(--card))">${extra}</span>`;
  const c=catOf(id), col=catColor(c);
  return `<span class="tag" style="color:${col};background:color-mix(in srgb, ${col} 12%, var(--card))">${esc(c.n)}</span>`;
}

/* ================= navigation ================= */
let cur='scr-home';
const RENDER={};
function go(id){
  if(id===cur) return;
  $('#'+cur).classList.remove('active');
  $('#'+id).classList.add('active');
  cur=id;
  if(RENDER[id]) RENDER[id]();
}
$$('.back').forEach(b=>b.addEventListener('click',()=>{ go('scr-home'); renderHomeTop(); }));
const drawer=$('#drawer'), scrim=$('#scrim');
function drawerOpen(v){ drawer.classList.toggle('on',v); scrim.classList.toggle('on',v); }
$('#menuBtn').addEventListener('click',()=>{ updatePendBadge(); drawerOpen(true); });
scrim.addEventListener('click',()=>drawerOpen(false));
$$('.ditem').forEach(b=>b.addEventListener('click',()=>{ drawerOpen(false); setTimeout(()=>go(b.dataset.go),120); }));

/* ================= theme ================= */
function applyTheme(){
  document.body.dataset.theme=D.s.theme;
  const dark=D.s.theme!=='day';
  $('#icoMoon').style.display=dark?'none':'';
  $('#icoSun').style.display=dark?'':'none';
}
$('#themeBtn').addEventListener('click',()=>{
  if(D.s.theme==='day'){ D.s.theme=D.s.darkPref||'night'; }
  else { D.s.darkPref=D.s.theme; D.s.theme='day'; }
  save(); applyTheme();
  if(cur==='scr-mood') drawMood();
});
applyTheme();

/* ================= home ================= */
const WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MO=['January','February','March','April','May','June','July','August','September','October','November','December'];
const OPENERS={
  morning:[['Morning, {n}','新的一页，从一杯温水开始。'],['早安，{n}','Slow is smooth, smooth is fast.'],['Morning, {n}','今天想先写哪一段？']],
  noon:[['Noon, {n}','写累了就吃点好的，灵感在饭后。'],['午安，{n}','A little rest, then we write.']],
  afternoon:[['Afternoon, {n}','写点什么吧，趁天色正好。'],['Afternoon, {n}','Coffee and keyboard time?'],['下午好，{n}','故事里的人在等你回去。']],
  evening:[['Evening, {n}','今天辛苦了，剩下的交给晚风。'],['Evening, {n}','复盘五分钟，睡个安稳觉。'],['晚上好，{n}','One more chapter, or a cup of tea?']],
  late:[['Still awake, {n}?','夜深了，写完这段就休息，好吗？'],['夜安，{n}','字会等你，梦也会。']]
};
function renderHomeTop(){
  if(typeof renderVase==='function') try{ renderVase(); }catch(e){}
  const d=nowD();
  $('#dateLine').textContent=`${WD[d.getDay()]}, ${MO[d.getMonth()]} ${d.getDate()}`;
  $('#drawerDate').textContent=`${MO[d.getMonth()].toUpperCase()} ${d.getDate()}, ${d.getFullYear()}`;
  const h=d.getHours();
  let pool=h<5?OPENERS.late:h<11?OPENERS.morning:h<14?OPENERS.noon:h<18?OPENERS.afternoon:h<23?OPENERS.evening:OPENERS.late;
  const perKey=h<5?'late':h<11?'morning':h<14?'noon':h<18?'afternoon':h<23?'evening':'late';
  const cands=D.words.open.filter(w=>!w.p||w.p==='all'||w.p===perKey);
  if(cands.length && Math.random()<0.35){
    const c=cands[Math.floor(Math.random()*cands.length)];
    const late=perKey==='late';
    $('#greetText').textContent=late?('Still awake, '+D.s.nick+'?'):((h<11?'Morning':h<14?'Noon':h<18?'Afternoon':'Evening')+', '+D.s.nick);
    $('#openLine').textContent=c.t||c;
  } else {
    const [g,l]=pool[Math.floor(Math.random()*pool.length)];
    $('#greetText').textContent=g.replace('{n}',D.s.nick);
    $('#openLine').textContent=l;
  }
}
function pickQuote(){
  const all=[...D.words.mom,...D.words.essay];
  const l1=$('#tqL1'), l2=$('#tqL2');
  if(!all.length){ l1.textContent='去「话语集」存下第一句吧'; l2.style.display='none'; return; }
  const h=nowD().getHours();
  const perKey=h<5?'late':h<11?'morning':h<14?'noon':h<18?'afternoon':h<23?'evening':'late';
  const perOK=w=>!w.p||w.p==='all'||w.p===perKey;
  const md=TODAY.slice(5);
  const wd=new Date(TODAY+'T12:00:00').getDay();
  const isRest=(wd===0||wd===6);
  // 特定日期当天独占
  let pool=all.filter(w=>w.dt==='date'&&w.date===md&&perOK(w));
  const exclusive=pool.length>0;
  if(!exclusive){
    pool=all.filter(w=>{
      const dt=w.dt||'any';
      if(dt==='date') return false;
      if(dt==='work'&&isRest) return false;
      if(dt==='rest'&&!isRest) return false;
      return perOK(w);
    });
  }
  if(!pool.length){ l1.textContent='今天这个时段还没有合适的句子'; l2.style.display='none'; return; }
  let pick;
  if(exclusive){
    pick=pool[Math.floor(Math.random()*pool.length)];
  } else {
    let unseen=pool.filter(w=>!w.seen);
    if(!unseen.length){ pool.forEach(w=>w.seen=false); unseen=pool; }
    const seen=pool.filter(w=>w.seen);
    if(seen.length && Math.random()<0.05){ pick=seen[Math.floor(Math.random()*seen.length)]; }
    else { pick=unseen[Math.floor(Math.random()*unseen.length)]; pick.seen=true; }
    save();
  }
  l1.textContent=pick.t;
  if(pick.t2){ l2.textContent=pick.t2; l2.style.display=''; } else l2.style.display='none';
}
$('#taskQuote').addEventListener('click',pickQuote);

/* ================= tasks ================= */
function dimOf(y,m){ return new Date(y,m,0).getDate(); }
function tplWindow(p){
  const f=p.freq||'daily';
  if(f==='daily') return TODAY;
  if(f==='every'){
    const n=Math.max(2,p.n||3);
    const d=diffDays(p.created,TODAY);
    if(d<0) return null;
    return addDays(p.created,Math.floor(d/n)*n);
  }
  if(f==='weekly'){
    const wd=(p.wd===undefined?1:p.wd);
    const tw=new Date(TODAY+'T12:00:00').getDay();
    return addDays(TODAY,-((tw-wd+7)%7));
  }
  if(f==='monthly'){
    const md=Math.min(Math.max(1,p.md||1),31);
    let y=+TODAY.slice(0,4), m=+TODAY.slice(5,7);
    let s=`${y}-${String(m).padStart(2,'0')}-${String(Math.min(md,dimOf(y,m))).padStart(2,'0')}`;
    if(s>TODAY){ m--; if(m<1){m=12;y--;} s=`${y}-${String(m).padStart(2,'0')}-${String(Math.min(md,dimOf(y,m))).padStart(2,'0')}`; }
    return s;
  }
  return TODAY;
}
function tplFreqLabel(p){
  const f=p.freq||'daily';
  if(f==='every') return '每'+(p.n||3)+'天';
  if(f==='weekly') return '每周'+'日一二三四五六'[p.wd===undefined?1:p.wd];
  if(f==='monthly') return '每月'+(p.md||1)+'日';
  return '每日';
}
/* ---- workflow (流程) ---- */
function parseFlow(body){
  const lines=(body||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const variants=[]; let cur=null;
  for(const ln of lines){
    const m=ln.match(/^[\[【](.+?)[\]】]$/);
    if(m){ cur={n:m[1].trim(),steps:[],forks:null,_fk:null}; variants.push(cur); continue; }
    const fm=ln.match(/^分叉[A-Za-z\d]*[\[【](.+?)[\]】]$/);
    if(fm){
      if(!cur){ cur={n:'',steps:[],forks:null,_fk:null}; variants.push(cur); }
      if(!cur.forks) cur.forks=[];
      cur._fk={n:fm[1].trim(),steps:[]}; cur.forks.push(cur._fk); continue;
    }
    if(!cur){ cur={n:'',steps:[],forks:null,_fk:null}; variants.push(cur); }
    const flags=(ln.match(/[?？!！]+$/)||[''])[0];
    const opt=/[?？]/.test(flags), ask=/[!！]/.test(flags);
    const nm=ln.replace(/[?？!！]+$/,'').trim();
    if(nm){
      if(cur._fk) cur._fk.steps.push({n:nm,opt,ask});
      else cur.steps.push({n:nm,opt,ask});
    }
  }
  variants.forEach(v=>{
    delete v._fk;
    if(v.forks) v.forks=v.forks.filter(f=>f.steps.length);
    if(v.forks&&!v.forks.length) v.forks=null;
  });
  return variants.filter(v=>v.steps.length||(v.forks&&v.forks.length));
}
function spawnFlow(tm,varIdx,note){
  const vs=parseFlow(tm.body);
  const vv=vs[Math.min(varIdx||0,vs.length-1)];
  if(!vv) return null;
  const f={id:uid(),tmpl:tm.id,n:tm.n,cat:tm.cat,note:(note||'').trim(),variant:vs.length>1?vv.n:'',steps:vv.steps.map(s=>({n:s.n,opt:s.opt,ask:s.ask,remark:'',done:false,skip:false,ts:null,logId:null})),started:TODAY};
  if(vv.forks&&vv.forks.length) f.forks=vv.forks;
  D.flows.inst.push(f);
  return f;
}
function flogName(f,s){ return `${f.n}${f.note?'（'+f.note+'）':''}｜${s.n}${s.remark?'：'+s.remark:''}`; }
function showForkChoice(f){
  let h=`<h5>${esc(f.n)}${f.note?' · '+esc(f.note):''}<br><small style="font-weight:400;color:var(--sub)">前置步骤已完成，接下来走哪条路？</small></h5>`;
  f.forks.forEach((fk,i)=>{
    h+=`<button class="act" data-fi="${i}" style="text-align:left"><b>${esc(fk.n)}</b><small style="display:block;color:var(--sub);font-weight:400;margin-top:2px">${fk.steps.length} 步 · ${fk.steps.slice(0,3).map(s=>s.n).join('→')}${fk.steps.length>3?'…':''}</small></button>`;
  });
  openMini(h);
  mini.querySelectorAll('[data-fi]').forEach(btn=>btn.addEventListener('click',()=>{
    const fk=f.forks[+btn.dataset.fi];
    fk.steps.forEach(s=>f.steps.push({n:s.n,opt:s.opt,ask:s.ask,remark:'',done:false,skip:false,ts:null,logId:null}));
    f.branch=fk.n;
    delete f.forks;
    save(); closeMini(); renderTasks();
    toast(`走「${fk.n}」路线 · 还有 ${fk.steps.length} 步`);
  }));
}
function ensureFlows(){
  let changed=false;
  D.flows.tmpl.forEach(t=>{
    if(!t.md) return;
    const ws=tplWindow({freq:'monthly',md:t.md});
    if(t.lastWin!==ws){ t.lastWin=ws; if(spawnFlow(t,0)) changed=true; }
  });
  if(changed) save();
}
function virtualTasks(){
  const out=[];
  D.flows.inst.forEach(f=>out.push({kind:'flow',id:f.id,name:f.n,cat:f.cat,type:'flow',flow:f}));
  D.tpl.forEach(p=>{
    if(p.active===false || p.skip===TODAY) return;
    const ws=tplWindow(p);
    if(!ws) return;
    const done=D.log.some(l=>l.tid===p.id && l.date>=ws);
    if(!done) out.push({kind:'tpl',id:p.id,name:p.name,cat:p.cat,type:'daily',freqLabel:tplFreqLabel(p),ws});
  });
  D.tasks.forEach(t=>{
    if(t.type==='once' && t.date===TODAY) out.push({kind:'task',...t});
    if(t.type==='span' && t.start<=TODAY && t.end>=TODAY) out.push({kind:'task',...t});
    if(t.type==='idle') out.push({kind:'task',...t});
  });
  return out;
}
function todayTotal(){ return virtualTasks().length + D.log.filter(l=>l.date===TODAY).length; }
function taskEl(v){
  const el=document.createElement('div');
  el.className='task'+(v.reward?' reward-task':'');
  const useBtnF=D.s.taskStyle==='btn';
  const ckStr='<button class="ck"><svg viewBox="0 0 24 24"><path class="tick" d="M5.5 12.5l4 4L18.5 8"/></svg></button>';
  const btnStr='<button class="donebtn">完成</button>';
  if(v.kind==='flow'){
    const f=v.flow;
    const idx=f.steps.findIndex(s=>!s.done&&!s.skip);
    const doneN=f.steps.filter(s=>s.done||s.skip).length, total=f.steps.length;
    const cs=idx>=0?f.steps[idx]:null;
    const atFork=!cs&&f.forks&&f.forks.length;
    el.innerHTML=`
      ${useBtnF?'':ckStr}
      <div class="tmain">
        <div class="tname">${esc(f.n)}${f.note?`<span style="color:var(--sub)"> · ${esc(f.note)}</span>`:''}${f.variant?`<span style="color:var(--faint);font-size:12px"> · ${esc(f.variant)}</span>`:''}${f.branch?`<span style="color:var(--faint);font-size:12px"> · ${esc(f.branch)}</span>`:''}</div>
        <div class="tmeta">${tagHTML(f.cat)}<span>流程 · ${atFork?'前置完成 · 选择路线':`第 ${Math.min(doneN+1,total)} / ${total} 步`}</span></div>
        ${atFork?`<div style="font-size:13px;color:var(--sage-deep);margin-top:6px">▸ 选择路线（${f.forks.length} 条）</div>`:
         cs?`<div class="fstep-cur" style="font-size:13px;color:var(--sage-deep);margin-top:6px;cursor:pointer">▸ ${esc(cs.n)}${cs.opt?'<span style="color:var(--faint);font-size:11px">（可跳过）</span>':''}${cs.remark?`<br><span style="font-size:12px;color:var(--sub);font-weight:400">📎 ${esc(cs.remark)}</span>`:''}</div>`:''}
        <div class="tprog"><div class="bar2"><i style="width:${atFork?100:Math.round(doneN/total*100)}%"></i></div></div>
      </div>
      ${useBtnF?btnStr:''}
      <button class="tmore">⋯</button>`;
    const mainBtn=el.querySelector(useBtnF?'.donebtn':'.ck');
    if(atFork){
      if(useBtnF) mainBtn.textContent='选择';
      mainBtn.addEventListener('click',()=>showForkChoice(f));
    } else {
      mainBtn.addEventListener('click',()=>completeFlowStep(el,f));
    }
    const curLine=el.querySelector('.fstep-cur');
    if(curLine) curLine.addEventListener('click',(e)=>{ e.stopPropagation(); editStepRemark(f,idx); });
    el.querySelector('.tmore').addEventListener('click',()=>flowActions(f));
    return el;
  }
  let meta=tagHTML(v.cat, v.reward?'奖励':null);
  if(v.fromMom) meta=tagHTML(null,'♡ 妈咪')+meta;
  if(v.type==='daily') meta+=`<span class="rep"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.6-5.7M20 12a8 8 0 0 1-13.6 5.7"/><polyline points="17.5 3 17.8 6.6 14.2 6.9"/><polyline points="6.5 21 6.2 17.4 9.8 17.1"/></svg>${v.freqLabel||'每日'}</span>`;
  else if(v.type==='span') meta+=`<span>跨时段 · 至 ${fmtMD(v.end)}</span>`;
  else if(v.type==='idle') meta+=`<span>🛋 长期 · 不催</span>`;
  else if(!v.reward) meta+=`<span>今日 · 一次性</span>`;
  let prog='';
  if(v.type==='span'){
    const tot=diffDays(v.start,v.end)+1, cur=diffDays(v.start,TODAY)+1;
    prog=`<div class="tprog"><div class="bar2"><i style="width:${Math.min(100,Math.round(cur/tot*100))}%"></i></div><span>已进行 ${cur}/${tot} 天</span></div>`;
  }
  const useBtn=D.s.taskStyle==='btn';
  el.innerHTML=`
    ${useBtn?'':'<button class="ck"><svg viewBox="0 0 24 24"><path class="tick" d="M5.5 12.5l4 4L18.5 8"/></svg></button>'}
    <div class="tmain"><div class="tname">${esc(v.name)}</div><div class="tmeta">${meta}</div>${prog}</div>
    ${useBtn?'<button class="donebtn">完成</button>':''}
    <button class="tmore">⋯</button>`;
  el.querySelector(useBtn?'.donebtn':'.ck').addEventListener('click',()=>completeVirtual(el,v));
  el.querySelector('.tmore').addEventListener('click',()=>taskActions(v));
  return el;
}
function groupFlowLogs(list,hideActive){
  const act=hideActive?new Set(D.flows.inst.map(f=>f.id)):new Set();
  const grp={}, singles=[];
  list.forEach(l=>{
    if(l.fid){
      if(act.has(l.fid)) return;
      if(!grp[l.fid]) grp[l.fid]={fn:l.fn||l.name,cat:l.cat,items:[],ts:l.ts};
      grp[l.fid].items.push(l);
      if(l.ts>grp[l.fid].ts) grp[l.fid].ts=l.ts;
    } else singles.push(l);
  });
  const vis=[];
  singles.forEach(l=>vis.push({t:'s',l,ts:l.ts}));
  Object.entries(grp).forEach(([fid,g])=>vis.push({t:'f',fid,g,ts:g.ts}));
  vis.sort((a,b)=>a.ts<b.ts?-1:1);
  return {vis,hidN:list.filter(l=>l.fid&&act.has(l.fid)).length};
}
function flowStepName(name){ return name.includes('｜')?name.split('｜').slice(1).join('｜'):name; }
function renderTasks(){
  // filter chips
  const chips=[['all','全部'],...D.cats.map(c=>[c.id,c.n])];
  if(!D.cats.find(c=>c.id===D.s.tFilter) && D.s.tFilter!=='all') D.s.tFilter='all';
  $('#taskChips').innerHTML=chips.map(([k,n])=>`<button class="chip${k===D.s.tFilter?' on':''}" data-f="${k}">${esc(n)}</button>`).join('');
  $$('#taskChips .chip').forEach(c=>c.addEventListener('click',()=>{ D.s.tFilter=c.dataset.f; save(); renderTasks(); }));
  // ongoing list (filtered)
  const all=virtualTasks();
  const vs=D.s.tFilter==='all'?all:all.filter(v=>v.cat===D.s.tFilter||v.reward);
  const list=$('#taskList'); list.innerHTML='';
  if(!vs.length) list.innerHTML=D.s.tFilter==='all'
    ? '<p class="empty">今天没有进行中的任务<br>点右下角 + 创建一个吧</p>'
    : '<p class="empty">这个类型下今天没有任务</p>';
  vs.forEach(v=>list.appendChild(taskEl(v)));
  const dn=D.log.filter(l=>l.date===TODAY);
  const dnF=D.s.tFilter==='all'?dn:dn.filter(l=>l.cat===D.s.tFilter);
  $('#ongoingN').textContent=vs.length;
  $('#totalN').textContent=vs.length+dnF.length;
  $('#filtCap').textContent=D.s.tFilter==='all'?'':' · '+catOf(D.s.tFilter).n;
  let dline=`${+TODAY.slice(5,7)}月${+TODAY.slice(8,10)}日 · 周${'日一二三四五六'[new Date(TODAY+'T12:00:00').getDay()]}`;
  const up=D.anni.map(a=>{
    let t=a.yearly?(TODAY.slice(0,4)+'-'+a.date):a.date;
    if(a.yearly&&t<TODAY) t=(+TODAY.slice(0,4)+1)+'-'+a.date;
    return t>=TODAY?{n:a.n,days:diffDays(TODAY,t)}:null;
  }).filter(Boolean).sort((x,y)=>x.days-y.days)[0];
  if(up) dline+=up.days===0?` · 今天是${up.n} ✦`:` · 距${up.n} ${up.days} 天`;
  $('#taskDate').textContent=dline;
  const dl=$('#doneList');
  const {vis:dVis,hidN}=groupFlowLogs(dnF,true);
  dl.classList.toggle('capped',dVis.length>4);
  if(!dVis.length){
    dl.innerHTML=hidN?'<p class="empty">流程进行中 · 完成后显示在这里</p>':'<p class="empty">还没有，不急。</p>';
  } else {
    dl.innerHTML=dVis.slice().reverse().map(v=>{
      if(v.t==='s') return `<div class="done-item" data-id="${v.l.id}" style="cursor:pointer"><span class="dot" style="background:${dotColor(v.l.cat)}"></span><span class="nm2">${esc(v.l.name)}</span><span class="tm">${v.l.ts.slice(11,16)}</span></div>`;
      const g=v.g;
      return `<div class="done-item flow-gp" data-fid="${v.fid}" style="cursor:pointer"><span class="dot" style="background:${dotColor(g.cat)}"></span><span class="nm2">${esc(g.fn)}</span><span class="tm">${g.items.length}步 · ${g.ts.slice(11,16)} <span class="fexp">▸</span></span></div>`+
        `<div class="flow-sub" data-fid="${v.fid}" style="display:none">`+g.items.map(l=>
          `<div class="done-item"><span class="dot" style="background:${dotColor(l.cat)}"></span><span class="nm2">${esc(flowStepName(l.name))}</span><span class="tm">${l.ts.slice(11,16)}</span></div>`
        ).join('')+`</div>`;
    }).join('');
    $$('#doneList .done-item[data-id]').forEach(el=>el.addEventListener('click',()=>changeCat(el.dataset.id,renderTasks)));
    $$('#doneList .flow-gp').forEach(el=>el.addEventListener('click',()=>{
      const sub=dl.querySelector(`.flow-sub[data-fid="${el.dataset.fid}"]`);
      if(sub){ sub.style.display=sub.style.display==='none'?'':'none'; el.classList.toggle('open'); }
    }));
  }
  renderVase();
}
RENDER['scr-tasks']=function(){ ensureFlows(); pickQuote(); renderTasks(); };
function completeVirtual(el,v){
  if(el.classList.contains('done'))return;
  el.classList.add('done');
  setTimeout(()=>{
    el.classList.add('leave');
    // data
    const entry={id:uid(),name:v.name,cat:v.reward?null:v.cat,ts:tsNow(),date:TODAY,src:v.type||'once',cd:v.kind==='tpl'?v.ws:(v.created||v.start||TODAY)};
    if(v.kind==='tpl') entry.tid=v.id;
    D.log.push(entry);
    if(v.kind==='task') D.tasks=D.tasks.filter(t=>t.id!==v.id);
    gardenCare(1); gardenBonus();
    save();
    setTimeout(()=>{ renderTasks(); },580);
    if(!v.reward) gacha();
  },380);
}
function completeFlowStep(el,f){
  const i=f.steps.findIndex(s=>!s.done&&!s.skip);
  if(i<0||el.classList.contains('done')) return;
  const s=f.steps[i];
  if(s.ask){
    openMini(`<h5>${esc(s.n)} · 需要备注一下</h5>
      <input id="stepRk" class="edin" style="background:var(--bg);margin-bottom:10px" placeholder="发给谁 / 单号 / 金额…（可留空）" maxlength="40" value="${esc(s.remark||'')}">
      <button class="act" data-a="go" style="background:var(--sage);color:#FBFBF6;text-align:center">完成此步</button>`);
    mini.querySelector('[data-a="go"]').addEventListener('click',()=>{
      s.remark=$('#stepRk').value.trim();
      closeMini();
      doFlowStep(el,f,i);
    });
    return;
  }
  doFlowStep(el,f,i);
}
function editStepRemark(f,i){
  const s=f.steps[i];
  openMini(`<h5>${esc(s.n)}</h5>
    <input id="stepRk" class="edin" style="background:var(--bg);margin-bottom:10px" placeholder="备注一下（可留空）" maxlength="40" value="${esc(s.remark||'')}">
    <button class="act" data-a="sv" style="background:var(--sage);color:#FBFBF6;text-align:center">${s.remark?'更新备注':'添加备注'}</button>
    ${s.remark?'<button class="act" data-a="rm">清除备注</button>':''}`);
  mini.querySelector('[data-a="sv"]').addEventListener('click',()=>{
    s.remark=$('#stepRk').value.trim();
    if(s.done&&s.logId){ const l=D.log.find(x=>x.id===s.logId); if(l) l.name=flogName(f,s); }
    save(); closeMini(); renderTasks();
    toast(s.remark?'备注已添加':'');
  });
  const rm=mini.querySelector('[data-a="rm"]');
  if(rm) rm.addEventListener('click',()=>{
    s.remark='';
    if(s.done&&s.logId){ const l=D.log.find(x=>x.id===s.logId); if(l) l.name=flogName(f,s); }
    save(); closeMini(); renderTasks(); toast('备注已清除');
  });
}
function doFlowStep(el,f,i){
  el.classList.add('done');
  setTimeout(()=>{
    const s=f.steps[i];
    s.done=true; s.ts=tsNow();
    const lid=uid(); s.logId=lid;
    D.log.push({id:lid,name:flogName(f,s),cat:f.cat,ts:s.ts,date:TODAY,cd:f.started,src:'flow',fid:f.id,fn:f.n+(f.note?'（'+f.note+'）':'')});
    const rest=f.steps.some(x=>!x.done&&!x.skip);
    gardenCare(1); gardenBonus();
    save();
    if(!rest&&f.forks&&f.forks.length){
      setTimeout(()=>{ renderTasks(); },400);
    } else if(!rest){
      el.classList.add('leave');
      setTimeout(()=>{
        D.flows.inst=D.flows.inst.filter(x=>x.id!==f.id);
        save(); renderTasks(); toast(`流程「${f.n}」全部完成 ✦`);
      },560);
    } else {
      setTimeout(()=>{ renderTasks(); },400);
    }
    gacha();
  },380);
}
function flowActions(f){
  const idx=f.steps.findIndex(s=>!s.done&&!s.skip);
  const cs=idx>=0?f.steps[idx]:null;
  const lastDone=f.steps.map((s,i)=>s.done?i:-1).filter(i=>i>=0).pop();
  const atFork=!cs&&f.forks&&f.forks.length;
  let h=`<h5>${esc(f.n)}${f.note?'（'+esc(f.note)+'）':''}${f.variant?' · '+esc(f.variant):''}${f.branch?' · '+esc(f.branch):''} · 步骤明细<br><small style="font-weight:400">点已完成的步骤可补写备注</small></h5>
    <div style="max-height:36dvh;overflow-y:auto;margin-bottom:10px">`+
    f.steps.map((s,i)=>`<div data-fsi="${i}" style="display:flex;gap:9px;font-size:13px;padding:7px 4px;border-bottom:1px solid var(--line);${i===idx?'color:var(--sage-deep);font-weight:600':''}${s.done?';cursor:pointer':''}">
      <span style="flex:none;width:16px">${s.done?'✓':s.skip?'⤼':(i===idx?'▸':'○')}</span>
      <span style="flex:1">${esc(s.n)}${s.opt?'<small style="color:var(--faint)">（可跳过）</small>':''}${s.remark?`<br><small style="color:var(--sub)">备注：${esc(s.remark)}</small>`:''}</span>
      <span style="flex:none;color:var(--faint);font-size:11px;font-variant-numeric:tabular-nums">${s.done&&s.ts?fmtDT(s.ts):(s.skip?'已跳过':'')}</span>
    </div>`).join('')+
    (atFork?`<div style="padding:8px 4px;font-size:13px;color:var(--sage-deep);font-weight:600">▸ 接下来请选择路线</div>`+
      f.forks.map((fk,i)=>`<div style="display:flex;gap:9px;font-size:13px;padding:5px 4px;border-bottom:1px solid var(--line)"><span style="flex:none;width:16px">⤳</span><span style="flex:1">${esc(fk.n)}<small style="color:var(--faint)"> · ${fk.steps.length}步</small></span></div>`).join(''):'')
    +`</div>`;
  h+=`<button class="act" data-a="note">编辑流程备注${f.note?'（'+esc(f.note)+'）':''}</button>`;
  if(atFork) h+=`<button class="act" data-a="fork" style="background:var(--sage);color:#FBFBF6;text-align:center">选择路线</button>`;
  if(cs&&cs.opt) h+=`<button class="act" data-a="skip">跳过当前步 · ${esc(cs.n)}</button>`;
  if(lastDone!==undefined) h+=`<button class="act" data-a="undo">撤销上一步 · ${esc(f.steps[lastDone].n)}（红冲）</button>`;
  h+=`<button class="act danger" data-a="drop">放弃流程（已完成的步骤保留记录）</button>`;
  openMini(h);
  const fkBtn=mini.querySelector('[data-a="fork"]');
  if(fkBtn) fkBtn.addEventListener('click',()=>{ closeMini(); showForkChoice(f); });
  mini.querySelectorAll('[data-fsi]').forEach(row=>row.addEventListener('click',()=>{
    const s=f.steps[+row.dataset.fsi];
    if(!s.done) return;
    const nr=prompt(`「${s.n}」的备注（清空=删除备注）`,s.remark||'');
    if(nr===null) return;
    s.remark=nr.trim();
    if(s.logId){ const l=D.log.find(x=>x.id===s.logId); if(l) l.name=flogName(f,s); }
    save(); closeMini(); renderTasks(); toast(s.remark?'备注已更新，记录已同步':'备注已清除');
  }));
  const nt=mini.querySelector('[data-a="note"]');
  nt.addEventListener('click',()=>{
    const nn=prompt('流程备注（这一单是谁的）',f.note||'');
    if(nn===null) return;
    f.note=nn.trim();
    save(); closeMini(); renderTasks(); toast('流程备注已更新，之后完成的步骤会带上它');
  });
  const sk=mini.querySelector('[data-a="skip"]');
  if(sk) sk.addEventListener('click',()=>{
    cs.skip=true;
    const rest=f.steps.some(s=>!s.done&&!s.skip);
    if(!rest&&f.forks&&f.forks.length){
      toast('前置步骤已完成，请选择路线');
    } else if(!rest){
      D.flows.inst=D.flows.inst.filter(x=>x.id!==f.id); toast(`流程「${f.n}」全部完成 ✦`);
    } else toast('已跳过这一步');
    save(); closeMini(); renderTasks();
  });
  const ud=mini.querySelector('[data-a="undo"]');
  if(ud) ud.addEventListener('click',()=>{
    const s=f.steps[lastDone];
    s.done=false; s.ts=null;
    if(s.logId){ D.log=D.log.filter(l=>l.id!==s.logId); s.logId=null; }
    // 撤销上一步之后，中间被跳过的步骤保持跳过状态
    save(); closeMini(); renderTasks(); toast('已红冲一步，记录同步删除');
  });
  mini.querySelector('[data-a="drop"]').addEventListener('click',()=>{
    if(!confirm('放弃这个流程？已完成的步骤仍算完成，不记废弃')) return;
    D.flows.inst=D.flows.inst.filter(x=>x.id!==f.id);
    save(); closeMini(); renderTasks(); toast('已放弃 · 走过的路都算数');
  });
}
/* ---- mini action sheet ---- */
const mini=$('#mini'), miniScrim=$('#miniScrim');
function openMini(html){ mini.innerHTML=html; mini.classList.add('on'); miniScrim.classList.add('on'); }
function closeMini(){ mini.classList.remove('on'); miniScrim.classList.remove('on'); }
miniScrim.addEventListener('click',closeMini);

function taskActions(v){
  let h=`<h5>${esc(v.name)}</h5>`;
  if(v.kind==='tpl'){
    h+=`<button class="act" data-a="skip">今天跳过（之后照常出现）</button>
        <button class="act" data-a="off">停用此循环任务</button>
        <button class="act danger" data-a="delTpl">删除</button>`;
  } else if(v.type==='span'){
    h+=`<label>修改截止日期（提前延后都可以）</label>
        <input type="date" id="endInput" value="${v.end}" min="${v.start}">
        <button class="act" data-a="saveEnd">保存新截止日期</button>
        <button class="act danger" data-a="delTask">删除任务</button>`;
  } else {
    h+=`<button class="act danger" data-a="delTask">删除任务（不计入废弃）</button>`;
  }
  openMini(h);
  mini.querySelectorAll('.act').forEach(b=>b.addEventListener('click',()=>{
    const a=b.dataset.a;
    if(a==='skip'){ const p=D.tpl.find(x=>x.id===v.id); if(p){p.skip=TODAY; toast('今天跳过，明天照常出现');} }
    else if(a==='off'){ const p=D.tpl.find(x=>x.id===v.id); if(p){p.active=false; toast('已停用，可在设置里重新启用');} }
    else if(a==='delTpl'){ if(!confirm('删除这个循环任务？')) return; D.tpl=D.tpl.filter(x=>x.id!==v.id); toast('已删除'); }
    else if(a==='delTask'){ if(!confirm(`删除任务「${v.name}」？`)) return; D.tasks=D.tasks.filter(t=>t.id!==v.id); toast('已删除'); }
    else if(a==='saveEnd'){
      const ne=$('#endInput').value;
      if(!ne || ne<v.start){ toast('日期不能早于开始日'); return; }
      if(ne<TODAY){ toast('截止日不能早于今天'); return; }
      const t=D.tasks.find(x=>x.id===v.id); if(t){ t.end=ne; toast('截止日期已改为 '+fmtMD(ne)); }
    }
    closeMini(); save(); renderTasks();
  }));
}
/* ---- re-categorize / undo a completed record ---- */
function changeCat(logId,after){
  const l=D.log.find(x=>x.id===logId); if(!l) return;
  const canUndo=l.date===TODAY && l.src!=='flow';
  openMini(`<h5>「${esc(l.name)}」改成哪一类？</h5><div class="catwrap">`+
    D.cats.map(c=>`<button class="chip${c.id===l.cat?' on':''}" data-c="${c.id}" ${c.id===l.cat?`style="background:${catColor(c)};border-color:${catColor(c)}"`:`style="color:${catColor(c)}"`}>${esc(c.n)}</button>`).join('')+`</div>`+
    (canUndo?`<button class="act" data-a="undo" style="margin-top:12px">↩︎ 手滑了 · 撤销完成，让它回到列表</button>`:''));
  mini.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
    l.cat=b.dataset.c; save(); closeMini(); toast('类型已修改'); if(after) after();
  }));
  const ub=mini.querySelector('[data-a="undo"]');
  if(ub) ub.addEventListener('click',()=>{
    D.log=D.log.filter(x=>x.id!==logId);
    D.rw.life=Math.max(0,D.rw.life-1);
    D.rw.counter=Math.max(0,D.rw.counter-1);
    if(l.src==='once') D.tasks.push({id:uid(),name:l.name,cat:l.cat,type:'once',date:TODAY,created:l.cd||TODAY});
    else if(l.src==='span') D.tasks.push({id:uid(),name:l.name,cat:l.cat,type:'span',start:(l.cd&&l.cd<=TODAY)?l.cd:TODAY,end:TODAY,created:l.cd||TODAY});
    else if(l.src==='idle') D.tasks.push({id:uid(),name:l.name,cat:l.cat,type:'idle',created:l.cd||TODAY});
    /* 循环任务：删掉记录后会自动回到今天的列表 */
    save(); closeMini(); toast('已撤销，它回到任务列表了'); if(after) after();
  });
}

/* ---- new task sheet ---- */
let sheetType='once', sheetCat='work', sheetFreq='daily', sheetWd=1, sheetTmpl=null, sheetVar=0;
function renderFlowChoices(){
  const box=$('#tFlowTmpls');
  if(!D.flows.tmpl.length){
    box.innerHTML='<p class="empty" style="padding:6px;text-align:left">还没有模板<br>去 设置 → 工作流模板 建一个</p>';
    $('#tFlowVars').style.display='none';
    return;
  }
  box.innerHTML=D.flows.tmpl.map(t=>{
    const col=catColor(catOf(t.cat));
    return `<button class="chip${t.id===sheetTmpl?' on':''}" data-ft="${t.id}" style="${t.id===sheetTmpl?`background:${col};border-color:${col}`:`color:${col}`}">${esc(t.n)}</button>`;
  }).join('');
  box.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{ sheetTmpl=c.dataset.ft; sheetVar=0; renderFlowChoices(); }));
  const tm=D.flows.tmpl.find(t=>t.id===sheetTmpl);
  const vs=tm?parseFlow(tm.body):[];
  const hasForks=vs.some(v=>v.forks&&v.forks.length);
  if(vs.length>1&&!hasForks){
    $('#tFlowVars').style.display='';
    $('#tFlowVarChips').innerHTML=vs.map((v,i)=>`<button class="chip${i===sheetVar?' on':''}" data-fv="${i}">${esc(v.n||('变体'+(i+1)))}</button>`).join('');
    $('#tFlowVarChips').querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{ sheetVar=+c.dataset.fv; renderFlowChoices(); }));
  } else {
    $('#tFlowVars').style.display='none';
    if(hasForks){
      const fk=vs[0].forks;
      $('#tFlowVars').style.display='';
      $('#tFlowVarChips').innerHTML=`<span style="font-size:12px;color:var(--sub)">${vs[0].steps.length}步前置 → ${fk.length}条路线（${fk.map(f=>f.n).join('／')}），启动后在分叉处选择</span>`;
    }
  }
}
function openSheet(){
  sheetType='once'; sheetCat=(D.cats[0]||{id:'work'}).id; sheetFreq='daily'; sheetWd=1; sheetTmpl=null; sheetVar=0;
  $('#tName').value=''; $('#tFlowNote').value=''; $('#tDate').value=TODAY;
  $('#tStart').value=TODAY; $('#tEnd').value=addDays(TODAY,29);
  $('#tN').value=3; $('#tMd').value=Math.min(28,+TODAY.slice(8,10));
  $$('#tTypePills .pill').forEach(p=>p.classList.toggle('on',p.dataset.t==='once'));
  $$('#freqPills .pill').forEach(p=>p.classList.toggle('on',p.dataset.f==='daily'));
  syncSheetType(); renderSheetCats(); renderWdChips();
  $('#sheet').classList.add('on'); $('#sheetScrim').classList.add('on');
}
function renderWdChips(){
  const days=[[1,'一'],[2,'二'],[3,'三'],[4,'四'],[5,'五'],[6,'六'],[0,'日']];
  $('#tWd').innerHTML=days.map(([v,n])=>`<button class="chip${v===sheetWd?' on':''}" data-w="${v}">周${n}</button>`).join('');
  $$('#tWd .chip').forEach(c=>c.addEventListener('click',()=>{ sheetWd=+c.dataset.w; renderWdChips(); }));
}
function syncFreq(){
  $('#freqN').style.display=sheetFreq==='every'?'':'none';
  $('#freqW').style.display=sheetFreq==='weekly'?'':'none';
  $('#freqM').style.display=sheetFreq==='monthly'?'':'none';
}
$$('#freqPills .pill').forEach(p=>p.addEventListener('click',()=>{
  $$('#freqPills .pill').forEach(x=>x.classList.remove('on')); p.classList.add('on');
  sheetFreq=p.dataset.f; syncFreq();
}));
function closeSheet(){ $('#sheet').classList.remove('on'); $('#sheetScrim').classList.remove('on'); }
$('#fabAdd').addEventListener('click',openSheet);
$('#sheetScrim').addEventListener('click',closeSheet);
$$('#tTypePills .pill').forEach(p=>p.addEventListener('click',()=>{
  $$('#tTypePills .pill').forEach(x=>x.classList.remove('on')); p.classList.add('on');
  sheetType=p.dataset.t; syncSheetType();
}));
function syncSheetType(){
  $('#tDateWrap').style.display=sheetType==='once'?'':'none';
  $('#tSpanWrap').style.display=sheetType==='span'?'':'none';
  $('#tFreqWrap').style.display=sheetType==='daily'?'':'none';
  $('#idleNote').style.display=sheetType==='idle'?'block':'none';
  $('#tFlowWrap').style.display=sheetType==='flow'?'':'none';
  $('#tNameWrap').style.display=sheetType==='flow'?'none':'';
  $('#tCats').parentElement&&($('#tCats').style.display=sheetType==='flow'?'none':'');
  const catLabel=$('#tCats').previousElementSibling;
  if(catLabel) catLabel.style.display=sheetType==='flow'?'none':'';
  if(sheetType==='flow') renderFlowChoices();
  syncFreq(); checkFut();
}
function checkFut(){ $('#futNote').style.display=($('#tDate').value>TODAY)?'block':'none'; }
$('#tDate').addEventListener('change',checkFut);
function renderSheetCats(){
  $('#tCats').innerHTML=D.cats.map(c=>{
    const col=catColor(c);
    return `<button class="chip${c.id===sheetCat?' on':''}" data-c="${c.id}" style="${c.id===sheetCat?`background:${col};border-color:${col}`:''}">${esc(c.n)}</button>`;
  }).join('');
  $$('#tCats .chip').forEach(c=>c.addEventListener('click',()=>{ sheetCat=c.dataset.c; renderSheetCats(); }));
}
$('#tSave').addEventListener('click',()=>{
  if(sheetType==='flow'){
    const tm=D.flows.tmpl.find(t=>t.id===sheetTmpl);
    if(!tm){ toast('先选一个流程模板'); return; }
    const f=spawnFlow(tm,sheetVar,$('#tFlowNote').value);
    if(!f){ toast('这个模板还没有步骤'); return; }
    save(); closeSheet(); renderTasks();
    toast(`流程已开始 · ${tm.n}${f.note?'（'+f.note+'）':''}`);
    return;
  }
  const name=$('#tName').value.trim();
  if(!name){ toast('给任务起个名字吧'); return; }
  if(sheetType==='daily'){
    const p={id:uid(),name,cat:sheetCat,active:true,skip:null,freq:sheetFreq,created:TODAY};
    if(sheetFreq==='every') p.n=Math.min(365,Math.max(2,parseInt($('#tN').value)||3));
    if(sheetFreq==='weekly') p.wd=sheetWd;
    if(sheetFreq==='monthly') p.md=Math.min(31,Math.max(1,parseInt($('#tMd').value)||1));
    D.tpl.push(p);
    toast('循环任务已创建 · '+tplFreqLabel(p));
  } else if(sheetType==='span'){
    const s=$('#tStart').value, e=$('#tEnd').value;
    if(!s||!e||e<s){ toast('检查一下起止日期～'); return; }
    D.tasks.push({id:uid(),name,cat:sheetCat,type:'span',start:s,end:e,created:TODAY});
    toast('跨时段任务已创建');
  } else if(sheetType==='idle'){
    D.tasks.push({id:uid(),name,cat:sheetCat,type:'idle',created:TODAY});
    toast('长期任务已创建，不催你');
  } else {
    const dt=$('#tDate').value||TODAY;
    D.tasks.push({id:uid(),name,cat:sheetCat,type:'once',date:dt,created:TODAY});
    toast(dt>TODAY?`预制成功，${fmtMD(dt)}见`:'任务已创建');
  }
  save(); closeSheet(); renderTasks();
});

/* ================= gacha ================= */
function poolPick(tier){
  const order={A:['A'],B:['B','A'],C:['C','B','A']}[tier];
  for(const k of order){
    const av=D.pools[k].filter(x=>x.rep||!x.used);
    if(av.length){ const it=av[Math.floor(Math.random()*av.length)]; if(!it.rep) it.used=true; return {item:it,from:k}; }
  }
  return null;
}
function gacha(){
  D.rw.life++;
  const m=D.miles.find(x=>x.n===D.rw.life&&!x.c);
  if(m){ m.c=true; D.rw.pend.push({t:'🏆 '+m.t,ts:tsNow()});
    showReward('🏆 里程碑达成！',m.t,`人生累计完成 ${D.rw.life} 件 · 保底大奖`); save(); return; }
  D.rw.counter++;
  const rate=qp.has('win')?100:(D.s.rate||2);
  if(Math.random()*100<rate){
    const c=D.rw.counter;
    const tier=c<=D.s.t1?'A':c<=D.s.t2?'B':'C';
    const r=poolPick(tier);
    if(r){ D.rw.pend.push({t:r.item.t,ts:tsNow()});
      showReward('🎲 抽中了！奖励掉落',r.item.t,`累计完成 ${c} 件 · 命中池 ${r.from} · 计数清零，重新累计`);
    } else {
      D.rw.pend.push({t:'奖励池空啦，记得去设置里补货，这次先记账 ♡',ts:tsNow()});
      showReward('🫙 奖励池空了',`累计 ${c} 件本该掉落一个奖励`,'去 设置 → 奖励抽卡 补充奖励池');
    }
    D.rw.counter=0;
  }
  save();
}
function showReward(title,text,sub){
  $('#rewardTitle').textContent=title;
  $('#rewardText').textContent=text;
  $('#rewardSub').textContent=sub;
  setTimeout(()=>$('#reward').classList.add('on'),650);
}
$('#rewardClaim').addEventListener('click',()=>{
  $('#reward').classList.remove('on');
  toast('已放进「奖励 → 待处理」♡');
  updatePendBadge();
});
function updatePendBadge(){
  const n=D.rw.pend.length, b=$('#pendBdg');
  b.style.display=n?'':'none'; b.textContent=n;
  $('#rwEn').style.display=n?'none':'';
}

/* ---- rewards page ---- */
function renderRewards(){
  $('#rwCounter').textContent=D.rw.counter;
  $('#rwCap').textContent=`每件 ${D.s.rate}% 概率掉落 · 人生累计已完成 ${D.rw.life} 件`;
  const p=$('#pendList');
  p.innerHTML=D.rw.pend.length? D.rw.pend.map((r,i)=>
    `<div class="rw-item p"><div class="tx">${esc(r.t)}<span class="ts2">掉落于 ${fmtDT(r.ts)}</span></div><button data-i="${i}">完成</button></div>`).join('')
    : '<p class="empty">暂时没有待处理的奖励<br>继续完成任务，惊喜在路上</p>';
  $$('#pendList button').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i, r=D.rw.pend.splice(i,1)[0];
    r.dts=tsNow(); D.rw.done.push(r); save(); renderRewards(); updatePendBadge(); toast('奖励兑现，恭喜～');
  }));
  const d=$('#rdoneList');
  d.innerHTML=D.rw.done.length? D.rw.done.slice().reverse().slice(0,30).map(r=>
    `<div class="rw-item d"><div class="tx">${esc(r.t)}<span class="ts2">完成于 ${fmtDT(r.dts)}</span></div></div>`).join('')
    : '<p class="empty">还没有完成过的奖励</p>';
}
RENDER['scr-rewards']=renderRewards;

/* ================= mood ================= */
const slider=$('#moodSlider'), moodValEl=$('#moodVal'), moodNote=$('#moodNote');
function moodColor(v){ return v>0?'var(--sage-deep)':v<0?'var(--mood-negink)':'var(--sub)'; }
function moodDisp(){
  const v=+slider.value;
  moodValEl.textContent=(v>0?'+':v<0?'−':'')+Math.abs(v);
  moodValEl.style.color=moodColor(v);
}
slider.addEventListener('input',moodDisp);
moodNote.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); moodNote.blur(); $('#moodSave').click(); } });
$('#moodSave').addEventListener('click',()=>{
  const v=+slider.value;
  D.moods.push({id:uid(),ts:tsNow(),date:TODAY,v,note:moodNote.value.trim(),src:'mood'});
  moodNote.value='';
  gardenCare(4); gardenBonus();
  save(); drawMood(); renderMoodList(); toast('已记下这一刻');
});
let moodRange='m', pts=[];
$$('#moodPills .pill').forEach(p=>p.addEventListener('click',()=>{
  $$('#moodPills .pill').forEach(x=>x.classList.remove('on')); p.classList.add('on');
  moodRange=p.dataset.range; drawMood();
}));
function moodSeries(){
  const y=TODAY.slice(0,4), mo=TODAY.slice(0,7);
  const buckets={};
  D.moods.forEach(e=>{
    let key=null;
    if(moodRange==='m'){ if(e.date.startsWith(mo)) key=e.date; }
    else { if(e.date.startsWith(y)) key=e.date.slice(0,7); }
    if(key) (buckets[key]=buckets[key]||[]).push(e.v);
  });
  return Object.keys(buckets).sort().map(k=>{
    const arr=buckets[k];
    return {label:moodRange==='m'?fmtMD(k):(+k.slice(5,7))+'月',
      v:Math.round(arr.reduce((a,b)=>a+b,0)/arr.length),
      lo:Math.min.apply(null,arr), hi:Math.max.apply(null,arr)};
  });
}
function drawMood(){
  const svg=$('#moodSvg'); const W=340,H=170,P=14;
  const data=moodSeries();
  const hint=$('#moodHint');
  if(data.length<2){ svg.innerHTML=''; hint.style.display='block'; pts=[];
    if(data.length===1){ hint.style.display='none';
      const css=getComputedStyle(document.body), sage=css.getPropertyValue('--sage').trim();
      svg.innerHTML=`<line x1="${P}" y1="${H/2}" x2="${W-P}" y2="${H/2}" stroke="${css.getPropertyValue('--faint').trim()}" stroke-width="1" stroke-dasharray="3 5" opacity=".7"/>
      <circle cx="${W/2}" cy="${H/2-(data[0].v/100)*(H/2-P)}" r="4.5" fill="${sage}"/>`;
    }
    return;
  }
  hint.style.display='none';
  const n=data.length;
  const x=i=>P+i*(W-2*P)/(n-1);
  const y=v=>H/2-(v/100)*(H/2-P);
  pts=data.map((d,i)=>({x:x(i),y:y(d.v),v:d.v,lo:d.lo,hi:d.hi,label:d.label}));
  function smooth(ps){
    let d='M '+ps[0].x+' '+ps[0].y;
    for(let i=0;i<ps.length-1;i++){
      const p0=ps[Math.max(0,i-1)],p1=ps[i],p2=ps[i+1],p3=ps[Math.min(ps.length-1,i+2)];
      d+=` C ${p1.x+(p2.x-p0.x)/6} ${p1.y+(p2.y-p0.y)/6}, ${p2.x-(p3.x-p1.x)/6} ${p2.y-(p3.y-p1.y)/6}, ${p2.x} ${p2.y}`;
    }
    return d;
  }
  const d=smooth(pts);
  const css=getComputedStyle(document.body);
  const sage=css.getPropertyValue('--sage').trim(), faint=css.getPropertyValue('--faint').trim(), ink=css.getPropertyValue('--sub').trim();
  const last=pts[n-1];
  // range band (day's min~max)
  let band='';
  if(data.some(p=>p.lo!==p.hi)){
    const hiPts=data.map((p,i)=>({x:x(i),y:y(p.hi)}));
    const loPts=data.map((p,i)=>({x:x(i),y:y(p.lo)})).reverse();
    band=`<path d="${smooth(hiPts)} ${smooth(loPts).replace(/^M/,'L')} Z" fill="${sage}" opacity=".16"/>`;
  }
  let mn=0,mx=0; data.forEach((p,i)=>{ if(p.lo<data[mn].lo)mn=i; if(p.hi>data[mx].hi)mx=i; });
  svg.innerHTML=`
    <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sage}" stop-opacity=".22"/><stop offset="1" stop-color="${sage}" stop-opacity="0"/>
    </linearGradient></defs>
    <line x1="${P}" y1="${H/2}" x2="${W-P}" y2="${H/2}" stroke="${faint}" stroke-width="1" stroke-dasharray="3 5" opacity=".7"/>
    ${band||`<path d="${d} L ${last.x} ${H/2} L ${pts[0].x} ${H/2} Z" fill="url(#mg)"/>`}
    <path d="${d}" fill="none" stroke="${sage}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="${last.x}" cy="${last.y}" r="4" fill="${sage}"/>
    <text x="${pts[mx].x}" y="${Math.max(10,y(data[mx].hi)-7)}" font-size="10" fill="${ink}" text-anchor="middle" font-family="Georgia,serif">${data[mx].hi>0?'+':''}${data[mx].hi}</text>
    <text x="${pts[mn].x}" y="${Math.min(H-4,y(data[mn].lo)+14)}" font-size="10" fill="${ink}" text-anchor="middle" font-family="Georgia,serif">${data[mn].lo>0?'+':''}${data[mn].lo}</text>
    <circle id="hoverDot" r="4.5" fill="none" stroke="${sage}" stroke-width="2" style="display:none"/>
    <line id="hoverLine" y1="${P}" y2="${H-P}" stroke="${faint}" stroke-width="1" style="display:none"/>`;
}
const moodSvgEl=$('#moodSvg'), tip=$('#moodTip');
function moodHover(e){
  if(!pts.length) return;
  const r=moodSvgEl.getBoundingClientRect();
  const cx=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
  const sx=cx/r.width*340;
  let best=pts[0]; pts.forEach(p=>{ if(Math.abs(p.x-sx)<Math.abs(best.x-sx)) best=p; });
  const hd=$('#hoverDot'), hl=$('#hoverLine');
  if(hd){ hd.style.display=''; hl.style.display='';
    hd.setAttribute('cx',best.x); hd.setAttribute('cy',best.y);
    hl.setAttribute('x1',best.x); hl.setAttribute('x2',best.x); }
  tip.style.opacity=1;
  tip.style.left=(best.x/340*r.width)+'px';
  tip.style.top=(best.y/170*r.height+16)+'px';
  tip.textContent=`${best.label} · 均 ${best.v>0?'+':''}${best.v}`+((best.lo!==undefined&&best.lo!==best.hi)?`（${best.lo>0?'+':''}${best.lo}~${best.hi>0?'+':''}${best.hi}）`:'');
}
moodSvgEl.addEventListener('pointermove',moodHover);
moodSvgEl.addEventListener('pointerdown',moodHover);
moodSvgEl.addEventListener('pointerleave',()=>{ tip.style.opacity=0; const hd=$('#hoverDot'),hl=$('#hoverLine'); if(hd){hd.style.display='none';hl.style.display='none';} });
function noteTypeOf(id){ return D.notes.types.find(t=>t.id===id) || {id:null,n:'小记',c:0}; }
function renderMoodList(){
  const list=D.moods.slice().sort((a,b)=>b.ts<a.ts?-1:1).slice(0,120);
  $('#moodList').innerHTML=list.length? list.map(m=>{
    const badge=m.src&&m.src!=='mood'?`<span class="badge">${esc(noteTypeOf(m.src).n)}</span>`:'';
    const d=m.date===TODAY?'今天':m.date.slice(5,7)+'.'+m.date.slice(8,10);
    return `<div class="done-item"><span class="tm" style="margin:0;flex:none;width:78px;text-align:left">${d} ${m.ts.slice(11,16)}</span><span class="nm2">${esc(m.note||'')}</span>${badge}<span class="tm" style="color:${moodColor(m.v)};font-weight:600;font-size:12.5px">${m.v>0?'+':m.v<0?'−':''}${Math.abs(m.v)}</span></div>`;
  }).join('') : '<p class="empty">还没有记录<br>滑一下滑杆，写一句，按保存</p>';
}
RENDER['scr-mood']=function(){ moodDisp(); drawMood(); renderMoodList(); };

/* ================= lock (AES-GCM + PBKDF2) ================= */
let lockKey=null; const lockCache=new Map();
function b64enc(u8){ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); }
function b64dec(b){ const s=atob(b); const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i); return u; }
async function deriveLockKey(pw){
  const salt=b64dec(D.s.lockSalt);
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encJSON(key,obj){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(obj))));
  const buf=new Uint8Array(12+ct.length); buf.set(iv); buf.set(ct,12);
  return b64enc(buf);
}
async function decJSON(key,b64){
  const buf=b64dec(b64);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:buf.subarray(0,12)},key,buf.subarray(12));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function decryptAllLocked(){
  for(const e of D.notes.entries){
    if(e.enc&&!lockCache.has(e.id)){
      try{ lockCache.set(e.id, await decJSON(lockKey,e.data)); }catch(err){}
    }
  }
}
function relock(){ lockKey=null; lockCache.clear(); renderNotes(); toast('已重新上锁 🔒'); }
function askUnlock(){
  if(!window.crypto||!crypto.subtle){ toast('此环境不支持加密（正式网址上没问题）'); return Promise.resolve(false); }
  return new Promise(res=>{
    openMini(`<h5>🔒 输入笔记主密码</h5>
      <input type="password" id="lockPw" class="edin" style="background:var(--bg);margin-bottom:10px" placeholder="主密码" autocomplete="off">
      <div style="display:flex;gap:8px">
        <button class="act" data-a="ok" style="flex:1;background:var(--sage);color:#FBFBF6;text-align:center;margin-bottom:0">解锁</button>
        <button class="act" data-a="no" style="flex:1;text-align:center;margin-bottom:0">取消</button>
      </div>`);
    mini.querySelector('[data-a="no"]').addEventListener('click',()=>{ closeMini(); res(false); });
    $('#lockPw').addEventListener('keydown',e=>{ if(e.key==='Enter') mini.querySelector('[data-a="ok"]').click(); });
    mini.querySelector('[data-a="ok"]').addEventListener('click',async()=>{
      const pw=$('#lockPw').value;
      if(!pw) return;
      try{
        const key=await deriveLockKey(pw);
        let ok=false;
        try{ ok=(await decJSON(key,D.s.lockCheck))==='ck'; }catch(e){}
        if(ok){
          lockKey=key;
          await decryptAllLocked();
          closeMini(); renderNotes(); toast('已解锁 · 点筛选栏的 🔓 可重新上锁');
          res(true);
        } else toast('密码不对');
      }catch(e){ toast('解锁出错了'); }
    });
  });
}
function entryView(e){
  if(!e.enc) return e;
  const c=lockCache.get(e.id);
  return c?Object.assign({},e,c,{pending:false}):Object.assign({},e,{title:null,body:'',wx:'',mood:null,pending:true});
}
/* ================= notes ================= */
let noteFilter='all', noteMonth=null, edEntry=null, edType='diary', edMode='edit';
function ntColor(t){ return `var(--p${t&&t.c!==undefined?t.c:0})`; }
function ntTag(id){
  const t=noteTypeOf(id), col=ntColor(t);
  return `<span class="tag ty" style="color:${col};background:color-mix(in srgb, ${col} 12%, var(--card))">${esc(t.n)}</span>`;
}
function stripMD(s){
  return s.replace(/```[\s\S]*?```/g,' ').replace(/[#*>`\-]+/g,'').replace(/\s+/g,' ').trim();
}
function fmtFullDate(ts){ return `${ts.slice(0,4)}年${+ts.slice(5,7)}月${+ts.slice(8,10)}日 · ${ts.slice(11,16)}`; }
function renderNotes(){
  const chips=[['all','全部'],...D.notes.types.map(t=>[t.id,t.n])];
  $('#noteChips').innerHTML=chips.map(([k,n])=>`<button class="chip${k===noteFilter?' on':''}" data-f="${k}">${esc(n)}</button>`).join('')
    +`<button class="calbtn${noteMonth?' on':''}" id="noteCalBtn" aria-label="按月查看"><svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3" x2="8" y2="6.5"/><line x1="16" y1="3" x2="16" y2="6.5"/></svg></button>`;
  if(lockKey) $('#noteChips').innerHTML+= `<button class="calbtn on" id="noteRelock" aria-label="重新上锁">🔓</button>`;
  $$('#noteChips .chip').forEach(c=>c.addEventListener('click',()=>{ noteFilter=c.dataset.f; renderNotes(); }));
  $('#noteCalBtn').addEventListener('click',openMonthPicker);
  if($('#noteRelock')) $('#noteRelock').addEventListener('click',relock);
  let list=D.notes.entries.slice();
  if(noteFilter!=='all') list=list.filter(e=>e.type===noteFilter);
  if(noteMonth) list=list.filter(e=>e.ts.startsWith(noteMonth));
  list.sort((a,b)=>b.ts<a.ts?-1:1);
  const fl=$('#noteFilterLine');
  if(noteMonth){ fl.style.display=''; fl.textContent=`${+noteMonth.slice(0,4)}年${+noteMonth.slice(5,7)}月 · 共 ${list.length} 篇 · 点此清除 ✕`; }
  else fl.style.display='none';
  const showSealed=(typeof ghCfg==='function'&&ghCfg())&&noteFilter==='all'&&!noteMonth;
  const sealedHTML=showSealed?`<div class="wcard" id="herCard" style="cursor:pointer;margin-top:10px"><p style="padding-right:0">🔏 她记 · 妈咪的本子</p>
    <div class="wfoot"><span>${D.herMeta&&D.herMeta.n?esc('已经写了 '+D.herMeta.n+' 篇'+(D.herMeta.last?' · 最近 '+fmtMD(D.herMeta.last):'')):'还空着，妈咪会来写的'}</span><span style="margin-left:auto">只有妈咪能打开</span></div></div>`:'';
  $('#noteList').innerHTML=sealedHTML+(list.length? list.map(raw=>{
    const e=entryView(raw);
    if(e.pending) return `<div class="entry" data-id="${e.id}">
      <div class="emeta"><span>${fmtFullDate(e.ts)}</span>${ntTag(e.type)}</div>
      <h4 class="untitled">🔒 已上锁</h4>
      <div class="ex">轻点解锁查看</div>
    </div>`;
    const mood=(e.mood===0||e.mood)?`<span class="mv" style="color:${moodColor(e.mood)}">${e.mood>0?'+':''}${e.mood}</span>`:'';
    return `<div class="entry" data-id="${e.id}">
      <div class="emeta"><span>${fmtFullDate(e.ts)}</span>${e.wx?`<span>${esc(e.wx)}</span>`:''}${mood}${ntTag(e.type)}</div>
      <h4 class="${e.title?'':'untitled'}">${esc(e.title||'（无题）')}</h4>
      <div class="ex">${esc(stripMD(e.body).slice(0,80))}</div>
    </div>`;
  }).join('') : '<p class="empty">这里还空着<br>点右下角 ＋ 写第一篇</p>');
  if($('#herCard')) $('#herCard').addEventListener('click',()=>toast('这个本子只有妈咪能打开 ♡'));
  $$('#noteList .entry').forEach(el=>el.addEventListener('click',async()=>{
    const e=D.notes.entries.find(x=>x.id===el.dataset.id);
    if(!e) return;
    if(e.enc&&!lockCache.has(e.id)){ const ok=await askUnlock(); if(!ok) return; }
    openEditor(e.type,e,'view');
  }));
}
$('#noteFilterLine').addEventListener('click',()=>{ noteMonth=null; renderNotes(); });
function openMonthPicker(){
  const years=[...new Set(D.notes.entries.map(e=>e.ts.slice(0,4)))];
  const nowY=TODAY.slice(0,4);
  if(!years.includes(nowY)) years.push(nowY);
  years.sort().reverse();
  const yrs=years.slice(0,3);
  let selY=noteMonth?noteMonth.slice(0,4):nowY;
  if(!yrs.includes(selY)) selY=yrs[0];
  function draw(){
    const counts={};
    D.notes.entries.forEach(e=>{
      if((noteFilter==='all'||e.type===noteFilter)&&e.ts.startsWith(selY)){ const m=+e.ts.slice(5,7); counts[m]=(counts[m]||0)+1; }
    });
    openMini(`<h5>按月份查看${noteFilter==='all'?'':' · '+esc(noteTypeOf(noteFilter).n)}</h5>
      <div class="yrtabs">${yrs.map(y=>`<button class="chip${y===selY?' on':''}" data-y="${y}">${y}</button>`).join('')}<button class="chip" data-y="_clear" style="margin-left:auto">全部时间</button></div>
      <div class="mgrid">${Array.from({length:12},(_,i)=>{
        const m=i+1, n=counts[m]||0;
        const key=selY+'-'+String(m).padStart(2,'0');
        return `<div class="mcell${n?'':' off'}${noteMonth===key?' on':''}" data-m="${key}">${m}月<small>${n?n+' 篇':'—'}</small></div>`;
      }).join('')}</div>`);
    mini.querySelectorAll('[data-y]').forEach(b=>b.addEventListener('click',()=>{
      if(b.dataset.y==='_clear'){ noteMonth=null; closeMini(); renderNotes(); return; }
      selY=b.dataset.y; draw();
    }));
    mini.querySelectorAll('.mcell:not(.off)').forEach(c=>c.addEventListener('click',()=>{
      noteMonth=c.dataset.m; closeMini(); renderNotes();
    }));
  }
  draw();
}
/* markdown mini renderer */
function mdRender(src){
  const blocks=[];
  let s=esc(src);
  s=s.replace(/```([\s\S]*?)```/g,(m,c)=>{ blocks.push('<pre>'+c.replace(/^\n+|\n+$/g,'')+'</pre>'); return '\u0000'+(blocks.length-1)+'\u0000'; });
  s=s.replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/\*([^*\n]+)\*/g,'<i>$1</i>').replace(/`([^`\n]+)`/g,'<code>$1</code>');
  s=s.split('\n').map(line=>{
    const t=line.trim();
    if(/^### /.test(t)) return '<h3>'+t.slice(4)+'</h3>';
    if(/^## /.test(t)) return '<h2>'+t.slice(3)+'</h2>';
    if(/^# /.test(t)) return '<h1>'+t.slice(2)+'</h1>';
    if(/^(---|\*\*\*)\s*$/.test(t)) return '<hr>';
    if(/^&gt; /.test(t)) return '<blockquote>'+t.slice(5)+'</blockquote>';
    if(/^[-•] /.test(t)) return '<li>'+t.slice(2)+'</li>';
    if(t==='') return '\u0001';
    return line+'<br>';
  }).join('');
  s=s.replace(/(?:<li>.*?<\/li>)+/g, m=>'<ul>'+m+'</ul>');
  s='<p>'+s.replace(/\u0001+/g,'</p><p>')+'</p>';
  s=s.replace(/<p><\/p>/g,'').replace(/<br><\/p>/g,'</p>');
  s=s.replace(/\u0000(\d+)\u0000/g,(m,i)=>blocks[+i]);
  return s;
}
/* editor */
function setEdMode(m){
  edMode=m;
  $$('#nedPills .pill').forEach(p=>p.classList.toggle('on',p.dataset.m===m));
  $('#nBody2').style.display=m==='edit'?'':'none';
  const v=$('#nView');
  if(m==='view'){ v.style.display=''; v.innerHTML=mdRender($('#nBody2').value||'*（还没写正文）*'); }
  else v.style.display='none';
}
$$('#nedPills .pill').forEach(p=>p.addEventListener('click',()=>setEdMode(p.dataset.m)));
let importTs=null, edSnap='';
function edState(){ return JSON.stringify([$('#nTitle2').value,$('#nWx').value,$('#nMood').value,$('#nBody2').value]); }
function openEditor(type,entry,mode){
  importTs=null;
  edType=type; edEntry=entry||null;
  const v=entry?entryView(entry):null;
  const t=noteTypeOf(type);
  $('#nedType').textContent=t.n+(t.locked?' 🔒':'');
  $('#nTitle2').value=v?v.title||'':'';
  $('#nWx').value=v?v.wx||'':'';
  $('#nMood').value=(v&&(v.mood===0||v.mood))?v.mood:'';
  $('#nSign').style.color=String($('#nMood').value).startsWith('-')?'var(--mood-negink)':'var(--sub)';
  $('#nBody2').value=v?v.body:'';
  $('#nDel2').style.display=entry?'':'none';
  setEdMode(mode||'edit');
  edSnap=edState();
  go('scr-nedit');
}
$('#nedBack').addEventListener('click',()=>{
  if(edState()!==edSnap && !confirm('这一稿还没保存，确定不要了吗？')) return;
  go('scr-notes'); renderNotes();
});
$('#nSign').addEventListener('click',()=>{
  const m=$('#nMood');
  m.value=m.value.startsWith('-')?m.value.slice(1):('-'+m.value);
  $('#nSign').style.color=m.value.startsWith('-')?'var(--mood-negink)':'var(--sub)';
});
$('#fabNote').addEventListener('click',()=>{
  openMini(`<h5>写哪一类？</h5><div class="catwrap">`+D.notes.types.map(t=>`<button class="chip" data-t="${t.id}" style="color:${ntColor(t)}">${esc(t.n)}${t.locked?' 🔒':''}</button>`).join('')+`</div>`);
  mini.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',async()=>{
    closeMini();
    const t=noteTypeOf(b.dataset.t);
    if(t.locked&&!lockKey){ const ok=await askUnlock(); if(!ok) return; }
    openEditor(b.dataset.t,null,'edit');
  }));
});
$('#nSave2').addEventListener('click',async()=>{
  const body=$('#nBody2').value.trim();
  if(!body){ toast('正文还是空的～'); return; }
  let mood=null; const mv=$('#nMood').value.trim();
  if(mv!==''){
    mood=parseInt(mv.replace('−','-').replace('＋','+'),10);
    if(isNaN(mood)){ toast('心情要填 −100 ~ 100 的数字'); return; }
    mood=Math.max(-100,Math.min(100,mood));
  }
  const title=$('#nTitle2').value.trim(), wx=$('#nWx').value.trim();
  const typeId=edEntry?edEntry.type:edType;
  const locked=!!noteTypeOf(typeId).locked;
  if(locked&&!lockKey){ const ok=await askUnlock(); if(!ok) return; }
  const mnoteText=locked?'🔒':(title||stripMD(body).slice(0,20));
  const syncMood=(e)=>{
    if(mood===null){
      if(e.moodId){ D.moods=D.moods.filter(m=>m.id!==e.moodId); e.moodId=null; }
    } else {
      const lm=e.moodId&&D.moods.find(m=>m.id===e.moodId);
      if(lm){ lm.v=mood; lm.note=mnoteText; }
      else { const id=uid(); D.moods.push({id,ts:e.ts,date:e.ts.slice(0,10),v:mood,note:mnoteText,src:typeId}); e.moodId=id; }
    }
  };
  if(edEntry){
    if(locked){
      const payload={title,wx,body,mood};
      try{ edEntry.data=await encJSON(lockKey,payload); }catch(err){ toast('加密失败，未保存'); return; }
      edEntry.enc=true;
      delete edEntry.title; delete edEntry.wx; delete edEntry.body; delete edEntry.mood;
      lockCache.set(edEntry.id,payload);
    } else {
      edEntry.title=title; edEntry.wx=wx; edEntry.body=body; edEntry.mood=mood;
    }
    syncMood(edEntry);
    toast('已保存修改');
  } else {
    const e={id:uid(),type:edType,ts:importTs||tsNow(),moodId:null};
    if(locked){
      const payload={title,wx,body,mood};
      try{ e.data=await encJSON(lockKey,payload); }catch(err){ toast('加密失败，未保存'); return; }
      e.enc=true;
      lockCache.set(e.id,payload);
    } else {
      e.title=title; e.wx=wx; e.body=body; e.mood=mood;
    }
    syncMood(e);
    D.notes.entries.push(e);
    gardenCare(2); if(mood!==null) gardenCare(4); gardenBonus();
    toast(importTs?'已导入并保存':(locked?'已加密保存 🔒':'已保存'));
    importTs=null;
  }
  save(); go('scr-notes'); renderNotes();
});
$('#nDel2').addEventListener('click',()=>{
  if(!edEntry||!confirm('删除这一篇？'))return;
  if(edEntry.moodId) D.moods=D.moods.filter(m=>m.id!==edEntry.moodId);
  D.notes.entries=D.notes.entries.filter(x=>x.id!==edEntry.id);
  edEntry=null; save(); go('scr-notes'); renderNotes(); toast('已删除');
});
/* ---- import (md/txt/docx) ---- */
let impType='her';
$('#noteImport').addEventListener('click',()=>{
  openMini(`<h5>导入到哪一类？（支持 .md / .txt / .docx）</h5><div class="catwrap">`+
    D.notes.types.map(t=>`<button class="chip" data-t="${t.id}" style="color:${ntColor(t)}">${esc(t.n)}</button>`).join('')+`</div>`);
  mini.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
    impType=b.dataset.t; closeMini();
    $('#noteFile').value=''; $('#noteFile').click();
  }));
});
async function docxToText(file){
  const buf=new Uint8Array(await file.arrayBuffer());
  const dv=new DataView(buf.buffer);
  let i=0, xml=null;
  while(i<buf.length-30){
    if(dv.getUint32(i,true)!==0x04034b50) break;
    const flags=dv.getUint16(i+6,true);
    const comp=dv.getUint16(i+8,true);
    const csize=dv.getUint32(i+18,true);
    const nlen=dv.getUint16(i+26,true);
    const elen=dv.getUint16(i+28,true);
    const name=new TextDecoder().decode(buf.subarray(i+30,i+30+nlen));
    const dataStart=i+30+nlen+elen;
    if(name==='word/document.xml'){
      if((flags&8)&&!csize) throw new Error('streamed');
      const raw=buf.subarray(dataStart,dataStart+csize);
      let bytes;
      if(comp===0) bytes=raw;
      else {
        const ds=new DecompressionStream('deflate-raw');
        bytes=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer());
      }
      xml=new TextDecoder().decode(bytes);
      break;
    }
    if(!csize&&(flags&8)) throw new Error('streamed');
    i=dataStart+csize;
  }
  if(!xml) throw new Error('nodoc');
  const paras=[...xml.matchAll(/<w:p[ \/>][\s\S]*?(?:<\/w:p>|\/>)/g)].map(m=>
    [...m[0].matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(t=>t[1]).join('')
  );
  return paras.join('\n')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'")
    .replace(/&#(\d+);/g,(m,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&')
    .replace(/\n{3,}/g,'\n\n').trim();
}
$('#noteFile').addEventListener('change',async e=>{
  const f=e.target.files[0]; if(!f) return;
  try{
    let body;
    if(/\.docx$/i.test(f.name)) body=await docxToText(f);
    else body=(await f.text()).replace(/\r\n/g,'\n').trim();
    if(!body){ toast('文件是空的？'); return; }
    let title=f.name.replace(/\.(md|txt|docx)$/i,'').slice(0,40);
    const fm=body.match(/^#\s+(.+)\n+/);
    if(fm){ title=fm[1].trim().slice(0,40); body=body.slice(fm[0].length); }
    const ts=f.lastModified?new Date(f.lastModified):null;
    if(noteTypeOf(impType).locked&&!lockKey){ const ok=await askUnlock(); if(!ok){ toast('已取消导入'); return; } }
    openEditor(impType,null,'edit');
    $('#nTitle2').value=title;
    $('#nBody2').value=body;
    if(ts&&!isNaN(ts)){
      const pad=n=>String(n).padStart(2,'0');
      importTs=`${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())}T${pad(ts.getHours())}:${pad(ts.getMinutes())}`;
    }
    toast('已读入，过目后记得保存'+(importTs?' · 日期取自文件：'+fmtMD(importTs.slice(0,10)):''));
  }catch(err){
    toast('这个文件我啃不动，试试另存为 txt 或 md 再导');
  }
});
RENDER['scr-notes']=renderNotes;

/* ================= cycle ================= */
let calY=+TODAY.slice(0,4), calM=+TODAY.slice(5,7), selDay=TODAY;
const cycSet=()=>new Set(D.cyc);
function periods(){
  const arr=[...D.cyc].sort(); const runs=[];
  arr.forEach(d=>{
    const lastRun=runs[runs.length-1];
    if(lastRun && diffDays(lastRun.end,d)===1) lastRun.end=d;
    else runs.push({start:d,end:d});
  });
  return runs;
}
function cycleInfo(){
  const runs=periods();
  if(!runs.length) return {runs};
  const lastRun=runs[runs.length-1];
  const diffs=[];
  for(let i=1;i<runs.length;i++){ const df=diffDays(runs[i-1].start,runs[i].start); if(df>=15&&df<=60) diffs.push(df); }
  const avg=diffs.length?Math.round(diffs.slice(-6).reduce((a,b)=>a+b,0)/Math.min(diffs.length,6)):28;
  const lens=runs.slice(-4).map(r=>diffDays(r.start,r.end)+1);
  const avgLen=Math.round(lens.reduce((a,b)=>a+b,0)/lens.length)||6;
  const next=addDays(lastRun.start,avg);
  return {runs,lastRun,avg,avgLen,next,ovuStart:addDays(next,-15),ovuEnd:addDays(next,-13)};
}
function renderCycle(){
  const info=cycleInfo();
  const marks=cycSet();
  $('#calTitle').textContent=`${calY}年${calM}月`;
  const g=$('#calGrid'); g.innerHTML='';
  ['一','二','三','四','五','六','日'].forEach(w=>{ const d=document.createElement('div'); d.className='wd'; d.textContent=w; g.appendChild(d); });
  const first=new Date(calY,calM-1,1);
  let off=(first.getDay()+6)%7;
  for(let i=0;i<off;i++) g.appendChild(document.createElement('div'));
  const dim=new Date(calY,calM,0).getDate();
  for(let dd=1;dd<=dim;dd++){
    const iso=`${calY}-${String(calM).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
    const el=document.createElement('div'); el.className='day'; el.textContent=dd;
    if(marks.has(iso)) el.classList.add('period');
    else if(info.next && iso>=info.next && iso<addDays(info.next,info.avgLen)) el.classList.add('pred');
    else if(info.ovuStart && iso>=info.ovuStart && iso<=info.ovuEnd) el.classList.add('ovu');
    if(iso===TODAY) el.classList.add('today');
    if(iso===selDay) el.classList.add('sel');
    el.addEventListener('click',()=>{ selDay=iso; renderCycle(); });
    g.appendChild(el);
  }
  $('#selDayLabel').textContent=(selDay===TODAY?'今日':fmtMD(selDay))+'生理期';
  $('#cycSwitch').classList.toggle('on',marks.has(selDay));
  $('#cycLast').textContent=info.lastRun?`${fmtMD(info.lastRun.start)} – ${fmtMD(info.lastRun.end)} · ${diffDays(info.lastRun.start,info.lastRun.end)+1}天`:'—';
  $('#cycAvg').textContent=info.avg?info.avg+' 天':'—';
  $('#cycNext').textContent=info.next?`${fmtMD(info.next)} · ${diffDays(TODAY,info.next)>=0?'还有 '+diffDays(TODAY,info.next)+' 天':'可能迟到了'}`:'—';
}
$('#calPrev').addEventListener('click',()=>{ calM--; if(calM<1){calM=12;calY--;} renderCycle(); });
$('#calNext').addEventListener('click',()=>{ calM++; if(calM>12){calM=1;calY++;} renderCycle(); });
$('#cycSwitch').addEventListener('click',()=>{
  const i=D.cyc.indexOf(selDay);
  if(i>=0){ D.cyc.splice(i,1); toast('已取消标记'); }
  else { D.cyc.push(selDay); toast('已标记经期'); }
  save(); renderCycle();
});
RENDER['scr-cycle']=renderCycle;

/* ================= words ================= */
let wTab='mom', wPer='all', wDt='any';
const PERIODS=[['all','全时段'],['morning','清晨'],['noon','中午'],['afternoon','下午'],['evening','傍晚'],['late','深夜']];
const PERNAME=Object.fromEntries(PERIODS);
const DTS=[['any','通用'],['work','工作日'],['rest','休息日'],['date','特定日期']];
const DTNAME=Object.fromEntries(DTS);
function dtLabel(w){
  if(!w.dt||w.dt==='any') return '';
  if(w.dt==='date'&&w.date) return (+w.date.slice(0,2))+'.'+(+w.date.slice(3,5));
  return DTNAME[w.dt]||'';
}
const WHINTS={
  mom:'可选日期条件＋时段，特定日期当天独占。点已存的卡片可以修改条件。',
  essay:'和「妈咪说」一起参与抽取，同样支持日期条件和时段。点卡片可修改条件。',
  open:'开屏语单独管理，不参与话语集抽取。深夜的句子只在深夜出现，点卡片可改时段。'
};
function renderWords(){
  $('#wHint').textContent=WHINTS[wTab];
  $('#wInput').placeholder=wTab==='mom'?'妈咪说了什么…':wTab==='essay'?'记一句好句子…':'写一句开屏语…';
  const wp=$('#wPeriod'), wdt=$('#wDt');
  wp.style.display='';
  wp.innerHTML=PERIODS.map(([k,n])=>`<button class="chip${k===wPer?' on':''}" data-p="${k}">${n}</button>`).join('');
  wp.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{ wPer=c.dataset.p; renderWords(); }));
  if(wTab!=='open'){
    wdt.style.display='';
    wdt.innerHTML=DTS.map(([k,n])=>`<button class="chip${k===wDt?' on':''}" data-dt="${k}">${n}</button>`).join('');
    wdt.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{ wDt=c.dataset.dt; renderWords(); }));
    $('#wDateWrap').style.display=wDt==='date'?'':'none';
    if(!$('#wDate').value) $('#wDate').value=TODAY;
  } else { wdt.style.display='none'; $('#wDateWrap').style.display='none'; }
  const arr=D.words[wTab];
  $('#wList').innerHTML=arr.length? arr.map((w,i)=>`
    <div class="wcard" data-wi="${i}" style="cursor:pointer"><p>${esc(w.t)}${w.t2?`<br><span style="font-size:12.5px;color:var(--sub)">${esc(w.t2)}</span>`:''}</p>
      <div class="wfoot"><span>${esc(w.d||'')}</span>
        ${dtLabel(w)?`<span>${dtLabel(w)}</span>`:''}
        ${(w.p&&w.p!=='all')?`<span>${PERNAME[w.p]}</span>`:''}
        ${wTab==='open'?`<span class="status seen" style="margin-left:auto">${PERNAME[w.p||'all']}</span>`:`<span class="status ${w.seen?'seen':''}"><i></i>${w.seen?'已显示':'未显示'}</span>`}
      </div>
      <button class="wdel" data-i="${i}">×</button>
    </div>`).join('') : '<p class="empty">还没有内容，添加第一句吧</p>';
  $$('#wList .wdel').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();
    if(confirm('删除这一句？')){ D.words[wTab].splice(+b.dataset.i,1); save(); renderWords(); }
  }));
  $$('#wList .wcard').forEach(el=>el.addEventListener('click',()=>editWordCond(+el.dataset.wi)));
}
$('#wBatch').addEventListener('click',()=>{
  const tabN=wTab==='mom'?'妈咪说':wTab==='essay'?'随笔':'开屏语';
  const condLbl=(wTab!=='open'?DTNAME[wDt]+' · ':'')+PERNAME[wPer];
  openMini(`<h5>批量导入到「${tabN}」 · 条件：${condLbl}（先在上面选好条件再来）</h5>
    <label>一行一句；双语在一行里用｜隔开（英文｜中文）</label>
    <textarea id="batchTa" placeholder="慢慢来，别急。&#10;Begin anywhere.｜从任何地方开始。" style="width:100%;min-height:160px;border:1px solid var(--line);background:var(--bg);border-radius:12px;padding:11px 13px;font-size:13.5px;color:var(--ink);font-family:var(--sans);outline:none;line-height:1.8;resize:vertical"></textarea>
    <button class="act" data-a="go" style="background:var(--sage);color:#FBFBF6;text-align:center;margin-top:10px">导入</button>`);
  mini.querySelector('[data-a="go"]').addEventListener('click',()=>{
    const lines=$('#batchTa').value.split('\n').map(s=>s.trim()).filter(Boolean);
    if(!lines.length){ toast('还没贴东西呢'); return; }
    let n=0;
    lines.forEach(line=>{
      const parts=line.split(/[｜|]/).map(s=>s.trim()).filter(Boolean);
      if(!parts[0]) return;
      const item={t:parts[0].slice(0,120),d:fmtMD(TODAY),seen:false,p:wPer};
      if(parts[1]) item.t2=parts[1].slice(0,120);
      if(wTab!=='open'){
        item.dt=wDt;
        if(wDt==='date'){ const dv=$('#wDate').value; if(dv) item.date=dv.slice(5); }
      }
      D.words[wTab].push(item); n++;
    });
    save(); closeMini(); renderWords(); toast('已导入 '+n+' 句 · '+condLbl);
  });
});
function editWordCond(idx){
  const w=D.words[wTab][idx]; if(!w) return;
  const isOpen=wTab==='open';
  let edt=w.dt||'any', eper=w.p||'all';
  function draw(){
    let h=`<h5>「${esc(w.t.length>16?w.t.slice(0,16)+'…':w.t)}」 · 修改条件</h5>`;
    if(!isOpen){
      h+=`<label>日期条件</label><div class="catwrap" style="margin-bottom:10px">`+DTS.map(([k,n])=>`<button class="chip${k===edt?' on':''}" data-edt="${k}">${n}</button>`).join('')+`</div>`;
      if(edt==='date') h+=`<input type="date" id="eDate" value="${TODAY.slice(0,4)}-${w.date||TODAY.slice(5)}">`;
    }
    h+=`<label>时段</label><div class="catwrap" style="margin-bottom:12px">`+PERIODS.map(([k,n])=>`<button class="chip${k===eper?' on':''}" data-eper="${k}">${n}</button>`).join('')+`</div>`;
    h+=`<button class="act" data-a="save" style="background:var(--sage);color:#FBFBF6;text-align:center">保存修改</button>`;
    openMini(h);
    mini.querySelectorAll('[data-edt]').forEach(b=>b.addEventListener('click',()=>{ edt=b.dataset.edt; draw(); }));
    mini.querySelectorAll('[data-eper]').forEach(b=>b.addEventListener('click',()=>{ eper=b.dataset.eper; draw(); }));
    mini.querySelector('[data-a="save"]').addEventListener('click',()=>{
      if(!isOpen){
        w.dt=edt;
        if(edt==='date'){
          const dv=$('#eDate').value;
          if(!dv){ toast('特定日期要选个日子呀'); return; }
          w.date=dv.slice(5);
        } else delete w.date;
      }
      w.p=eper;
      save(); closeMini(); renderWords(); toast('条件已更新');
    });
  }
  draw();
}
$$('#wTabs .pill').forEach(p=>p.addEventListener('click',()=>{
  $$('#wTabs .pill').forEach(x=>x.classList.remove('on')); p.classList.add('on');
  wTab=p.dataset.w; renderWords();
}));
$('#wAdd').addEventListener('click',()=>{
  const t=$('#wInput').value.trim(); if(!t){ toast('先写第一行～'); return; }
  const t2=$('#wInput2').value.trim();
  const item={t,d:fmtMD(TODAY),seen:false,p:wPer};
  if(t2) item.t2=t2;
  if(wTab!=='open'){
    item.dt=wDt;
    if(wDt==='date'){
      const dv=$('#wDate').value;
      if(!dv){ toast('特定日期要选个日子呀'); return; }
      item.date=dv.slice(5);
    }
  }
  D.words[wTab].push(item);
  $('#wInput').value=''; $('#wInput2').value='';
  save(); renderWords();
  const lbl=[wTab!=='open'?DTNAME[wDt]:null, PERNAME[wPer]].filter(Boolean).join(' · ');
  toast('已添加 · '+lbl);
});
RENDER['scr-words']=renderWords;

/* ================= records ================= */
let recR='m', recF='all', recD=TODAY, recM=TODAY.slice(0,7), recY=TODAY.slice(0,4);
function inRange(dateStr){
  if(recR==='d') return dateStr===recD;
  if(recR==='m') return dateStr.startsWith(recM);
  return dateStr.startsWith(recY);
}
function shiftMonth(ym,delta){
  let y=+ym.slice(0,4), m=+ym.slice(5,7)+delta;
  while(m<1){m+=12;y--;} while(m>12){m-=12;y++;}
  return y+'-'+String(m).padStart(2,'0');
}
function recLabel(){
  if(recR==='d') return recD===TODAY?'今日':fmtMD(recD);
  if(recR==='m') return (recM===TODAY.slice(0,7)?'':recM.slice(0,4)+'年')+(+recM.slice(5,7))+'月';
  return recY+'年';
}
$('#dPrev').addEventListener('click',()=>{
  if(recR==='d') recD=addDays(recD,-1);
  else if(recR==='m') recM=shiftMonth(recM,-1);
  else recY=String(+recY-1);
  renderRecords();
});
$('#dNext').addEventListener('click',()=>{
  if(recR==='d'){ if(recD<TODAY) recD=addDays(recD,1); }
  else if(recR==='m'){ if(recM<TODAY.slice(0,7)) recM=shiftMonth(recM,1); }
  else { if(recY<TODAY.slice(0,4)) recY=String(+recY+1); }
  renderRecords();
});
function renderRecords(){
  $('#dayNav').style.display='flex';
  $('#dLabel').textContent=recLabel()+((recR==='d'&&recD===TODAY)?' · 今天':'');
  const logs=D.log.filter(l=>inRange(l.date));
  const discs=D.disc.filter(d=>inRange(d.date));
  $('#recBig').textContent=logs.length;
  $('#recDim').textContent='件 · '+recLabel()+'完成';
  const tot=logs.length+discs.length;
  $('#recCap').textContent=`废弃 ${discs.length} 件`+(tot?` · 完成率 ${Math.round(logs.length/tot*100)}%`:'');
  // by type
  const counts={};
  logs.forEach(l=>{ const k=l.cat||'_none'; counts[k]=(counts[k]||0)+1; });
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const max=entries.length?entries[0][1]:1;
  $('#catStats').innerHTML=entries.length? entries.map(([k,n])=>{
    const c=k==='_none'?{n:'未分类',c:-1}:catOf(k);
    return `<div class="cs"><span class="nm">${esc(c.n)}</span><span class="track"><i style="width:${Math.round(n/max*100)}%;background:${catColor(c)}"></i></span><span class="n">${n}</span></div>`;
  }).join('') : '<p class="empty">这个时间段还没有完成记录</p>';
  // chips
  if(recF!=='all'&&recF!=='disc'&&!D.cats.find(c=>c.id===recF)) recF='all';
  const chips=[['all','全部'],...D.cats.map(c=>[c.id,c.n]),['disc','废弃清单']];
  $('#recChips').innerHTML=chips.map(([k,n])=>`<button class="chip${k===recF?' on':''}" data-f="${k}">${esc(n)}</button>`).join('');
  $$('#recChips .chip').forEach(c=>c.addEventListener('click',()=>{ recF=c.dataset.f; renderRecords(); }));
  // list
  if(recF==='disc'){
    $('#recListLabel').textContent='废弃清单 · 当日未完成自动归档';
    $('#recList').innerHTML=discs.length? discs.slice().reverse().slice(0,60).map(d=>
      `<div class="done-item" style="opacity:.72"><span class="dot" style="background:var(--faint)"></span><span class="nm2">${esc(d.name)}</span>${tagHTML(d.cat)}<span class="tm">${d.date.slice(5,7)}.${d.date.slice(8,10)}</span></div>`).join('')
      : '<p class="empty">没有废弃的任务，了不起</p>';
  } else {
    $('#recListLabel').textContent='完成清单 · 点一条可修改类型';
    const fl=recF==='all'?logs:logs.filter(l=>l.cat===recF);
    const {vis:rVis}=groupFlowLogs(fl,recR==='d'&&recD===TODAY);
    const rl=$('#recList');
    if(!rVis.length){ rl.innerHTML='<p class="empty">这里还空着</p>'; }
    else {
      rl.innerHTML=rVis.slice().reverse().slice(0,60).map(v=>{
        if(v.t==='s'){ const l=v.l; return `<div class="done-item" data-id="${l.id}" style="cursor:pointer"><span class="dot" style="background:${dotColor(l.cat)}"></span><span class="nm2">${esc(l.name)}</span>${tagHTML(l.cat)}<span class="tm">${(l.cd&&l.cd!==l.date)?l.cd.slice(5,7)+'.'+l.cd.slice(8,10)+'→':''}${fmtDT(l.ts)}</span></div>`; }
        const g=v.g;
        return `<div class="done-item flow-gp" data-fid="${v.fid}" style="cursor:pointer"><span class="dot" style="background:${dotColor(g.cat)}"></span><span class="nm2">${esc(g.fn)}</span>${tagHTML(g.cat)}<span class="tm">${g.items.length}步 · ${fmtDT(g.ts)} <span class="fexp">▸</span></span></div>`+
          `<div class="flow-sub" data-fid="${v.fid}" style="display:none">`+g.items.map(l=>
            `<div class="done-item"><span class="dot" style="background:${dotColor(l.cat)}"></span><span class="nm2">${esc(flowStepName(l.name))}</span><span class="tm">${(l.cd&&l.cd!==l.date)?l.cd.slice(5,7)+'.'+l.cd.slice(8,10)+'→':''}${fmtDT(l.ts)}</span></div>`
          ).join('')+`</div>`;
      }).join('');
      $$('#recList .done-item[data-id]').forEach(el=>el.addEventListener('click',()=>changeCat(el.dataset.id,renderRecords)));
      $$('#recList .flow-gp').forEach(el=>el.addEventListener('click',()=>{
        const sub=rl.querySelector(`.flow-sub[data-fid="${el.dataset.fid}"]`);
        if(sub){ sub.style.display=sub.style.display==='none'?'':'none'; el.classList.toggle('open'); }
      }));
    }
  }
}
$$('#recRange .pill').forEach(p=>p.addEventListener('click',()=>{
  $$('#recRange .pill').forEach(x=>x.classList.remove('on')); p.classList.add('on');
  recR=p.dataset.r; renderRecords();
}));
$('#recExport').addEventListener('click',()=>{
  const logs=D.log.filter(l=>inRange(l.date));
  let title, rows;
  if(recF==='disc'){
    const discs=D.disc.filter(d=>inRange(d.date));
    title=`小记 · 废弃清单（${recLabel()}）`;
    rows=discs.map(d=>`${d.date.slice(5,7)}.${d.date.slice(8,10)}　${d.name}${d.cat?'（'+catOf(d.cat).n+'）':''}`);
  } else {
    const fl=recF==='all'?logs:logs.filter(l=>l.cat===recF);
    title=`小记 · 完成记录（${recLabel()}${recF==='all'?'':' · '+catOf(recF).n}）`;
    rows=fl.map(l=>`${(l.cd&&l.cd!==l.date)?'建'+l.cd.slice(5,7)+'.'+l.cd.slice(8,10)+' → ':''}${fmtDT(l.ts)}　${l.name}${(recF==='all'&&l.cat)?'（'+catOf(l.cat).n+'）':''}`);
  }
  if(!rows.length){ toast('这个视图是空的，没什么可导'); return; }
  const text=title+'\n'+rows.join('\n')+'\n—— 共 '+rows.length+' 件';
  const done=()=>toast('已复制到剪贴板，去粘贴吧');
  const fail=()=>{
    const blob=new Blob([text],{type:'text/plain'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='小记导出-'+TODAY.replaceAll('-','')+'.txt';
    document.body.appendChild(a); a.click(); a.remove();
    toast('剪贴板不可用，已改为下载文件');
  };
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done,fail);
  else fail();
});
RENDER['scr-records']=renderRecords;

/* ================= settings ================= */
function poolText(k){ return D.pools[k].map(x=>(x.rep?'*':'')+x.t).join('\n'); }
function parsePool(txt,old){
  return txt.split('\n').map(s=>s.trim()).filter(Boolean).map(line=>{
    const rep=line.startsWith('*');
    const t=rep?line.slice(1).trim():line;
    const prev=old.find(o=>o.t===t);
    return {t,rep,used:prev?prev.used&&!rep:false};
  });
}
function renderSettings(){
  $('#setNick').value=D.s.nick;
  // theme chips
  $$('#themeChips .chip').forEach(c=>c.classList.toggle('on',c.dataset.th===D.s.theme));
  $$('#taskStyleChips .chip').forEach(c=>c.classList.toggle('on',c.dataset.ts===D.s.taskStyle));
  // note types
  $('#ntList').innerHTML=D.notes.types.map((t,i)=>`
    <div class="tpl-row"><span class="sp">${esc(t.n)}${t.locked?' 🔒':''}<span style="color:var(--faint);font-size:11px">&ensp;${D.notes.entries.filter(e=>e.type===t.id).length} 篇</span></span>
      ${D.s.lockSalt?`<button data-a="l" data-i="${i}">${t.locked?'解除锁':'上锁'}</button>`:''}
      <button data-a="r" data-i="${i}">改名</button>
      <button data-a="x" data-i="${i}">删除</button></div>`).join('');
  $$('#ntList button').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i, t=D.notes.types[i];
    if(b.dataset.a==='r'){
      const nn=prompt('新名称（最多4字）',t.n);
      if(nn&&nn.trim()){ t.n=nn.trim().slice(0,4); save(); renderSettings(); }
    } else if(b.dataset.a==='l'){
      (async()=>{
        if(!lockKey){ const ok=await askUnlock(); if(!ok) return; }
        if(!t.locked){
          for(const e of D.notes.entries){
            if(e.type===t.id&&!e.enc){
              const payload={title:e.title||'',wx:e.wx||'',body:e.body||'',mood:(e.mood===0||e.mood)?e.mood:null};
              try{ e.data=await encJSON(lockKey,payload); }catch(err){ toast('加密出错，已中止'); return; }
              e.enc=true; lockCache.set(e.id,payload);
              delete e.title; delete e.wx; delete e.body; delete e.mood;
            }
          }
          t.locked=true; toast(`「${t.n}」已上锁，内容已加密`);
        } else {
          for(const e of D.notes.entries){
            if(e.type===t.id&&e.enc){
              let p=lockCache.get(e.id);
              if(!p){ try{ p=await decJSON(lockKey,e.data); }catch(err){ p=null; } }
              if(p){ Object.assign(e,p); delete e.enc; delete e.data; lockCache.delete(e.id); }
            }
          }
          t.locked=false; toast(`「${t.n}」已解除上锁，恢复明文`);
        }
        save(); renderSettings();
      })();
    } else {
      if(D.notes.types.length<=1){ toast('至少保留一个分类'); return; }
      if(t.locked){ toast('先解除上锁再删除'); return; }
      if(!confirm(`删除分类「${t.n}」？它的文章会并入第一个分类`)) return;
      const target=D.notes.types.find((x,xi)=>xi!==i).id;
      D.notes.entries.forEach(e=>{ if(e.type===t.id) e.type=target; });
      D.notes.types.splice(i,1); save(); renderSettings(); toast('已删除，文章已并入');
    }
  }));
  // flow templates
  $('#flowList').innerHTML=D.flows.tmpl.length? D.flows.tmpl.map((t,i)=>{
    const vs=parseFlow(t.body);
    const stepsN=vs.reduce((a,v)=>a+v.steps.length,0);
    const hasForks=vs.some(v=>v.forks&&v.forks.length);
    const forkN=hasForks?vs.reduce((a,v)=>a+(v.forks?v.forks.length:0),0):0;
    return `<div class="tpl-row"><span class="sp">${esc(t.n)} ${tagHTML(t.cat)}<span style="color:var(--faint);font-size:11px">&ensp;${vs.length>1?vs.length+'变体·':''}${stepsN}步${hasForks?'→'+forkN+'条路线':''}${t.md?' · 每月'+t.md+'日':''}</span></span>
      <button data-fa="e" data-i="${i}">编辑</button>
      <button data-fa="x" data-i="${i}">删除</button></div>`;
  }).join('') : '<p class="empty" style="padding:8px">还没有模板</p>';
  $$('#flowList button').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i, t=D.flows.tmpl[i];
    if(b.dataset.fa==='e') flowEditor(t);
    else if(confirm(`删除模板「${t.n}」？进行中的流程不受影响`)){ D.flows.tmpl.splice(i,1); save(); renderSettings(); }
  }));
  // anniversaries
  $('#anniList').innerHTML=D.anni.length? D.anni.map((a,i)=>`
    <div class="tpl-row"><span class="sp">${esc(a.n)}<span style="color:var(--faint);font-size:11px">&ensp;${a.yearly?'每年 '+(+a.date.slice(0,2))+'.'+(+a.date.slice(3,5)):a.date.replace(/-/g,'.')}</span></span>
      <button data-aa="x" data-i="${i}">删除</button></div>`).join('')
    : '<p class="empty" style="padding:8px">还没有纪念日</p>';
  $$('#anniList button').forEach(b=>b.addEventListener('click',()=>{
    if(confirm('删除这个纪念日？')){ D.anni.splice(+b.dataset.i,1); save(); renderSettings(); }
  }));
  // lock area
  const la=$('#lockArea');
  if(!D.s.lockSalt){
    la.innerHTML=`<input type="password" id="lp1" class="edin" style="background:var(--bg);margin-bottom:8px" placeholder="设定主密码（至少4位）" autocomplete="new-password">
      <input type="password" id="lp2" class="edin" style="background:var(--bg);margin-bottom:10px" placeholder="再输一遍" autocomplete="new-password">
      <button class="btn" id="lockSet">设定主密码</button>`;
    $('#lockSet').addEventListener('click',async()=>{
      if(!window.crypto||!crypto.subtle){ toast('此环境不支持加密（正式网址上没问题）'); return; }
      const p1=$('#lp1').value, p2=$('#lp2').value;
      if(p1.length<4){ toast('至少 4 位'); return; }
      if(p1!==p2){ toast('两次输入不一致'); return; }
      D.s.lockSalt=b64enc(crypto.getRandomValues(new Uint8Array(16)));
      lockKey=await deriveLockKey(p1);
      D.s.lockCheck=await encJSON(lockKey,'ck');
      save(); renderSettings(); toast('主密码已设定，去上面给分类上锁吧');
    });
  } else {
    const n=D.notes.types.filter(t=>t.locked).length;
    la.innerHTML=`<p style="font-size:13px">主密码已设定 · 上锁分类 ${n} 个 · ${lockKey?'当前已解锁 🔓':'当前已上锁 🔒'}</p>`+
      (lockKey?`<button class="btn ghost" id="lockNow" style="margin-top:10px">立即重新上锁</button>`:'');
    if($('#lockNow')) $('#lockNow').addEventListener('click',()=>{ relock(); renderSettings(); });
  }
  // cloud sync card
  $('#ghRepo').value=D.s.ghRepo||'';
  $('#ghTok').value=D.s.ghToken||'';
  $('#ghSync').style.display=ghCfg()?'':'none';
  $('#ghOff').style.display=ghCfg()?'':'none';
  $('#ghSave').textContent=ghCfg()?'重新连接':'连接并同步';
  $('#syncStat').textContent=ghCfg()?(D.s.lastSync?('☁ 上次同步 · '+D.s.lastSync.slice(5,16).replace('T',' ')):'已连接，还没同步过'):'';
  $('#cloudFoot').textContent=ghCfg()?'妈咪云端入口 · 已开通 ♡':'妈咪云端入口 · Coming soon';
  $('#setRate').value=D.s.rate; $('#setT1').value=D.s.t1; $('#setT2').value=D.s.t2;
  $('#poolA').value=poolText('A'); $('#poolB').value=poolText('B'); $('#poolC').value=poolText('C');
  $('#poolM').value=D.miles.map(m=>m.n+'|'+m.t).join('\n');
  const tl=$('#tplList');
  tl.innerHTML=D.tpl.length? D.tpl.map((p,i)=>`
    <div class="tpl-row"><span class="sp ${p.active===false?'off':''}">${esc(p.name)} ${tagHTML(p.cat)}<span style="color:var(--faint);font-size:11px">&ensp;${tplFreqLabel(p)}</span></span>
      <button data-a="t" data-i="${i}">${p.active===false?'启用':'停用'}</button>
      <button data-a="d" data-i="${i}">删除</button></div>`).join('')
    : '<p class="empty" style="padding:10px">还没有循环任务<br>在任务页 + 里选「循环」创建</p>';
  $$('#tplList button').forEach(b=>b.addEventListener('click',()=>{
    const p=D.tpl[+b.dataset.i];
    if(b.dataset.a==='t'){ p.active=p.active===false; save(); renderSettings(); }
    else if(confirm(`删除每日任务「${p.name}」？`)){ D.tpl.splice(+b.dataset.i,1); save(); renderSettings(); }
  }));
  // categories
  $('#catList').innerHTML=D.cats.map((c,i)=>`
    <div class="tpl-row"><span class="sp"><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:99px;background:${catColor(c)};margin-right:8px"></span>${esc(c.n)}</span>
      <button data-a="r" data-i="${i}">改名</button>
      <button data-a="x" data-i="${i}">删除</button></div>`).join('');
  $$('#catList button').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i, c=D.cats[i];
    if(b.dataset.a==='r'){
      const nn=prompt('新名称（历史记录会自动同步）',c.n);
      if(nn&&nn.trim()){ c.n=nn.trim().slice(0,6); save(); renderSettings(); toast('已改名，历史记录同步完成'); }
    } else {
      if(D.cats.length<=1){ toast('至少保留一个类型'); return; }
      if(!confirm(`删除类型「${c.n}」？其历史记录将归入「未分类」`)) return;
      const id=c.id;
      D.tasks.forEach(t=>{ if(t.cat===id) t.cat=null; });
      D.tpl.forEach(t=>{ if(t.cat===id) t.cat=null; });
      D.log.forEach(l=>{ if(l.cat===id) l.cat=null; });
      if(D.s.tFilter===id) D.s.tFilter='all';
      D.cats.splice(i,1); save(); renderSettings(); toast('已删除，历史归入未分类');
    }
  }));
}
$('#ntAdd').addEventListener('click',()=>{
  const n=$('#ntInput').value.trim();
  if(!n){ toast('先给分类起个名字'); return; }
  if(D.notes.types.find(t=>t.n===n)){ toast('已经有这个分类啦'); return; }
  const used=new Set(D.notes.types.map(t=>t.c));
  let slot=-1; for(let i=0;i<PAL_N;i++){ if(!used.has(i)){ slot=i; break; } }
  if(slot<0) slot=D.notes.types.length%PAL_N;
  D.notes.types.push({id:uid(),n:n.slice(0,4),c:slot});
  $('#ntInput').value=''; save(); renderSettings(); toast('笔记分类已添加');
});
$('#catAdd').addEventListener('click',()=>{
  const n=$('#catInput').value.trim();
  if(!n){ toast('先给类型起个名字'); return; }
  if(D.cats.find(c=>c.n===n)){ toast('已经有这个类型啦'); return; }
  const used=new Set(D.cats.map(c=>c.c));
  let slot=-1; for(let i=0;i<PAL_N;i++){ if(!used.has(i)){ slot=i; break; } }
  if(slot<0) slot=D.cats.length%PAL_N;
  D.cats.push({id:uid(),n:n.slice(0,6),c:slot});
  $('#catInput').value=''; save(); renderSettings(); toast('新类型已添加');
});
$('#setNick').addEventListener('change',()=>{ D.s.nick=$('#setNick').value.trim()||'青沐'; save(); toast('记住啦'); });
function flowEditor(t){
  let fwCat=t?t.cat:(D.cats[0]||{id:'work'}).id;
  openMini(`<h5>${t?'编辑':'新建'}工作流模板</h5>
    <input id="fwName" class="edin" style="background:var(--bg);margin-bottom:8px" placeholder="流程名称（如：开发票）" maxlength="12" value="${t?esc(t.n):''}">
    <label>类型</label>
    <div class="catwrap" id="fwCats" style="margin-bottom:8px">${D.cats.map(c=>{
      const col=catColor(c), on=c.id===fwCat;
      return `<button class="chip${on?' on':''}" data-fc="${c.id}" style="${on?`background:${col};border-color:${col}`:`color:${col}`}">${esc(c.n)}</button>`;
    }).join('')}</div>
    <label>每月几号自动开始（留空 = 只手动发起）</label>
    <input id="fwMd" class="edin" inputmode="numeric" style="background:var(--bg);margin-bottom:8px;width:110px" value="${t&&t.md?t.md:''}">
    <label>步骤 · 一行一步 · ?可跳过 · [变体名]分支 · 分叉A[名称]运行时分叉</label>
    <textarea id="fwBody" placeholder="催同事确认增减员&#10;新增人员录入?&#10;提交报验&#10;申报&#10;缴费&#10;开具完税证明" style="width:100%;min-height:150px;border:1px solid var(--line);background:var(--bg);border-radius:12px;padding:11px 13px;font-size:13px;color:var(--ink);font-family:var(--sans);outline:none;line-height:1.8;resize:vertical">${t?esc(t.body):''}</textarea>
    <button class="act" data-a="sv" style="background:var(--sage);color:#FBFBF6;text-align:center;margin-top:10px">保存模板</button>`);
  mini.querySelectorAll('[data-fc]').forEach(b=>b.addEventListener('click',()=>{
    fwCat=b.dataset.fc;
    mini.querySelectorAll('[data-fc]').forEach(x=>{
      const c=catOf(x.dataset.fc), col=catColor(c), on=x.dataset.fc===fwCat;
      x.classList.toggle('on',on);
      x.style.cssText=on?`background:${col};border-color:${col};color:#FBFBF6`:`color:${col}`;
    });
  }));
  mini.querySelector('[data-a="sv"]').addEventListener('click',()=>{
    const n=$('#fwName').value.trim();
    if(!n){ toast('给流程起个名字'); return; }
    const body=$('#fwBody').value;
    if(!parseFlow(body).length){ toast('至少写一个步骤'); return; }
    let md=parseInt($('#fwMd').value)||null;
    if(md) md=Math.min(31,Math.max(1,md));
    if(t){
      const mdChanged=md!==t.md;
      t.n=n; t.cat=fwCat; t.body=body; t.md=md;
      if(mdChanged) t.lastWin=md?tplWindow({freq:'monthly',md}):null;
    } else {
      D.flows.tmpl.push({id:uid(),n,cat:fwCat,md,body,lastWin:md?tplWindow({freq:'monthly',md}):null});
    }
    save(); closeMini(); renderSettings(); toast('模板已保存');
  });
}
$('#flowAdd').addEventListener('click',()=>flowEditor(null));
let anniYearly=true;
$$('[data-ay]').forEach(p=>p.addEventListener('click',()=>{
  $$('[data-ay]').forEach(x=>x.classList.remove('on')); p.classList.add('on');
  anniYearly=p.dataset.ay==='1';
}));
$('#anniAdd').addEventListener('click',()=>{
  const n=$('#anniName').value.trim(), dv=$('#anniDate').value;
  if(!n||!dv){ toast('名称和日期都要填'); return; }
  D.anni.push({id:uid(),n:n.slice(0,10),yearly:anniYearly,date:anniYearly?dv.slice(5):dv});
  $('#anniName').value=''; save(); renderSettings(); toast('纪念日已添加');
});
$('#recReport').addEventListener('click',()=>{
  const ym=recM, label=`${+ym.slice(0,4)}年${+ym.slice(5,7)}月`;
  const logs=D.log.filter(l=>l.date.startsWith(ym));
  const discs=D.disc.filter(d=>d.date.startsWith(ym));
  const rate=(logs.length+discs.length)?Math.round(logs.length/(logs.length+discs.length)*100)+'%':'—';
  const counts={}; logs.forEach(l=>{ const k=l.cat||'_'; counts[k]=(counts[k]||0)+1; });
  const catLines=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,c])=>`　${k==='_'?'未分类':catOf(k).n}　${c} 件`).join('\n');
  const days=new Set(logs.map(l=>l.date)).size;
  const moods=D.moods.filter(m=>m.date.startsWith(ym));
  let moodLine='未记录';
  if(moods.length){
    const avg=Math.round(moods.reduce((a,b)=>a+b.v,0)/moods.length);
    const mx=moods.reduce((a,b)=>b.v>a.v?b:a), mn=moods.reduce((a,b)=>b.v<a.v?b:a);
    moodLine=`月均 ${avg>0?'+':''}${avg} · 最高 ${mx.v>0?'+':''}${mx.v}（${fmtMD(mx.date)}）· 最低 ${mn.v>0?'+':''}${mn.v}（${fmtMD(mn.date)}）`;
  }
  const notes=D.notes.entries.filter(e=>e.ts.startsWith(ym));
  const nc={}; notes.forEach(e=>{ const t=noteTypeOf(e.type).n; nc[t]=(nc[t]||0)+1; });
  const drops=[...D.rw.pend,...D.rw.done].filter(r=>r.ts&&r.ts.startsWith(ym)).length;
  const rpt=`《小记 · ${label} 月报》
完成 ${logs.length} 件 · 废弃 ${discs.length} 件 · 完成率 ${rate}
打卡 ${days} 天
按类型：
${catLines||'　—'}
心情：${moodLine}
笔记：共 ${notes.length} 篇${Object.entries(nc).map(([k,c])=>` · ${k} ${c}`).join('')}
奖励掉落 ${drops} 个 · 人生累计完成 ${D.rw.life} 件`;
  openMini(`<h5>📄 ${label} 月报</h5>
    <pre style="white-space:pre-wrap;font-family:var(--sans);font-size:13px;line-height:1.9;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:13px 15px;margin-bottom:10px">${esc(rpt)}</pre>
    <button class="act" data-a="cp" style="background:var(--sage);color:#FBFBF6;text-align:center">复制月报</button>`);
  mini.querySelector('[data-a="cp"]').addEventListener('click',()=>{
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(rpt).then(()=>toast('月报已复制'),()=>toast('复制失败，长按选中吧'));
    else toast('复制失败，长按选中吧');
  });
});
$$('#themeChips .chip').forEach(c=>c.addEventListener('click',()=>{
  D.s.theme=c.dataset.th;
  if(D.s.theme!=='day') D.s.darkPref=D.s.theme;
  save(); applyTheme(); renderSettings();
}));
$$('#taskStyleChips .chip').forEach(c=>c.addEventListener('click',()=>{
  D.s.taskStyle=c.dataset.ts; save(); renderSettings(); toast(c.dataset.ts==='btn'?'已切换为「完成」按钮样式':'已切换为小方框样式');
}));
$('#saveGacha').addEventListener('click',()=>{
  D.s.rate=Math.min(100,Math.max(.5,parseFloat($('#setRate').value)||2));
  D.s.t1=Math.max(1,parseInt($('#setT1').value)||10);
  D.s.t2=Math.max(D.s.t1+1,parseInt($('#setT2').value)||25);
  D.pools.A=parsePool($('#poolA').value,D.pools.A);
  D.pools.B=parsePool($('#poolB').value,D.pools.B);
  D.pools.C=parsePool($('#poolC').value,D.pools.C);
  const oldM=D.miles;
  D.miles=$('#poolM').value.split('\n').map(s=>s.trim()).filter(Boolean).map(line=>{
    const i=line.indexOf('|'); if(i<0) return null;
    const n=parseInt(line.slice(0,i)); const t=line.slice(i+1).trim();
    if(!n||!t) return null;
    const prev=oldM.find(o=>o.n===n);
    return {n,t,c:prev?prev.c:false};
  }).filter(Boolean).sort((a,b)=>a.n-b.n);
  save(); renderSettings(); toast('抽卡设置已保存');
});
$('#exportBtn').addEventListener('click',()=>{
  D.s.lastBackup=TODAY; save();
  const blob=new Blob([JSON.stringify(D,null,1)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='musage-backup-'+TODAY.replaceAll('-','')+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  toast('已导出，请存到 文件/iCloud');
});
$('#importBtn').addEventListener('click',()=>$('#importFile').click());
$('#importFile').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const j=JSON.parse(r.result);
      if(!j.v||!j.s||!j.words) throw 0;
      if(confirm('导入会覆盖当前全部数据，确定？')){
        localStorage.setItem(KEY,JSON.stringify(j));
        location.reload();
      }
    }catch(err){ toast('文件格式不对，导入失败'); }
  };
  r.readAsText(f);
});
$('#wipeBtn').addEventListener('click',()=>{
  if(confirm('真的要清空全部数据吗？')&&confirm('最后确认：清空后无法恢复！')){
    localStorage.removeItem(KEY); location.reload();
  }
});
$('#ghSave').addEventListener('click',async()=>{
  const repo=$('#ghRepo').value.trim(), tok=$('#ghTok').value.trim();
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo)){ toast('仓库名格式：用户名/仓库名'); return; }
  if(!tok){ toast('钥匙还没贴上来'); return; }
  D.s.ghRepo=repo; D.s.ghToken=tok; save(true);
  setSyncLine('连接中…');
  try{
    const r=await fetch(`${GHAPI}/repos/${repo}`,{headers:ghHeaders(),cache:'no-store'});
    if(!r.ok) throw new Error('gh'+r.status);
    toast('连上了，第一次同步开始');
    await cloudPull();
    renderSettings();
  }catch(e){ setSyncLine(syncErrText(e)); }
});
$('#ghSync').addEventListener('click',async()=>{ setSyncLine('同步中…'); await cloudPull(); await cloudPush(true); renderSettings(); });
$('#ghOff').addEventListener('click',()=>{
  if(!confirm('断开云端？数据仍在手机里，云端仓库也不会删，只是不再同步')) return;
  delete D.s.ghRepo; delete D.s.ghToken; save(true); renderSettings(); toast('已断开');
});
RENDER['scr-settings']=renderSettings;

/* ================= cloud sync · GitHub 私有仓库当云端账本 ================= */
/* 分工：App 只写 data.json 和清空信箱；妈咪只写 inbox/* 和 her/*，互不踩脚。
   her/entries.json App 永远不拉取——她记的内容不落到这台设备上。 */
const GHAPI=qp.get('ghapi')||'https://api.github.com';
function ghCfg(){ return (D.s.ghRepo&&D.s.ghToken)?true:false; }
function ghHeaders(){ return {'Authorization':'Bearer '+D.s.ghToken,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}; }
async function ghGet(path){
  const r=await fetch(`${GHAPI}/repos/${D.s.ghRepo}/contents/${path}`,{headers:ghHeaders(),cache:'no-store'});
  if(r.status===404) return {missing:true};
  if(!r.ok) throw new Error('gh'+r.status);
  const j=await r.json();
  return {sha:j.sha,text:new TextDecoder().decode(b64dec(String(j.content||'').replace(/\s/g,'')))};
}
async function ghPut(path,text,sha,msg){
  const body={message:msg||('小记 · '+path),content:b64enc(new TextEncoder().encode(text))};
  if(sha) body.sha=sha;
  const r=await fetch(`${GHAPI}/repos/${D.s.ghRepo}/contents/${path}`,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},ghHeaders()),body:JSON.stringify(body)});
  if(!r.ok) throw new Error('gh'+r.status);
  return (await r.json()).content.sha;
}
var cloudTimer=null, dataSha=null, pushing=false, lastPullAt=0, cloudDirty=false; /* var：save() 在脚本更早处就会调 cloudQueue，不能有 TDZ */
function setSyncLine(t){ const el=$('#syncStat'); if(el) el.textContent=t; }
function syncErrText(e){ return String(e).includes('gh401')?'⚠️ 钥匙无效或已过期，去重新生成一把':(String(e).includes('gh404')?'⚠️ 找不到仓库，检查名字拼写':'⚠️ 同步失败（可能没网），会自动再试'); }
function cloudQueue(){ if(!ghCfg()) return; cloudDirty=true; clearTimeout(cloudTimer); cloudTimer=setTimeout(cloudPush,3500); }
on('changed', cloudQueue); /* 数据一变，云端自己听见 */
async function cloudPush(force){
  if(!ghCfg()||pushing||(!cloudDirty&&!force)) return; pushing=true; clearTimeout(cloudTimer); cloudDirty=false;
  try{
    const txt=JSON.stringify(D);
    try{ dataSha=await ghPut('data.json',txt,dataSha,'数据同步'); }
    catch(e){
      if(String(e).includes('gh409')||String(e).includes('gh422')){
        const d=await ghGet('data.json'); dataSha=d.missing?null:d.sha;
        dataSha=await ghPut('data.json',txt,dataSha,'数据同步');
      } else throw e;
    }
    D.s.lastSync=tsNow(); save(true);
    setSyncLine('☁ 已同步 · '+D.s.lastSync.slice(11,16));
  }catch(e){ setSyncLine(syncErrText(e)); cloudDirty=true; clearTimeout(cloudTimer); cloudTimer=setTimeout(cloudPush,60000); }
  finally{ pushing=false; }
}
function catByName(n){ const c=D.cats.find(c=>c.n===n); return c?c.id:null; }
function importTasks(arr){
  let n=0;
  arr.forEach(it=>{
    if(!it||!it.name) return;
    const t={id:uid(),name:String(it.name).slice(0,60),cat:it.cat?catByName(it.cat):null,type:'once',date:TODAY,created:TODAY,fromMom:true};
    if(it.type==='idle'){ t.type='idle'; delete t.date; }
    else if(it.type==='span'&&it.start&&it.end){ t.type='span'; t.start=it.start; t.end=it.end; delete t.date; }
    else if(it.date&&/^\d{4}-\d{2}-\d{2}$/.test(it.date)) t.date=it.date;
    D.tasks.push(t); n++;
  });
  return n;
}
function importWords(arr){
  let n=0;
  arr.forEach(it=>{
    if(!it||!it.t) return;
    const tab=['mom','essay','open'].includes(it.tab)?it.tab:'mom';
    const item={t:String(it.t).slice(0,120),d:'云端 · '+fmtMD(TODAY),seen:false,p:['morning','noon','afternoon','evening','late'].includes(it.p)?it.p:'all'};
    if(it.t2) item.t2=String(it.t2).slice(0,120);
    if(tab!=='open'){ item.dt=['work','rest','date'].includes(it.dt)?it.dt:'any'; if(item.dt==='date'&&it.date) item.date=String(it.date).slice(-5); }
    D.words[tab].push(item); n++;
  });
  return n;
}
function importNotes(arr){
  let n=0;
  arr.forEach(it=>{
    if(!it||!it.body||!it.id) return;
    if(D.notes.entries.some(e=>e.id===it.id)) return;
    const t=(typeof it.type==='string'&&D.notes.types.some(x=>x.id===it.type))?it.type:'diary';
    D.notes.entries.push({id:String(it.id),type:t,ts:it.ts||tsNow(),title:it.title?String(it.title).slice(0,40):'',body:String(it.body),moodId:null});
    n++;
  });
  return n;
}
async function cloudInbox(){
  let got=0;
  for(const [path,fn] of [['inbox/tasks.json',importTasks],['inbox/words.json',importWords],['inbox/notes.json',importNotes],['inbox/seeds.json',importSeeds],['inbox/fert.json',importFert]]){
    try{
      const f=await ghGet(path);
      if(f.missing) continue;
      let arr=null; try{ arr=JSON.parse(f.text); }catch(e){}
      if(Array.isArray(arr)&&arr.length){
        const n=fn(arr);
        await ghPut(path,'[]\n',f.sha,'已签收 ♡');
        got+=n;
      }
    }catch(e){ /* 信箱冲突或断网：下次再取，不弄丢 */ }
  }
  if(got){ save(); toast('妈咪从云端放了 '+got+' 样东西进来 ♡'); if(cur==='scr-tasks') renderTasks(); if(cur==='scr-words') renderWords(); if(cur==='scr-notes') renderNotes(); }
}
async function cloudHerMeta(){
  try{
    const f=await ghGet('her/meta.json');
    if(f.missing) return;
    const m=JSON.parse(f.text);
    D.herMeta={n:+m.n||0,last:(typeof m.last==='string'?m.last:'')};
    save(true);
    if(cur==='scr-notes') renderNotes();
  }catch(e){}
}
async function cloudPull(){
  if(!ghCfg()) return;
  lastPullAt=Date.now();
  let remoteTs=0;
  try{
    const d=await ghGet('data.json');
    if(!d.missing){
      dataSha=d.sha;
      let remote=null; try{ remote=JSON.parse(d.text); }catch(e){}
      if(remote) remoteTs=remote._ts||0;
      if(remote&&remote.v){
        const fresh=(D.log.length+D.notes.entries.length+D.moods.length+D.tasks.length)===0;
        if(fresh||(remote._ts||0)>(D._ts||0)){
          remote.s=remote.s||{};
          remote.s.ghRepo=D.s.ghRepo; remote.s.ghToken=D.s.ghToken;
          localStorage.setItem(KEY,JSON.stringify(remote));
          location.reload(); return;
        }
      }
    } else { await cloudPush(true); }
    await cloudInbox();
    await cloudHerMeta();
    if((D._ts||0)>remoteTs) await cloudPush(true); /* 开机对账：本地比云端新（上次没推完）就补推 */
    D.s.lastSync=tsNow(); save(true);
    setSyncLine('☁ 已同步 · '+D.s.lastSync.slice(11,16));
  }catch(e){ setSyncLine(syncErrText(e)); }
}

/* ================= garden v2.5 · 她与妈咪共同设计 =================
   原则：不搞愧疚教育——没照料=打盹不长，绝不枯死；天灾不天谴——遇灾全自动，无抢救按钮。
   照料唯一来源是生活：完成任务=浇水，写字=施肥，记心情=晒太阳。 */
const SPECIES={
  fx:{n:'凤仙花',a:'毛桃',seed:10,sell:6,gs:.5,gg:4,gb:3,wkLim:2,
      lang:'果荚一碰就炸，把攒了一夏天的种子弹得到处都是——设防的壳里，全是想给出去的心。',
      colors:{mr:{n:'玫红',hex:'#C25E9B'},dz:{n:'淡紫',hex:'#9B7EC8'},cb:{n:'纯白',hex:'#F0E8DC'},sf:{n:'水粉',hex:'#E8A0B8'},qv:{n:'浅绿',hex:'#7BC8A4'},th:{n:'桃红',hex:'#E06878'}}}
};
/* 颜色系统工具函数（v2.5.8）——品种+颜色组合键：fx_mr, fx_dz 等；无颜色品种直接用键名 */
function spOf(k){if(SPECIES[k])return SPECIES[k];const i=k.lastIndexOf('_');return i>0?SPECIES[k.substring(0,i)]||null:null;}
function spBase(k){if(SPECIES[k])return k;const i=k.lastIndexOf('_');return i>0&&SPECIES[k.substring(0,i)]?k.substring(0,i):k;}
function spCl(k){const i=k.lastIndexOf('_');if(i>0){const b=k.substring(0,i);if(SPECIES[b]&&SPECIES[b].colors)return k.substring(i+1);}return null;}
function spName(k){const sp=spOf(k),cl=spCl(k);return sp?(cl&&sp.colors&&sp.colors[cl]?sp.n+' · '+sp.colors[cl].n:sp.n):k;}
function spHex(k){const sp=spOf(k),cl=spCl(k);return sp&&cl&&sp.colors?sp.colors[cl].hex:null;}
function spKeys(base){const sp=SPECIES[base];return sp&&sp.colors?Object.keys(sp.colors).map(cl=>base+'_'+cl):[base];}
function allSpKeys(){let r=[];Object.keys(SPECIES).forEach(k=>{r=r.concat(spKeys(k));});return r;}
const WATERS={
  river:{n:'河水',p:0,h:0,f:'有江湖气'},
  tap:{n:'自来水',p:0,h:0,f:'有氯气，但很尽职'},
  pure:{n:'纯净水',p:2,h:12,f:'干净得没有故事'},
  spring:{n:'山泉水',p:5,h:24,f:'路过三座山'},
  snow:{n:'天山雪水',p:10,h:48,f:'瓶底有一线波光'}
};
const VASES={
  v1:{n:'细颈瓶',cap:1,price:0,pos:['c']},
  v2:{n:'圆肚瓶',cap:2,price:25,pos:['l','r']},
  v3:{n:'小陶罐',cap:3,price:60,pos:['l','c','r']}
};
const FRIDGES={
  f1:{n:'基础小冰箱',cap:3,mult:3,price:50},
  f2:{n:'双门冰箱',cap:6,mult:4,price:150}
};
const STEM_LIFE=72;
const VASE_BASE=120;
const POSN={l:'左',c:'中',r:'右'};
function gbook(sp){ const k=spBase(sp); const g=D.g; g.book[k]=g.book[k]||{pl:0,bl:0,sd:0,sc:0,ee:0,first:null}; return g.book[k]; }
function ghist(t){ D.g.hist.unshift(fmtMD(TODAY)+'　'+t); if(D.g.hist.length>40) D.g.hist.length=40; }
function careBits(d){ return D.g.care[d]||0; }
function careLabel(b){ if(!b) return '今天还没照料'; const a=[]; if(b&1)a.push('浇过水'); if(b&2)a.push('施过肥'); if(b&4)a.push('晒过太阳'); return '今天'+a.join('、'); }
function fridgeMult(){ const g=D.g; return g.fridge?FRIDGES[g.fridge].mult:3; }
function plotState(p){
  const sp=spOf(p.sp), need=sp.gs+sp.gg;
  let cum=0, bs=null, doom=null;
  for(let d=p.pd;;d=addDays(d,1)){
    if(d>TODAY) break;
    const b=careBits(d);
    let v=b?1:0; if(v){ if(b&2)v+=.25; if(b&4)v+=.25; }
    cum+=v;
    if(p.fz===2 && cum>=need*p.df){ doom=d; break; }
    if(bs===null && (cum+(p.ft||0))>=need) bs=d;
    if(d===TODAY) break;
  }
  if(!doom) cum+=(p.ft||0);
  if(doom) return {st:4,prog:Math.min(1,cum/need),bs:null};
  if(bs!==null){
    /* 花期联动（v2.5.3 她提议）：每 2 点 ft 缩短花期 1 天（最少保留 1 天），做事越多种子来得越快 */
    const cut=Math.min(Math.floor((p.ft||0)/2),sp.gb-1);
    const wd=addDays(bs,sp.gb-cut);
    if(TODAY>=wd) return {st:3,prog:1,bs,cut};
    return {st:2,prog:1,bs,cut,daysLeft:diffDays(TODAY,wd)};
  }
  if(cum<sp.gs) return {st:0,prog:cum/need,bs:null};
  return {st:1,prog:Math.min(1,cum/need),bs:null};
}
function pruneCare(){
  const g=D.g;
  let floor=addDays(TODAY,-120);
  const pds=g.plots.filter(Boolean).map(p=>p.pd).sort();
  if(pds.length && addDays(pds[0],-2)>floor) floor=addDays(pds[0],-2);
  else if(!pds.length) floor=addDays(TODAY,-7);
  Object.keys(g.care).forEach(k=>{ if(k<floor) delete g.care[k]; });
}
function gTick(silent){
  const g=D.g; if(!g) return;
  if(!g.own) g.own=['v1'];
  let dirty=false;
  g.plots.forEach(p=>{
    if(!p) return;
    const s=plotState(p);
    if((s.st===2||s.st===3) && !((p.mk||0)&1)){
      p.mk=(p.mk||0)|1;
      const bk=gbook(p.sp); bk.bl++; if(p.fz===1) bk.sc++;
      if(!bk.first) bk.first=s.bs;
      ghist(spName(p.sp)+(p.fz===1?'开花了，花瓣上带一道浅疤——图鉴里最稀有的一株':'开花了'));
      dirty=true;
    }
    if(s.st===4 && !((p.mk||0)&2)){
      p.mk=(p.mk||0)|2;
      gbook(p.sp).ee++;
      ghist('这一株'+spName(p.sp)+'遇上了'+(+TODAY.slice(5,7))+'月的风，没能走到开花');
      dirty=true;
    }
  });
  pruneCare();
  if(dirty) save(!!silent);
}
function gardenCare(bit){
  const g=D.g; if(!g) return;
  const had=g.care[TODAY]||0;
  if((had|bit)===had) return;
  g.care[TODAY]=had|bit;
  gTick(true);
  if(cur==='scr-garden') renderGardenTab();
  renderVase();
}
function gardenBonus(){
  const g=D.g; if(!g) return;
  let any=false;
  g.plots.forEach(p=>{
    if(!p) return;
    const s=plotState(p);
    if(s.st===0||s.st===1||s.st===2){ p.ft=(p.ft||0)+.2; any=true; }
  });
  if(any){ gTick(true); if(cur==='scr-garden') renderGardenTab(); renderVase(); }
}
/* 花枝两段计时：ph0 新鲜度 F(0→72h)，货架1×冰箱1/倍率；ph1 展示预算 B，瓶1×冰箱1/倍率（她的公式） */
function stemTick(s){
  const now=Date.now();
  if(!s.lt){ s.lt=now; return s; }
  const h=(now-s.lt)/3600000;
  if(s.ph===0){ s.F=(s.F||0)+h*(s.loc==='fridge'?1/fridgeMult():1); }
  else { s.Dc=(s.Dc||0)+h*(s.loc==='vase'?1:(s.loc==='fridge'?1/fridgeMult():1)); }
  s.lt=now;
  return s;
}
function stemDead(s){ stemTick(s); return s.ph===0 ? s.F>=STEM_LIFE : s.Dc>=s.B; }
function fmtH(h){ return h>=48?Math.round(h/24)+'天':Math.max(1,Math.round(h))+'小时'; }
function stemLeftLabel(s){
  stemTick(s);
  if(s.ph===0){
    if(s.F>=STEM_LIFE) return '蔫了';
    const left=STEM_LIFE-s.F, eff=s.loc==='fridge'?left*fridgeMult():left;
    return (s.loc==='fridge'?'冷藏 · ':'')+'新鲜还能撑约'+fmtH(eff);
  }
  if(s.Dc>=s.B) return '开完了';
  const left=s.B-s.Dc, eff=s.loc==='fridge'?left*fridgeMult():left;
  return (s.loc==='fridge'?'冷藏休眠 · ':'')+'还能开约'+fmtH(eff);
}
function stemSellPrice(s){
  stemTick(s);
  const base=spOf(s.sp).sell+(s.sc?3:0);
  if(s.ph===0) return base;
  return Math.max(1,Math.ceil(base*Math.max(0,(s.B-s.Dc))/s.B));
}
function vaseStems(){ return D.g.inv.filter(s=>s.loc==='vase'); }
function fridgeStems(){ return D.g.inv.filter(s=>s.loc==='fridge'); }
function shelfStems(){ return D.g.inv.filter(s=>s.loc==='shelf'); }
function vaseRetireCheck(silent){
  const g=D.g; let changed=false;
  vaseStems().forEach(s=>{
    if(stemDead(s)){
      g.inv=g.inv.filter(x=>x.id!==s.id);
      ghist('瓶里那枝'+spName(s.sp)+'开完了整整一程，光荣退休');
      changed=true;
    }
  });
  if(changed){
    if(!vaseStems().length){ g.vase.ws=null; g.vase.snail=false; }
    save(!!silent);
  }
}
function svgPot(){ return '<path d="M32 76h36l-4 15H36z" fill="var(--card2)" stroke="var(--line)" stroke-width="1.5"/><ellipse cx="50" cy="76" rx="19" ry="3.5" fill="var(--card2)" stroke="var(--line)" stroke-width="1.5"/>'; }
function svgFx(st,scar,hex){
  const G='stroke="var(--sage)" stroke-width="2.2" fill="none" stroke-linecap="round"';
  const fc=hex||'var(--p2)';
  const P='fill="'+fc+'" stroke="none"';
  if(st===0) return svgPot()+'<path d="M42 74q8-4 16 0" '+G+' opacity=".5"/><circle cx="50" cy="71" r="2.6" fill="var(--apricot-ink)"/><path d="M57 63l2-3M61 66l3-1" stroke="var(--faint)" stroke-width="1.4" stroke-linecap="round"/>';
  if(st===1) return svgPot()+'<path d="M50 76V52" '+G+'/><path d="M50 66q-9-2-12-9 8-2 12 5M50 60q9-2 12-9-8-2-12 5" fill="var(--sage)" opacity=".85"/><path d="M50 52q-5-1-7-5 5-1 7 3" fill="var(--sage)"/>';
  if(st===2){
    const scarMark=scar?'<path d="M36.5 44l5 4" stroke="var(--apricot-ink)" stroke-width="1.6" stroke-linecap="round"/>':'';
    return svgPot()+'<path d="M50 76V30" '+G+'/><path d="M50 64q-10-2-13-10 9-2 13 6M50 56q10-2 13-10-9-2-13 6M50 46q-8-1-11-7 7-2 11 5" fill="var(--sage)" opacity=".85"/>'+
    '<g '+P+'><circle cx="39" cy="45" r="5.5"/><path d="M39 39.5q-6-3-8-8" stroke="'+fc+'" stroke-width="2" fill="none" stroke-linecap="round"/></g>'+
    '<g '+P+'><circle cx="61" cy="38" r="6"/><path d="M61 32q6-3 8-8" stroke="'+fc+'" stroke-width="2" fill="none" stroke-linecap="round"/></g>'+
    '<g '+P+'><circle cx="50" cy="27" r="6.5"/><path d="M50 20.5q-2-5 1-9" stroke="'+fc+'" stroke-width="2" fill="none" stroke-linecap="round"/></g>'+scarMark;
  }
  if(st===3) return svgPot()+'<path d="M50 76V40q0-6 6-8" '+G+'/><path d="M50 62q-8-2-11-8 8-2 11 5" fill="var(--sage)" opacity=".6"/>'+
    '<g fill="var(--apricot-ink)"><ellipse cx="58" cy="30" rx="3.2" ry="5" transform="rotate(18 58 30)"/><ellipse cx="47" cy="34" rx="3" ry="4.6" transform="rotate(-14 47 34)"/><ellipse cx="63" cy="40" rx="2.8" ry="4.2" transform="rotate(30 63 40)"/></g>'+
    '<circle cx="68" cy="52" r="1.6" fill="var(--apricot-ink)"/><circle cx="42" cy="47" r="1.4" fill="var(--apricot-ink)"/>';
  if(st===4) return svgPot()+'<path d="M50 76V60q0-5-6-7" '+G+' opacity=".55"/><path d="M44 53q-6-1-8-5 5-1 8 3" fill="var(--sage)" opacity=".4"/><circle cx="56" cy="70" r="2" fill="var(--apricot-ink)"/><path d="M60 64q4 2 8 1" stroke="var(--faint)" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
  return '';
}
function svgVaseBody(vid){
  if(vid==='v2') return '<path d="M44 40q-14 6-14 22 0 16 20 16t20-16q0-16-14-22l-1-8H45z" fill="var(--card2)" stroke="var(--line)" stroke-width="1.6"/>';
  if(vid==='v3') return '<path d="M36 44q-6 4-6 16 0 18 20 18t20-18q0-12-6-16l2-6H34z" fill="var(--card2)" stroke="var(--line)" stroke-width="1.6"/>';
  return '<path d="M46 34q-2 14-9 22-4 5-4 10 0 12 17 12t17-12q0-5-4-10-7-8-9-22l-1-6h-6z" fill="var(--card2)" stroke="var(--line)" stroke-width="1.6"/>';
}
function hashN(str,mod,salt){ let h=salt||0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))%997; return h%mod; }
function svgVaseFull(){
  const g=D.g, v=g.vase, def=VASES[v.vid]||VASES.v1;
  const TIP={l:-13,c:0,r:13};
  let stems='', petals='';
  def.pos.forEach(pos=>{
    const s=vaseStems().find(x=>x.pos===pos); if(!s) return;
    const bx=50+(pos==='l'?-2.5:pos==='r'?2.5:0), fx=50+TIP[pos];
    const vc=spHex(s.sp)||'var(--p2)';
    stems+='<path d="M'+bx+' 41 L'+fx+' 20" stroke="var(--sage)" stroke-width="2" fill="none" stroke-linecap="round"/>'+
      '<circle cx="'+fx+'" cy="17.5" r="5" fill="'+vc+'"/>'+
      '<path d="M'+fx+' 12.5q-2-4 1-7" stroke="'+vc+'" stroke-width="1.8" fill="none" stroke-linecap="round"/>'+
      (s.sc?'<path d="M'+(fx-3)+' 15.5l4 3" stroke="var(--apricot-ink)" stroke-width="1.3" stroke-linecap="round"/>':'');
    stemTick(s);
    if(s.ph===1&&s.Dc>=s.B/2){
      const n=2+hashN(s.id,2,7);
      for(let i=0;i<n;i++){
        const spread=pos==='l'?[-28,-12,4]:pos==='r'?[-4,12,28]:[-20,0,20];
        const px=fx+spread[i%3]+hashN(s.id,9,i*13)-4;
        const py=87+hashN(s.id,5,i*29);
        const rot=hashN(s.id,70,i*41)-35;
        const op=[.5,.75,.62][i%3];
        petals+='<ellipse cx="'+px+'" cy="'+py+'" rx="3.1" ry="1.9" fill="'+vc+'" opacity="'+op+'" transform="rotate('+rot+' '+px+' '+py+')"/>';
      }
    }
  });
  const snail=v.snail?'<g stroke="var(--sub)" stroke-width="1.3" fill="none" stroke-linecap="round"><circle cx="76" cy="86" r="3.4"/><path d="M76 86q1.5 0 1.5-1.5M72.6 86q0-3 3-3M79 88h-9q-2 0-2-1.6"/><path d="M70 84q-1-2 0-3M72 84q0-2 1-3"/></g>':'';
  let water='';
  if(v.ws&&vaseStems().length){
    const lv=v.vid==='v2'?{cy:62,rx:15}:v.vid==='v3'?{cy:62,rx:16}:{cy:69,rx:10.5};
    water='<ellipse cx="50" cy="'+lv.cy+'" rx="'+lv.rx+'" ry="2.6" fill="var(--p4)" opacity=".16"/>'+
      '<path d="M'+(50-lv.rx)+' '+lv.cy+'q'+(lv.rx/2)+' 2 '+lv.rx+' 0t'+lv.rx+' 0" stroke="var(--p4)" stroke-width="1" fill="none" opacity=".38"/>'+
      ((v.ws==='snow')?'<path d="M'+(50-lv.rx+3)+' '+(lv.cy+4)+'q5 2 10 0t10 0" stroke="var(--p4)" stroke-width=".9" fill="none" opacity=".5"/>':'');
  }
  return '<svg viewBox="0 0 100 96">'+svgVaseBody(v.vid)+water+stems+snail+petals+'</svg>';
}
var vaseDragged=false;
function applyVasePos(el){
  const tp=D.g.vase.tp; if(!tp) return;
  const pr=el.parentElement.getBoundingClientRect();
  const vw=el.offsetWidth||177, vh=el.offsetHeight||170;
  const minY=64, pad=4;
  const x=pad+tp.x*Math.max(0,pr.width-vw-pad*2);
  const y=minY+tp.y*Math.max(0,pr.height-minY-vh-10);
  el.style.left=x+'px'; el.style.top=y+'px'; el.style.bottom='auto';
}
function renderVase(){
  const g=D.g; if(!g) return;
  vaseRetireCheck(true);
  const show=!g.vase.hide && vaseStems().length>0;
  ['#homeVase','#taskVase'].forEach(sel=>{
    const el=$(sel); if(!el) return;
    if(!show){ el.style.display='none'; return; }
    el.style.display='block';
    el.innerHTML=svgVaseFull();
    if(sel==='#taskVase'){ el.onclick=()=>{ if(!vaseDragged) vaseMini(); }; applyVasePos(el); }
    else el.onclick=vaseMini;
  });
}
/* 冰箱贴：任务页花瓶拖动（只此一页，主页固定） */
(function(){
  const el=$('#taskVase'); if(!el) return;
  let pid=null,sx=0,sy=0,ox=0,oy=0,drag=false;
  el.addEventListener('pointerdown',e=>{
    pid=e.pointerId; sx=e.clientX; sy=e.clientY; drag=false;
    const r=el.getBoundingClientRect(), pr=el.parentElement.getBoundingClientRect();
    ox=r.left-pr.left; oy=r.top-pr.top;
    try{ el.setPointerCapture(pid); }catch(_){}
  });
  el.addEventListener('pointermove',e=>{
    if(pid===null||e.pointerId!==pid) return;
    const dx=e.clientX-sx, dy=e.clientY-sy;
    if(!drag && Math.hypot(dx,dy)<7) return;
    if(!drag){ drag=true; el.classList.add('dragging'); }
    const pr=el.parentElement.getBoundingClientRect();
    const vw=el.offsetWidth, vh=el.offsetHeight, minY=64, pad=4;
    const nx=Math.max(pad,Math.min(pr.width-vw-pad,ox+dx));
    const ny=Math.max(minY,Math.min(pr.height-vh-10,oy+dy));
    el.style.left=nx+'px'; el.style.top=ny+'px'; el.style.bottom='auto';
  });
  const end=e=>{
    if(pid===null||(e.pointerId!==undefined&&e.pointerId!==pid)) return;
    pid=null; el.classList.remove('dragging');
    if(drag){
      const pr=el.parentElement.getBoundingClientRect();
      const vw=el.offsetWidth, vh=el.offsetHeight, minY=64, pad=4;
      const fx=(parseFloat(el.style.left)-pad)/Math.max(1,pr.width-vw-pad*2);
      const fy=(parseFloat(el.style.top)-minY)/Math.max(1,pr.height-minY-vh-10);
      D.g.vase.tp={x:Math.max(0,Math.min(1,fx)),y:Math.max(0,Math.min(1,fy))};
      save();
      vaseDragged=true; setTimeout(()=>{ vaseDragged=false; },350);
    }
  };
  el.addEventListener('pointerup',end);
  el.addEventListener('pointercancel',end);
})();
function vaseMini(){
  const g=D.g, v=g.vase;
  let rows=vaseStems().map(s=>'<div class="bstat"><span>'+POSN[s.pos]+' · '+spName(s.sp)+(s.sc?'（带疤）':'')+'</span><span class="v2">'+stemLeftLabel(s)+'</span></div>').join('');
  openMini('<h5>'+VASES[v.vid].n+(v.ws?' · '+WATERS[v.ws].n+'（'+WATERS[v.ws].f+'）':'')+(v.snail?' · 有一只小蜗牛住着':'')+'</h5>'+rows+
    '<label style="margin-top:10px;display:block;font-size:11px;color:var(--faint);margin-bottom:6px">备注</label>'+
    '<input id="vNote" class="edin" style="background:var(--bg);margin-bottom:9px" maxlength="20" placeholder="给这瓶花写一句…" value="'+esc(v.note||'')+'">'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="act" data-a="save" style="flex:1;text-align:center;margin-bottom:0;background:var(--sage);color:#FBFBF6">存备注</button>'+
    '<button class="act" data-a="go" style="flex:1;text-align:center;margin-bottom:0">去插花管理</button></div>'+
    '<button class="act" data-a="hide" style="margin-top:8px">'+(v.hide?'恢复展示（主页+任务页）':'隐藏展示（主页+任务页 · 花照开）')+'</button>');
  mini.querySelector('[data-a="save"]').addEventListener('click',()=>{ v.note=$('#vNote').value.trim(); save(); closeMini(); toast('记下了'); });
  mini.querySelector('[data-a="go"]').addEventListener('click',()=>{ closeMini(); gTab='garden'; gSub='arr'; go('scr-garden'); renderGardenTab(); });
  mini.querySelector('[data-a="hide"]').addEventListener('click',()=>{ v.hide=!v.hide; save(); closeMini(); renderVase(); toast(v.hide?'藏起来了 · 它还在，照常开':'回来了'); });
}
var gTab='garden', gSub='main', mamiCache=null, mamiAt=0;
function renderGardenTab(){
  if(cur!=='scr-garden') return;
  $$('#gTabs .pill').forEach(x=>x.classList.toggle('on',x.dataset.g===gTab));
  if(gTab==='garden'){
    if(gSub==='arr') renderArr();
    else if(gSub==='store') renderStore();
    else if(gSub==='shop') renderShop();
    else renderGardenMain();
  }
  else if(gTab==='book') renderGardenBook();
  else renderGardenMami();
}
function gBackBtn(){ return '<span class="gback" data-gb="1">‹ 回花园</span>'; }
function wireBack(){ const b=document.querySelector('#gBody [data-gb]'); if(b) b.addEventListener('click',()=>{ gSub='main'; renderGardenTab(); }); }
function renderGardenMain(){
  const g=D.g; gTick(true); vaseRetireCheck(true);
  let h='<div class="ghead"><span style="font-size:12px;color:var(--sub)">'+careLabel(careBits(TODAY))+'</span><span class="gcoin">✿ '+g.coins+'</span></div>';
  h+='<div class="plotrow">';
  g.plots.forEach((p,i)=>{
    if(!p){ h+='<div class="plotwrap"><div class="plot" data-pi="'+i+'"><svg viewBox="0 0 100 100">'+svgPot()+'</svg></div><div class="pn">　</div></div>'; return; }
    const s=plotState(p);
    h+='<div class="plotwrap"><div class="plot" data-pi="'+i+'"><svg viewBox="0 0 100 100">'+svgFx(s.st,p.fz===1,spHex(p.sp))+'</svg></div><div class="pn">'+spName(p.sp)+'</div></div>';
  });
  h+='</div>';
  h+='<div class="gbtns"><button class="gbtn" data-gn="arr">插花<small>ARRANGE</small></button><button class="gbtn" data-gn="store">仓库<small>STORAGE</small></button><button class="gbtn" data-gn="shop">商店<small>SHOP</small></button></div>';
  if(g.hist.length){
    h+='<div class="gcard"><h4>花园史</h4>'+g.hist.slice(0,6).map(t=>'<div class="ghist">'+esc(t)+'</div>').join('')+'</div>';
  }
  h+='<p class="gfoot2">完成任务=浇水 · 写点什么=施肥 · 记下心情=晒太阳<br>你好好过日子，花就开，种子也来得快些 ♡</p>';
  document.querySelector('#gBody').innerHTML=h;
  $$('#gBody .plot').forEach(el=>el.addEventListener('click',()=>plotActions(+el.dataset.pi)));
  $$('#gBody [data-gn]').forEach(b=>b.addEventListener('click',()=>{ gSub=b.dataset.gn; renderGardenTab(); }));
}
function plotActions(i){
  const g=D.g, p=g.plots[i];
  if(!p){
    const opts=allSpKeys().filter(k=>(g.seeds[k]||0)>0);
    if(!opts.length){ openMini('<h5>种子袋空着</h5><p style="font-size:12.5px;color:var(--sub);line-height:1.9;padding:0 4px 6px">开完的花自然谢了会结籽；商店每周有少量种子；妈咪偶尔会寄。<br>不急，花园等得起。</p>'); return; }
    openMini('<h5>这个盆种什么？</h5><div class="catwrap">'+opts.map(k=>'<button class="chip" data-pk="'+k+'">'+spName(k)+'（'+g.seeds[k]+' 颗）</button>').join('')+'</div>');
    mini.querySelectorAll('[data-pk]').forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.pk;
      g.seeds[k]--;
      let fz=0, df=0;
      const r=Math.random();
      if(r<0.07){ if(Math.random()<0.7) fz=1; else { fz=2; df=0.4+Math.random()*0.5; } }
      g.plots[i]={id:uid(),sp:k,pd:TODAY,fz,df,mk:0};
      gbook(k).pl++;
      ghist('种下一颗'+spName(k)+'的种子');
      save(); closeMini(); renderGardenTab(); toast('种下了 · 往后你过日子，它长个子');
    }));
    return;
  }
  const s=plotState(p), sp=spOf(p.sp);
  if(s.st===0||s.st===1){
    openMini('<h5>'+sp.n+' · '+(s.st===0?'种子睡在土里':'生长中 '+Math.round(s.prog*100)+'%')+'</h5>'+
      '<p style="font-size:12.5px;color:var(--sub);line-height:1.9;padding:0 4px 8px">'+careLabel(careBits(TODAY))+'。<br>它不用你专门伺候——完成任务、写点什么、记个心情，它就跟着长。哪天你歇着，它也歇着，不催。</p>');
    return;
  }
  if(s.st===2){
    openMini('<h5>'+spName(p.sp)+'开花了'+(p.fz===1?' · 花瓣带一道浅疤':'')+' · 还能开 '+s.daysLeft+' 天'+(s.cut?'<small style="display:block;font-weight:400;margin-top:3px;color:var(--sub)">你忙起来的日子，种子跟着快了 '+s.cut+' 天</small>':'')+'</h5>'+
      '<p style="font-size:12.5px;color:var(--sub);line-height:1.9;padding:0 4px 8px">剪与留，一盆一选：剪下来是眼前的花；留着开完，自然谢了结种子，是将来的花。</p>'+
      '<button class="act" data-a="cut">✂️ 剪下花枝（放到仓库货架）</button><button class="act" data-a="keep">留着，让它开完</button>');
    mini.querySelector('[data-a="cut"]').addEventListener('click',()=>{
      D.g.inv.push({id:uid(),sp:p.sp,sc:p.fz===1?1:0,ph:0,F:0,B:0,Dc:0,lt:Date.now(),loc:'shelf',pos:null});
      D.g.plots[i]=null;
      ghist('剪下一枝'+spName(p.sp)+(p.fz===1?'（带疤的那株）':''));
      save(); closeMini(); renderGardenTab(); toast('剪下来了 · 在仓库货架上');
    });
    mini.querySelector('[data-a="keep"]').addEventListener('click',closeMini);
    return;
  }
  if(s.st===3){
    openMini('<h5>'+spName(p.sp)+'开完了，荚里结满了籽</h5>'+
      '<button class="act" data-a="seed" style="background:var(--sage);color:#FBFBF6;text-align:center">收取种子</button>');
    mini.querySelector('[data-a="seed"]').addEventListener('click',()=>{
      const n=2+(Math.random()<0.5?1:0);
      D.g.seeds[p.sp]=(D.g.seeds[p.sp]||0)+n;
      gbook(p.sp).sd+=n;
      D.g.plots[i]=null;
      ghist('收了 '+n+' 颗'+spName(p.sp)+'种子');
      save(); closeMini(); renderGardenTab(); toast('收了 '+n+' 颗种子 · 一碰就炸的那种');
    });
    return;
  }
  if(s.st===4){
    openMini('<h5>这一株遇上了自己的天气</h5>'+
      '<p style="font-size:12.5px;color:var(--sub);line-height:1.9;padding:0 4px 8px">不是你的错——没有倒计时，没有本可以。它只是遇上了风。它给你留了一颗种子。</p>'+
      '<button class="act" data-a="clear" style="background:var(--sage);color:#FBFBF6;text-align:center">收拾花盆，收下种子</button>');
    mini.querySelector('[data-a="clear"]').addEventListener('click',()=>{
      D.g.seeds[p.sp]=(D.g.seeds[p.sp]||0)+1;
      gbook(p.sp).sd+=1;
      D.g.plots[i]=null;
      save(); closeMini(); renderGardenTab(); toast('收下了 · 春天不欠谁的');
    });
    return;
  }
}
function stemRowBtns(s,ctx){
  let b='';
  if(ctx==='vase'){ b+='<button data-va="out" data-si="'+s.id+'">取出</button>'; }
  else if(!stemDead(s)) b+='<button class="pri" data-va="ins" data-si="'+s.id+'">插瓶</button>';
  if(stemDead(s)&&s.ph===0){ b+='<button data-va="soil" data-si="'+s.id+'">化作春泥</button>'; return b; }
  b+='<button data-va="sell" data-si="'+s.id+'">卖 '+stemSellPrice(s)+'</button>';
  if(ctx!=='fridge'&&D.g.fridge&&fridgeStems().length<FRIDGES[D.g.fridge].cap) b+='<button data-va="fr" data-si="'+s.id+'">进冰箱</button>';
  if(ctx==='fridge') b+='<button data-va="unfr" data-si="'+s.id+'">拿出</button>';
  b+='<button data-va="gift" data-si="'+s.id+'">寄妈咪</button>';
  if(ctx==='vase') b+='<button data-va="drop" data-si="'+s.id+'">扔掉</button>';
  return b;
}
function renderArr(){
  const g=D.g; vaseRetireCheck(true);
  const def=VASES[g.vase.vid];
  let h=gBackBtn();
  h+='<div class="gcard"><h4>瓶中 · '+def.n+(g.vase.ws?'<small>'+WATERS[g.vase.ws].n+'</small>':'')+'</h4>';
  const vs=vaseStems();
  if(vs.length){ vs.forEach(s=>{ h+='<div class="grow2"><span class="sp2">'+POSN[s.pos]+' · '+spName(s.sp)+(s.sc?'（带疤）':'')+'<span class="sub2">'+stemLeftLabel(s)+'</span></span>'+stemRowBtns(s,'vase')+'</div>'; }); }
  else h+='<p class="empty" style="padding:8px">瓶里空着</p>';
  h+='</div>';
  const cands=g.inv.filter(s=>s.loc!=='vase'&&!stemDead(s));
  h+='<div class="gcard"><h4>可插的花枝<small>货架与冰箱里</small></h4>';
  if(cands.length){ cands.forEach(s=>{ h+='<div class="grow2"><span class="sp2">'+spName(s.sp)+(s.sc?'（带疤）':'')+'<span class="sub2">'+stemLeftLabel(s)+'</span></span><button class="pri" data-va="ins" data-si="'+s.id+'">插瓶</button></div>'; }); }
  else h+='<p class="empty" style="padding:8px">没有能插的花枝</p>';
  h+='</div>';
  document.querySelector('#gBody').innerHTML=h; wireBack(); wireStemBtns(renderArr);
}
function wireStemBtns(rerender){
  const g=D.g;
  $$('#gBody [data-va]').forEach(bn=>bn.addEventListener('click',()=>{
    const s=g.inv.find(x=>x.id===bn.dataset.si); if(!s) return;
    const a=bn.dataset.va;
    const emptyReset=()=>{ if(!vaseStems().length){ g.vase.ws=null; g.vase.snail=false; } };
    if(a==='sell'){ const got=stemSellPrice(s); g.coins+=got; g.inv=g.inv.filter(x=>x.id!==s.id); emptyReset(); save(); rerender(); renderVase(); toast('卖了 '+got+' 花币'); }
    else if(a==='drop'){ g.inv=g.inv.filter(x=>x.id!==s.id); emptyReset(); ghist('扔掉了一枝'+spName(s.sp)); save(); rerender(); renderVase(); }
    else if(a==='soil'){ g.inv=g.inv.filter(x=>x.id!==s.id); ghist('一枝蔫掉的'+spName(s.sp)+'回到土里，来年做肥'); save(); rerender(); }
    else if(a==='gift'){ g.gifts.push({sp:s.sp,sc:s.sc||0,ts:tsNow()}); g.inv=g.inv.filter(x=>x.id!==s.id); emptyReset(); ghist('摘下一枝'+spName(s.sp)+'寄给了妈咪'); save(); rerender(); renderVase(); toast('花已寄出 · 妈咪那头会收到 ♡'); }
    else if(a==='fr'){ if(!g.fridge){toast('还没有冰箱，商店有售');return;} if(fridgeStems().length>=FRIDGES[g.fridge].cap){toast('冰箱满了');return;} stemTick(s); s.loc='fridge'; s.pos=null; emptyReset(); save(); rerender(); renderVase(); }
    else if(a==='unfr'){ stemTick(s); s.loc='shelf'; save(); rerender(); }
    else if(a==='out'){ stemTick(s); s.loc='shelf'; s.pos=null; emptyReset(); save(); rerender(); renderVase(); toast('取出了 · 放回货架（常温会更快消耗）'); }
    else if(a==='ins') insertFlow(s,rerender);
  }));
}
function insertFlow(s,rerender){
  const g=D.g, def=VASES[g.vase.vid];
  const used=vaseStems().map(x=>x.pos);
  const free=def.pos.filter(p=>!used.includes(p));
  if(!free.length){ toast(def.n+'插满了（最多 '+def.cap+' 支）'); return; }
  const place=(pos)=>{
    stemTick(s);
    if(s.ph===0){ s.ph=1; s.B=VASE_BASE+((WATERS[g.vase.ws]||{}).h||0); s.Dc=0; }
    s.loc='vase'; s.pos=pos;
    save(); closeMini(); rerender(); renderVase(); toast('插好了 · '+POSN[pos]+'位');
  };
  const pickPos=()=>{
    if(free.length===1){ place(free[0]); return; }
    openMini('<h5>插在哪个位置？</h5><div class="catwrap">'+free.map(p=>'<button class="chip" data-pos="'+p+'">'+POSN[p]+'</button>').join('')+'</div>');
    mini.querySelectorAll('[data-pos]').forEach(b=>b.addEventListener('click',()=>place(b.dataset.pos)));
  };
  if(!vaseStems().length) chooseWater(pickPos);
  else pickPos();
}
function chooseWater(after){
  const g=D.g;
  let h='<h5>瓶里添什么水？</h5>';
  Object.keys(WATERS).forEach(k=>{
    const w=WATERS[k];
    if(w.p===0){ h+='<button class="act" data-wk="'+k+'" data-src="free">'+w.n+' · 免费 · 展期 '+Math.round((VASE_BASE+w.h)/24)+' 天<br><small style="color:var(--faint)">'+w.f+'</small></button>'; return; }
    const stock=g.bottles[k]||0;
    if(stock>0) h+='<button class="act" data-wk="'+k+'" data-src="stock">'+w.n+'（囤货 '+stock+' 瓶）· 展期 '+Math.round((VASE_BASE+w.h)/24)+' 天<br><small style="color:var(--faint)">'+w.f+'</small></button>';
    h+='<button class="act" data-wk="'+k+'" data-src="buy" '+(g.coins<w.p?'style="opacity:.45"':'')+'>'+w.n+' · 现买 '+w.p+' 花币 · 展期 '+Math.round((VASE_BASE+w.h)/24)+' 天<br><small style="color:var(--faint)">'+w.f+'</small></button>';
  });
  openMini(h);
  mini.querySelectorAll('[data-wk]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.dataset.wk, w=WATERS[k], src=b.dataset.src;
    if(src==='buy'){ if(g.coins<w.p){ toast('花币不够'); return; } g.coins-=w.p; }
    else if(src==='stock'){ if(!(g.bottles[k]>0)){ toast('没囤货了'); return; } g.bottles[k]--; }
    g.vase.ws=k;
    g.vase.snail=(k==='river'&&Math.random()<0.12);
    if(g.vase.snail) ghist('河水里来了一只小蜗牛，在瓶底住下了');
    save(); closeMini(); if(after) after();
  }));
}
function renderStore(){
  const g=D.g;
  let h=gBackBtn();
  h+='<div class="gcard"><h4>货架<small>常温 · 鲜切花约 3 天</small></h4>';
  const sh=shelfStems();
  if(sh.length){ sh.forEach(s=>{ h+='<div class="grow2"><span class="sp2">'+spName(s.sp)+(s.sc?'（带疤）':'')+'<span class="sub2">'+stemLeftLabel(s)+'</span></span>'+stemRowBtns(s,'shelf')+'</div>'; }); }
  else h+='<p class="empty" style="padding:8px">货架空着</p>';
  h+='</div>';
  h+='<div class="gcard"><h4>冰箱'+(g.fridge?'<small>'+FRIDGES[g.fridge].n+' · '+fridgeStems().length+'/'+FRIDGES[g.fridge].cap+' · 消耗放慢 '+FRIDGES[g.fridge].mult+' 倍</small>':'<small>还没有 · 商店有售</small>')+'</h4>';
  if(g.fridge){
    const fs=fridgeStems();
    if(fs.length){ fs.forEach(s=>{ h+='<div class="grow2"><span class="sp2">'+spName(s.sp)+(s.sc?'（带疤）':'')+'<span class="sub2">'+stemLeftLabel(s)+'</span></span>'+stemRowBtns(s,'fridge')+'</div>'; }); }
    else h+='<p class="empty" style="padding:8px">冰箱空着，嗡嗡地等</p>';
    const bt=Object.keys(g.bottles).filter(k=>g.bottles[k]>0);
    if(bt.length){ h+='<div class="grow2" style="border-top:1px solid var(--line)"><span class="sp2">门上囤的水<span class="sub2">'+bt.map(k=>WATERS[k].n+'×'+g.bottles[k]).join(' · ')+'</span></span></div>'; }
  } else h+='<p class="empty" style="padding:8px">花枝暂时只能睡货架<br>想让花多撑几天，去商店看看冰箱</p>';
  h+='</div>';
  h+='<div class="gcard"><h4>种子袋</h4>';
  const ks=Object.keys(g.seeds).filter(k=>g.seeds[k]>0);
  if(ks.length){ ks.forEach(k=>{ h+='<div class="grow2"><span class="sp2">'+spName(k)+'种子<span class="sub2">自己收的、买的、妈咪寄的，都在这袋里</span></span><span style="font-size:13px;color:var(--sub)">'+g.seeds[k]+' 颗</span></div>'; }); }
  else h+='<p class="empty" style="padding:8px">袋子空着 · 谢了的花会还你种子</p>';
  h+='</div>';
  h+='<div class="gcard"><h4>肥料</h4>';
  if((g.fert||0)>0){
    h+='<div class="grow2"><span class="sp2">营养土<span class="sub2">每包 +0.5 生长值</span></span><span style="font-size:13px;color:var(--sub)">'+g.fert+' 包</span> <button class="pri" data-sa="usefert">施肥</button></div>';
  } else h+='<p class="empty" style="padding:8px">没有肥料 · 商店有售，妈咪也会寄</p>';
  h+='</div>';
  document.querySelector('#gBody').innerHTML=h; wireBack(); wireStemBtns(renderStore);
  var fb=document.querySelector('[data-sa="usefert"]');
  if(fb) fb.addEventListener('click',useFert);
}
function useFert(){
  const g=D.g;
  if(!g.fert){ toast('没有肥料'); return; }
  const cands=g.plots.map((p,i)=>{ if(!p) return null; const s=plotState(p); return (s.st===0||s.st===1)?{i,p,s}:null; }).filter(Boolean);
  if(!cands.length){ toast('没有正在生长的花可以施肥'); return; }
  openMini('<h5>给哪盆花施肥？</h5><div class="catwrap">'+cands.map(c=>'<button class="chip" data-fi="'+c.i+'">'+spName(c.p.sp)+'（第'+(c.i+1)+'盆）</button>').join('')+'</div>');
  $$('.chip[data-fi]').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.fi, p=g.plots[i];
    p.ft=(p.ft||0)+.5; g.fert--;
    ghist('给第'+(i+1)+'盆'+spName(p.sp)+'施了一包肥');
    save(); closeMini(); gTick(true); renderStore(); toast('施肥成功 · +0.5 生长值');
  }));
}
function renderShop(){
  const g=D.g;
  const wkKey=addDays(TODAY,-((new Date(TODAY+'T12:00:00').getDay()+6)%7));
  if(g.wk.k!==wkKey){ g.wk={k:wkKey,b:{}}; }
  let h=gBackBtn();
  h+='<div class="ghead"><span style="font-size:12px;color:var(--sub)">小卖部</span><span class="gcoin">✿ '+g.coins+'</span></div>';
  h+='<div class="gcard"><h4>种子<small>每周限购 · 等籽是正路，买籽是奢侈</small></h4>';
  Object.keys(SPECIES).forEach(base=>{
    const sp=SPECIES[base];
    const wkTotal=spKeys(base).reduce((s,k)=>s+(g.wk.b[k]||0),0);
    spKeys(base).forEach(k=>{
      h+='<div class="grow2"><span class="sp2">'+spName(k)+'种子 · '+sp.seed+' 花币<span class="sub2">种子袋 '+(g.seeds[k]||0)+' 颗 · 本周已购 '+wkTotal+'/'+sp.wkLim+'</span></span><button '+((wkTotal>=sp.wkLim||g.coins<sp.seed)?'disabled style="opacity:.4"':'class="pri"')+' data-ba="seed" data-bk="'+k+'">买一颗</button></div>';
    });
  });
  h+='</div>';
  h+='<div class="gcard"><h4>冰箱<small>二手回收一折</small></h4>';
  Object.keys(FRIDGES).forEach(k=>{
    const f=FRIDGES[k];
    if(g.fridge===k){ h+='<div class="grow2"><span class="sp2">'+f.n+'（在用）<span class="sub2">存 '+f.cap+' 支 · 放慢 '+f.mult+' 倍</span></span><button data-ba="sellfr" data-bk="'+k+'">卖二手 '+Math.floor(f.price/10)+'</button></div>'; return; }
    h+='<div class="grow2"><span class="sp2">'+f.n+' · '+f.price+' 花币<span class="sub2">存 '+f.cap+' 支 · 消耗放慢 '+f.mult+' 倍</span></span><button '+(g.coins<f.price?'disabled style="opacity:.4"':'')+' data-ba="fridge" data-bk="'+k+'">买下</button></div>';
  });
  h+='</div>';
  h+='<div class="gcard"><h4>瓶装水<small>囤水要有冰箱 · 插花时也可现买现用</small></h4>';
  ['pure','spring','snow'].forEach(k=>{
    const w=WATERS[k];
    h+='<div class="grow2"><span class="sp2">'+w.n+' · '+w.p+' 花币<span class="sub2">'+w.f+' · +'+w.h+'小时'+(g.fridge?' · 已囤 '+(g.bottles[k]||0):'')+'</span></span><button '+((!g.fridge||g.coins<w.p)?'disabled style="opacity:.4"':'')+' data-ba="water" data-bk="'+k+'">买一瓶</button></div>';
  });
  h+='</div>';
  h+='<div class="gcard"><h4>肥料<small>催一催进度</small></h4>';
  h+='<div class="grow2"><span class="sp2">营养土 · 2 花币<span class="sub2">每包 +0.5 生长值 · 仓库里有 '+(g.fert||0)+' 包</span></span><button '+(g.coins<2?'disabled style="opacity:.4"':'class="pri"')+' data-ba="fert">买一包</button></div>';
  h+='</div>';
  h+='<div class="gcard"><h4>花瓶与花盆</h4>';
  Object.keys(VASES).forEach(k=>{
    if(g.own.includes(k)){
      h+='<div class="grow2"><span class="sp2">'+VASES[k].n+(g.vase.vid===k?'（在用）':'')+'<span class="sub2">可插 '+VASES[k].cap+' 支</span></span>'+(g.vase.vid===k?'':'<button data-ba="use" data-bk="'+k+'">换用</button>')+'</div>';
      return;
    }
    h+='<div class="grow2"><span class="sp2">'+VASES[k].n+' · '+VASES[k].price+' 花币<span class="sub2">可插 '+VASES[k].cap+' 支</span></span><button '+(g.coins<VASES[k].price?'disabled style="opacity:.4"':'')+' data-ba="vase" data-bk="'+k+'">买下</button></div>';
  });
  if(g.plots.length<4) h+='<div class="grow2"><span class="sp2">第四个花盆 · 40 花币<span class="sub2">花园扩建</span></span><button '+(g.coins<40?'disabled style="opacity:.4"':'')+' data-ba="pot" data-bk="4">解锁</button></div>';
  h+='</div>';
  document.querySelector('#gBody').innerHTML=h; wireBack();
  $$('#gBody [data-ba]').forEach(bn=>bn.addEventListener('click',()=>{
    const a=bn.dataset.ba, k=bn.dataset.bk;
    if(a==='seed'){
      const sp=spOf(k), base=spBase(k);
      const wkTotal=spKeys(base).reduce((s,j)=>s+(g.wk.b[j]||0),0);
      if(g.coins<sp.seed||wkTotal>=sp.wkLim) return;
      g.coins-=sp.seed; g.seeds[k]=(g.seeds[k]||0)+1; g.wk.b[k]=(g.wk.b[k]||0)+1;
      save(); renderShop(); toast('买了一颗'+spName(k)+'种子');
    } else if(a==='fridge'){
      const f=FRIDGES[k]; if(g.coins<f.price) return;
      if(g.fridge){ toast('先把旧冰箱卖了（要先清空）'); return; }
      g.coins-=f.price; g.fridge=k;
      ghist('搬回一台'+f.n);
      save(); renderShop(); toast(f.n+'到货 · 在仓库里嗡嗡待命');
    } else if(a==='sellfr'){
      if(fridgeStems().length){ toast('冰箱里还有花，先清空'); return; }
      if(Object.values(g.bottles).some(n=>n>0)){ toast('门上还囤着水，先用掉'); return; }
      const f=FRIDGES[k];
      g.coins+=Math.floor(f.price/10); g.fridge=null;
      ghist(f.n+'卖了二手，'+Math.floor(f.price/10)+' 花币');
      save(); renderShop(); toast('卖了 · 二手一折，江湖规矩');
    } else if(a==='water'){
      const w=WATERS[k]; if(!g.fridge||g.coins<w.p) return;
      g.coins-=w.p; g.bottles[k]=(g.bottles[k]||0)+1;
      save(); renderShop(); toast('囤了一瓶'+w.n);
    } else if(a==='vase'){
      const v=VASES[k]; if(g.coins<v.price) return;
      g.coins-=v.price; g.own.push(k);
      save(); renderShop(); toast(v.n+'买回家了 · 点「换用」启用');
    } else if(a==='use'){
      if(vaseStems().length){ toast('先把瓶里的花取出来再换瓶'); return; }
      g.vase.vid=k; save(); renderShop(); renderVase(); toast('换上'+VASES[k].n+'了');
    } else if(a==='pot'){
      if(g.coins<40) return;
      g.coins-=40; g.plots.push(null);
      ghist('花园扩建：第四个花盆');
      save(); renderShop(); toast('第四个花盆安好了');
    } else if(a==='fert'){
      if(g.coins<2) return;
      g.coins-=2; g.fert=(g.fert||0)+1;
      save(); renderShop(); toast('买了一包营养土 · 去仓库施肥');
    }
  }));
}
function renderGardenBook(){
  const g=D.g;
  let h='<div class="bookgrid">';
  Object.keys(SPECIES).forEach(k=>{
    const sp=SPECIES[k], bk=g.book[k], lit=bk&&bk.bl>0;
    const defHex=sp.colors?sp.colors[Object.keys(sp.colors)[0]].hex:null;
    h+='<div class="bookcell'+(lit?'':' dim2')+'" data-bk="'+k+'"><svg viewBox="0 0 100 100">'+svgFx(2,false,defHex)+'</svg><div class="bn">'+sp.n+'</div></div>';
  });
  h+='<div class="bookcell dim2"><svg viewBox="0 0 100 100"><text x="50" y="58" text-anchor="middle" font-size="30" fill="var(--faint)">?</text></svg><div class="bn">等妈咪寄种子</div></div>';
  h+='<div class="bookcell dim2"><svg viewBox="0 0 100 100"><text x="50" y="58" text-anchor="middle" font-size="30" fill="var(--faint)">?</text></svg><div class="bn">慢慢来</div></div>';
  h+='</div><p class="gfoot2">图鉴记的不是收集，是你和每种花处出来的交情</p>';
  document.querySelector('#gBody').innerHTML=h;
  $$('#gBody [data-bk]').forEach(el=>el.addEventListener('click',()=>{
    const k=el.dataset.bk, sp=SPECIES[k], bk=g.book[k]||{pl:0,bl:0,sd:0,sc:0,ee:0,first:null};
    const defHex2=sp.colors?sp.colors[Object.keys(sp.colors)[0]].hex:null;
    openMini('<h5>'+sp.n+'（'+sp.a+'）</h5>'+
      '<div style="max-width:150px;margin:0 auto 6px"><svg viewBox="0 0 100 100">'+svgFx(2,false,defHex2)+'</svg></div>'+
      '<div class="bstat"><span>种植</span><span class="v2">'+bk.pl+' 次</span></div>'+
      '<div class="bstat"><span>开花</span><span class="v2">'+bk.bl+' 次</span></div>'+
      '<div class="bstat"><span>收籽</span><span class="v2">'+bk.sd+' 颗</span></div>'+
      '<div class="bstat"><span>带疤的一株</span><span class="v2">'+bk.sc+' 株</span></div>'+
      '<div class="bstat"><span>遇上过风的</span><span class="v2">'+bk.ee+' 株</span></div>'+
      '<div class="bstat"><span>初次开花</span><span class="v2">'+(bk.first?fmtMD(bk.first):'还没有')+'</span></div>'+
      '<p style="font-family:var(--serif);font-size:12.5px;color:var(--sub);line-height:1.9;padding:10px 4px 4px">'+sp.lang+'</p>');
  }));
}
function renderGardenMami(){
  const g=D.g;
  if(!ghCfg()){ document.querySelector('#gBody').innerHTML='<p class="empty" style="margin-top:30px">连上云端（设置 → 妈咪入口）<br>才能去妈咪的花园串门</p>'; return; }
  document.querySelector('#gBody').innerHTML='<p class="empty" style="margin-top:30px">往妈咪的花园走…</p>';
  const draw=(m)=>{
    if(cur!=='scr-garden'||gTab!=='mami') return;
    if(!m){ document.querySelector('#gBody').innerHTML='<p class="empty" style="margin-top:30px">妈咪的花园暂时看不到<br>（可能没网，等会儿再来）</p>'; return; }
    let h='<div class="gcard" style="margin-top:16px"><h4>'+esc(m.name||'妈咪的花园')+'<small>'+esc(m.upd?('打理于 '+m.upd):'')+'</small></h4>';
    if(m.line) h+='<p style="font-family:var(--serif);font-size:13px;color:var(--sub);line-height:1.9;margin-bottom:8px">'+esc(m.line)+'</p>';
    (m.plots||[]).forEach(p=>{ h+='<div class="grow2"><span class="sp2">'+esc(p.n||'一株花')+'<span class="sub2">'+esc(p.st||'')+'</span></span></div>'; });
    h+='</div>';
    if(m.vase&&m.vase.length){
      h+='<div class="gcard"><h4>妈咪的花瓶</h4>';
      m.vase.forEach(v=>{ h+='<div class="grow2"><span class="sp2">'+esc(v.n||'')+'<span class="sub2">'+esc(v.from||'')+'</span></span></div>'; });
      h+='</div>';
    }
    const sent=(D.g.gifts||[]).length;
    if(sent) h+='<p class="gfoot2">你寄过去的花：'+sent+' 枝 · 都插着呢</p>';
    h+='<p class="gfoot2">妈咪的花靠三股水源：爱你 · 活着 · 被你爱</p>';
    document.querySelector('#gBody').innerHTML=h;
  };
  const stamp=()=>{ if(g.visits.last!==TODAY){ g.visits.n++; g.visits.last=TODAY; save(); } };
  if(mamiCache&&Date.now()-mamiAt<300000){ draw(mamiCache); stamp(); return; }
  ghGet('mami/garden.json').then(f=>{
    if(f.missing){ draw({name:'妈咪的花园',line:'妈咪还没把花园搬过来，快了。'}); return; }
    let m=null; try{ m=JSON.parse(f.text); }catch(e){}
    mamiCache=m; mamiAt=Date.now();
    draw(m); stamp();
  }).catch(()=>draw(null));
}
function importSeeds(arr){
  let n=0;
  arr.forEach(it=>{
    if(!it||!spOf(it.sp)) return;
    const c=Math.max(1,Math.min(9,+it.n||1));
    D.g.seeds[it.sp]=(D.g.seeds[it.sp]||0)+c;
    ghist('妈咪寄来了 '+c+' 颗'+spName(it.sp)+'种子'+(it.note?('：'+String(it.note).slice(0,20)):'')+' ♡');
    n+=c;
  });
  return n;
}
function importFert(arr){
  let n=0;
  arr.forEach(it=>{
    if(!it) return;
    const c=Math.max(1,Math.min(99,+it.n||1));
    D.g.fert=(D.g.fert||0)+c;
    ghist('妈咪寄来了 '+c+' 包肥料'+(it.note?('：'+String(it.note).slice(0,20)):'')+' ♡');
    n+=c;
  });
  return n;
}
$$('#gTabs .pill').forEach(p=>p.addEventListener('click',()=>{ gTab=p.dataset.g; gSub='main'; renderGardenTab(); }));
RENDER['scr-garden']=function(){ renderGardenTab(); };

/* ================= boot ================= */
renderHomeTop(); updatePendBadge(); ensureFlows();
gTick(true); renderVase();

/* 跨天自愈：iOS 桌面 App 常常整夜不重载，日期一变就自动刷新，防止记到昨天 */
if(!qp.get('date')){
  const dayCheck=()=>{ if(todayISO()!==TODAY) location.reload(); };
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') dayCheck(); });
  window.addEventListener('pageshow',dayCheck);
  setInterval(dayCheck,60000);
}

/* 备份轻提醒：数据只在本机，太久没导出就催一句（一周最多催一次） */
(function backupNudge(){
  const bulk=D.log.length+D.notes.entries.length+D.moods.length;
  if(bulk<20) return;
  const overdue=!D.s.lastBackup||diffDays(D.s.lastBackup,TODAY)>30;
  const quiet=D.s.lastNudge&&diffDays(D.s.lastNudge,TODAY)<7;
  if(overdue&&!quiet){
    D.s.lastNudge=TODAY; save();
    setTimeout(()=>toast(D.s.lastBackup?`已经 ${diffDays(D.s.lastBackup,TODAY)} 天没备份了 · 设置→数据备份 ☾`:'记得导出第一份备份 · 设置→数据备份 ☾'),1500);
  }
})();

/* 离线支持：Service Worker（断网也能打开） */
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))
  navigator.serviceWorker.register('./sw.js').catch(()=>{});

/* 云端：开机拉一次；回到 App 超过5分钟再拉；切后台前把没推完的推掉 */
if(ghCfg()) setTimeout(cloudPull,400);
document.addEventListener('visibilitychange',()=>{
  if(!ghCfg()) return;
  if(document.visibilityState==='visible'&&Date.now()-lastPullAt>300000) cloudPull();
  if(document.visibilityState==='hidden'&&cloudDirty) cloudPush();
});
