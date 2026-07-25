/* 小记 v2.6.4 · mood：心情——滑杆 / 曲线 / 时间线 */
'use strict';
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
  gardenCare(4); gardenAccel(4);
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
function renderMoodList(){
  const list=D.moods.slice().sort((a,b)=>b.ts<a.ts?-1:1).slice(0,120);
  $('#moodList').innerHTML=list.length? list.map(m=>{
    const badge=m.src&&m.src!=='mood'?`<span class="badge">${esc(noteTypeOf(m.src).n)}</span>`:'';
    const d=m.date===TODAY?'今天':m.date.slice(5,7)+'.'+m.date.slice(8,10);
    return `<div class="done-item"><span class="tm" style="margin:0;flex:none;width:78px;text-align:left">${d} ${m.ts.slice(11,16)}</span><span class="nm2">${esc(m.note||'')}</span>${badge}<span class="tm" style="color:${moodColor(m.v)};font-weight:600;font-size:12.5px">${m.v>0?'+':m.v<0?'−':''}${Math.abs(m.v)}</span></div>`;
  }).join('') : '<p class="empty">还没有记录<br>滑一下滑杆，写一句，按保存</p>';
}
RENDER['scr-mood']=function(){ moodDisp(); drawMood(); renderMoodList(); };
