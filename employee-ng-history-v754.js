/* V757: Self-contained read-only Employee NG renderer.
   Must not depend on private variables inside app-v588.js. */
(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const isAdmin=()=>sessionStorage.getItem('ppms_admin')==='1';
 function history(employee){return Array.isArray(employee?.ngHistory)?employee.ngHistory.filter(Boolean):[]}
 function timeline(employee){return history(employee).map((record,index)=>({...record,_originalIndex:index})).sort((a,b)=>String(a.createdAt||a.date||'').localeCompare(String(b.createdAt||b.date||''))).map((record,index)=>({...record,warningNumber:index%3+1,cycle:Math.floor(index/3)+1,card:(index%3+1)===3?'red':'yellow'}))}
 function stats(employee){const total=timeline(employee).length;return{total,red:Math.floor(total/3),yellow:total%3,cycle:Math.floor(total/3)+1,next:total%3+1}}
 function panel(employee){
  if(!employee)return '<section class="panel employee-ng-history"><p>ไม่พบข้อมูลพนักงาน</p></section>';
  const summary=stats(employee);
  const rows=[...timeline(employee)].reverse().map(record=>`<tr><td>${esc(record.date||'-')}</td><td><span class="ng-card-badge ${record.card}">${record.card==='red'?'ใบแดง':'ใบเหลือง'} #${record.warningNumber}</span><small>รอบ ${record.cycle}</small></td><td><b>${esc(record.type||'งาน NG')}</b><small>${esc(record.partNo||'-')} · ${esc(record.process||'-')} · NG ${esc(record.qty||1)} ชิ้น</small></td><td>${esc(record.detail||'-')}${record.evidenceImage?`<a href="${esc(record.evidenceImage)}" target="_blank" rel="noopener" class="ng-evidence-link"><img src="${esc(record.evidenceImage)}" alt="หลักฐาน NG" class="ng-evidence-thumb"><span>เปิดภาพหลักฐาน</span></a>`:''}<small>${record.correctiveAction?'แก้ไข: '+esc(record.correctiveAction):''}</small></td><td>${esc(record.recordedBy||'Admin')}</td></tr>`).join('');
  return `<section class="panel employee-ng-history"><div class="ng-history-head"><div><h3>ประวัติการทำงานเสีย / Employee NG History</h3><p>บันทึกสะสมตามรหัสพนักงาน · รายการที่ 3 ของแต่ละรอบเป็นใบแดง</p></div></div><div class="ng-summary"><span><b>${summary.total}</b>เหตุการณ์ทั้งหมด</span><span class="yellow"><b>${summary.yellow}/3</b>ใบเหลืองรอบปัจจุบัน</span><span class="red"><b>${summary.red}</b>ใบแดงสะสม</span><span><b>${summary.cycle}</b>รอบปัจจุบัน</span></div><div class="table-wrap"><table><thead><tr><th>วันที่</th><th>สถานะ</th><th>ประเภท / Part</th><th>รายละเอียด</th><th>ผู้บันทึก</th></tr></thead><tbody>${rows||'<tr><td colspan="5">ยังไม่มีประวัติ NG</td></tr>'}</tbody></table></div>${isAdmin()?'<p class="modal-note no-print">การบันทึกและลบ NG จะเปิดใช้งานอีกครั้งหลังปรับโมดูลจัดการข้อมูลให้แยกจากไฟล์เดิมอย่างปลอดภัย</p>':''}</section>`;
 }
 function overview(list){
  const rows=(Array.isArray(list)?list:[]).map(employee=>{const summary=stats(employee);return `<tr><td>${esc(employee.id)}</td><td><b>${esc(employee.name)}</b><small>${esc(employee.position||'')}</small></td><td>${summary.total}</td><td><span class="ng-card-badge yellow">${summary.yellow}/3</span></td><td><span class="ng-card-badge red">${summary.red}</span></td><td class="no-print"><button type="button" class="compact" data-action="openEmployeeNg" data-employee-id="${esc(employee.id)}" data-section="${esc(employee.section)}">เปิดประวัติ</button></td></tr>`}).join('');
  return `<section class="panel employee-ng-history"><div class="ng-history-head"><div><h3>ประวัติการทำงานเสีย / Employee NG History</h3><p>เลือกพนักงานเพื่อดูประวัติย้อนหลัง</p></div></div><div class="table-wrap"><table><thead><tr><th>รหัส</th><th>พนักงาน</th><th>เหตุการณ์</th><th>ใบเหลืองรอบนี้</th><th>ใบแดงสะสม</th><th class="no-print">เปิดข้อมูล</th></tr></thead><tbody>${rows||'<tr><td colspan="6">ยังไม่มีพนักงาน</td></tr>'}</tbody></table></div></section>`;
 }
 window.employeeNgHistory=history;
 window.employeeNgTimeline=timeline;
 window.employeeNgStats=stats;
 window.employeeNgHistoryPanel=panel;
 window.sectionNgOverview=overview;
 window.PPMS_NG_RENDERER_VERSION='V757';
})();