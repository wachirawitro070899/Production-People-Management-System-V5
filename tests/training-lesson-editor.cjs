const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms||40)),copy=v=>v==null?v:JSON.parse(JSON.stringify(v));
const cloud=new Map(),writes=[],reads=[];let deny=false,network=false,writeRace=false,writeTimeout=false;
function setup({admin=true,view=false,stored={}}={}){
 const d=new JSDOM('<!doctype html><title>PPMS</title><body><main id="app"></main><button id="origin">Open</button></body>',{url:'https://ppms.test',runScripts:'outside-only',pretendToBeVisual:true});const w=d.window;
 w.AbortController=AbortController;w.confirm=()=>true;w.PPMS_FIREBASE_CONFIG={databaseURL:'https://database.test'};w.PPMSAccess={canEdit:()=>!view};
 if(admin){w.sessionStorage.setItem('ppms_admin','1');w.sessionStorage.setItem('ppms_admin_user','tester');}
 for(const[k,v]of Object.entries(stored))w.localStorage.setItem(k,v);
 w.fetch=async(url,options={})=>{
  const key=String(url),old=cloud.get(key)||{record:null,etag:'"null"'};
  if(network)throw Error('network unavailable');
  if(options.method==='PUT'){
   writes.push({url:key,options});if(deny)return {ok:false,status:403};
   if(writeRace){writeRace=false;return {ok:false,status:412};}
   assert.equal(options.headers['If-Match'],old.etag);const record=JSON.parse(options.body);cloud.set(key,{record,etag:'"'+record.revision+'"'});
   if(writeTimeout){writeTimeout=false;throw Error('reply lost');}
   return {ok:true,status:200,headers:{get:()=>null},json:async()=>copy(record)};
  }
  reads.push(key);return {ok:true,status:200,headers:{get:()=>old.etag},json:async()=>copy(old.record)};
 };
 for(const name of ['exam-plan-details-v592.js','training-lessons-v964.js','training-lesson-editor-v967.js'])w.eval(fs.readFileSync(name,'utf8'));
 return {w,close:()=>w.close()};
}
const input=(extra={})=>({ctx:{section:'Quality Section',year:2026,scope:{division:'Production Division',plant:'โรง 1'}},q:'Q3',quarter:{},item:{index:0,title:'การตรวจวัด',detail:'รายละเอียด'},...extra});
const state=w=>({pages:w.document.querySelectorAll('.tl-print-frame').length,status:w.document.querySelector('[data-tl-status]')?.textContent});
const open=async(w,value=input())=>{const v=w.PPMSTrainingLessons.open(value,w.document.getElementById('origin'));await wait();return v;};
const edit=w=>w.document.querySelector('[data-tl-edit]').click();
function fill(w,name,value){const e=w.document.querySelector('[data-slide-form] [name="'+name+'"]');assert(e,name);e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}));}
const save=async w=>{w.document.querySelector('[data-tl-save]').click();await wait();};
(async()=>{
 const a=setup();let b;
 try{
  const w=a.w,api=w.PPMSTrainingLessonEditor,path=api.identity(input());
  assert.notEqual(path,api.identity(input({q:'Q4'})));assert.notEqual(path,api.identity(input({ctx:{...input().ctx,scope:{division:'Production Division',plant:'โรง 2'}}})));assert.notEqual(path,api.identity(input({item:{...input().item,index:1}})));
  assert(!api.safeImage('data:image/svg+xml;base64,PHN2Zy8+'));assert(!api.safeImage('javascript:alert(1)'));assert(!api.safeImage('https://elsewhere.test/p.png'));
  const v=await open(w);assert(w.document.querySelector('[data-tl-edit]'));edit(w);assert(!w.document.querySelector('.tl-editor').hidden);
  fill(w,'title','ตรวจเวอร์เนียร์ <script>alert(1)</script>');fill(w,'points','ตรวจสอบ Zero\nอ่านหน่วยก่อนบันทึก');fill(w,'kicker','การตรวจเวอร์เนียร์');fill(w,'imageCaption','จุดตรวจที่แก้ไขแล้ว');
  assert(w.document.querySelector('.tl-paper h2').textContent.includes('<script>'));assert.equal(w.document.querySelectorAll('.tl-paper script').length,0);assert(w.document.querySelector('[data-tl-go="0"] b').textContent.includes('เวอร์เนียร์'));
  w.document.querySelector('[data-tl-go="8"]').click();fill(w,'question-0','ถามใหม่');fill(w,'answer-0','คำตอบใหม่');
  w.document.querySelector('[data-tl-go="9"]').click();fill(w,'method','สาธิตด้วยชิ้นงานจริง');fill(w,'criteria','ตรวจครบทุกจุด');
  w.document.querySelector('[data-tl-go="0"]').click();assert(w.document.querySelector('input[name=title]').value.includes('เวอร์เนียร์'));
  await save(w);assert.equal(writes.length,1);assert(state(w).status.startsWith('บันทึกสไลด์แล้ว'));
  const record=cloud.get('https://database.test/'+path+'.json').record;assert.equal(record.pages[8].questions[0].question,'ถามใหม่');assert.equal(record.pages[9].criteria,'ตรวจครบทุกจุด');assert(w.PPMSTrainingLessons.printMarkup(v.deck).includes('ตรวจเวอร์เนียร์ &lt;script&gt;'));
  const before=writes.length;b=setup({admin:false});const vb=await open(b.w);assert(!b.w.document.querySelector('[data-tl-edit]'));assert(vb.deck.pages[0].title.includes('เวอร์เนียร์'));assert.equal(writes.length,before);b.close();b=null;
  const readOnly=setup({view:true});await open(readOnly.w);assert(!readOnly.w.document.querySelector('[data-tl-edit]'));readOnly.close();
  // Losing edit access after opening cannot publish a draft.
  fill(w,'title','draft after permission change');w.PPMSAccess.canEdit=()=>false;await save(w);assert.equal(writes.length,before);w.PPMSAccess.canEdit=()=>true;
  // Offline failures retain the author draft and never report a shared save.
  network=true;await save(w);assert(state(w).status.includes('ยังไม่บันทึกส่วนกลาง'));assert(state(w).status.includes('เก็บฉบับร่าง'));
  w.PPMSTrainingLessons.close();await open(w);edit(w);const restore=w.document.querySelector('[data-restore-draft]');assert(!restore.hidden);restore.click();assert.equal(w.document.querySelector('input[name=title]').value,'draft after permission change');network=false;
  // A newer remote revision must not be overwritten silently.
  const item=cloud.get('https://database.test/'+path+'.json');item.record.revision='remote-revision';item.etag='"remote-revision"';await save(w);assert.equal(writes.length,before);assert(state(w).status.includes('มีฉบับใหม่'));
  w.document.querySelector('[data-tl-reload]').click();await wait();assert(w.document.querySelector('input[name=title]').value.includes('เวอร์เนียร์'));w.document.querySelector('[data-restore-draft]').click();assert.equal(w.document.querySelector('input[name=title]').value,'draft after permission change');
  // A simultaneous conditional-write race also preserves the draft.
  writeRace=true;await save(w);assert(state(w).status.includes('มีฉบับใหม่'));assert(state(w).status.includes('ฉบับร่าง'));await save(w);assert(state(w).status.startsWith('บันทึกสไลด์แล้ว'));
  // If the server saved but its response was lost, retry recognizes this exact operation.
  fill(w,'title','บันทึกที่ตอบกลับไม่ทัน');writeTimeout=true;await save(w);assert(state(w).status.includes('ยังไม่บันทึกส่วนกลาง'));const afterTimeout=writes.length;await save(w);assert.equal(writes.length,afterTimeout);assert(state(w).status.startsWith('บันทึกสไลด์แล้ว'));
  // Raster images survive published reload and PDF markup; unsafe formats are rejected.
  const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6gwAAAABJRU5ErkJggg==';
  const pages=copy(v.deck.pages);pages[0].image=png;pages[0].imageCaption='ภาพหน้างาน';assert(api.sanitizePages(pages,v.deck.pages)[0].image===png);pages[0].image='data:image/svg+xml;base64,PHN2Zy8+';assert.throws(()=>api.sanitizePages(pages,v.deck.pages),/ภาพประกอบ/);
  const currentView=w.PPMSTrainingLessons.open(input());await wait();currentView.deck.pages[0].image=png;currentView.deck.pages[0].imageCaption='ภาพหน้างาน';edit(w);await save(w);
  const html=w.PPMSTrainingLessons.printMarkup(currentView.deck),doc=new JSDOM(html);assert.equal(doc.window.document.querySelectorAll('.tl-illustration img').length,1);assert.equal(doc.window.document.querySelector('.tl-illustration img').getAttribute('src'),png);doc.window.close();
  b=setup({admin:false});const imageView=await open(b.w);assert.equal(imageView.deck.pages[0].image,png);b.close();b=null;
  // Requests target the lesson store only, never attendance, evidence, employee or examination records.
  assert([...reads,...writes.map(x=>x.url)].every(url=>url.includes('/ppmsTrainingLessonDecks/')));
  console.log('PASS per-topic editing, navigation, quiz and summary, XSS escaping, shared reload, scope isolation, read-only access, offline drafts, conflict resolution, conditional-write race, uncertain-save recovery and raster images in PDF.');
 }finally{a.close();b?.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
