/* 小记 v2.6.4 · cycle：周期——日历 / 预测 */
'use strict';
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
