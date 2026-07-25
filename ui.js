/* 小记 v2.6.3 · ui：壳——屏幕切换 / 抽屉 / 主题 / 主页问候 / mini 面板 */
'use strict';
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

/* ---- mini action sheet ---- */
const mini=$('#mini'), miniScrim=$('#miniScrim');
function openMini(html){ mini.innerHTML=html; mini.classList.add('on'); miniScrim.classList.add('on'); }
function closeMini(){ mini.classList.remove('on'); miniScrim.classList.remove('on'); }
miniScrim.addEventListener('click',closeMini);
