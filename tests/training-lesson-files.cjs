const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');const wait=ms=>new Promise(r=>setTimeout(r,ms||50));
const store=new Map(),patches=[],reads=[],downloads=[];let fail=false,admin=true,writeAllowed=true;
const dom=new JSDOM('<!doctype html><body><button id="origin">Files</button></body>',{url:'https://ppms.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
w.setImmediate=setImmediate;w.clearImmediate=clearImmediate;w.AbortController=AbortController;w.PPMS_FIREBASE_CONFIG={databaseURL:'https://db.test'};w.sessionStorage.setItem('ppms_admin_user','tester');
w.PPMSTrainingLessonEditor={canEdit:()=>admin&&writeAllowed,identity:input=>'ppmsTrainingLessonDecks/2026/section/'+input.q+'/'+input.item.index};
w.URL.createObjectURL=()=> 'blob:https://ppms.test/'+Math.random();w.URL.revokeObjectURL=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,url:this.href});};
w.fetch=async(url,options={})=>{
 if(fail)throw Error('network failed');
 if(options.method==='PATCH'){
  assert(writeAllowed);assert.equal(String(url),'https://db.test/.json');const value=JSON.parse(options.body);patches.push(value);
  for(const[key,item]of Object.entries(value))store.set(key,item);
  return {ok:true,status:200,json:async()=>null};
 }
 const path=String(url).replace('https://db.test/','').replace(/\.json$/,'');reads.push(path);
 const record=store.has(path)?store.get(path):Object.fromEntries([...store].filter(([key])=>key.startsWith(path+'/')).map(([key,value])=>[key.slice(path.length+1),value]));
 return {ok:true,status:200,json:async()=>JSON.parse(JSON.stringify(record))};
};
w.eval(fs.readFileSync('vendor/jszip-3.10.1.min.js','utf8'));w.eval(fs.readFileSync('training-lesson-files-v968.js','utf8'));
const api=w.PPMSTrainingLessonFiles,input={ctx:{section:'Quality Section',year:2026},q:'Q1',item:{index:0,title:'การตรวจวัด'}};
const open=async(value=input)=>{api.open(value,w.document.getElementById('origin'));await wait();};
async function upload(files){const form=w.document.querySelector('[data-files-upload]');Object.defineProperty(form.elements.materials,'files',{configurable:true,value:files});form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));for(let i=0;i<100;i++){await wait(10);if(!form.querySelector('button').disabled)return;}throw Error('Upload did not finish');}
(async()=>{try{
 const pdf=new w.File(['%PDF-1.4\nexample data\n%%EOF'], 'มาตรฐานการตรวจวัด.pdf',{type:'application/pdf'}),pdfPrepared=await api.prepareFile(pdf);
 assert.equal(pdfPrepared.ext,'pdf');assert.equal(pdfPrepared.type,'application/pdf');assert.equal(w.atob(pdfPrepared.data),'%PDF-1.4\nexample data\n%%EOF');
 const zip=new w.JSZip();zip.file('[Content_Types].xml','<Types/>');zip.file('ppt/presentation.xml','<presentation/>');const pptx=new w.File([await zip.generateAsync({type:'uint8array'})],'เครื่องมือวัด.pptx',{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'});assert.equal((await api.prepareFile(pptx)).ext,'pptx');
 const wrongZip=new w.JSZip();wrongZip.file('[Content_Types].xml','<Types/>');wrongZip.file('word/document.xml','<document/>');const badPptx=new w.File([await wrongZip.generateAsync({type:'uint8array'})],'wrong.pptx');await assert.rejects(api.prepareFile(badPptx),/ไม่ใช่ PowerPoint/);
 await assert.rejects(api.prepareFile(new w.File(['<script>bad()</script>'],'wrong.pdf')),/เนื้อหาไฟล์/);await assert.rejects(api.prepareFile({name:'large.pptx',size:21*1024*1024}),/20 MB/);await assert.rejects(api.prepareFile(new w.File(['x'],'x.html')),/รองรับเฉพาะ/);
 await open();assert(w.document.querySelector('[data-files-list]').textContent.includes('ยังไม่มีไฟล์'));assert(reads.every(p=>p.startsWith('ppmsTrainingLessonFileIndex/')),'Listing never fetches original file data');
 await upload([pdf,pptx]);assert.equal(patches.length,2);assert.equal(w.document.querySelectorAll('[data-file-download]').length,2);assert(w.document.querySelector('[data-files-status]').textContent.includes('สำเร็จ 2 / 2'));
 for(const change of patches){assert.equal(Object.keys(change).length,2);const meta=Object.entries(change).find(([k])=>k.startsWith('ppmsTrainingLessonFileIndex/'))[1],body=Object.entries(change).find(([k])=>k.startsWith('ppmsTrainingLessonFiles/'))[1];assert(!('data'in meta));assert(body.data);assert.equal(meta.id,body.id);assert.equal(api.fileBlob(body,meta).size,meta.size);}
 w.document.querySelector('[data-file-download]').click();await wait();assert.equal(downloads.length,1);assert(/\.(pptx|pdf)$/.test(downloads[0].name));
 w.document.querySelector('[data-file-open]').click();await wait();assert(!w.document.querySelector('[data-files-preview]').hidden);assert(w.document.querySelector('[data-pdf-frame]').src.startsWith('blob:'));w.document.querySelector('[data-preview-close]').click();assert(w.document.querySelector('[data-files-preview]').hidden);
 assert.throws(()=>api.fileBlob({...pdfPrepared,id:'a',data:'PHNjcmlwdD4='},{...pdfPrepared,id:'a'}),/ขนาดไฟล์/);
 api.close();admin=false;await open();assert(!w.document.querySelector('[data-files-upload]'));assert.equal(w.document.querySelectorAll('[data-file-download]').length,2,'Stored files remain available in another session');api.close();
 await open({...input,q:'Q2'});assert.equal(w.document.querySelectorAll('[data-file-download]').length,0,'Quarter separation');api.close();
 admin=true;await open();writeAllowed=false;const count=patches.length;await upload([pdf]);assert.equal(patches.length,count);assert(w.document.querySelector('[data-files-status]').textContent.includes('ไม่มีสิทธิ์'));writeAllowed=true;
 fail=true;await upload([pdf]);assert.equal(patches.length,count);assert(w.document.querySelector('[data-files-status]').textContent.includes('ยังไม่สำเร็จ'));fail=false;
 await upload([pdf,new w.File(['bad'],'wrong.txt')]);assert(w.document.querySelector('[data-files-status]').textContent.includes('สำเร็จ 1 / 2'));assert(w.document.querySelector('[data-files-status]').textContent.includes('wrong.txt'));api.close();
 console.log('PASS original PDF/PPTX bytes, PowerPoint structure checks, type/size limits, per-topic uploads, atomic bytes + index, lightweight listing, PDF preview, original filenames, permissions, network failures and per-file partial results.');
}finally{w.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
