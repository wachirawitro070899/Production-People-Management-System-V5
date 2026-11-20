const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const dom=new JSDOM('<!doctype html><title>PPMS — ระบบจัดการพนักงานและการผลิต</title><body><main id="app"></main></body>',{url:'https://ppms.test',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,wait=()=>new Promise(resolve=>setTimeout(resolve,40));
w.alert=()=>{};w.confirm=()=>false;w.prompt=()=>null;
w.eval(fs.readFileSync('language-v843.js','utf8'));w.eval(fs.readFileSync('training-lessons-v964.js','utf8'));
let calls=0,captured,fail=false;
const append=w.document.body.append.bind(w.document.body);
w.document.body.append=(...nodes)=>{
 append(...nodes);
 for(const node of nodes)if(node.classList?.contains('tl-print-frame')){
  node.contentWindow.focus=()=>{};
  node.contentWindow.requestAnimationFrame=callback=>{callback();return 0;};
  node.contentWindow.print=()=>{
   calls++;w.PPMSLanguage.refresh();
   captured={parent:w.document.title,child:node.contentDocument.title,frame:node.title,pages:node.contentDocument.querySelectorAll('[data-tl-page]').length};
   if(fail)throw Error('print unavailable');
  };
 }
};
const input=topic=>({ctx:{section:'Quality Section',year:2026,scope:{}},q:'Q3',quarter:{},item:{index:0,title:topic,detail:'รายละเอียด'}});
const launch=async topic=>{w.PPMSTrainingLessons.open(input(topic));w.document.querySelector('[data-tl-print]').click();await wait();};
(async()=>{try{
 await wait();const original=w.document.title;
 await launch('การตรวจวัด');
 const expected='สไลด์อบรม_การตรวจวัด_Quality Section_Q3_2026';
 assert.equal(captured.parent,expected);assert.equal(captured.child,expected);assert.equal(captured.frame,expected);assert.equal(captured.pages,10);
 w.PPMSLanguage.refresh();assert.equal(w.document.title,expected,'Language refresh preserves the PDF title');
 w.document.querySelector('[data-tl-print]').click();await wait();assert.equal(calls,1);assert.equal(w.document.querySelectorAll('.tl-print-frame').length,1);
 w.document.querySelector('.tl-print-frame').contentWindow.dispatchEvent(new w.Event('afterprint'));
 assert.equal(w.document.title,original);assert.equal(w.document.querySelector('.tl-print-frame'),null);assert(!w.document.documentElement.hasAttribute('data-ppms-print-title'));
 await launch('WI / SOP: "A"? <B> | C* \\ D');
 assert(!/[<>:"/\\|?*\u0000-\u001f]/.test(captured.parent));assert(captured.parent.includes('WI - SOP- -A-- -B- - C- - D'));
 w.dispatchEvent(new w.Event('afterprint'));assert.equal(w.document.title,original);
 fail=true;await launch('หัวข้อถัดไป');assert.equal(w.document.title,original);assert.equal(w.document.querySelector('.tl-print-frame'),null);assert(w.document.querySelector('[data-tl-status]').textContent.includes('print unavailable'));
 fail=false;await launch('สอบย้อนกลับ');assert(captured.parent.includes('สอบย้อนกลับ'));w.dispatchEvent(new w.Event('afterprint'));
 for(const name of ['index.html','404.html']){const html=fs.readFileSync(name,'utf8');assert(html.includes('language-v843.js?v=966'));assert(html.includes('training-lessons-v964.js?v=976'));}
 assert.equal(w.document.title,original);console.log('PASS selected topic/Section/quarter/year PDF titles, safe filename characters, language refresh, repeated print guard, save/cancel cleanup, failure recovery and cache versions.');
}finally{w.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
