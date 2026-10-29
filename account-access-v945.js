/* Shared application permissions for named accounts. */
(()=>{'use strict';
 const KEY='ppms_v3_admin_accounts',message='บัญชีนี้ดูข้อมูลได้อย่างเดียว ไม่มีสิทธิ์แก้ไข';
 let raw='',accounts=[];
 function permission(){
  if(sessionStorage.getItem('ppms_admin')!=='1')return 'staff';
  try{const value=localStorage.getItem(KEY)||'[]';if(value!==raw){raw=value;const parsed=JSON.parse(value);accounts=Array.isArray(parsed)?parsed:Object.values(parsed||{})}}catch{accounts=[]}
  const username=String(sessionStorage.getItem('ppms_admin_user')||'').toLowerCase(),account=accounts.find(a=>a?.username?.toLowerCase()===username);
  if(account?.active===false||accounts.length&&!account)return 'view';
  return account?.owner===true?'edit':account?.permission==='view'?'view':'edit';
 }
 const readOnly=()=>permission()==='view';
 function assertWrite(){if(readOnly()){const error=Error(message);error.code='read-only';throw error}}
 window.PPMSAccess={permission,readOnly,canEdit:()=>!readOnly(),assertWrite};
 // Guard REST writes as well as the realtime SDK used by the older editors.
 if(window.fetch){const fetch=window.fetch.bind(window);window.fetch=(input,options={})=>{
  const method=String(options.method||input?.method||'GET').toUpperCase(),url=String(input?.url||input),base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'');
  if(!['GET','HEAD','OPTIONS'].includes(method)&&base&&url.startsWith(base+'/')){try{assertWrite()}catch(error){return Promise.reject(error)}}
  return fetch(input,options);
 }}
 try{
  const prototype=window.firebase?.database?.Reference?.prototype;
  for(const name of ['set','update','remove','transaction','setWithPriority','setPriority'])if(prototype?.[name]){
   const original=prototype[name];prototype[name]=function(...args){try{assertWrite()}catch(error){return Promise.reject(error)}return original.apply(this,args)};
  }
  if(prototype?.push){const push=prototype.push;prototype.push=function(...args){if(args[0]!=null){try{assertWrite()}catch(error){return Promise.reject(error)}}return push.apply(this,args)}}
 }catch(error){console.warn('Account write guard:',error)}
 const actions=new Set(['addNgRecord','advanceLateNotice','approveUpskill','attachMedicalCertificate','attendanceDevices','attendanceException','attendanceSettings','baselineSkills','bulkSkills','clearAllAttendance','clearAllAttendanceDevices','clearAllSystemTestData','clearAttendanceDay','clearAttendanceScope','clearExamResults','clearTrialAbsences','cloudAttendanceBackup','deleteAttendanceRecord','deleteExamResult','deleteHoliday','deleteNgRecord','holidayManagement','leaderOpenShift','recoverTodayAttendance','removeTrialPeriod','resetAttendanceDevice','resetExamBank','restoreAttendanceArchive','reviewWritten','scanFileUpload','shiftManagement','startAttendanceGoLive','switchAttendanceToTrial']);
 const selector='[data-delete],[data-skill-edit],[data-account-reset],[data-account-toggle],[data-account-delete],[data-account-permission],[data-cert-add],[data-cert-edit],[data-org-edit-position],[data-org-order],[data-org-drop],[data-org-structure-toolbar],[data-org-person-controls],[data-section-team-assign],[data-mp-new-person],[data-mp-remove],[data-mp-dissolve],[data-mp-add-support],[data-mp-small-group],[data-jd-save],[data-jd-edit],[data-jd-delete],[data-action],#nav [data-page="add"]';
 function mutates(node){return node.matches(selector)&&(!node.hasAttribute('data-action')||actions.has(node.dataset.action))}
 const restricted=new Set();
 function restrict(root){
  if(root.nodeType!==1)return;
  const nodes=[...(root.matches(selector)?[root]:[]),...root.querySelectorAll(selector)];
  for(const node of nodes)if(mutates(node)){
   if(readOnly()){restricted.add(node);node.dataset.accessAria='1';if('disabled'in node&&!node.disabled){node.disabled=true;node.dataset.accessDisabled='1';restricted.add(node)}node.setAttribute('aria-disabled','true')}
   else if(node.dataset.accessDisabled){node.disabled=false;delete node.dataset.accessDisabled;node.removeAttribute('aria-disabled')}
  }
  if(readOnly())for(const node of root.querySelectorAll('[draggable="true"]')){node.draggable=false;node.dataset.accessDrag='1';restricted.add(node)}
 }
 function stop(event){event.preventDefault();event.stopImmediatePropagation()}
 document.addEventListener('click',event=>{if(!readOnly())return;const node=event.target.closest(selector);if(node&&mutates(node))stop(event)},true);
 document.addEventListener('submit',event=>{if(readOnly()&&!['adminLoginForm','leaderLoginForm'].includes(event.target.id)){stop(event);alert(message)}},true);
 for(const type of ['dragstart','drop'])document.addEventListener(type,event=>{if(readOnly())stop(event)},true);
 let scheduled=false;const roots=new Set();
 function queue(root){
  if(!readOnly()){
   for(const node of restricted){if(node.dataset.accessAria){node.removeAttribute('aria-disabled');delete node.dataset.accessAria}if(node.dataset.accessDisabled){node.disabled=false;delete node.dataset.accessDisabled;node.removeAttribute('aria-disabled')}if(node.dataset.accessDrag){node.draggable=true;delete node.dataset.accessDrag}}restricted.clear();return;
  }
  if(root?.nodeType!==1)return;roots.add(root);if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;for(const node of roots){let parent=node.parentNode,covered=false;while(parent){if(roots.has(parent)){covered=true;break}parent=parent.parentNode}if(node.isConnected&&!covered)restrict(node)}roots.clear();const badge=document.getElementById('modeBadge'),label=window.PPMSLanguage?.language==='en'?'View only':'ดูอย่างเดียว';if(readOnly()&&badge){badge.setAttribute('data-i18n-ignore','');if(badge.textContent!==label)badge.textContent=label}});
 }
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)queue(node)}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('ppms-account-permissions-changed',()=>queue(document.body));
 window.addEventListener('ppms-language-changed',()=>queue(document.body));
 window.addEventListener('storage',event=>{if(event.key===KEY)queue(document.body)});
 queue(document.body);
})();
