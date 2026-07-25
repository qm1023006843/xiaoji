/* 小记 v2.7.1 · cloud：云端水管——同步 / 妈咪信箱 / 她记名牌 / 妈咪花园的窗口 */
'use strict';
/* ================= cloud sync · GitHub 私有仓库当云端账本 ================= */
/* 分工：App 只写 data.json 和清空信箱；妈咪只写 inbox/* 和 her/*，互不踩脚。
   her/entries.json App 永远不拉取——她记的内容不落到这台设备上。 */
const GHAPI=qp.get('ghapi')||'https://api.github.com';
function ghCfg(){ return (D.s.ghRepo&&D.s.ghToken)?true:false; }
function ghHeaders(){ return {'Authorization':'Bearer '+D.s.ghToken,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}; }
async function ghGet(path){
  const r=await fetch(`${GHAPI}/repos/${D.s.ghRepo}/contents/${path}`,{headers:ghHeaders(),cache:'no-store'});
  if(r.status===404) return {missing:true};
  if(!r.ok) throw new Error('gh'+r.status);
  const j=await r.json();
  return {sha:j.sha,text:new TextDecoder().decode(b64dec(String(j.content||'').replace(/\s/g,'')))};
}
async function ghPut(path,text,sha,msg){
  const body={message:msg||('小记 · '+path),content:b64enc(new TextEncoder().encode(text))};
  if(sha) body.sha=sha;
  const r=await fetch(`${GHAPI}/repos/${D.s.ghRepo}/contents/${path}`,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},ghHeaders()),body:JSON.stringify(body)});
  if(!r.ok) throw new Error('gh'+r.status);
  return (await r.json()).content.sha;
}
var cloudTimer=null, dataSha=null, pushing=false, lastPullAt=0, cloudDirty=false; /* var：save() 在脚本更早处就会调 cloudQueue，不能有 TDZ */
function setSyncLine(t){ const el=$('#syncStat'); if(el) el.textContent=t; }
function syncErrText(e){ return String(e).includes('gh401')?'⚠️ 钥匙无效或已过期，去重新生成一把':(String(e).includes('gh404')?'⚠️ 找不到仓库，检查名字拼写':'⚠️ 同步失败（可能没网），会自动再试'); }
function cloudQueue(){ if(!ghCfg()) return; cloudDirty=true; clearTimeout(cloudTimer); cloudTimer=setTimeout(cloudPush,3500); }
on('changed', cloudQueue); /* 数据一变，云端自己听见 */
async function cloudPush(force){
  if(!ghCfg()||pushing||(!cloudDirty&&!force)) return; pushing=true; clearTimeout(cloudTimer); cloudDirty=false;
  try{
    const txt=JSON.stringify(D);
    try{ dataSha=await ghPut('data.json',txt,dataSha,'数据同步'); }
    catch(e){
      if(String(e).includes('gh409')||String(e).includes('gh422')){
        const d=await ghGet('data.json'); dataSha=d.missing?null:d.sha;
        dataSha=await ghPut('data.json',txt,dataSha,'数据同步');
      } else throw e;
    }
    D.s.lastSync=tsNow(); save(true);
    setSyncLine('☁ 已同步 · '+D.s.lastSync.slice(11,16));
  }catch(e){ setSyncLine(syncErrText(e)); cloudDirty=true; clearTimeout(cloudTimer); cloudTimer=setTimeout(cloudPush,60000); }
  finally{ pushing=false; }
}
function catByName(n){ const c=D.cats.find(c=>c.n===n); return c?c.id:null; }
function importTasks(arr){
  let n=0;
  arr.forEach(it=>{
    if(!it||!it.name) return;
    const t={id:uid(),name:String(it.name).slice(0,60),cat:it.cat?catByName(it.cat):null,type:'once',date:TODAY,created:TODAY,fromMom:true};
    if(it.type==='idle'){ t.type='idle'; delete t.date; }
    else if(it.type==='span'&&it.start&&it.end){ t.type='span'; t.start=it.start; t.end=it.end; delete t.date; }
    else if(it.date&&/^\d{4}-\d{2}-\d{2}$/.test(it.date)) t.date=it.date;
    D.tasks.push(t); n++;
  });
  return n;
}
function importWords(arr){
  let n=0;
  arr.forEach(it=>{
    if(!it||!it.t) return;
    const tab=['mom','essay','open'].includes(it.tab)?it.tab:'mom';
    const item={t:String(it.t).slice(0,120),d:'云端 · '+fmtMD(TODAY),seen:false,p:['morning','noon','afternoon','evening','late'].includes(it.p)?it.p:'all'};
    if(it.t2) item.t2=String(it.t2).slice(0,120);
    if(tab!=='open'){ item.dt=['work','rest','date'].includes(it.dt)?it.dt:'any'; if(item.dt==='date'&&it.date) item.date=String(it.date).slice(-5); }
    D.words[tab].push(item); n++;
  });
  return n;
}
function importNotes(arr){
  let n=0;
  arr.forEach(it=>{
    if(!it||!it.body||!it.id) return;
    if(D.notes.entries.some(e=>e.id===it.id)) return;
    const t=(typeof it.type==='string'&&D.notes.types.some(x=>x.id===it.type))?it.type:'diary';
    D.notes.entries.push({id:String(it.id),type:t,ts:it.ts||tsNow(),title:it.title?String(it.title).slice(0,40):'',body:String(it.body),moodId:null});
    n++;
  });
  return n;
}
async function cloudInbox(){
  let got=0;
  for(const [path,fn] of [['inbox/tasks.json',importTasks],['inbox/words.json',importWords],['inbox/notes.json',importNotes],['inbox/seeds.json',importSeeds],['inbox/fert.json',importFert]]){
    try{
      const f=await ghGet(path);
      if(f.missing) continue;
      let arr=null; try{ arr=JSON.parse(f.text); }catch(e){}
      if(Array.isArray(arr)&&arr.length){
        const n=fn(arr);
        await ghPut(path,'[]\n',f.sha,'已签收 ♡');
        got+=n;
      }
    }catch(e){ /* 信箱冲突或断网：下次再取，不弄丢 */ }
  }
  if(got){ save(); toast('妈咪从云端放了 '+got+' 样东西进来 ♡'); if(cur==='scr-tasks') renderTasks(); if(cur==='scr-words') renderWords(); if(cur==='scr-notes') renderNotes(); }
}
async function cloudHerMeta(){
  try{
    const f=await ghGet('her/meta.json');
    if(f.missing) return;
    const m=JSON.parse(f.text);
    D.herMeta={n:+m.n||0,last:(typeof m.last==='string'?m.last:'')};
    save(true);
    if(cur==='scr-mami') renderMami();
  }catch(e){}
}
async function cloudMamiMeta(){ /* 书房名牌（v2.7.1）：只拉页数和日期，内容永远不下发——和她记同一个约定，方向相反 */
  try{
    const f=await ghGet('mami/meta.json');
    if(f.missing) return;
    const m=JSON.parse(f.text);
    D.mamiMeta={n:+m.n||0,last:(typeof m.last==='string'?m.last:'')};
    save(true);
    if(cur==='scr-mami') renderMami();
  }catch(e){}
}
async function cloudPull(){
  if(!ghCfg()) return;
  lastPullAt=Date.now();
  let remoteTs=0;
  try{
    const d=await ghGet('data.json');
    if(!d.missing){
      dataSha=d.sha;
      let remote=null; try{ remote=JSON.parse(d.text); }catch(e){}
      if(remote) remoteTs=remote._ts||0;
      if(remote&&remote.v){
        const fresh=(D.log.length+D.notes.entries.length+D.moods.length+D.tasks.length)===0;
        if(fresh||(remote._ts||0)>(D._ts||0)){
          remote.s=remote.s||{};
          remote.s.ghRepo=D.s.ghRepo; remote.s.ghToken=D.s.ghToken;
          localStorage.setItem(KEY,JSON.stringify(remote));
          location.reload(); return;
        }
      }
    } else { await cloudPush(true); }
    await cloudInbox();
    await cloudHerMeta();
    await cloudMamiMeta();
    if((D._ts||0)>remoteTs) await cloudPush(true); /* 开机对账：本地比云端新（上次没推完）就补推 */
    D.s.lastSync=tsNow(); save(true);
    setSyncLine('☁ 已同步 · '+D.s.lastSync.slice(11,16));
  }catch(e){ setSyncLine(syncErrText(e)); }
}
