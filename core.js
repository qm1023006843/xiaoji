/* 小记 v2.6.1 · core：无状态工具（不认识 D，谁都能用） */
'use strict';
/* ================= helpers ================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const qp = new URLSearchParams(location.search);
function nowD(){ return new Date(); }
function todayISO(){
  if(qp.get('date')) return qp.get('date');
  const d=nowD(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function tsNow(){ const d=nowD(); return todayISO()+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function addDays(iso,n){ const d=new Date(iso+'T12:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function diffDays(a,b){ return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000); }
function fmtMD(iso){ return (+iso.slice(5,7))+'月'+(+iso.slice(8,10))+'日'; }
function fmtDT(ts){ return ts.slice(5,7)+'.'+ts.slice(8,10)+' · '+ts.slice(11,16); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('on'),2100); }
const PAL_N=15;
