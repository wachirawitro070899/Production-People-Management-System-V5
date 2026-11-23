const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app-v588.js','utf8');
const stamp='2026-11-20T08:00:00Z',current=Array.from({length:400},(_,i)=>({employeeId:'TEST-'+i,date:'2026-11-20',checkIn:stamp,updatedAt:stamp,evidence:'x'.repeat(50000)}));
const master={meta:{master:true},settings:{},records:current,recordsByKey:Object.fromEntries(current.map(r=>[r.employeeId+'__'+r.date,r]))};
const row=id=>({employeeId:id,date:'2026-11-21',checkIn:stamp,updatedAt:stamp});
const archived=[row('MISSING'),row('RACED'),row('DELETED'),row('ADMIN'),{...row('HUGE'),evidence:'x'.repeat(9*1024*1024)}];
const writes=[],scheduled=[];let archiveReads=0,listeners=0,reads=0;
const stored={RACED:{...row('RACED'),checkIn:'2026-11-21T07:40:00Z',note:'New concurrent record'},ADMIN:{employeeId:'ADMIN',date:'2026-11-21',exception:{type:'absent',manualAdmin:true}}};
const c={console:{warn(){}},TextEncoder,setTimeout:(fn,ms)=>ms===1500?(scheduled.push(fn),scheduled.length):setTimeout(fn,ms),Date,Set,Map,Promise,JSON,
 cloudDb:{ref(path){return {once:async()=>{reads++;if(path==='archive/attendance'){archiveReads++;return {val:()=>({'2026-11-21':archived})}}return {val:()=>master}},on(){listeners++},transaction:async update=>{const id=path.split('/').pop().split('__')[0],next=update(stored[id]||null);if(next!==undefined){assert(Buffer.byteLength(JSON.stringify(next))<1024*1024);writes.push({path,next});stored[id]=next}return {committed:next!==undefined}},update:async value=>{assert(path==='attendance/meta','No full master/history rewrite');writes.push({path,next:value})}}}},
 ATTENDANCE_CLOUD_ROOT:'attendance',APP_DATA_VERSION:'test',ATTENDANCE_KEY:'cache',ATTENDANCE_SETTINGS_KEY:'settings',ATTENDANCE_DEVICES_KEY:'devices',ATTENDANCE_DELETED_DATES_KEY:'dates',
 firebaseEncodeData:x=>x,firebaseDecodeData:x=>x,employees:[],attendanceEmployeeKey:String,attendanceEmployeeNumericKey:String,
 flattenAttendanceArchive:value=>Object.values(value||{}).flatMap(day=>Object.values(day||{})),attendanceDeletedDates:()=>({}),attendanceDeletedRecords:()=>({}),
 attendanceRecordDeleteKey:(id,date)=>id+'__'+date,attendanceRecordStorageKey:(id,date)=>id+'__'+date,
 attendanceRecordBlockedByDeletion:r=>r.employeeId==='DELETED',attendanceRecordBlockedByCleanup:()=>false,loadObject:()=>({}),
 applyAttendanceMasterPayload(){},attendanceCloudReady:false,attendanceCloudListenerBound:false,window:{PPMSAccess:{readOnly:()=>false}},isAdmin:false,localStorage:{setItem(){}},
 pageAllowsLiveRemoteRender:()=>false,queueRemoteRender(){},userInteractionBusy:()=>false};
vm.createContext(c);
vm.runInContext(source.slice(source.indexOf('function mergeAttendanceRecords('),source.indexOf('function firebaseSafeKey(')),c);
// The known archive path in the app is intentionally redirected to fixture data.
vm.runInContext(source.slice(source.indexOf('let attendanceArchiveRecoveryJob='),source.indexOf('async function updateAttendanceMasterMeta')).replaceAll("'ppmsArchive/attendance'","'archive/attendance'"),c);
(async()=>{
 assert(Buffer.byteLength(JSON.stringify(master))>32*1024*1024,'Fixture contains duplicated history larger than a single write');
 await c.initAttendanceCloudMaster();assert.equal(c.attendanceCloudReady,true);assert.equal(archiveReads,0,'Public navigation never waits for historical repair');assert.equal(writes.length,0);assert.equal(listeners,1);
 c.isAdmin=true;await c.initAttendanceCloudMaster();assert.equal(scheduled.length,1);assert.equal(archiveReads,0,'Admin startup schedules repair after the UI is ready');
 const first=c.recoverAttendanceFromArchiveCloud(),second=c.recoverAttendanceFromArchiveCloud();const counts=await Promise.all([first,second]);assert.deepEqual(counts,[1,1]);assert.equal(archiveReads,1,'Concurrent repair requests share one archive read');
 assert.equal(stored.MISSING.checkIn,stamp);assert.equal(stored.RACED.note,'New concurrent record');assert.equal(stored.ADMIN.exception.manualAdmin,true);assert.equal(stored.DELETED,undefined);assert.equal(stored.HUGE,undefined,'Oversized row stays in the original archive');
 assert.equal(writes.filter(w=>w.path.includes('/recordsByKey/')).length,1);assert.equal(master.records.length,400);assert.equal(archived.length,5);
 console.log('PASS large attendance history: responsive startup, one background repair, bounded missing-row writes, concurrent/manual records and deletion guards preserved, oversized archive evidence retained.');
})().catch(e=>{console.error(e);process.exitCode=1});
