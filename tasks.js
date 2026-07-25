/* 小记 v2.6.3 · tasks：任务全家——五种类型 / 循环 / 流程与分叉 / 新建面板 / 撤销 */
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
    gardenCare(1); gardenAccel(4);
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
    gardenCare(1); gardenAccel(4);
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
