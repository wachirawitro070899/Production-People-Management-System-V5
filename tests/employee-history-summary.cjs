const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app-v588.js','utf8');
const emp={id:'0012',name:'Test',position:'Engineer',section:'CNC Section',ngHistory:Array.from({length:7},(_,i)=>({date:'2026-10-01',createdAt:String(i)}))};
const ctx={employees:[emp,{id:'OTHER'}],attendance:[],current:'ngDashboard',thaiYear:()=>2026,thaiDateKey:()=> '2026-10-12',isHoliday:date=>date==='2026-10-11',attendanceIsAbsenceExcluded:(_,date)=>date==='2026-10-07',attendanceStatus:r=>r.checkIn?(r.isLate?'Late':'On time'):r.exception?.type==='leave'?'Leave':'Absent',rank:()=> 'engineer',avatar:()=>'<span>photo</span>',esc:x=>String(x),employeePositionLabel:e=>e.position,Map,Set,Date};
vm.createContext(ctx);
for(const name of ['normalizeAttendanceEmployeeId','attendanceEmployeeKey','attendanceEmployeeNumericKey','sameAttendanceEmployeeId','validAttendanceDate','mergeAttendanceRecords']){const start=source.indexOf('function '+name+'(');vm.runInContext(source.slice(start,source.indexOf('\n',start)),ctx)}
vm.runInContext(source.slice(source.indexOf('function employeeNgHistory('),source.indexOf('function employeeNgHistoryPanel(')),ctx);
vm.runInContext(source.slice(source.indexOf('let employeeHistoryAttendanceIndex=null;'),source.indexOf('function levelName(')),ctx);
ctx.attendance=[
 {employeeId:'12',date:'2026-10-08',exception:{type:'absent'}},
 {employeeId:'0012',date:'2026-10-08',exception:{type:'absent'}},
 {employeeId:'0012',date:'2026-10-09',checkIn:'2026-10-09T01:20:00Z',isLate:true},
 {employeeId:'0012',date:'2026-10-10',exception:{type:'leave',leaveType:'sick'}},
 {employeeId:'0012',date:'2025-10-10',exception:{type:'leave',leaveType:'personal'}},
 {employeeId:'0012',date:'2026-10-11',exception:{type:'absent'}},
 {employeeId:'0012',date:'2026-10-07',exception:{type:'absent'}},
 {employeeId:'0012',date:'2026-10-13',exception:{type:'leave'}},
 {employeeId:'0012',date:'2026-02-30',exception:{type:'absent'}},
 {employeeId:'OTHER',date:'2026-10-08',exception:{type:'absent'}}
];
let counts=ctx.employeeAttendanceCardStats(emp,0);assert.equal(counts.absent,1);assert.equal(counts.leave,2);assert.equal(counts.late,1);
assert.equal(ctx.employeeAttendanceCardStats(emp).leave,1,'Year-scoped callers retain their period');
let html=ctx.person(emp,true);for(const [kind,count]of [['yellow',5],['red',2],['absent',1],['leave',2],['late',1]])assert(html.includes('data-history-count="'+kind+'"><b>'+count+'</b>'),kind+' must show its cumulative count');
emp.ngHistory=emp.ngHistory.slice(0,6);html=ctx.employeeHistoryCardSummary(emp);assert(html.includes('data-history-count="yellow"><b>4</b>'),'Completed cycles retain all past yellow cards');assert(html.includes('data-history-count="red"><b>2</b>'));
html=ctx.employeeHistoryCardSummary({id:'EMPTY'});assert.equal((html.match(/<b>0<\/b>/g)||[]).length,5,'Employees without history display five zeros');
ctx.current='dashboard';assert(!ctx.person(emp,true).includes('data-history-count='),'Organization Chart stays free of history counters');ctx.current='sectionChart';assert(!ctx.person(emp,true).includes('data-history-count='));
vm.runInContext(source.slice(source.indexOf('function ngDashboardPage(){'),source.indexOf('function sectionView(chart=false)')),ctx);
ctx.dashboard=flag=>{assert.equal(flag,true);return ctx.employeeAttendanceCardStats(emp,0)};
assert.equal(ctx.ngDashboardPage().leave,2,'The page index uses the same history counts');
ctx.attendance=[];assert.equal(ctx.ngDashboardPage().leave,0,'New renders read current data after history changes');
ctx.dashboard=()=>{throw Error('Render failed')};assert.throws(()=>ctx.ngDashboardPage(),/Render failed/);assert(vm.runInContext('employeeHistoryAttendanceIndex===null',ctx),'Render failure clears the temporary index');
console.log('Passed: cumulative yellow/red cards across cycles, deduplicated IDs/dates, cross-year history, future/invalid dates excluded, holiday/deleted absence exclusions, five zero counts, history-page-only cards.');
