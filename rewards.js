/* 小记 v2.6.3 · rewards：抽卡与奖励——池ABC / 里程碑保底 / 待处理清单 */
'use strict';
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
