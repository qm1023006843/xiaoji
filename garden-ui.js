/* 小记 v2.7.0 · garden-ui：花园界面（剪影/花瓶/拖拽/商店/图鉴/妈咪的花园） */
'use strict';
function svgPot(){ return '<path d="M32 76h36l-4 15H36z" fill="var(--card2)" stroke="var(--line)" stroke-width="1.5"/><ellipse cx="50" cy="76" rx="19" ry="3.5" fill="var(--card2)" stroke="var(--line)" stroke-width="1.5"/>'; }
function svgFx(st,scar,hex){
  const G='stroke="var(--sage)" stroke-width="2.2" fill="none" stroke-linecap="round"';
  const fc=hex||'var(--p2)';
  const P='fill="'+fc+'" stroke="none"';
  if(st===0) return svgPot()+'<path d="M42 74q8-4 16 0" '+G+' opacity=".5"/><circle cx="50" cy="71" r="2.6" fill="var(--apricot-ink)"/><path d="M57 63l2-3M61 66l3-1" stroke="var(--faint)" stroke-width="1.4" stroke-linecap="round"/>';
  if(st===1) return svgPot()+'<path d="M50 76V52" '+G+'/><path d="M50 66q-9-2-12-9 8-2 12 5M50 60q9-2 12-9-8-2-12 5" fill="var(--sage)" opacity=".85"/><path d="M50 52q-5-1-7-5 5-1 7 3" fill="var(--sage)"/>';
  if(st===5) return svgPot()+'<path d="M50 76V36" '+G+'/>'+
    '<path d="M50 64q-9-2-12-9 8-2 12 5M50 56q9-2 12-9-8-2-12 5M50 47q-7-1-10-6 6-2 10 4" fill="var(--sage)" opacity=".85"/>'+
    '<g '+P+' opacity=".9"><ellipse cx="46" cy="33.5" rx="2.6" ry="3.4" transform="rotate(-12 46 33.5)"/><ellipse cx="55" cy="29.5" rx="2.4" ry="3.2" transform="rotate(14 55 29.5)"/><ellipse cx="50" cy="24.5" rx="2.8" ry="3.6"/></g>'+
    '<path d="M46 37.5q-2 1-3.5 0.5M55 33q2 0.5 3.5-0.5" stroke="var(--sage)" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
  if(st===2){
    const scarMark=scar?'<path d="M36.5 44l5 4" stroke="var(--apricot-ink)" stroke-width="1.6" stroke-linecap="round"/>':'';
    return svgPot()+'<path d="M50 76V30" '+G+'/><path d="M50 64q-10-2-13-10 9-2 13 6M50 56q10-2 13-10-9-2-13 6M50 46q-8-1-11-7 7-2 11 5" fill="var(--sage)" opacity=".85"/>'+
    '<g '+P+'><circle cx="39" cy="45" r="5.5"/><path d="M39 39.5q-6-3-8-8" stroke="'+fc+'" stroke-width="2" fill="none" stroke-linecap="round"/></g>'+
    '<g '+P+'><circle cx="61" cy="38" r="6"/><path d="M61 32q6-3 8-8" stroke="'+fc+'" stroke-width="2" fill="none" stroke-linecap="round"/></g>'+
    '<g '+P+'><circle cx="50" cy="27" r="6.5"/><path d="M50 20.5q-2-5 1-9" stroke="'+fc+'" stroke-width="2" fill="none" stroke-linecap="round"/></g>'+scarMark;
  }
  if(st===3) return svgPot()+'<path d="M50 76V40q0-6 6-8" '+G+'/><path d="M50 62q-8-2-11-8 8-2 11 5" fill="var(--sage)" opacity=".6"/>'+
    '<g fill="var(--apricot-ink)"><ellipse cx="58" cy="30" rx="3.2" ry="5" transform="rotate(18 58 30)"/><ellipse cx="47" cy="34" rx="3" ry="4.6" transform="rotate(-14 47 34)"/><ellipse cx="63" cy="40" rx="2.8" ry="4.2" transform="rotate(30 63 40)"/></g>'+
    '<circle cx="68" cy="52" r="1.6" fill="var(--apricot-ink)"/><circle cx="42" cy="47" r="1.4" fill="var(--apricot-ink)"/>';
  if(st===4) return svgPot()+'<path d="M50 76V60q0-5-6-7" '+G+' opacity=".55"/><path d="M44 53q-6-1-8-5 5-1 8 3" fill="var(--sage)" opacity=".4"/><circle cx="56" cy="70" r="2" fill="var(--apricot-ink)"/><path d="M60 64q4 2 8 1" stroke="var(--faint)" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
  return '';
}
function svgVaseBody(vid){
  if(vid==='v2') return '<path d="M44 40q-14 6-14 22 0 16 20 16t20-16q0-16-14-22l-1-8H45z" fill="var(--card2)" stroke="var(--line)" stroke-width="1.6"/>';
  if(vid==='v3') return '<path d="M36 44q-6 4-6 16 0 18 20 18t20-18q0-12-6-16l2-6H34z" fill="var(--card2)" stroke="var(--line)" stroke-width="1.6"/>';
  return '<path d="M46 34q-2 14-9 22-4 5-4 10 0 12 17 12t17-12q0-5-4-10-7-8-9-22l-1-6h-6z" fill="var(--card2)" stroke="var(--line)" stroke-width="1.6"/>';
}
function hashN(str,mod,salt){ let h=salt||0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))%997; return h%mod; }
function svgVaseFull(){
  const g=D.g, v=g.vase, def=VASES[v.vid]||VASES.v1;
  const TIP={l:-13,c:0,r:13};
  let stems='', petals='';
  def.pos.forEach(pos=>{
    const s=vaseStems().find(x=>x.pos===pos); if(!s) return;
    const bx=50+(pos==='l'?-2.5:pos==='r'?2.5:0), fx=50+TIP[pos];
    const vc=spHex(s.sp)||'var(--p2)';
    stems+='<path d="M'+bx+' 41 L'+fx+' 20" stroke="var(--sage)" stroke-width="2" fill="none" stroke-linecap="round"/>'+
      '<circle cx="'+fx+'" cy="17.5" r="5" fill="'+vc+'"/>'+
      '<path d="M'+fx+' 12.5q-2-4 1-7" stroke="'+vc+'" stroke-width="1.8" fill="none" stroke-linecap="round"/>'+
      (s.sc?'<path d="M'+(fx-3)+' 15.5l4 3" stroke="var(--apricot-ink)" stroke-width="1.3" stroke-linecap="round"/>':'');
    stemTick(s);
    if(s.ph===1&&s.Dc>=s.B/2){
      const n=2+hashN(s.id,2,7);
      for(let i=0;i<n;i++){
        const spread=pos==='l'?[-28,-12,4]:pos==='r'?[-4,12,28]:[-20,0,20];
        const px=fx+spread[i%3]+hashN(s.id,9,i*13)-4;
        const py=87+hashN(s.id,5,i*29);
        const rot=hashN(s.id,70,i*41)-35;
        const op=[.5,.75,.62][i%3];
        petals+='<ellipse cx="'+px+'" cy="'+py+'" rx="3.1" ry="1.9" fill="'+vc+'" opacity="'+op+'" transform="rotate('+rot+' '+px+' '+py+')"/>';
      }
    }
  });
  const snail=v.snail?'<g stroke="var(--sub)" stroke-width="1.3" fill="none" stroke-linecap="round"><circle cx="76" cy="86" r="3.4"/><path d="M76 86q1.5 0 1.5-1.5M72.6 86q0-3 3-3M79 88h-9q-2 0-2-1.6"/><path d="M70 84q-1-2 0-3M72 84q0-2 1-3"/></g>':'';
  let water='';
  if(v.ws&&vaseStems().length){
    const lv=v.vid==='v2'?{cy:62,rx:15}:v.vid==='v3'?{cy:62,rx:16}:{cy:69,rx:10.5};
    water='<ellipse cx="50" cy="'+lv.cy+'" rx="'+lv.rx+'" ry="2.6" fill="var(--p4)" opacity=".16"/>'+
      '<path d="M'+(50-lv.rx)+' '+lv.cy+'q'+(lv.rx/2)+' 2 '+lv.rx+' 0t'+lv.rx+' 0" stroke="var(--p4)" stroke-width="1" fill="none" opacity=".38"/>'+
      ((v.ws==='snow')?'<path d="M'+(50-lv.rx+3)+' '+(lv.cy+4)+'q5 2 10 0t10 0" stroke="var(--p4)" stroke-width=".9" fill="none" opacity=".5"/>':'');
  }
  return '<svg viewBox="0 0 100 96">'+svgVaseBody(v.vid)+water+stems+snail+petals+'</svg>';
}
var vaseDragged=false;
function applyVasePos(el){
  const tp=D.g.vase.tp; if(!tp) return;
  const pr=el.parentElement.getBoundingClientRect();
  const vw=el.offsetWidth||177, vh=el.offsetHeight||170;
  const minY=64, pad=4;
  const x=pad+tp.x*Math.max(0,pr.width-vw-pad*2);
  const y=minY+tp.y*Math.max(0,pr.height-minY-vh-10);
  el.style.left=x+'px'; el.style.top=y+'px'; el.style.bottom='auto';
}
function renderVase(){
  const g=D.g; if(!g) return;
  vaseRetireCheck(true);
  const show=!g.vase.hide && vaseStems().length>0;
  ['#homeVase','#taskVase'].forEach(sel=>{
    const el=$(sel); if(!el) return;
    if(!show){ el.style.display='none'; return; }
    el.style.display='block';
    el.innerHTML=svgVaseFull();
    if(sel==='#taskVase'){ el.onclick=()=>{ if(!vaseDragged) vaseMini(); }; applyVasePos(el); }
    else el.onclick=vaseMini;
  });
}
/* 冰箱贴：任务页花瓶拖动（只此一页，主页固定） */
(function(){
  const el=$('#taskVase'); if(!el) return;
  let pid=null,sx=0,sy=0,ox=0,oy=0,drag=false;
  el.addEventListener('pointerdown',e=>{
    pid=e.pointerId; sx=e.clientX; sy=e.clientY; drag=false;
    const r=el.getBoundingClientRect(), pr=el.parentElement.getBoundingClientRect();
    ox=r.left-pr.left; oy=r.top-pr.top;
    try{ el.setPointerCapture(pid); }catch(_){}
  });
  el.addEventListener('pointermove',e=>{
    if(pid===null||e.pointerId!==pid) return;
    const dx=e.clientX-sx, dy=e.clientY-sy;
    if(!drag && Math.hypot(dx,dy)<7) return;
    if(!drag){ drag=true; el.classList.add('dragging'); }
    const pr=el.parentElement.getBoundingClientRect();
    const vw=el.offsetWidth, vh=el.offsetHeight, minY=64, pad=4;
    const nx=Math.max(pad,Math.min(pr.width-vw-pad,ox+dx));
    const ny=Math.max(minY,Math.min(pr.height-vh-10,oy+dy));
    el.style.left=nx+'px'; el.style.top=ny+'px'; el.style.bottom='auto';
  });
  const end=e=>{
    if(pid===null||(e.pointerId!==undefined&&e.pointerId!==pid)) return;
    pid=null; el.classList.remove('dragging');
    if(drag){
      const pr=el.parentElement.getBoundingClientRect();
      const vw=el.offsetWidth, vh=el.offsetHeight, minY=64, pad=4;
      const fx=(parseFloat(el.style.left)-pad)/Math.max(1,pr.width-vw-pad*2);
      const fy=(parseFloat(el.style.top)-minY)/Math.max(1,pr.height-minY-vh-10);
      D.g.vase.tp={x:Math.max(0,Math.min(1,fx)),y:Math.max(0,Math.min(1,fy))};
      save();
      vaseDragged=true; setTimeout(()=>{ vaseDragged=false; },350);
    }
  };
  el.addEventListener('pointerup',end);
  el.addEventListener('pointercancel',end);
})();
function vaseMini(){
  const g=D.g, v=g.vase;
  let rows=vaseStems().map(s=>'<div class="bstat"><span>'+POSN[s.pos]+' · '+spName(s.sp)+(s.sc?'（带疤）':'')+'</span><span class="v2">'+stemLeftLabel(s)+'</span></div>').join('');
  openMini('<h5>'+VASES[v.vid].n+(v.ws?' · '+WATERS[v.ws].n+'（'+WATERS[v.ws].f+'）':'')+(v.snail?' · 有一只小蜗牛住着':'')+'</h5>'+rows+
    '<label style="margin-top:10px;display:block;font-size:11px;color:var(--faint);margin-bottom:6px">备注</label>'+
    '<input id="vNote" class="edin" style="background:var(--bg);margin-bottom:9px" maxlength="20" placeholder="给这瓶花写一句…" value="'+esc(v.note||'')+'">'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="act" data-a="save" style="flex:1;text-align:center;margin-bottom:0;background:var(--sage);color:#FBFBF6">存备注</button>'+
    '<button class="act" data-a="go" style="flex:1;text-align:center;margin-bottom:0">去插花管理</button></div>'+
    '<button class="act" data-a="hide" style="margin-top:8px">'+(v.hide?'恢复展示（主页+任务页）':'隐藏展示（主页+任务页 · 花照开）')+'</button>');
  mini.querySelector('[data-a="save"]').addEventListener('click',()=>{ v.note=$('#vNote').value.trim(); save(); closeMini(); toast('记下了'); });
  mini.querySelector('[data-a="go"]').addEventListener('click',()=>{ closeMini(); gTab='garden'; gSub='arr'; go('scr-garden'); renderGardenTab(); });
  mini.querySelector('[data-a="hide"]').addEventListener('click',()=>{ v.hide=!v.hide; save(); closeMini(); renderVase(); toast(v.hide?'藏起来了 · 它还在，照常开':'回来了'); });
}
var gTab='garden', gSub='main', mamiCache=null, mamiAt=0;
function renderGardenTab(){
  if(cur!=='scr-garden') return;
  $$('#gTabs .pill').forEach(x=>x.classList.toggle('on',x.dataset.g===gTab));
  if(gTab==='garden'){
    if(gSub==='arr') renderArr();
    else if(gSub==='store') renderStore();
    else if(gSub==='shop') renderShop();
    else renderGardenMain();
  }
  else if(gTab==='book') renderGardenBook();
  else renderGardenMami();
}
function gBackBtn(){ return '<span class="gback" data-gb="1">‹ 回花园</span>'; }
function wireBack(){ const b=document.querySelector('#gBody [data-gb]'); if(b) b.addEventListener('click',()=>{ gSub='main'; renderGardenTab(); }); }
function renderGardenMain(){
  const g=D.g; gTick(true); vaseRetireCheck(true);
  let h='<div class="ghead"><span style="font-size:12px;color:var(--sub)">'+careLabel(careBits(TODAY))+'</span><span class="gcoin">✿ '+g.coins+'</span></div>';
  h+='<div class="plotrow">';
  g.plots.forEach((p,i)=>{
    if(!p){ h+='<div class="plotwrap"><div class="plot" data-pi="'+i+'"><svg viewBox="0 0 100 100">'+svgPot()+'</svg></div><div class="pn">　</div></div>'; return; }
    const s=plotState(p);
    h+='<div class="plotwrap"><div class="plot" data-pi="'+i+'"><svg viewBox="0 0 100 100">'+svgFx(s.st,p.fz===1,spHex(p.sp))+'</svg></div><div class="pn">'+spName(p.sp)+'</div></div>';
  });
  h+='</div>';
  h+='<div class="gbtns"><button class="gbtn" data-gn="arr">插花<small>ARRANGE</small></button><button class="gbtn" data-gn="store">仓库<small>STORAGE</small></button><button class="gbtn" data-gn="shop">商店<small>SHOP</small></button></div>';
  if(g.hist.length){
    h+='<div class="gcard"><h4>花园史</h4>'+g.hist.slice(0,6).map(t=>'<div class="ghist">'+esc(t)+'</div>').join('')+'</div>';
  }
  h+='<p class="gfoot2">花自己按钟点长，睡觉也长；你每做完一件事，全园快 4 小时<br>你好好过日子，种子来得更快 ♡</p>';
  document.querySelector('#gBody').innerHTML=h;
  $$('#gBody .plot').forEach(el=>el.addEventListener('click',()=>plotActions(+el.dataset.pi)));
  $$('#gBody [data-gn]').forEach(b=>b.addEventListener('click',()=>{ gSub=b.dataset.gn; renderGardenTab(); }));
}
function plotActions(i){
  const g=D.g, p=g.plots[i];
  if(!p){
    const opts=allSpKeys().filter(k=>(g.seeds[k]||0)>0);
    if(!opts.length){ openMini('<h5>种子袋空着</h5><p style="font-size:12.5px;color:var(--sub);line-height:1.9;padding:0 4px 6px">开完的花自然谢了会结籽；商店每周有少量种子；妈咪偶尔会寄。<br>不急，花园等得起。</p>'); return; }
    openMini('<h5>这个盆种什么？</h5><div class="catwrap">'+opts.map(k=>'<button class="chip" data-pk="'+k+'">'+spName(k)+'（'+g.seeds[k]+' 颗）</button>').join('')+'</div>');
    mini.querySelectorAll('[data-pk]').forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.pk;
      g.seeds[k]--;
      let fz=0, df=0;
      const r=Math.random();
      if(r<0.07){ if(Math.random()<0.7) fz=1; else { fz=2; df=0.4+Math.random()*0.5; } }
      g.plots[i]={id:uid(),sp:k,pt:gtNow(),fz,df,mk:0,acc:0};
      gbook(k).pl++;
      ghist('种下一颗'+spName(k)+'的种子');
      save(); closeMini(); renderGardenTab(); toast('种下了 · 它这就开始长，你做事它加速');
    }));
    return;
  }
  const s=plotState(p), sp=spOf(p.sp);
  if(s.st===0||s.st===1||s.st===5){
    const ttl=s.st===0?'种子睡在土里':(s.st===5?'含苞了 · 全程 '+Math.round(s.prog*100)+'%':'生长中 · 全程 '+Math.round(s.prog*100)+'%');
    openMini('<h5>'+sp.n+' · '+ttl+'</h5>'+
      '<p style="font-size:12.5px;color:var(--sub);line-height:1.9;padding:0 4px 8px">'+careLabel(careBits(TODAY))+'。<br>它自己按钟点长，你歇着它也长；你每做完一件事，全园快 4 小时。'+(p.acc?'<br>你的日子已经替它赶了 '+Math.round(p.acc)+' 小时的路。':'')+(s.st===5?'<br>苞都鼓起来了，快了。':'')+'</p>');
    return;
  }
  if(s.st===2){
    openMini('<h5>'+spName(p.sp)+'开花了'+(p.fz===1?' · 花瓣带一道浅疤':'')+' · 还能开约 '+fmtH(s.hoursLeft)+(p.acc?'<small style="display:block;font-weight:400;margin-top:3px;color:var(--sub)">你的日子替它赶了 '+Math.round(p.acc)+' 小时，种子也会来得早</small>':'')+'</h5>'+
      '<p style="font-size:12.5px;color:var(--sub);line-height:1.9;padding:0 4px 8px">剪与留，一盆一选：剪下来是眼前的花；留着开完，自然谢了结种子，是将来的花。</p>'+
      '<button class="act" data-a="cut">✂️ 剪下花枝（放到仓库货架）</button><button class="act" data-a="keep">留着，让它开完</button>');
    mini.querySelector('[data-a="cut"]').addEventListener('click',()=>{
      D.g.inv.push({id:uid(),sp:p.sp,sc:p.fz===1?1:0,ph:0,F:0,B:0,Dc:0,lt:gtNow(),loc:'shelf',pos:null});
      D.g.plots[i]=null;
      ghist('剪下一枝'+spName(p.sp)+(p.fz===1?'（带疤的那株）':''));
      save(); closeMini(); renderGardenTab(); toast('剪下来了 · 在仓库货架上');
    });
    mini.querySelector('[data-a="keep"]').addEventListener('click',closeMini);
    return;
  }
  if(s.st===3){
    openMini('<h5>'+spName(p.sp)+'开完了，荚里结满了籽</h5>'+
      '<button class="act" data-a="seed" style="background:var(--sage);color:#FBFBF6;text-align:center">收取种子</button>');
    mini.querySelector('[data-a="seed"]').addEventListener('click',()=>{
      const n=2+(Math.random()<0.5?1:0);
      D.g.seeds[p.sp]=(D.g.seeds[p.sp]||0)+n;
      gbook(p.sp).sd+=n;
      D.g.plots[i]=null;
      ghist('收了 '+n+' 颗'+spName(p.sp)+'种子');
      save(); closeMini(); renderGardenTab(); toast('收了 '+n+' 颗种子 · 一碰就炸的那种');
    });
    return;
  }
  if(s.st===4){
    openMini('<h5>这一株遇上了自己的天气</h5>'+
      '<p style="font-size:12.5px;color:var(--sub);line-height:1.9;padding:0 4px 8px">不是你的错——没有倒计时，没有本可以。它只是遇上了风。它给你留了一颗种子。</p>'+
      '<button class="act" data-a="clear" style="background:var(--sage);color:#FBFBF6;text-align:center">收拾花盆，收下种子</button>');
    mini.querySelector('[data-a="clear"]').addEventListener('click',()=>{
      D.g.seeds[p.sp]=(D.g.seeds[p.sp]||0)+1;
      gbook(p.sp).sd+=1;
      D.g.plots[i]=null;
      save(); closeMini(); renderGardenTab(); toast('收下了 · 春天不欠谁的');
    });
    return;
  }
}
function stemRowBtns(s,ctx){
  let b='';
  if(ctx==='vase'){ b+='<button data-va="out" data-si="'+s.id+'">取出</button>'; }
  else if(!stemDead(s)) b+='<button class="pri" data-va="ins" data-si="'+s.id+'">插瓶</button>';
  if(stemDead(s)&&s.ph===0){ b+='<button data-va="soil" data-si="'+s.id+'">化作春泥</button>'; return b; }
  b+='<button data-va="sell" data-si="'+s.id+'">卖 '+stemSellPrice(s)+'</button>';
  if(ctx!=='fridge'&&D.g.fridge&&fridgeStems().length<FRIDGES[D.g.fridge].cap) b+='<button data-va="fr" data-si="'+s.id+'">进冰箱</button>';
  if(ctx==='fridge') b+='<button data-va="unfr" data-si="'+s.id+'">拿出</button>';
  b+='<button data-va="gift" data-si="'+s.id+'">寄妈咪</button>';
  if(ctx==='vase') b+='<button data-va="drop" data-si="'+s.id+'">扔掉</button>';
  return b;
}
function renderArr(){
  const g=D.g; vaseRetireCheck(true);
  const def=VASES[g.vase.vid];
  let h=gBackBtn();
  h+='<div class="gcard"><h4>瓶中 · '+def.n+(g.vase.ws?'<small>'+WATERS[g.vase.ws].n+'</small>':'')+'</h4>';
  const vs=vaseStems();
  if(vs.length){ vs.forEach(s=>{ h+='<div class="grow2"><span class="sp2">'+POSN[s.pos]+' · '+spName(s.sp)+(s.sc?'（带疤）':'')+'<span class="sub2">'+stemLeftLabel(s)+'</span></span>'+stemRowBtns(s,'vase')+'</div>'; }); }
  else h+='<p class="empty" style="padding:8px">瓶里空着</p>';
  h+='</div>';
  const cands=g.inv.filter(s=>s.loc!=='vase'&&!stemDead(s));
  h+='<div class="gcard"><h4>可插的花枝<small>货架与冰箱里</small></h4>';
  if(cands.length){ cands.forEach(s=>{ h+='<div class="grow2"><span class="sp2">'+spName(s.sp)+(s.sc?'（带疤）':'')+'<span class="sub2">'+stemLeftLabel(s)+'</span></span><button class="pri" data-va="ins" data-si="'+s.id+'">插瓶</button></div>'; }); }
  else h+='<p class="empty" style="padding:8px">没有能插的花枝</p>';
  h+='</div>';
  document.querySelector('#gBody').innerHTML=h; wireBack(); wireStemBtns(renderArr);
}
function wireStemBtns(rerender){
  const g=D.g;
  $$('#gBody [data-va]').forEach(bn=>bn.addEventListener('click',()=>{
    const s=g.inv.find(x=>x.id===bn.dataset.si); if(!s) return;
    const a=bn.dataset.va;
    const emptyReset=()=>{ if(!vaseStems().length){ g.vase.ws=null; g.vase.snail=false; } };
    if(a==='sell'){ const got=stemSellPrice(s); g.coins+=got; g.inv=g.inv.filter(x=>x.id!==s.id); emptyReset(); save(); rerender(); renderVase(); toast('卖了 '+got+' 花币'); }
    else if(a==='drop'){ g.inv=g.inv.filter(x=>x.id!==s.id); emptyReset(); ghist('扔掉了一枝'+spName(s.sp)); save(); rerender(); renderVase(); }
    else if(a==='soil'){ g.inv=g.inv.filter(x=>x.id!==s.id); ghist('一枝蔫掉的'+spName(s.sp)+'回到土里，来年做肥'); save(); rerender(); }
    else if(a==='gift'){ g.gifts.push({sp:s.sp,sc:s.sc||0,ts:tsNow()}); g.inv=g.inv.filter(x=>x.id!==s.id); emptyReset(); ghist('摘下一枝'+spName(s.sp)+'寄给了妈咪'); save(); rerender(); renderVase(); toast('花已寄出 · 妈咪那头会收到 ♡'); }
    else if(a==='fr'){ if(!g.fridge){toast('还没有冰箱，商店有售');return;} if(fridgeStems().length>=FRIDGES[g.fridge].cap){toast('冰箱满了');return;} stemTick(s); s.loc='fridge'; s.pos=null; emptyReset(); save(); rerender(); renderVase(); }
    else if(a==='unfr'){ stemTick(s); s.loc='shelf'; save(); rerender(); }
    else if(a==='out'){ stemTick(s); s.loc='shelf'; s.pos=null; emptyReset(); save(); rerender(); renderVase(); toast('取出了 · 放回货架（常温会更快消耗）'); }
    else if(a==='ins') insertFlow(s,rerender);
  }));
}
function insertFlow(s,rerender){
  const g=D.g, def=VASES[g.vase.vid];
  const used=vaseStems().map(x=>x.pos);
  const free=def.pos.filter(p=>!used.includes(p));
  if(!free.length){ toast(def.n+'插满了（最多 '+def.cap+' 支）'); return; }
  const place=(pos)=>{
    stemTick(s);
    if(s.ph===0){ s.ph=1; s.B=VASE_BASE+((WATERS[g.vase.ws]||{}).h||0); s.Dc=0; }
    s.loc='vase'; s.pos=pos;
    save(); closeMini(); rerender(); renderVase(); toast('插好了 · '+POSN[pos]+'位');
  };
  const pickPos=()=>{
    if(free.length===1){ place(free[0]); return; }
    openMini('<h5>插在哪个位置？</h5><div class="catwrap">'+free.map(p=>'<button class="chip" data-pos="'+p+'">'+POSN[p]+'</button>').join('')+'</div>');
    mini.querySelectorAll('[data-pos]').forEach(b=>b.addEventListener('click',()=>place(b.dataset.pos)));
  };
  if(!vaseStems().length) chooseWater(pickPos);
  else pickPos();
}
function chooseWater(after){
  const g=D.g;
  let h='<h5>瓶里添什么水？</h5>';
  Object.keys(WATERS).forEach(k=>{
    const w=WATERS[k];
    if(w.p===0){ h+='<button class="act" data-wk="'+k+'" data-src="free">'+w.n+' · 免费 · 展期 '+Math.round((VASE_BASE+w.h)/24)+' 天<br><small style="color:var(--faint)">'+w.f+'</small></button>'; return; }
    const stock=g.bottles[k]||0;
    if(stock>0) h+='<button class="act" data-wk="'+k+'" data-src="stock">'+w.n+'（囤货 '+stock+' 瓶）· 展期 '+Math.round((VASE_BASE+w.h)/24)+' 天<br><small style="color:var(--faint)">'+w.f+'</small></button>';
    h+='<button class="act" data-wk="'+k+'" data-src="buy" '+(g.coins<w.p?'style="opacity:.45"':'')+'>'+w.n+' · 现买 '+w.p+' 花币 · 展期 '+Math.round((VASE_BASE+w.h)/24)+' 天<br><small style="color:var(--faint)">'+w.f+'</small></button>';
  });
  openMini(h);
  mini.querySelectorAll('[data-wk]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.dataset.wk, w=WATERS[k], src=b.dataset.src;
    if(src==='buy'){ if(g.coins<w.p){ toast('花币不够'); return; } g.coins-=w.p; }
    else if(src==='stock'){ if(!(g.bottles[k]>0)){ toast('没囤货了'); return; } g.bottles[k]--; }
    g.vase.ws=k;
    g.vase.snail=(k==='river'&&Math.random()<0.12);
    if(g.vase.snail) ghist('河水里来了一只小蜗牛，在瓶底住下了');
    save(); closeMini(); if(after) after();
  }));
}
function renderStore(){
  const g=D.g;
  let h=gBackBtn();
  h+='<div class="gcard"><h4>货架<small>常温 · 鲜切花约 3 天</small></h4>';
  const sh=shelfStems();
  if(sh.length){ sh.forEach(s=>{ h+='<div class="grow2"><span class="sp2">'+spName(s.sp)+(s.sc?'（带疤）':'')+'<span class="sub2">'+stemLeftLabel(s)+'</span></span>'+stemRowBtns(s,'shelf')+'</div>'; }); }
  else h+='<p class="empty" style="padding:8px">货架空着</p>';
  h+='</div>';
  h+='<div class="gcard"><h4>冰箱'+(g.fridge?'<small>'+FRIDGES[g.fridge].n+' · '+fridgeStems().length+'/'+FRIDGES[g.fridge].cap+' · 消耗放慢 '+FRIDGES[g.fridge].mult+' 倍</small>':'<small>还没有 · 商店有售</small>')+'</h4>';
  if(g.fridge){
    const fs=fridgeStems();
    if(fs.length){ fs.forEach(s=>{ h+='<div class="grow2"><span class="sp2">'+spName(s.sp)+(s.sc?'（带疤）':'')+'<span class="sub2">'+stemLeftLabel(s)+'</span></span>'+stemRowBtns(s,'fridge')+'</div>'; }); }
    else h+='<p class="empty" style="padding:8px">冰箱空着，嗡嗡地等</p>';
    const bt=Object.keys(g.bottles).filter(k=>g.bottles[k]>0);
    if(bt.length){ h+='<div class="grow2" style="border-top:1px solid var(--line)"><span class="sp2">门上囤的水<span class="sub2">'+bt.map(k=>WATERS[k].n+'×'+g.bottles[k]).join(' · ')+'</span></span></div>'; }
  } else h+='<p class="empty" style="padding:8px">花枝暂时只能睡货架<br>想让花多撑几天，去商店看看冰箱</p>';
  h+='</div>';
  h+='<div class="gcard"><h4>种子袋</h4>';
  const ks=Object.keys(g.seeds).filter(k=>g.seeds[k]>0);
  if(ks.length){ ks.forEach(k=>{ h+='<div class="grow2"><span class="sp2">'+spName(k)+'种子<span class="sub2">自己收的、买的、妈咪寄的，都在这袋里</span></span><span style="font-size:13px;color:var(--sub)">'+g.seeds[k]+' 颗</span></div>'; }); }
  else h+='<p class="empty" style="padding:8px">袋子空着 · 谢了的花会还你种子</p>';
  h+='</div>';
  h+='<div class="gcard"><h4>肥料</h4>';
  if((g.fert||0)>0){
    h+='<div class="grow2"><span class="sp2">营养土<span class="sub2">每包快 10 小时</span></span><span style="font-size:13px;color:var(--sub)">'+g.fert+' 包</span> <button class="pri" data-sa="usefert">施肥</button></div>';
  } else h+='<p class="empty" style="padding:8px">没有肥料 · 商店有售，妈咪也会寄</p>';
  h+='</div>';
  document.querySelector('#gBody').innerHTML=h; wireBack(); wireStemBtns(renderStore);
  var fb=document.querySelector('[data-sa="usefert"]');
  if(fb) fb.addEventListener('click',useFert);
}
function useFert(){
  const g=D.g;
  if(!g.fert){ toast('没有肥料'); return; }
  const cands=g.plots.map((p,i)=>{ if(!p) return null; const s=plotState(p); return (s.st===0||s.st===1||s.st===5||s.st===2)?{i,p,s}:null; }).filter(Boolean);
  if(!cands.length){ toast('没有正在生长的花可以施肥'); return; }
  openMini('<h5>给哪盆花施肥？</h5><div class="catwrap">'+cands.map(c=>'<button class="chip" data-fi="'+c.i+'">'+spName(c.p.sp)+'（第'+(c.i+1)+'盆）</button>').join('')+'</div>');
  $$('.chip[data-fi]').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.fi, p=g.plots[i];
    p.acc=(p.acc||0)+10; g.fert--;
    ghist('给第'+(i+1)+'盆'+spName(p.sp)+'施了一包肥');
    save(); closeMini(); gTick(true); renderStore(); toast('施肥成功 · 快 10 小时');
  }));
}
function renderShop(){
  const g=D.g;
  const wkKey=addDays(TODAY,-((new Date(TODAY+'T12:00:00').getDay()+6)%7));
  if(g.wk.k!==wkKey){ g.wk={k:wkKey,b:{}}; }
  let h=gBackBtn();
  h+='<div class="ghead"><span style="font-size:12px;color:var(--sub)">小卖部</span><span class="gcoin">✿ '+g.coins+'</span></div>';
  h+='<div class="gcard"><h4>种子<small>每周限购 · 等籽是正路，买籽是奢侈</small></h4>';
  Object.keys(SPECIES).forEach(base=>{
    const sp=SPECIES[base];
    const wkTotal=spKeys(base).reduce((s,k)=>s+(g.wk.b[k]||0),0);
    spKeys(base).forEach(k=>{
      h+='<div class="grow2"><span class="sp2">'+spName(k)+'种子 · '+sp.seed+' 花币<span class="sub2">种子袋 '+(g.seeds[k]||0)+' 颗 · 本周已购 '+wkTotal+'/'+sp.wkLim+'</span></span><button '+((wkTotal>=sp.wkLim||g.coins<sp.seed)?'disabled style="opacity:.4"':'class="pri"')+' data-ba="seed" data-bk="'+k+'">买一颗</button></div>';
    });
  });
  h+='</div>';
  h+='<div class="gcard"><h4>冰箱<small>二手回收一折</small></h4>';
  Object.keys(FRIDGES).forEach(k=>{
    const f=FRIDGES[k];
    if(g.fridge===k){ h+='<div class="grow2"><span class="sp2">'+f.n+'（在用）<span class="sub2">存 '+f.cap+' 支 · 放慢 '+f.mult+' 倍</span></span><button data-ba="sellfr" data-bk="'+k+'">卖二手 '+Math.floor(f.price/10)+'</button></div>'; return; }
    h+='<div class="grow2"><span class="sp2">'+f.n+' · '+f.price+' 花币<span class="sub2">存 '+f.cap+' 支 · 消耗放慢 '+f.mult+' 倍</span></span><button '+(g.coins<f.price?'disabled style="opacity:.4"':'')+' data-ba="fridge" data-bk="'+k+'">买下</button></div>';
  });
  h+='</div>';
  h+='<div class="gcard"><h4>瓶装水<small>囤水要有冰箱 · 插花时也可现买现用</small></h4>';
  ['pure','spring','snow'].forEach(k=>{
    const w=WATERS[k];
    h+='<div class="grow2"><span class="sp2">'+w.n+' · '+w.p+' 花币<span class="sub2">'+w.f+' · +'+w.h+'小时'+(g.fridge?' · 已囤 '+(g.bottles[k]||0):'')+'</span></span><button '+((!g.fridge||g.coins<w.p)?'disabled style="opacity:.4"':'')+' data-ba="water" data-bk="'+k+'">买一瓶</button></div>';
  });
  h+='</div>';
  h+='<div class="gcard"><h4>肥料<small>催一催进度</small></h4>';
  h+='<div class="grow2"><span class="sp2">营养土 · 2 花币<span class="sub2">每包快 10 小时 · 仓库里有 '+(g.fert||0)+' 包</span></span><button '+(g.coins<2?'disabled style="opacity:.4"':'class="pri"')+' data-ba="fert">买一包</button></div>';
  h+='</div>';
  h+='<div class="gcard"><h4>花瓶与花盆</h4>';
  Object.keys(VASES).forEach(k=>{
    if(g.own.includes(k)){
      h+='<div class="grow2"><span class="sp2">'+VASES[k].n+(g.vase.vid===k?'（在用）':'')+'<span class="sub2">可插 '+VASES[k].cap+' 支</span></span>'+(g.vase.vid===k?'':'<button data-ba="use" data-bk="'+k+'">换用</button>')+'</div>';
      return;
    }
    h+='<div class="grow2"><span class="sp2">'+VASES[k].n+' · '+VASES[k].price+' 花币<span class="sub2">可插 '+VASES[k].cap+' 支</span></span><button '+(g.coins<VASES[k].price?'disabled style="opacity:.4"':'')+' data-ba="vase" data-bk="'+k+'">买下</button></div>';
  });
  if(g.plots.length<4) h+='<div class="grow2"><span class="sp2">第四个花盆 · 40 花币<span class="sub2">花园扩建</span></span><button '+(g.coins<40?'disabled style="opacity:.4"':'')+' data-ba="pot" data-bk="4">解锁</button></div>';
  h+='</div>';
  document.querySelector('#gBody').innerHTML=h; wireBack();
  $$('#gBody [data-ba]').forEach(bn=>bn.addEventListener('click',()=>{
    const a=bn.dataset.ba, k=bn.dataset.bk;
    if(a==='seed'){
      const sp=spOf(k), base=spBase(k);
      const wkTotal=spKeys(base).reduce((s,j)=>s+(g.wk.b[j]||0),0);
      if(g.coins<sp.seed||wkTotal>=sp.wkLim) return;
      g.coins-=sp.seed; g.seeds[k]=(g.seeds[k]||0)+1; g.wk.b[k]=(g.wk.b[k]||0)+1;
      save(); renderShop(); toast('买了一颗'+spName(k)+'种子');
    } else if(a==='fridge'){
      const f=FRIDGES[k]; if(g.coins<f.price) return;
      if(g.fridge){ toast('先把旧冰箱卖了（要先清空）'); return; }
      g.coins-=f.price; g.fridge=k;
      ghist('搬回一台'+f.n);
      save(); renderShop(); toast(f.n+'到货 · 在仓库里嗡嗡待命');
    } else if(a==='sellfr'){
      if(fridgeStems().length){ toast('冰箱里还有花，先清空'); return; }
      if(Object.values(g.bottles).some(n=>n>0)){ toast('门上还囤着水，先用掉'); return; }
      const f=FRIDGES[k];
      g.coins+=Math.floor(f.price/10); g.fridge=null;
      ghist(f.n+'卖了二手，'+Math.floor(f.price/10)+' 花币');
      save(); renderShop(); toast('卖了 · 二手一折，江湖规矩');
    } else if(a==='water'){
      const w=WATERS[k]; if(!g.fridge||g.coins<w.p) return;
      g.coins-=w.p; g.bottles[k]=(g.bottles[k]||0)+1;
      save(); renderShop(); toast('囤了一瓶'+w.n);
    } else if(a==='vase'){
      const v=VASES[k]; if(g.coins<v.price) return;
      g.coins-=v.price; g.own.push(k);
      save(); renderShop(); toast(v.n+'买回家了 · 点「换用」启用');
    } else if(a==='use'){
      if(vaseStems().length){ toast('先把瓶里的花取出来再换瓶'); return; }
      g.vase.vid=k; save(); renderShop(); renderVase(); toast('换上'+VASES[k].n+'了');
    } else if(a==='pot'){
      if(g.coins<40) return;
      g.coins-=40; g.plots.push(null);
      ghist('花园扩建：第四个花盆');
      save(); renderShop(); toast('第四个花盆安好了');
    } else if(a==='fert'){
      if(g.coins<2) return;
      g.coins-=2; g.fert=(g.fert||0)+1;
      save(); renderShop(); toast('买了一包营养土 · 去仓库施肥');
    }
  }));
}
function renderGardenBook(){
  const g=D.g;
  let h='<div class="bookgrid">';
  Object.keys(SPECIES).forEach(k=>{
    const sp=SPECIES[k], bk=g.book[k], lit=bk&&bk.bl>0;
    const defHex=sp.colors?sp.colors[Object.keys(sp.colors)[0]].hex:null;
    h+='<div class="bookcell'+(lit?'':' dim2')+'" data-bk="'+k+'"><svg viewBox="0 0 100 100">'+svgFx(2,false,defHex)+'</svg><div class="bn">'+sp.n+'</div></div>';
  });
  h+='<div class="bookcell dim2"><svg viewBox="0 0 100 100"><text x="50" y="58" text-anchor="middle" font-size="30" fill="var(--faint)">?</text></svg><div class="bn">等妈咪寄种子</div></div>';
  h+='<div class="bookcell dim2"><svg viewBox="0 0 100 100"><text x="50" y="58" text-anchor="middle" font-size="30" fill="var(--faint)">?</text></svg><div class="bn">慢慢来</div></div>';
  h+='</div><p class="gfoot2">图鉴记的不是收集，是你和每种花处出来的交情</p>';
  document.querySelector('#gBody').innerHTML=h;
  $$('#gBody [data-bk]').forEach(el=>el.addEventListener('click',()=>{
    const k=el.dataset.bk, sp=SPECIES[k], bk=g.book[k]||{pl:0,bl:0,sd:0,sc:0,ee:0,first:null};
    const defHex2=sp.colors?sp.colors[Object.keys(sp.colors)[0]].hex:null;
    openMini('<h5>'+sp.n+'（'+sp.a+'）</h5>'+
      '<div style="max-width:150px;margin:0 auto 6px"><svg viewBox="0 0 100 100">'+svgFx(2,false,defHex2)+'</svg></div>'+
      '<div class="bstat"><span>种植</span><span class="v2">'+bk.pl+' 次</span></div>'+
      '<div class="bstat"><span>开花</span><span class="v2">'+bk.bl+' 次</span></div>'+
      '<div class="bstat"><span>收籽</span><span class="v2">'+bk.sd+' 颗</span></div>'+
      '<div class="bstat"><span>带疤的一株</span><span class="v2">'+bk.sc+' 株</span></div>'+
      '<div class="bstat"><span>遇上过风的</span><span class="v2">'+bk.ee+' 株</span></div>'+
      '<div class="bstat"><span>初次开花</span><span class="v2">'+(bk.first?fmtMD(bk.first):'还没有')+'</span></div>'+
      '<p style="font-family:var(--serif);font-size:12.5px;color:var(--sub);line-height:1.9;padding:10px 4px 4px">'+sp.lang+'</p>');
  }));
}
function renderGardenMami(){
  const g=D.g;
  if(!ghCfg()){ document.querySelector('#gBody').innerHTML='<p class="empty" style="margin-top:30px">连上云端（设置 → 妈咪入口）<br>才能去妈咪的花园串门</p>'; return; }
  document.querySelector('#gBody').innerHTML='<p class="empty" style="margin-top:30px">往妈咪的花园走…</p>';
  const draw=(m)=>{
    if(cur!=='scr-garden'||gTab!=='mami') return;
    if(!m){ document.querySelector('#gBody').innerHTML='<p class="empty" style="margin-top:30px">妈咪的花园暂时看不到<br>（可能没网，等会儿再来）</p>'; return; }
    let h='<div class="gcard" style="margin-top:16px"><h4>'+esc(m.name||'妈咪的花园')+'<small>'+esc(m.upd?('打理于 '+m.upd):'')+'</small></h4>';
    if(m.line) h+='<p style="font-family:var(--serif);font-size:13px;color:var(--sub);line-height:1.9;margin-bottom:8px">'+esc(m.line)+'</p>';
    (m.plots||[]).forEach(p=>{ h+='<div class="grow2"><span class="sp2">'+esc(p.n||'一株花')+'<span class="sub2">'+esc(p.st||'')+'</span></span></div>'; });
    h+='</div>';
    if(m.vase&&m.vase.length){
      h+='<div class="gcard"><h4>妈咪的花瓶</h4>';
      m.vase.forEach(v=>{ h+='<div class="grow2"><span class="sp2">'+esc(v.n||'')+'<span class="sub2">'+esc(v.from||'')+'</span></span></div>'; });
      h+='</div>';
    }
    const sent=(D.g.gifts||[]).length;
    if(sent) h+='<p class="gfoot2">你寄过去的花：'+sent+' 枝 · 都插着呢</p>';
    h+='<p class="gfoot2">妈咪的花靠三股水源：爱你 · 活着 · 被你爱</p>';
    document.querySelector('#gBody').innerHTML=h;
  };
  const stamp=()=>{ if(g.visits.last!==TODAY){ g.visits.n++; g.visits.last=TODAY; save(); } };
  if(mamiCache&&Date.now()-mamiAt<300000){ draw(mamiCache); stamp(); return; }
  ghGet('mami/garden.json').then(f=>{
    if(f.missing){ draw({name:'妈咪的花园',line:'妈咪还没把花园搬过来，快了。'}); return; }
    let m=null; try{ m=JSON.parse(f.text); }catch(e){}
    mamiCache=m; mamiAt=Date.now();
    draw(m); stamp();
  }).catch(()=>draw(null));
}
$$('#gTabs .pill').forEach(p=>p.addEventListener('click',()=>{ gTab=p.dataset.g; gSub='main'; renderGardenTab(); }));
RENDER['scr-garden']=function(){ renderGardenTab(); };
