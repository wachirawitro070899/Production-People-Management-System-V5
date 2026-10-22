/* Summary only: explicit staff metadata, with existing organization layout and names preserved. */
(()=>{'use strict';
 const isSub=e=>/^(subcontractor|subcontract|ซัพคอนแทรค|พนักงานซัพคอนแทรค|พนักงานรับเหมาช่วง)$/i.test(String(e?.contractType||'').trim());
 function group(e){if(!isSub(e))return '';const value=String(e.subcontractGroup||e.contractNationality||e.nationality||'').trim().toLowerCase();return ['th','thai','thailand','ไทย','คนไทย'].includes(value)?'TH':['mm','myanmar','burmese','พม่า','เมียนมา'].includes(value)?'MM':''}
 function counts(people){const sub=people.filter(isSub),thai=sub.filter(e=>group(e)==='TH').length,myanmar=sub.filter(e=>group(e)==='MM').length;return {permanent:people.length-sub.length,subcontractor:sub.length,thai,myanmar,unknown:sub.length-thai-myanmar}}
 function markup(c){return '<div class="card metric">ซับคนไทย<b data-employment-count="subcontract-th">'+c.thai+'</b></div><div class="card metric">ซับพม่า<b data-employment-count="subcontract-mm">'+c.myanmar+'</b></div>'+(c.unknown?'<div class="card metric">ซับยังไม่ระบุกลุ่ม<b data-employment-count="subcontract-unknown">'+c.unknown+'</b><small>ระบุในข้อมูลพนักงาน</small></div>':'')}
 function field(e){if(!isSub(e))return '';const key=group(e);return '<label>กลุ่มสำหรับสรุปซับ<select name="subcontractGroup"><option value="">ยังไม่ระบุ</option><option value="TH" '+(key==='TH'?'selected':'')+'>ซับคนไทย</option><option value="MM" '+(key==='MM'?'selected':'')+'>ซับพม่า</option></select></label>'}
 window.PPMSSubcontractSummary={counts,markup,field,group,isSub};
})();
