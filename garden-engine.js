/* 小记 v2.7.0 · garden-engine：花园引擎（纯逻辑：品种/生长/加速/花枝计时/信箱签收） */
'use strict';
/* ================= garden v2.7 · 她与妈咪共同设计 =================
   原则：不搞愧疚教育——花自己按钟点长，睡觉也长，永不枯死等她；天灾不天谴——遇灾全自动，无抢救按钮。
   照料印章只当晴雨表（完成任务=浇水，写字=施肥，记心情=晒太阳）；生长吃的是时间，和她做事攒下的加速。 */
const SPECIES={
  fx:{n:'凤仙花',a:'毛桃',seed:10,sell:6,gt:72,wkLim:2,
      lang:'果荚一碰就炸，把攒了一夏天的种子弹得到处都是——设防的壳里，全是想给出去的心。',
      colors:{mr:{n:'玫红',hex:'#C25E9B'},dz:{n:'淡紫',hex:'#9B7EC8'},cb:{n:'纯白',hex:'#F0E8DC'},sf:{n:'水粉',hex:'#E8A0B8'},qv:{n:'浅绿',hex:'#7BC8A4'},th:{n:'桃红',hex:'#E06878'}}},
  jj:{n:'荆芥',a:'猫薄荷',seed:8,sell:5,gt:48,wkLim:2,
      lang:'凑过来，快乐就晕开了',
      colors:{xq:{n:'雪青',hex:'#B3A6D6'},yb:{n:'月白',hex:'#E4EAF6'}}}
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
/* v2.9 装饰注册表：纯装饰零加成，一次买断；price 为 null 的是非卖品（只能靠妈咪寄）。
   cat 三类：shelf=装饰架摆件 / vskin=花瓶款式 / pskin=花盆款式。
   以后加新装饰＝这里添一行＋garden-ui 画一个剪影，商店/换装/信箱全自动跟上。
   own 标记与小状态都住 D.g.deco：{fox:1, sign:{t:'…'}, vskin:'vmilk', pskin:'psq', lampNote:'…'} */
const DECO={
  fox:{n:'打盹的小狐猫',price:45,cat:'shelf'},
  jar:{n:'萤火虫罐子',price:30,cat:'shelf'},
  vmilk:{n:'花瓶 · 牛奶瓶',price:15,cat:'vskin'},
  vclay:{n:'花瓶 · 陶土罐',price:15,cat:'vskin'},
  vslim:{n:'花瓶 · 玻璃细颈瓶',price:15,cat:'vskin'},
  psq:{n:'花盆 · 方形',price:15,cat:'pskin'},
  sign:{n:'花园木牌',price:20,cat:'shelf'},
  lamp:{n:'妈咪的小提灯',price:null,cat:'shelf'}
};
function decoHas(k){ return !!(D.g&&D.g.deco&&D.g.deco[k]); }
function decoKeys(cat){ return Object.keys(DECO).filter(k=>DECO[k].cat===cat); }
/* 当前生效的款式键（vskin/pskin 通用）：选中且确实拥有才算，否则回默认 */
function decoSkin(cat){ const d=(D.g&&D.g.deco)||{}; const k=d[cat]; return (k&&DECO[k]&&DECO[k].cat===cat&&d[k])?k:null; }
const STEM_LIFE=72;
const VASE_BASE=72;  /* v2.7 她定的：展示 72 小时 */
const POSN={l:'左',c:'中',r:'右'};
function gbook(sp){ const k=spBase(sp); const g=D.g; g.book[k]=g.book[k]||{pl:0,bl:0,sd:0,sc:0,ee:0,first:null}; return g.book[k]; }
function ghist(t){ D.g.hist.unshift(fmtMD(TODAY)+'　'+t); if(D.g.hist.length>40) D.g.hist.length=40; }
function careBits(d){ return D.g.care[d]||0; }
function careLabel(b){ if(!b) return '今天还没照料'; const a=[]; if(b&1)a.push('浇过水'); if(b&2)a.push('施过肥'); if(b&4)a.push('晒过太阳'); return '今天'+a.join('、'); }
function fridgeMult(){ const g=D.g; return g.fridge?FRIDGES[g.fridge].mult:3; }
/* v2.7 新引擎（2026-07-25 她拍板：「等着实在是太痛苦了」）：时间自然长 + 做事加速。
   阶段按品种总时长(gt)比例分：种子10% / 发芽35% / 含苞20%(st5) / 开花35%；结籽(st3)不占时间，不腐烂，等她来收。
   进度小时 = (现在 - 种下时刻pt) + 累计加速acc。plot 结构：{id,sp,pt(ms),fz,df,mk,acc(h)}。
   天灾株(fz2)在通往开花的路上 df 处早谢（0.65T×df，永远走不到开花）——加速也会把告别提前，她点头过。
   调试：?now=毫秒或ISO时间 可拨快引擎的钟（连同花枝计时）。 */
function gtNow(){ const q=qp.get('now'); if(q) return /^\d+$/.test(q)?+q:new Date(q).getTime(); return Date.now(); }
function plotHours(p){ return Math.max(0,(gtNow()-p.pt)/3600000)+(p.acc||0); }
function bsDate(p,T){ const d=new Date(gtNow()-(plotHours(p)-0.65*T)*3600000); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function plotState(p){
  const sp=spOf(p.sp), T=sp.gt;
  const h=plotHours(p), f=h/T;
  if(p.fz===2){ const dh=0.65*T*p.df; if(h>=dh) return {st:4,prog:Math.min(1,f)}; }
  if(h>=T) return {st:3,prog:1,bs:bsDate(p,T)};
  if(f<.10) return {st:0,prog:f};
  if(f<.45) return {st:1,prog:f};
  if(f<.65) return {st:5,prog:f};
  return {st:2,prog:f,bs:bsDate(p,T),hoursLeft:T-h};
}
function pruneCare(){
  const floor=addDays(TODAY,-120);
  Object.keys(D.g.care).forEach(k=>{ if(k<floor) delete D.g.care[k]; });
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
/* 加速（v2.7 取代 gardenBonus）：每做完一件事全园 −4h；肥料一包 −10h。结籽(st3)/已谢(st4)不吃加速。 */
function gardenAccel(hrs){
  const g=D.g; if(!g) return;
  let any=false;
  g.plots.forEach(p=>{
    if(!p) return;
    const s=plotState(p);
    if(s.st===0||s.st===1||s.st===5||s.st===2){ p.acc=(p.acc||0)+(hrs||4); any=true; }
  });
  if(any){ gTick(true); if(cur==='scr-garden') renderGardenTab(); renderVase(); }
}
/* 花枝两段计时：ph0 新鲜度 F(0→72h)，货架1×冰箱1/倍率；ph1 展示预算 B，瓶1×冰箱1/倍率（她的公式） */
function stemTick(s){
  const now=gtNow();
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
/* v2.9 装饰信箱：k 必须在 DECO 注册表里（任何 cat 都能寄）；已拥有跳过不重复记史；lamp 的 note 存作来历 */
function importDeco(arr){
  let n=0;
  arr.forEach(it=>{
    if(!it||!it.k||!DECO[it.k]) return;
    D.g.deco=D.g.deco||{};
    if(D.g.deco[it.k]) return;
    const note=it.note?String(it.note).slice(0,20):'';
    D.g.deco[it.k]=1;
    if(it.k==='lamp') D.g.deco.lampNote=note;
    ghist('妈咪寄来了'+DECO[it.k].n+(note?('：'+note):'')+' ♡');
    n++;
  });
  return n;
}
