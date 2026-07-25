/* 小记 v2.6.5 · garden-engine：花园引擎（纯逻辑：品种/生长/照料/花枝计时/信箱签收）——v2.7 新引擎就在这里动刀 */
'use strict';
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
