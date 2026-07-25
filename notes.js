/* 小记 v2.6.4 · notes：笔记——分类 / 上锁(AES) / markdown / 导入 / 她记名牌 */
'use strict';
function noteTypeOf(id){ return D.notes.types.find(t=>t.id===id) || {id:null,n:'小记',c:0}; }

/* ================= lock (AES-GCM + PBKDF2) ================= */
let lockKey=null; const lockCache=new Map();
function b64enc(u8){ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); }
function b64dec(b){ const s=atob(b); const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i); return u; }
async function deriveLockKey(pw){
  const salt=b64dec(D.s.lockSalt);
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encJSON(key,obj){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(obj))));
  const buf=new Uint8Array(12+ct.length); buf.set(iv); buf.set(ct,12);
  return b64enc(buf);
}
async function decJSON(key,b64){
  const buf=b64dec(b64);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:buf.subarray(0,12)},key,buf.subarray(12));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function decryptAllLocked(){
  for(const e of D.notes.entries){
    if(e.enc&&!lockCache.has(e.id)){
      try{ lockCache.set(e.id, await decJSON(lockKey,e.data)); }catch(err){}
    }
  }
}
function relock(){ lockKey=null; lockCache.clear(); renderNotes(); toast('已重新上锁 🔒'); }
function askUnlock(){
  if(!window.crypto||!crypto.subtle){ toast('此环境不支持加密（正式网址上没问题）'); return Promise.resolve(false); }
  return new Promise(res=>{
    openMini(`<h5>🔒 输入笔记主密码</h5>
      <input type="password" id="lockPw" class="edin" style="background:var(--bg);margin-bottom:10px" placeholder="主密码" autocomplete="off">
      <div style="display:flex;gap:8px">
        <button class="act" data-a="ok" style="flex:1;background:var(--sage);color:#FBFBF6;text-align:center;margin-bottom:0">解锁</button>
        <button class="act" data-a="no" style="flex:1;text-align:center;margin-bottom:0">取消</button>
      </div>`);
    mini.querySelector('[data-a="no"]').addEventListener('click',()=>{ closeMini(); res(false); });
    $('#lockPw').addEventListener('keydown',e=>{ if(e.key==='Enter') mini.querySelector('[data-a="ok"]').click(); });
    mini.querySelector('[data-a="ok"]').addEventListener('click',async()=>{
      const pw=$('#lockPw').value;
      if(!pw) return;
      try{
        const key=await deriveLockKey(pw);
        let ok=false;
        try{ ok=(await decJSON(key,D.s.lockCheck))==='ck'; }catch(e){}
        if(ok){
          lockKey=key;
          await decryptAllLocked();
          closeMini(); renderNotes(); toast('已解锁 · 点筛选栏的 🔓 可重新上锁');
          res(true);
        } else toast('密码不对');
      }catch(e){ toast('解锁出错了'); }
    });
  });
}
function entryView(e){
  if(!e.enc) return e;
  const c=lockCache.get(e.id);
  return c?Object.assign({},e,c,{pending:false}):Object.assign({},e,{title:null,body:'',wx:'',mood:null,pending:true});
}
/* ================= notes ================= */
let noteFilter='all', noteMonth=null, edEntry=null, edType='diary', edMode='edit';
function ntColor(t){ return `var(--p${t&&t.c!==undefined?t.c:0})`; }
function ntTag(id){
  const t=noteTypeOf(id), col=ntColor(t);
  return `<span class="tag ty" style="color:${col};background:color-mix(in srgb, ${col} 12%, var(--card))">${esc(t.n)}</span>`;
}
function stripMD(s){
  return s.replace(/```[\s\S]*?```/g,' ').replace(/[#*>`\-]+/g,'').replace(/\s+/g,' ').trim();
}
function fmtFullDate(ts){ return `${ts.slice(0,4)}年${+ts.slice(5,7)}月${+ts.slice(8,10)}日 · ${ts.slice(11,16)}`; }
function renderNotes(){
  const chips=[['all','全部'],...D.notes.types.map(t=>[t.id,t.n])];
  $('#noteChips').innerHTML=chips.map(([k,n])=>`<button class="chip${k===noteFilter?' on':''}" data-f="${k}">${esc(n)}</button>`).join('')
    +`<button class="calbtn${noteMonth?' on':''}" id="noteCalBtn" aria-label="按月查看"><svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3" x2="8" y2="6.5"/><line x1="16" y1="3" x2="16" y2="6.5"/></svg></button>`;
  if(lockKey) $('#noteChips').innerHTML+= `<button class="calbtn on" id="noteRelock" aria-label="重新上锁">🔓</button>`;
  $$('#noteChips .chip').forEach(c=>c.addEventListener('click',()=>{ noteFilter=c.dataset.f; renderNotes(); }));
  $('#noteCalBtn').addEventListener('click',openMonthPicker);
  if($('#noteRelock')) $('#noteRelock').addEventListener('click',relock);
  let list=D.notes.entries.slice();
  if(noteFilter!=='all') list=list.filter(e=>e.type===noteFilter);
  if(noteMonth) list=list.filter(e=>e.ts.startsWith(noteMonth));
  list.sort((a,b)=>b.ts<a.ts?-1:1);
  const fl=$('#noteFilterLine');
  if(noteMonth){ fl.style.display=''; fl.textContent=`${+noteMonth.slice(0,4)}年${+noteMonth.slice(5,7)}月 · 共 ${list.length} 篇 · 点此清除 ✕`; }
  else fl.style.display='none';
  /* 她记卡片 v2.7.1 起搬去「妈咪」页 */
  $('#noteList').innerHTML=(list.length? list.map(raw=>{
    const e=entryView(raw);
    if(e.pending) return `<div class="entry" data-id="${e.id}">
      <div class="emeta"><span>${fmtFullDate(e.ts)}</span>${ntTag(e.type)}</div>
      <h4 class="untitled">🔒 已上锁</h4>
      <div class="ex">轻点解锁查看</div>
    </div>`;
    const mood=(e.mood===0||e.mood)?`<span class="mv" style="color:${moodColor(e.mood)}">${e.mood>0?'+':''}${e.mood}</span>`:'';
    return `<div class="entry" data-id="${e.id}">
      <div class="emeta"><span>${fmtFullDate(e.ts)}</span>${e.wx?`<span>${esc(e.wx)}</span>`:''}${mood}${ntTag(e.type)}</div>
      <h4 class="${e.title?'':'untitled'}">${esc(e.title||'（无题）')}</h4>
      <div class="ex">${esc(stripMD(e.body).slice(0,80))}</div>
    </div>`;
  }).join('') : '<p class="empty">这里还空着<br>点右下角 ＋ 写第一篇</p>');
  $$('#noteList .entry').forEach(el=>el.addEventListener('click',async()=>{
    const e=D.notes.entries.find(x=>x.id===el.dataset.id);
    if(!e) return;
    if(e.enc&&!lockCache.has(e.id)){ const ok=await askUnlock(); if(!ok) return; }
    openEditor(e.type,e,'view');
  }));
}
$('#noteFilterLine').addEventListener('click',()=>{ noteMonth=null; renderNotes(); });
function openMonthPicker(){
  const years=[...new Set(D.notes.entries.map(e=>e.ts.slice(0,4)))];
  const nowY=TODAY.slice(0,4);
  if(!years.includes(nowY)) years.push(nowY);
  years.sort().reverse();
  const yrs=years.slice(0,3);
  let selY=noteMonth?noteMonth.slice(0,4):nowY;
  if(!yrs.includes(selY)) selY=yrs[0];
  function draw(){
    const counts={};
    D.notes.entries.forEach(e=>{
      if((noteFilter==='all'||e.type===noteFilter)&&e.ts.startsWith(selY)){ const m=+e.ts.slice(5,7); counts[m]=(counts[m]||0)+1; }
    });
    openMini(`<h5>按月份查看${noteFilter==='all'?'':' · '+esc(noteTypeOf(noteFilter).n)}</h5>
      <div class="yrtabs">${yrs.map(y=>`<button class="chip${y===selY?' on':''}" data-y="${y}">${y}</button>`).join('')}<button class="chip" data-y="_clear" style="margin-left:auto">全部时间</button></div>
      <div class="mgrid">${Array.from({length:12},(_,i)=>{
        const m=i+1, n=counts[m]||0;
        const key=selY+'-'+String(m).padStart(2,'0');
        return `<div class="mcell${n?'':' off'}${noteMonth===key?' on':''}" data-m="${key}">${m}月<small>${n?n+' 篇':'—'}</small></div>`;
      }).join('')}</div>`);
    mini.querySelectorAll('[data-y]').forEach(b=>b.addEventListener('click',()=>{
      if(b.dataset.y==='_clear'){ noteMonth=null; closeMini(); renderNotes(); return; }
      selY=b.dataset.y; draw();
    }));
    mini.querySelectorAll('.mcell:not(.off)').forEach(c=>c.addEventListener('click',()=>{
      noteMonth=c.dataset.m; closeMini(); renderNotes();
    }));
  }
  draw();
}
/* markdown mini renderer */
function mdRender(src){
  const blocks=[];
  let s=esc(src);
  s=s.replace(/```([\s\S]*?)```/g,(m,c)=>{ blocks.push('<pre>'+c.replace(/^\n+|\n+$/g,'')+'</pre>'); return '\u0000'+(blocks.length-1)+'\u0000'; });
  s=s.replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/\*([^*\n]+)\*/g,'<i>$1</i>').replace(/`([^`\n]+)`/g,'<code>$1</code>');
  s=s.split('\n').map(line=>{
    const t=line.trim();
    if(/^### /.test(t)) return '<h3>'+t.slice(4)+'</h3>';
    if(/^## /.test(t)) return '<h2>'+t.slice(3)+'</h2>';
    if(/^# /.test(t)) return '<h1>'+t.slice(2)+'</h1>';
    if(/^(---|\*\*\*)\s*$/.test(t)) return '<hr>';
    if(/^&gt; /.test(t)) return '<blockquote>'+t.slice(5)+'</blockquote>';
    if(/^[-•] /.test(t)) return '<li>'+t.slice(2)+'</li>';
    if(t==='') return '\u0001';
    return line+'<br>';
  }).join('');
  s=s.replace(/(?:<li>.*?<\/li>)+/g, m=>'<ul>'+m+'</ul>');
  s='<p>'+s.replace(/\u0001+/g,'</p><p>')+'</p>';
  s=s.replace(/<p><\/p>/g,'').replace(/<br><\/p>/g,'</p>');
  s=s.replace(/\u0000(\d+)\u0000/g,(m,i)=>blocks[+i]);
  return s;
}
/* editor */
function setEdMode(m){
  edMode=m;
  $$('#nedPills .pill').forEach(p=>p.classList.toggle('on',p.dataset.m===m));
  $('#nBody2').style.display=m==='edit'?'':'none';
  const v=$('#nView');
  if(m==='view'){ v.style.display=''; v.innerHTML=mdRender($('#nBody2').value||'*（还没写正文）*'); }
  else v.style.display='none';
}
$$('#nedPills .pill').forEach(p=>p.addEventListener('click',()=>setEdMode(p.dataset.m)));
let importTs=null, edSnap='';
function edState(){ return JSON.stringify([$('#nTitle2').value,$('#nWx').value,$('#nMood').value,$('#nBody2').value]); }
function openEditor(type,entry,mode){
  importTs=null;
  edType=type; edEntry=entry||null;
  const v=entry?entryView(entry):null;
  const t=noteTypeOf(type);
  $('#nedType').textContent=t.n+(t.locked?' 🔒':'');
  $('#nTitle2').value=v?v.title||'':'';
  $('#nWx').value=v?v.wx||'':'';
  $('#nMood').value=(v&&(v.mood===0||v.mood))?v.mood:'';
  $('#nSign').style.color=String($('#nMood').value).startsWith('-')?'var(--mood-negink)':'var(--sub)';
  $('#nBody2').value=v?v.body:'';
  $('#nDel2').style.display=entry?'':'none';
  setEdMode(mode||'edit');
  edSnap=edState();
  go('scr-nedit');
}
$('#nedBack').addEventListener('click',()=>{
  if(edState()!==edSnap && !confirm('这一稿还没保存，确定不要了吗？')) return;
  go('scr-notes'); renderNotes();
});
$('#nSign').addEventListener('click',()=>{
  const m=$('#nMood');
  m.value=m.value.startsWith('-')?m.value.slice(1):('-'+m.value);
  $('#nSign').style.color=m.value.startsWith('-')?'var(--mood-negink)':'var(--sub)';
});
$('#fabNote').addEventListener('click',()=>{
  openMini(`<h5>写哪一类？</h5><div class="catwrap">`+D.notes.types.map(t=>`<button class="chip" data-t="${t.id}" style="color:${ntColor(t)}">${esc(t.n)}${t.locked?' 🔒':''}</button>`).join('')+`</div>`);
  mini.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',async()=>{
    closeMini();
    const t=noteTypeOf(b.dataset.t);
    if(t.locked&&!lockKey){ const ok=await askUnlock(); if(!ok) return; }
    openEditor(b.dataset.t,null,'edit');
  }));
});
$('#nSave2').addEventListener('click',async()=>{
  const body=$('#nBody2').value.trim();
  if(!body){ toast('正文还是空的～'); return; }
  let mood=null; const mv=$('#nMood').value.trim();
  if(mv!==''){
    mood=parseInt(mv.replace('−','-').replace('＋','+'),10);
    if(isNaN(mood)){ toast('心情要填 −100 ~ 100 的数字'); return; }
    mood=Math.max(-100,Math.min(100,mood));
  }
  const title=$('#nTitle2').value.trim(), wx=$('#nWx').value.trim();
  const typeId=edEntry?edEntry.type:edType;
  const locked=!!noteTypeOf(typeId).locked;
  if(locked&&!lockKey){ const ok=await askUnlock(); if(!ok) return; }
  const mnoteText=locked?'🔒':(title||stripMD(body).slice(0,20));
  const syncMood=(e)=>{
    if(mood===null){
      if(e.moodId){ D.moods=D.moods.filter(m=>m.id!==e.moodId); e.moodId=null; }
    } else {
      const lm=e.moodId&&D.moods.find(m=>m.id===e.moodId);
      if(lm){ lm.v=mood; lm.note=mnoteText; }
      else { const id=uid(); D.moods.push({id,ts:e.ts,date:e.ts.slice(0,10),v:mood,note:mnoteText,src:typeId}); e.moodId=id; }
    }
  };
  if(edEntry){
    if(locked){
      const payload={title,wx,body,mood};
      try{ edEntry.data=await encJSON(lockKey,payload); }catch(err){ toast('加密失败，未保存'); return; }
      edEntry.enc=true;
      delete edEntry.title; delete edEntry.wx; delete edEntry.body; delete edEntry.mood;
      lockCache.set(edEntry.id,payload);
    } else {
      edEntry.title=title; edEntry.wx=wx; edEntry.body=body; edEntry.mood=mood;
    }
    syncMood(edEntry);
    toast('已保存修改');
  } else {
    const e={id:uid(),type:edType,ts:importTs||tsNow(),moodId:null};
    if(locked){
      const payload={title,wx,body,mood};
      try{ e.data=await encJSON(lockKey,payload); }catch(err){ toast('加密失败，未保存'); return; }
      e.enc=true;
      lockCache.set(e.id,payload);
    } else {
      e.title=title; e.wx=wx; e.body=body; e.mood=mood;
    }
    syncMood(e);
    D.notes.entries.push(e);
    gardenCare(2); if(mood!==null) gardenCare(4); gardenAccel(4);
    toast(importTs?'已导入并保存':(locked?'已加密保存 🔒':'已保存'));
    importTs=null;
  }
  save(); go('scr-notes'); renderNotes();
});
$('#nDel2').addEventListener('click',()=>{
  if(!edEntry||!confirm('删除这一篇？'))return;
  if(edEntry.moodId) D.moods=D.moods.filter(m=>m.id!==edEntry.moodId);
  D.notes.entries=D.notes.entries.filter(x=>x.id!==edEntry.id);
  edEntry=null; save(); go('scr-notes'); renderNotes(); toast('已删除');
});
/* ---- import (md/txt/docx) ---- */
let impType='her';
$('#noteImport').addEventListener('click',()=>{
  openMini(`<h5>导入到哪一类？（支持 .md / .txt / .docx）</h5><div class="catwrap">`+
    D.notes.types.map(t=>`<button class="chip" data-t="${t.id}" style="color:${ntColor(t)}">${esc(t.n)}</button>`).join('')+`</div>`);
  mini.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
    impType=b.dataset.t; closeMini();
    $('#noteFile').value=''; $('#noteFile').click();
  }));
});
async function docxToText(file){
  const buf=new Uint8Array(await file.arrayBuffer());
  const dv=new DataView(buf.buffer);
  let i=0, xml=null;
  while(i<buf.length-30){
    if(dv.getUint32(i,true)!==0x04034b50) break;
    const flags=dv.getUint16(i+6,true);
    const comp=dv.getUint16(i+8,true);
    const csize=dv.getUint32(i+18,true);
    const nlen=dv.getUint16(i+26,true);
    const elen=dv.getUint16(i+28,true);
    const name=new TextDecoder().decode(buf.subarray(i+30,i+30+nlen));
    const dataStart=i+30+nlen+elen;
    if(name==='word/document.xml'){
      if((flags&8)&&!csize) throw new Error('streamed');
      const raw=buf.subarray(dataStart,dataStart+csize);
      let bytes;
      if(comp===0) bytes=raw;
      else {
        const ds=new DecompressionStream('deflate-raw');
        bytes=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer());
      }
      xml=new TextDecoder().decode(bytes);
      break;
    }
    if(!csize&&(flags&8)) throw new Error('streamed');
    i=dataStart+csize;
  }
  if(!xml) throw new Error('nodoc');
  const paras=[...xml.matchAll(/<w:p[ \/>][\s\S]*?(?:<\/w:p>|\/>)/g)].map(m=>
    [...m[0].matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(t=>t[1]).join('')
  );
  return paras.join('\n')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'")
    .replace(/&#(\d+);/g,(m,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&')
    .replace(/\n{3,}/g,'\n\n').trim();
}
$('#noteFile').addEventListener('change',async e=>{
  const f=e.target.files[0]; if(!f) return;
  try{
    let body;
    if(/\.docx$/i.test(f.name)) body=await docxToText(f);
    else body=(await f.text()).replace(/\r\n/g,'\n').trim();
    if(!body){ toast('文件是空的？'); return; }
    let title=f.name.replace(/\.(md|txt|docx)$/i,'').slice(0,40);
    const fm=body.match(/^#\s+(.+)\n+/);
    if(fm){ title=fm[1].trim().slice(0,40); body=body.slice(fm[0].length); }
    const ts=f.lastModified?new Date(f.lastModified):null;
    if(noteTypeOf(impType).locked&&!lockKey){ const ok=await askUnlock(); if(!ok){ toast('已取消导入'); return; } }
    openEditor(impType,null,'edit');
    $('#nTitle2').value=title;
    $('#nBody2').value=body;
    if(ts&&!isNaN(ts)){
      const pad=n=>String(n).padStart(2,'0');
      importTs=`${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())}T${pad(ts.getHours())}:${pad(ts.getMinutes())}`;
    }
    toast('已读入，过目后记得保存'+(importTs?' · 日期取自文件：'+fmtMD(importTs.slice(0,10)):''));
  }catch(err){
    toast('这个文件我啃不动，试试另存为 txt 或 md 再导');
  }
});
RENDER['scr-notes']=renderNotes;
