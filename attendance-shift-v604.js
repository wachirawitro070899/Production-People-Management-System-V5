// V604: Mirror the current Leader roster into Employee Master for attendance clients.
(()=>{'use strict';
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const add=(value,days)=>{const [y,m,d]=String(value).split('-').map(Number),x=new Date(y,m-1,d,12);x.setDate(x.getDate()+days);return key(x)};
function list(value){return Array.isArray(value)?value.filter(Boolean):value&&typeof value==='object'?Object.values(value).filter(Boolean):[]}
function selectedShift(fd,emp,round){
 const direct=String(fd.get('emp_'+emp.id+'_r'+round)||'');
 if(direct==='day'||direct==='night')return direct;
 const team=String(emp.stampingShift||'').replace(' ','_');
 const teamShift=team?String(fd.get('team_'+team+'_r'+round)||''):'';
 return teamShift==='day'||teamShift==='night'?teamShift:'';
}
async function mirrorCurrentRoster(form){
 const fd=new FormData(form),start=String(fd.get('startDate')||''),rosterSection=String(fd.get('section')||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!rosterSection)return;
 const today=key(new Date()),sortingGroup=rosterSection==='Sorting 1 Section'?'Sorting 1':rosterSection==='Sorting 2 Section'?'Sorting 2':'';
 const section=sortingGroup?'Sorting Section':rosterSection;
 let round=0;
 for(let i=0;i<4;i++){const from=add(start,i*14),to=add(from,13);if(today>=from&&today<=to){round=i+1;break}}
 if(!round)return;
 await new Promise(resolve=>setTimeout(resolve,1800));
 if(!window.firebase||!firebase.apps.length)return;
 const ref=firebase.database().ref('ppms/employees');
 await ref.transaction(raw=>{
  if(!raw)return raw;
  const rows=Array.isArray(raw)?raw:Object.values(raw);
  let changed=false;
  for(const emp of rows){
   if(!emp||String(emp.section||'')!==section)continue;
   if(sortingGroup&&String(emp.sortingGroup||'')!==sortingGroup)continue;
   const shift=selectedShift(fd,emp,round);if(!shift)continue;
   emp.attendanceShift=shift;emp.attShift=shift;emp.shiftRosterUpdatedAt=new Date().toISOString();changed=true;
  }
  return changed?raw:undefined;
 });
}
document.addEventListener('submit',event=>{
 const form=event.target;if(!form||form.id!=='shiftRosterForm'||!sessionStorage.getItem('ppms_leader_id'))return;
 mirrorCurrentRoster(form).catch(err=>console.error('V604 current roster mirror failed',err));
},true);
})();