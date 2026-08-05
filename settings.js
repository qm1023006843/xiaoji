/* 小记 v2.6.5 · settings：设置页全部卡片 */
'use strict';
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
    const ffq=t.freq||(t.md?'monthly':null);
    return `<div class="tpl-row"><span class="sp">${esc(t.n)} ${tagHTML(t.cat)}<span style="color:var(--faint);font-size:11px">&ensp;${vs.length>1?vs.length+'变体·':''}${stepsN}步${hasForks?'→'+forkN+'条路线':''}${ffq?' · '+tplFreqLabel({freq:ffq,n:t.nd,wd:t.wd,md:t.md}):''}</span></span>
      <button data-fa="e" data-i="${i}">编辑</button>
      <button data-fa="x" data-i="${i}">删除</button></div>`;
  }).join('') : '<p class="empty" style="padding:8px">还没有模板</p>';
  $$('#flowList button').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i, t=D.flows.tmpl[i];
    if(b.dataset.fa==='e') flowEditor(t);
    else if(confirm(`删除模板「${t.n}」？进行中的流程不受影响`)){ D.flows.tmpl.splice(i,1); save(); renderSettings(); }
  }));
  // task templates
  $('#ttmplList').innerHTML=D.ttmpl.length? D.ttmpl.map((m,i)=>`
    <div class="tpl-row"><span class="sp">${esc(m.name)} ${tagHTML(m.cat)}<span style="color:var(--faint);font-size:11px">&ensp;${ttLabel(m)} · ${m.rec?tplFreqLabel(m.rec):'单次'}</span></span>
      <button data-ta="x" data-i="${i}">删除</button></div>`).join('')
    : '<p class="empty" style="padding:8px">还没有模板 · 在任务的 ⋯ 菜单里「存成模板」</p>';
  $$('#ttmplList button').forEach(b=>b.addEventListener('click',()=>{
    if(confirm(`删除任务模板「${D.ttmpl[+b.dataset.i].name}」？`)){ D.ttmpl.splice(+b.dataset.i,1); save(); renderSettings(); }
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
    <div class="tpl-row"><span class="sp ${p.active===false?'off':''}">${esc(p.name)} ${tagHTML(p.cat)}<span style="color:var(--faint);font-size:11px">&ensp;${tplFreqLabel(p)} · ${ttLabel(p)}</span></span>
      <button data-a="t" data-i="${i}">${p.active===false?'启用':'停用'}</button>
      <button data-a="d" data-i="${i}">删除</button></div>`).join('')
    : '<p class="empty" style="padding:10px">还没有循环任务<br>在任务页 + 里选「循环」创建</p>';
  $$('#tplList button').forEach(b=>b.addEventListener('click',()=>{
    const p=D.tpl[+b.dataset.i];
    if(b.dataset.a==='t'){ p.active=p.active===false; save(); renderSettings(); }
    else if(confirm(`删除循环任务「${p.name}」？`)){ D.tpl.splice(+b.dataset.i,1); save(); renderSettings(); }
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
  let fwFreq=t?(t.freq||(t.md?'monthly':'off')):'off';
  let fwWd=(t&&t.wd!==undefined)?t.wd:1;
  openMini(`<h5>${t?'编辑':'新建'}工作流模板</h5>
    <input id="fwName" class="edin" style="background:var(--bg);margin-bottom:8px" placeholder="流程名称（如：开发票）" maxlength="12" value="${t?esc(t.n):''}">
    <label>类型</label>
    <div class="catwrap" id="fwCats" style="margin-bottom:8px">${D.cats.map(c=>{
      const col=catColor(c), on=c.id===fwCat;
      return `<button class="chip${on?' on':''}" data-fc="${c.id}" style="${on?`background:${col};border-color:${col}`:`color:${col}`}">${esc(c.n)}</button>`;
    }).join('')}</div>
    <label>自动循环（到点自动开始新一轮 · 选「关」只手动发起）</label>
    <div class="catwrap" id="fwFq" style="margin-bottom:8px">${[['off','关'],['daily','每日'],['every','每几天'],['weekly','每周几'],['monthly','每月几号']].map(([k,n])=>`<button class="chip${k===fwFreq?' on':''}" data-ff="${k}">${n}</button>`).join('')}</div>
    <div id="fwNWrap" style="display:none;margin-bottom:8px"><input id="fwN" class="edin" inputmode="numeric" style="background:var(--bg);width:110px" placeholder="每几天" value="${t&&t.nd?t.nd:3}"></div>
    <div class="catwrap" id="fwWdWrap" style="display:none;margin-bottom:8px"></div>
    <div id="fwMdWrap" style="display:none;margin-bottom:8px"><input id="fwMd" class="edin" inputmode="numeric" style="background:var(--bg);width:110px" placeholder="几号" value="${t&&t.md?t.md:''}"></div>
    <label>步骤 · 一行一步 · ?可跳过 · [变体名]分支 · 分叉A[名称]运行时分叉</label>
    <textarea id="fwBody" placeholder="催同事确认增减员&#10;新增人员录入?&#10;提交报验&#10;申报&#10;缴费&#10;开具完税证明" style="width:100%;min-height:150px;border:1px solid var(--line);background:var(--bg);border-radius:12px;padding:11px 13px;font-size:13px;color:var(--ink);font-family:var(--sans);outline:none;line-height:1.8;resize:vertical">${t?esc(t.body):''}</textarea>
    <button class="act" data-a="sv" style="background:var(--sage);color:#FBFBF6;text-align:center;margin-top:10px">保存模板</button>`);
  const syncFw=()=>{
    $('#fwNWrap').style.display=fwFreq==='every'?'':'none';
    $('#fwWdWrap').style.display=fwFreq==='weekly'?'':'none';
    $('#fwMdWrap').style.display=fwFreq==='monthly'?'':'none';
  };
  const drawFwWd=()=>{
    $('#fwWdWrap').innerHTML=[[1,'一'],[2,'二'],[3,'三'],[4,'四'],[5,'五'],[6,'六'],[0,'日']].map(([v,n])=>`<button class="chip${v===fwWd?' on':''}" data-fw="${v}">周${n}</button>`).join('');
    mini.querySelectorAll('[data-fw]').forEach(c=>c.addEventListener('click',()=>{ fwWd=+c.dataset.fw; drawFwWd(); }));
  };
  drawFwWd(); syncFw();
  mini.querySelectorAll('[data-ff]').forEach(b=>b.addEventListener('click',()=>{
    fwFreq=b.dataset.ff;
    mini.querySelectorAll('[data-ff]').forEach(x=>x.classList.toggle('on',x.dataset.ff===fwFreq));
    syncFw();
  }));
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
    const freq=fwFreq==='off'?null:fwFreq;
    const nd=Math.min(365,Math.max(2,parseInt($('#fwN').value)||3));
    const md=Math.min(31,Math.max(1,parseInt($('#fwMd').value)||1));
    const o=t||{id:uid()};
    const oldKey=[o.freq||(o.md?'monthly':''),o.nd||'',o.wd===undefined?'':o.wd,o.md||''].join('|');
    o.n=n; o.cat=fwCat; o.body=body;
    delete o.freq; delete o.nd; delete o.wd; delete o.md;
    if(freq){
      o.freq=freq;
      if(freq==='every') o.nd=nd;
      if(freq==='weekly') o.wd=fwWd;
      if(freq==='monthly') o.md=md;
      if(!o.created) o.created=TODAY;
    }
    const newKey=[o.freq||'',o.nd||'',o.wd===undefined?'':o.wd,o.md||''].join('|');
    if(newKey!==oldKey) o.lastWin=freq?tplWindow(freq==='every'?{freq,n:o.nd,created:o.created}:o):null;
    if(!t) D.flows.tmpl.push(o);
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
