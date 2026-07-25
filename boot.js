/* 小记 v2.6.5 · boot：启动——开机渲染/跨天自愈/备份提醒/sw注册/云端首拉 */
'use strict';
/* ================= boot ================= */
renderHomeTop(); updatePendBadge(); ensureFlows();
gTick(true); renderVase();

/* 跨天自愈：iOS 桌面 App 常常整夜不重载，日期一变就自动刷新，防止记到昨天 */
if(!qp.get('date')){
  const dayCheck=()=>{ if(todayISO()!==TODAY) location.reload(); };
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') dayCheck(); });
  window.addEventListener('pageshow',dayCheck);
  setInterval(dayCheck,60000);
}

/* 备份轻提醒：数据只在本机，太久没导出就催一句（一周最多催一次） */
(function backupNudge(){
  const bulk=D.log.length+D.notes.entries.length+D.moods.length;
  if(bulk<20) return;
  const overdue=!D.s.lastBackup||diffDays(D.s.lastBackup,TODAY)>30;
  const quiet=D.s.lastNudge&&diffDays(D.s.lastNudge,TODAY)<7;
  if(overdue&&!quiet){
    D.s.lastNudge=TODAY; save();
    setTimeout(()=>toast(D.s.lastBackup?`已经 ${diffDays(D.s.lastBackup,TODAY)} 天没备份了 · 设置→数据备份 ☾`:'记得导出第一份备份 · 设置→数据备份 ☾'),1500);
  }
})();

/* 离线支持：Service Worker（断网也能打开） */
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))
  navigator.serviceWorker.register('./sw.js').catch(()=>{});

/* 云端：开机拉一次；回到 App 超过5分钟再拉；切后台前把没推完的推掉 */
if(ghCfg()) setTimeout(cloudPull,400);
document.addEventListener('visibilitychange',()=>{
  if(!ghCfg()) return;
  if(document.visibilityState==='visible'&&Date.now()-lastPullAt>300000) cloudPull();
  if(document.visibilityState==='hidden'&&cloudDirty) cloudPush();
});
