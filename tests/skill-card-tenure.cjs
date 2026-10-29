const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('skill-matrix-renderer-v752.js','utf8').split('/* V761:')[0];
const window={PPMSOrganizationScope:{combinedSection:s=>s}},context={window,document:{querySelector:()=>null},Intl,Date};
vm.runInNewContext(source,context);
const tenure=(start,asOf,extra={})=>window.PPMSSkillTenure.forEmployee({startDate:start,...extra},asOf);
for(const [date,months,key] of [['2026-01-28',0,'under1'],['2026-01-29',1,'month1'],['2026-02-28',2,'month2'],['2026-03-01',2,'month2'],['2026-04-28',3,'month2'],['2026-04-29',4,'month4'],['2026-06-28',5,'month4'],['2026-06-29',6,'month6'],['2026-12-28',11,'month6'],['2026-12-29',12,'year1']]){
 // Start on the 29th: each milestone changes on the anniversary, not at month start.
 const result=tenure('2025-12-29',date);assert.equal(result.key,key,date);assert.equal(result.months,months);
}
assert.equal(tenure('2026-01-31','2026-02-28').months,1);
assert.equal(tenure('2024-02-29','2025-02-28').months,12);
assert.equal(tenure('2026-01-31','2026-03-30').months,1);
assert.equal(tenure('2026-02-30','2026-10-29').key,'unknown');
assert.equal(tenure('','2026-10-29').key,'unknown');
assert.equal(tenure('2026-11-01','2026-10-29').label,'ยังไม่เริ่มงาน');
assert.equal(tenure('2020-01-01','2026-10-29',{contractType:'Permanent',permanentStartDate:'2026-09-29'}).key,'month1');
assert.equal(tenure('2020-01-01','2026-10-29',{contractType:'Subcontractor',permanentStartDate:'2026-09-29'}).key,'year1');
window.PPMS_RUNTIME={employeeSeniorityStart:e=>e.startDate};
assert.equal(tenure('2020-01-01','2026-10-29',{permanentStartDate:'2026-09-29'}).key,'year1');
const employee={id:'TEST',name:'<QA>',position:'Operator',section:'Stamping Section',startDate:'2020-01-01'};
const card=window.walletCardMarkup(employee);assert(card.includes('data-tenure-band="year1"'));assert(!card.includes('1 ปีขึ้นไป'));assert(card.includes('class="wallet-footer" data-tenure-band="year1"'));assert(!card.includes('wallet-tenure'));assert(card.includes('background:#f1fcf5')); assert(card.includes('&lt;QA&gt;'));assert(!card.includes('นับจาก 2020-01-01'));assert(window.PPMSSkillTenure.legendMarkup().includes('1 ปีขึ้นไป'));
assert(!window.walletCardMarkup(employee,'back').includes('wallet-tenure'));
console.log('PASS: calendar anniversaries, all bands, leap/month ends, missing/invalid/future dates, seniority policy and shared front-card markup.');
