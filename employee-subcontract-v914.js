/* Summary only: subcontract employee IDs beginning NCN are Thai; all others are Myanmar. */
(()=>{'use strict';
 const isSub=e=>/^(subcontractor|subcontract|ซัพคอนแทรค|พนักงานซัพคอนแทรค|พนักงานรับเหมาช่วง)$/i.test(String(e?.contractType||'').trim());
 function group(e){if(!isSub(e))return '';return /^NCN/i.test(String(e.id||'').trim())?'TH':'MM'}
 function counts(people){const sub=people.filter(isSub),thai=sub.filter(e=>group(e)==='TH').length,myanmar=sub.filter(e=>group(e)==='MM').length;return {permanent:people.length-sub.length,subcontractor:sub.length,thai,myanmar,unknown:sub.length-thai-myanmar}}
 function markup(c){return '<div class="card metric">ซับคนไทย<b data-employment-count="subcontract-th">'+c.thai+'</b></div><div class="card metric">ซับพม่า<b data-employment-count="subcontract-mm">'+c.myanmar+'</b></div>'+(c.unknown?'<div class="card metric">ซับยังไม่ระบุกลุ่ม<b data-employment-count="subcontract-unknown">'+c.unknown+'</b><small>ระบุในข้อมูลพนักงาน</small></div>':'')}
 function field(e){return isSub(e)?'<input type="hidden" name="subcontractGroup" value="'+group(e)+'">':''}
 window.PPMSSubcontractSummary={counts,markup,field,group,isSub};
})();
