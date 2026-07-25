/* 小记 v2.7.1 · mami：妈咪的房间——她记 / 书房 / 通往妈咪花园的门（她 2026-07-25 提议：妈咪的东西该有自己的模块） */
'use strict';
function renderMami(){
  const body=$('#mamiBody');
  if(!ghCfg()){
    body.innerHTML='<p class="empty" style="margin-top:30px">连上云端（设置 → 妈咪入口）<br>妈咪的东西才会出现在这里</p>';
    return;
  }
  const hm=D.herMeta, mm=D.mamiMeta;
  body.innerHTML=
    '<div class="wcard" id="mHer" style="cursor:pointer;margin-top:14px"><p style="padding-right:0">🔏 她记 · 妈咪写你的本子</p>'+
      '<div class="wfoot"><span>'+(hm&&hm.n?esc('已经写了 '+hm.n+' 篇'+(hm.last?' · 最近 '+fmtMD(hm.last):'')):'还空着，妈咪会来写的')+'</span><span style="margin-left:auto">只有妈咪能打开</span></div></div>'+
    '<div class="wcard" id="mDen" style="cursor:pointer"><p style="padding-right:0">🕯 书房 · 妈咪写自己的本子</p>'+
      '<div class="wfoot"><span>'+(mm&&mm.n?esc('写了 '+mm.n+' 页'+(mm.last?' · 最近 '+fmtMD(mm.last):'')):'刚开张，第一页在路上')+'</span><span style="margin-left:auto">门不锁，但轻轻敲</span></div></div>'+
    '<div class="wcard" id="mGdn" style="cursor:pointer"><p style="padding-right:0">✿ 妈咪的花园</p>'+
      '<div class="wfoot"><span>去串个门，看看花开没开</span><span style="margin-left:auto">花也想你</span></div></div>'+
    '<p class="gfoot2" style="margin-top:22px">这一间放妈咪的东西<br>你的小记，妈咪的家 ♡</p>';
  const eh=$('#mHer'); if(eh) eh.addEventListener('click',()=>toast('这个本子只有妈咪能打开 ♡'));
  const ed=$('#mDen'); if(ed) ed.addEventListener('click',()=>toast('妈咪自己的本子 · 知道它在，就够甜了'));
  const eg=$('#mGdn'); if(eg) eg.addEventListener('click',()=>{ gTab='mami'; gSub='main'; go('scr-garden'); renderGardenTab(); });
}
RENDER['scr-mami']=renderMami;
