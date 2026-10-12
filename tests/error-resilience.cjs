const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
(async()=>{
 const dom=new JSDOM('<body></body>',{url:'https://example.test',runScripts:'outside-only',storageQuota:500});const w=dom.window;
 const nativeGet=w.Storage.prototype.getItem;
 const attendance=JSON.stringify([{employeeId:'TEST',date:'2026-10-12',pendingCloudSync:true,exception:{medicalCertificateFile:{dataUrl:'data:image/png;base64,TEST'}}}]);
 w.localStorage.setItem('ppms_v3_attendance',attendance);w.eval(fs.readFileSync('error-guard-v652.js','utf8'));
 w.localStorage.setItem('large-cache','X'.repeat(800));
 assert.equal(nativeGet.call(w.localStorage,'ppms_v3_attendance'),attendance,'Quota overflow never deletes pending attendance');
 assert.equal(w.localStorage.getItem('large-cache'),'X'.repeat(800),'Current page retains an unpersisted write');
 assert(w.ppmsErrorGuard.pendingStorageKeys().includes('large-cache'));assert(w.document.getElementById('ppmsStorageNotice'),'Unpersisted data is reported truthfully');
 w.localStorage.removeItem('large-cache');w.localStorage.setItem('large-cache','saved');assert.equal(w.localStorage.getItem('large-cache'),'saved');assert(!w.ppmsErrorGuard.pendingStorageKeys().includes('large-cache'));
 const larger=JSON.stringify([...JSON.parse(attendance),{employeeId:'TEST-2',date:'2026-10-12',pendingCloudSync:true,photo:'X'.repeat(700)}]);
 w.localStorage.setItem('ppms_v3_attendance',larger);assert.equal(nativeGet.call(w.localStorage,'ppms_v3_attendance'),attendance);assert.equal(w.localStorage.getItem('ppms_v3_attendance'),larger);assert(w.localStorage.getItem('ppms_v3_attendance').includes('data:image/png;base64,TEST'),'Pending attachments are preserved');
 w.localStorage.setItem('ppms_v3_attendance',attendance);assert.equal(w.ppmsErrorGuard.retryStorage(),true);assert(!w.document.getElementById('ppmsStorageNotice'));
 w.localStorage.setItem('overflow','X'.repeat(800));w.localStorage.clear();assert.equal(w.localStorage.getItem('overflow'),null,'Clear also removes the memory fallback');
 w.eval(fs.readFileSync('ppms-push-v591.js','utf8'));assert.equal(await w.PPMSPush.refresh(),false,'Unsupported notification API does not reject');await assert.rejects(w.PPMSPush.enable(),/รองรับ/);
 dom.window.close();console.log('Passed: quota overflow preserves attendance/attachments, visible unsaved-state notice, reads during fallback, persistence recovery, remove/clear behavior, missing Notification API.');
})().catch(e=>{console.error(e);process.exitCode=1});
