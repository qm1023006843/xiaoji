/* 小记 v2.7.0 · store：数据中心——D 的家（默认值/迁移/save/跨天自愈）+ 事件铃铛 */
'use strict';
/* ================= 事件铃铛 ================= */
/* 模块间不再直调：做完事喊一声，谁关心谁自己听。save() 喊 'changed'，云端听见排队推送。 */
const BUS={};
function on(ev,fn){ (BUS[ev]=BUS[ev]||[]).push(fn); }
function emit(ev,a,b){ (BUS[ev]||[]).forEach(fn=>{ try{ fn(a,b); }catch(e){ console.error('[bus]',ev,e); } }); }

function defaultCats(){
  return [
    {id:'work',n:'工作',c:0},{id:'life',n:'生活',c:1},{id:'love',n:'爱情',c:2},
    {id:'family',n:'亲情',c:3},{id:'friend',n:'朋友',c:4},{id:'care',n:'自我养护',c:5},
    {id:'grow',n:'自我提升',c:6},{id:'shop',n:'购物',c:7},{id:'read',n:'读书',c:8}
  ];
}
/* ================= data ================= */
const KEY='musage_v1';
function defaults(){
  return {
    v:1, lastOpen:null,
    s:{theme:'day', nick:'青沐', rate:2, t1:10, t2:25},
    pools:{
      A:[{t:'喝一杯喜欢的奶茶',rep:true,used:false},{t:'看一集喜欢的短剧',rep:true,used:false},{t:'散步二十分钟，什么都不想',rep:true,used:false}],
      B:[{t:'点一顿想吃很久的外卖',rep:true,used:false},{t:'给自己买一支新笔 / 小文具',rep:false,used:false},{t:'一个完全不码字的下午',rep:true,used:false}],
      C:[{t:'买那个购物车里放了很久的东西',rep:false,used:false},{t:'安排一次短途出游',rep:false,used:false},{t:'一整天彻底放假，理直气壮',rep:true,used:false}]
    },
    miles:[{n:100,t:'吃一顿正式的大餐，庆祝一百件小事',c:false},{n:500,t:'给自己买一件一直想要的大件',c:false},{n:1000,t:'策划一次真正的旅行',c:false}],
    tasks:[], tpl:[], ttmpl:[],
    log:[], disc:[],
    rw:{counter:0, life:0, pend:[], done:[]},
    words:{
      mom:[{t:'慢慢来，别急，妈咪永远站在你这边。',d:'内置',seen:false}],
      essay:[{t:'初心是一张白纸，所以什么都写得下。——《禅者的初心》',d:'内置',seen:false},{t:'Begin anywhere. — John Cage',d:'内置',seen:false}],
      open:[]
    },
    mood:{}, cyc:[]
  };
}
let D;
try{ D = JSON.parse(localStorage.getItem(KEY)) || defaults(); }catch(e){ D = defaults(); }
if(!D.v) D = defaults();
/* v1.1 migration */
if(!D.cats) D.cats=defaultCats();
if(!D.s.tFilter) D.s.tFilter='all';
D.log.forEach(l=>{ if(!l.id) l.id=uid()+Math.random().toString(36).slice(2,5); });
/* v1.2 migration */
if(!D.notes) D.notes={types:[{id:'diary',n:'日记'},{id:'wen',n:'小文'},{id:'her',n:'她记'}],entries:[]};
if(!D.s.darkPref) D.s.darkPref='night';
/* v1.3 migration */
if(D.s.taskStyle===undefined) D.s.taskStyle='box';
/* v1.6 migration: tpl -> recurrence */
D.tpl.forEach(p=>{ if(!p.freq) p.freq='daily'; if(!p.created) p.created=D.lastOpen||todayISO(); });
/* v2.0 migration */
if(!D.anni) D.anni=[];
/* v2.1 migration */
if(!D.flows) D.flows={tmpl:[],inst:[]};
if(!D.moods){
  D.moods=[];
  if(D.mood) Object.keys(D.mood).forEach(k=>{ const m=D.mood[k]; D.moods.push({id:uid()+k.slice(8),ts:k+'T12:00',date:k,v:m.v,note:m.note||'',src:'mood'}); });
}
[['diary','日记',0],['wen','小文',1],['her','她记',2],['book','读书笔记',8]].forEach(([id,n,c])=>{
  const t=D.notes.types.find(x=>x.id===id);
  if(!t) D.notes.types.push({id,n,c}); else if(t.c===undefined) t.c=c;
});
D.notes.types.forEach((t,i)=>{ if(t.c===undefined) t.c=[4,5,7,10,11][i%5]; });
/* v2.4 migration: 她记交给妈咪（本地旧内容改名保留，不动一个字） */
(function(){
  const ht=D.notes.types.find(t=>t.id==='her');
  if(ht){
    if(D.notes.entries.some(e=>e.type==='her')) ht.n='旧她记';
    else D.notes.types=D.notes.types.filter(t=>t.id!=='her');
  }
  if(D.herMeta===undefined) D.herMeta=null;
  if(D.mamiMeta===undefined) D.mamiMeta=null; /* v2.7.1 书房名牌 */
})();
/* v2.5 migration: 花园（她与妈咪共同设计 · 2026-07-20 定稿） */
if(!D.g) D.g={
  v:2, coins:0,
  seeds:{fx:2},              /* 开园礼：两颗凤仙花种子 */
  plots:[null,null,null],
  inv:[],                    /* 花枝 {id,sp,sc,ph,F,B,Dc,lt,loc,pos} */
  vase:{vid:'v1', ws:null, note:'', snail:false, hide:false},
  fridge:null,               /* 冰箱要自己买：f1/f2 */
  bottles:{},                /* 囤的瓶装水 */
  fert:0,                    /* 肥料库存（包） */
  book:{}, hist:[], care:{}, gifts:[],
  visits:{n:0,last:null},
  own:['v1'],
  wk:{k:'',b:{}},
  deco:{}                    /* v2.9 装饰抽屉：own 标记与小状态 {fox:1,sign:{t:''},vskin:'vmilk',pskin:'psq',lampNote:''} */
};
if(D.g.v===1){ /* 开发期状态升级 */
  D.g.v=2; D.g.fridge=null; D.g.bottles={};
  const oldSlots=(D.g.vase&&D.g.vase.slots)||{};
  D.g.inv=(D.g.inv||[]).map(s=>({id:s.id,sp:s.sp,sc:s.sc||0,ph:0,F:s.wl||0,B:0,Dc:0,lt:Date.now(),loc:'shelf',pos:null}));
  Object.keys(oldSlots).forEach(pos=>{ const o=oldSlots[pos]; D.g.inv.push({id:uid(),sp:o.sp,sc:o.sc||0,ph:1,F:0,B:120,Dc:0,lt:Date.now(),loc:'vase',pos}); });
  D.g.vase={vid:D.g.vase.vid||'v1',ws:D.g.vase.ws||null,note:'',snail:!!D.g.vase.snail,hide:!!D.g.vase.hide};
}
if(D.g.fert===undefined) D.g.fert=0;
/* v2.5.8 migration: 颜色系统——旧 fx 键迁移为 fx_mr（玫红） */
if(D.g.seeds.fx!==undefined&&typeof D.g.seeds.fx==='number'){D.g.seeds.fx_mr=(D.g.seeds.fx_mr||0)+D.g.seeds.fx;delete D.g.seeds.fx;}
D.g.plots.forEach(function(p){if(p&&p.sp==='fx')p.sp='fx_mr';});
(D.g.inv||[]).forEach(function(s){if(s&&s.sp==='fx')s.sp='fx_mr';});
(D.g.gifts||[]).forEach(function(gf){if(gf&&gf.sp==='fx')gf.sp='fx_mr';});
if(D.g.book&&D.g.book.fx&&!D.g.book.fx_mr){D.g.book.fx_mr=D.g.book.fx;delete D.g.book.fx;}
if(D.g.wk&&D.g.wk.b&&D.g.wk.b.fx!==undefined){D.g.wk.b.fx_mr=(D.g.wk.b.fx_mr||0)+D.g.wk.b.fx;delete D.g.wk.b.fx;}
/* v2.7 migration: 花园新引擎 · 清园补籽（她拍板：旧账不折算，一盆一籽、一枝一籽退回，开新账） */
if(D.g && !D.g.ev){
  D.g.ev=2;
  let back=0;
  D.g.plots=D.g.plots.map(p=>{ if(p&&p.sp){ D.g.seeds[p.sp]=(D.g.seeds[p.sp]||0)+1; back++; } return null; });
  (D.g.inv||[]).forEach(st=>{ if(st&&st.sp){ D.g.seeds[st.sp]=(D.g.seeds[st.sp]||0)+1; back++; } });
  D.g.inv=[];
  if(D.g.vase){ D.g.vase.ws=null; D.g.vase.snail=false; }
  if(back){ D.g.hist.unshift(fmtMD(todayISO())+'　花园换了新的钟——旧盆栽旧花枝化作 '+back+' 颗种子回到袋里，新账从今天记起'); if(D.g.hist.length>40) D.g.hist.length=40; }
}
/* v2.8 migration: 任务模板 */
if(!D.ttmpl) D.ttmpl=[];
/* v2.9 migration: 花园装饰抽屉（老数据零迁移风险：没有就给个空的） */
if(D.g&&D.g.deco===undefined) D.g.deco={};
function save(silent){
  if(!silent) D._ts=Date.now();
  try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){ toast('保存失败：存储空间可能已满'); }
  if(!silent) emit('changed');
}

/* ================= day rollover ================= */
const TODAY = todayISO();
(function rollover(){
  if(D.lastOpen && D.lastOpen < TODAY){
    // expire once-tasks dated before today -> discard
    D.tasks = D.tasks.filter(t=>{
      if(t.type==='once' && t.date < TODAY){ D.disc.push({name:t.name,cat:t.cat,date:t.date}); return false; }
      if(t.type==='span' && t.end < TODAY){ D.disc.push({name:t.name,cat:t.cat,date:t.end}); return false; }
      return true;
    });
    // clear old daily skips
    D.tpl.forEach(p=>{ if(p.skip && p.skip < TODAY) p.skip=null; });
  }
  D.lastOpen = TODAY; save(true); /* 静默：开机例行记账不抬时间戳，否则云端写入永远抢不过本机 */
})();
