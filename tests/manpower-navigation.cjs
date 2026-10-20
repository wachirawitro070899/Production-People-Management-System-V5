const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const {setup}=require('./app-pages.cjs');const app=await setup();try{
  const w=app.w;w.document.querySelector('#nav [data-page="sectionChart"]').click();await wait(200);
  const input=w.document.querySelector('#sectionSelect');input.focus();assert.equal(w.document.activeElement,input);
  w.document.querySelector('#nav [data-page="manpower"]').click();assert(w.document.querySelector('#manpowerPlanningPage'),'Navigation opens immediately even with a focused select');
  assert.equal(app.errors.length,0,app.errors.join('\n'));
 }finally{app.dom.window.close()}
 const dom=new JSDOM('<nav id="nav"><button data-page="manpower" class="active">Manpower</button></nav><main id="app">Loading</main>',{url:'https://ppms.test/',runScripts:'outside-only'}),w=dom.window;
 const people=Array.from({length:300},(_,i)=>({id:String(i),name:'Employee '+i,section:'Stamping Section',position:'Operator'}));
 const machines=Object.fromEntries(Array.from({length:36},(_,i)=>['m'+i,{name:'M'+i,section:'Stamping Section',assignments:{a:{employeeId:String(i),shift:'day'}}}]));
 let reads=0;w.PPMS_RUNTIME={factoryLayoutEmployees:()=>{reads++;return people},factoryLayoutIsAdmin:()=>true,organizationSections:()=>['Stamping Section']};w.PPMS_FIREBASE_CONFIG={databaseURL:'https://mock.test'};
 w.fetch=async()=>({ok:true,status:200,json:async()=>({machines})});
 w.document.querySelector('#nav').onclick=()=>{w.document.querySelector('#app').innerHTML=w.PPMS_MANPOWER.page();w.PPMS_MANPOWER.mount()};
 const started=Date.now();w.eval(fs.readFileSync('manpower-planning-v886.js','utf8'));await wait(30);
 assert(w.document.querySelector('#manpowerPlanningPage'),'Late module load recovers an already-selected loading page');assert.equal(w.document.querySelectorAll('.mp-machine').length,36);
 assert(reads<=3,'Roster is read a bounded number of times, not per employee/machine');
 assert.equal(w.document.querySelectorAll('[data-mp-assign] option').length,36,'Unopened selectors only create placeholder options');
 const select=w.document.querySelector('[data-mp-assign] select');select.focus();assert.equal(select.options.length,301);select.focus();assert.equal(select.options.length,301,'Options populate once');
 assert(select.options[1].textContent.includes('M0'),'Existing assignment appears in the employee choice');
 console.log('Passed focused-select navigation, late loading recovery and 300-person/36-machine rendering in '+(Date.now()-started)+'ms ('+reads+' roster reads).');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
