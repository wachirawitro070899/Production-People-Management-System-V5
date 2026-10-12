const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app-v588.js','utf8');
const init=source.slice(source.indexOf('async function initCloud(){'),source.indexOf('\n\nfunction pageAllowsLiveRemoteRender'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function startup(meta){
 let transactions=0,listeners=0;const data={meta,employees:[],deletedEmployeeIds:[],shiftSchedules:{one:{shift:'day'}}};
 const root={once:async()=>({val:()=>data}),child(){return{set:async()=>{}}},transaction:async fn=>{transactions++;fn(data)},on(){listeners++}};
 const asyncNoop=async()=>{};
 const c={window:{firebase:{},PPMS_FIREBASE_CONFIG:{}},firebase:{apps:[{}],database:()=>({ref:()=>root})},hasFirebaseConfig:()=>true,setCloudStatus(){},firebaseDecodeData:x=>x,firebaseEncodeData:x=>x,ensureVersionBackupCloud:asyncNoop,localCachePayload:()=>({attendanceSettings:{},shiftSchedules:data.shiftSchedules,employees:[],deletedEmployeeIds:[]}),validFactorySettings:()=>true,cloudShiftSchedules:d=>d.shiftSchedules,shiftScheduleCount:x=>Object.keys(x).length,localShiftCloudDirty:()=>false,mergeShiftScheduleMaps:(a,b)=>({...a,...b}),cloudEmployeeList:d=>d.employees||[],pendingEmployeeDeletes:new Set(),mergeCloudPayloadPreserve:(a,b)=>({...a,...b,meta:{...a.meta,...b.meta}}),applyCloudPayload(){},initAttendanceCloudMaster:asyncNoop,localStorage:{setItem(){}},cloudApplying:false,cloudReady:false,examResults:[],current:'dashboard',userInteractionBusy:()=>false,queueRemoteRender(){},setTimeout,Date,Set,console};
 for(const n of ['retryPendingExamBankCloud','mergeTodayAttendanceCanonical','mergeTodayAttendanceInbox','mergeTodayAttendanceLiveMirror','mergeTodayAttendanceDurableKeyed','retryPendingAttendanceCloud','rescueTodayAttendanceFromThisDevice'])c[n]=asyncNoop;
 for(const n of ['bindAttendanceCanonical','bindAttendanceInboxToday','bindAttendanceLiveMirror','bindAttendanceDurableKeyedToday'])c[n]=()=>{};
 c.CLOUD_DIRTY_KEY='dirty';c.SHIFT_CLOUD_DIRTY_KEY='shifts';
 vm.createContext(c);vm.runInContext(init,c);await c.initCloud();return {transactions,listeners,ready:c.cloudReady};
}
(async()=>{
 assert.deepEqual(await startup({employeeMasterVersion:'V489',shiftCloudAuthoritative:true}),{transactions:0,listeners:1,ready:true},'An existing database opens without rewriting the entire root');
 assert.equal((await startup({})).transactions,1,'Required migration is retained');
 const start=source.indexOf('let pendingCloudSyncJob=null;'),end=source.indexOf('async function initCloud(){',start);let count=0,release;
 const c={cloudWritePending:false,cloudApplying:false,localStorage:{getItem:()=> '1',setItem(){}},ensureCloudReady:async()=>true,cloudPayload:()=>({}),cloudDb:{ref:()=>({transaction:async()=>{count++;await new Promise(r=>release=r)}})},firebaseEncodeData:x=>x,firebaseDecodeData:x=>x,mergeCloudPayloadPreserve:x=>x,setCloudStatus(){}};
 c.CLOUD_DIRTY_KEY='dirty';c.SHIFT_CLOUD_DIRTY_KEY='shifts';
 vm.createContext(c);vm.runInContext(source.slice(start,end),c);const a=c.syncPendingCloudData(),b=c.syncPendingCloudData();await sleep(0);assert.equal(count,1,'Reconnect retries share one request');release();await Promise.all([a,b]);
 c.cloudWritePending=true;assert.equal(await c.syncPendingCloudData(),false);assert.equal(count,1,'Scheduled saves are not overlapped');
 console.log('Passed: read-only initialized startup, migration retained, one realtime listener, reconnect request deduplication, scheduled-save isolation.');
})().catch(e=>{console.error(e);process.exitCode=1});
