const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app-v588.js','utf8'),leader=fs.readFileSync('leader-shift-v603.js','utf8');
const start=app.indexOf(' employeePhotoData:imageToData,'),end=app.indexOf(' factoryLayoutEmployees:',start);
let allowed=true,calls=0,queued=[],events=0;
const boss={id:'L',section:'Stamping Section'},people=[{id:'1',section:'Stamping Section',name:'ONE',photoUrl:'legacy'},{id:'2',section:'Welding Section',name:'TWO'}];
const ctx={imageToData:async file=>{assert.equal(file.type,'image/png');return 'data:image/jpeg;base64,COMPRESSED'},leaderEmployee:()=>boss,isLeaderMode:()=>allowed,organizationRenderMaster:null,employees:structuredClone(people),queueEmployeeSave:(...args)=>queued.push(args),deletedEmployeeIds:new Set(['new']),persistDeletedIds(){},persistCloudToLocal(){},window:{dispatchEvent(){events++}},Event:class{},syncEmployeeCloudNow:async(...args)=>{calls++;return args}};
vm.createContext(ctx);vm.runInContext('this.runtime={'+app.slice(start,end)+'};',ctx);
(async()=>{
 await assert.rejects(ctx.runtime.updateLeaderEmployeePhoto('2',{type:'image/png'}),/Section/);assert.equal(calls,0);
 allowed=false;await assert.rejects(ctx.runtime.addLeaderEmployee({id:'new'}),/Leader/);allowed=true;
 let result=await ctx.runtime.updateLeaderEmployeePhoto('1',{type:'image/png'});assert.equal(result[0].photoData,'data:image/jpeg;base64,COMPRESSED');assert.equal(result[0].photoUrl,'');assert.equal(result[0].name,'ONE');assert.equal(queued.length,1);
 result=await ctx.runtime.updateLeaderEmployeePhoto('1',null,true);assert.equal(result[0].photoData,'');assert.equal(result[0].photoUrl,'');
 result=await ctx.runtime.addLeaderEmployee({id:'new',section:'Welding Section',organizationDivision:'OTHER',photoData:'uploaded'});assert.equal(result[0].section,'Stamping Section');assert.equal(result[0].organizationDivision,'Production Division');assert.equal(result[2].createOnly,true);assert.equal(result[0].photoData,'uploaded');assert(!ctx.deletedEmployeeIds.has('new'));
 await assert.rejects(ctx.runtime.addLeaderEmployee({id:'1'}),/อยู่แล้ว/);
 assert(leader.includes('name="photo" accept="image/*"'));assert(!leader.includes("master.db.ref('ppms').transaction"));
 const form=app.slice(app.indexOf('function employeeForm'),app.indexOf('function add()',app.indexOf('function employeeForm')));assert(!form.includes('chooseFromDrive'));assert(!form.includes('photoUrlInput'));assert(form.includes('accept="image/*"'));
 assert(app.includes('function driveUploaderReady(){return false}'));
 console.log('Passed: same-section photo changes, cross-section and logged-out rejection, photo deletion, shared compressed data, forced Leader section, duplicate IDs, no Drive picker or root add transaction.');
})().catch(err=>{console.error(err);process.exitCode=1});
