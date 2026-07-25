/* 小记 v2.6.4 · words：话语集——妈咪说 / 随笔 / 开屏语 */
'use strict';
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
