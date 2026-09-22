const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app-v588.js'),'utf8');
const code=source.slice(source.indexOf('function biometricIntegrationPanel()'),source.indexOf('// Read-only contract'));
const button={disabled:false},message={textContent:''},fields=new Map([['deviceName','เครื่องโรงงาน 1'],['deviceId','JR-GATE-01'],['brand','รอเลือกยี่ห้อ'],['model','รอเลือกรุ่น'],['location','ประตูโรงงาน 1'],['connectionMode','vendor_cloud']]);
const form={dataset:{},querySelector:()=>button};let html='',saved=null,warning='',fail=false,writes=0;
const ctx={isAdmin:true,attendanceSettings:{},esc:x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),modal:x=>{html=x},alert:x=>{warning=x},document:{getElementById:id=>id==='biometricSettingsForm'?form:message},FormData:class{get(key){return fields.get(key)}},ensureAttendanceCloudReady:async()=>true,cloudDb:{ref:path=>({set:async value=>{if(fail)throw Error('offline');writes++;saved={path,value}}})},firebaseEncodeData:x=>x,ATTENDANCE_CLOUD_ROOT:'ppmsAttendance',ATTENDANCE_SETTINGS_KEY:'settings',localStorage:{setItem(){}},Date};vm.createContext(ctx);vm.runInContext(code,ctx);
(async()=>{
assert(ctx.biometricIntegrationPanel().includes('ยังไม่เชื่อมต่อเครื่องจริง'));ctx.biometricSettingsModal();assert(html.includes('biometricSettingsForm'));await form.onsubmit({preventDefault(){}});assert.equal(saved.value.enabled,false);assert.equal(saved.value.status,'draft');assert.equal(saved.path,'ppmsAttendance/settings/biometricIntegration');assert.equal(ctx.attendanceSettings.biometricIntegration.deviceId,'JR-GATE-01');assert(message.textContent.includes('บันทึกข้อมูลเครื่องแล้ว'));assert.equal(button.disabled,false);
fields.set('deviceId','bad/path');await form.onsubmit({preventDefault(){}});assert(warning.includes('รหัสเครื่อง'));assert.equal(writes,1);
fields.set('deviceId','JR-GATE-02');fail=true;await form.onsubmit({preventDefault(){}});assert(message.textContent.includes('บันทึกไม่สำเร็จ'));assert.equal(ctx.attendanceSettings.biometricIntegration.deviceId,'JR-GATE-01');assert.equal(button.disabled,false);
ctx.isAdmin=false;warning='';ctx.biometricSettingsModal();assert.equal(warning,'กรุณา Login เป็น Admin');await form.onsubmit({preventDefault(){}});assert.equal(writes,1);
ctx.attendanceSettings.biometricIntegration.deviceName='<script>alert(1)</script>';assert(!ctx.biometricIntegrationPanel().includes('<script>'));
console.log('5 biometric settings scenarios passed: draft save, validation, failed save, Admin guard, escaped display (mock DOM/database)');
})().catch(e=>{console.error(e);process.exitCode=1});
