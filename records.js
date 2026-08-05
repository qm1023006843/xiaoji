/* 小记 v2.6.4 · records：记录——日月年视图 / 导出 / 月报 */
'use strict';
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
    $('#recListLabel').textContent='废弃清单 · 过期归档与手动放弃';
    $('#recList').innerHTML=discs.length? discs.slice().reverse().slice(0,60).map(d=>
      `<div class="done-item" style="opacity:.72"><span class="dot" style="background:var(--faint)"></span><span class="nm2">${esc(d.name)}</span>${tagHTML(d.cat)}<span class="tm">${d.m?'放弃 · ':''}${d.date.slice(5,7)}.${d.date.slice(8,10)}</span></div>`).join('')
      : '<p class="empty">没有废弃的任务，了不起</p>';
  } else {
    $('#recListLabel').textContent='完成清单 · 点一条可修改类型';
    const fl=recF==='all'?logs:logs.filter(l=>l.cat===recF);
    const {vis:rVis}=groupFlowLogs(fl,recR==='d'&&recD===TODAY);
    const rl=$('#recList');
    if(!rVis.length){ rl.innerHTML='<p class="empty">这里还空着</p>'; }
    else {
      rl.innerHTML=rVis.slice().reverse().slice(0,60).map(v=>{
        if(v.t==='s'){ const l=v.l; return `<div class="done-item" data-id="${l.id}" style="cursor:pointer"><span class="dot" style="background:${dotColor(l.cat)}"></span><span class="nm2">${esc(l.name)}${l.rk?` <small style="color:var(--faint)">📎${esc(l.rk)}</small>`:''}</span>${tagHTML(l.cat)}<span class="tm">${(l.cd&&l.cd!==l.date)?l.cd.slice(5,7)+'.'+l.cd.slice(8,10)+'→':''}${fmtDT(l.ts)}</span></div>`; }
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
    rows=discs.map(d=>`${d.date.slice(5,7)}.${d.date.slice(8,10)}${d.m?'（放弃）':''}　${d.name}${d.cat?'（'+catOf(d.cat).n+'）':''}`);
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

/* ---- 月报（从设置段搬来，本就是记录页的活） ---- */
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
