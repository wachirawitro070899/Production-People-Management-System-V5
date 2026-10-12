const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('jd-manager-v837.js','utf8');
const people=[{id:'A',name:'Employee A',section:'Stamping Section',position:'Leader'},{id:'B',name:'Employee B',section:'Stamping Section',position:'Technician'}];
const cache={ppms_employee_organization_v1:{A:{division:'Production Division',plant:'โรง 2'}},ppms_v3_deleted_employee_ids:[]};
function node(dataset={}){return {dataset,children:[],append(child){this.children.push(child)},querySelector(){return this.children.find(b=>b.dataset.jdEmployeeId)},matches(){return Boolean(this.dataset.jdCardToolbar)}}}
const chart=node({edit:'A'}),factory=node({edit:'B'}),wallet=node({employeeId:'A'});
wallet.closest=()=>null;wallet.before=toolbar=>{wallet.previousElementSibling=toolbar};
const calls=[],listeners={};
const ctx={ORG:"ppms_employee_organization_v1",read:(key,fallback)=>cache[key]||fallback,roster:()=>people,master:()=>({plants:['โรง 1']}),admin:()=>true,records:{},filters:null,viewer:id=>calls.push(['view',id]),editor:(id,scope)=>calls.push(['edit',scope.employeeId]),manager:()=>calls.push(['manager']),scope:()=>({division:'Production Division',plant:'โรง 1'}),alert:message=>calls.push(['alert',message]),document:{createElement:()=>node(),querySelectorAll:selector=>selector.includes('wallet-card-sheet')?[wallet]:[chart,factory]},window:{addEventListener:(type,handler,capture)=>{assert.equal(capture,true);listeners[type]=handler}}};
ctx.operatorPosition=position=>/operator|^op(?:\b|\d)/i.test(String(position||''));
vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('function employeeJDContext('),source.indexOf('function controls(')),ctx);
ctx.cardControls();ctx.cardControls();assert.equal(chart.children.length,1);assert.equal(factory.children.length,1);assert.equal(wallet.previousElementSibling.children.length,1);
assert.equal(chart.children[0].dataset.jdEmployeeId,'A');assert.equal(factory.children[0].dataset.jdEmployeeId,'B');assert.equal(wallet.previousElementSibling.children[0].dataset.jdEmployeeId,'A');
assert.equal(ctx.employeeJDContext('A').plant,'โรง 2');assert.equal(ctx.employeeJDContext('B').plant,'โรง 1');
vm.runInContext(source.slice(source.indexOf("window.addEventListener('click',e=>{\n const button=e.target.closest?.('[data-open-jd]')"),source.indexOf("window.addEventListener('afterprint'")),ctx);
function click(button){let stopped=false,prevented=false;listeners.click({target:{closest:()=>button},preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert(stopped&&prevented,'Must intercept before employee editor');}
click(chart.children[0]);click(wallet.previousElementSibling.children[0]);assert.deepEqual(calls,[['edit','A'],['edit','A']]);
ctx.records.personalA={employeeId:'A'};click(chart.children[0]);click(wallet.previousElementSibling.children[0]);assert.deepEqual(calls.slice(-2),[['view','personalA'],['view','personalA']],'Both entry points open the same personal JD');
let stopped=false,prevented=false,keyboardClicks=0;listeners.keydown({key:'Enter',target:{closest:()=>({click(){keyboardClicks++}})},preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert(stopped&&prevented);assert.equal(keyboardClicks,1);
cache.ppms_v3_deleted_employee_ids=['B'];assert.equal(ctx.employeeJDContext('B'),null);ctx.openEmployeeJD('B');assert.equal(calls.at(-1)[0],'alert');
assert(source.includes('.ppms-jd-person-button,.ppms-jd-card-toolbar{display:none!important}'));
console.log('Passed: Organization and factory card buttons, skill-card entry, idempotent rendering, correct employee/plant selection, both routes create/view same personal JD, click and keyboard isolation from employee editor, deleted-employee guard, print actions hidden.');
