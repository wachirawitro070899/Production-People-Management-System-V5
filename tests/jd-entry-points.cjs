const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('jd-manager-v837.js','utf8');
const people=['Manager','Engineer','Supervisor','Leader','Technician','Operator','Custom Position'].map((position,i)=>({id:String.fromCharCode(65+i),name:'Employee '+i,section:i%2?'CNC Section':'Stamping Section',position}));
const cache={ppms_employee_organization_v1:{A:{division:'Production Division',plant:'โรง 2'}},ppms_v3_deleted_employee_ids:[]};
function node(dataset={}){return {dataset,children:[],append(child){child.parent=this;this.children.push(child)},querySelector(){return this.children.find(b=>b.dataset.jdEmployeeId)},querySelectorAll(){return this.children.filter(b=>b.dataset.jdEmployeeId)},remove(){this.parent.children=this.parent.children.filter(b=>b!==this)},closest(){return this.sectionChart?{}:null},matches(){return Boolean(this.dataset.jdCardToolbar)}}}
const orgCards=people.map(person=>{const card=node({edit:person.id});card.append(node({employeeEdit:'1'}));card.append(node({openJd:'1',jdEmployeeId:person.id}));return card}),wallet=node({employeeId:'A'}),formButton=node({openJd:'1'});
wallet.closest=()=>null;wallet.before=toolbar=>{wallet.previousElementSibling=toolbar};
const sectionCards=people.map(person=>{const card=node({edit:person.id});card.sectionChart=true;return card});
const calls=[],listeners={};
const ctx={ORG:"ppms_employee_organization_v1",read:(key,fallback)=>cache[key]||fallback,roster:()=>people,master:()=>({plants:['โรง 1']}),admin:()=>true,records:{},filters:null,viewer:id=>calls.push(['view',id]),editor:(id,scope)=>calls.push(['edit',scope.employeeId]),manager:()=>calls.push(['manager']),scope:()=>({division:'Production Division',plant:'โรง 1',employeeId:'A'}),alert:message=>calls.push(['alert',message]),document:{createElement:()=>node(),querySelectorAll:selector=>selector.includes('wallet-card-sheet')?[wallet]:[...orgCards,...sectionCards]},window:{addEventListener:(type,handler,capture)=>{assert.equal(capture,true);listeners[type]=handler}}};
vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('function employeeJDContext('),source.indexOf('function controls(')),ctx);
ctx.cardControls();ctx.cardControls();
for(const card of orgCards){assert.equal(card.children.length,1,'Only JD actions are removed for every position');assert.equal(card.children[0].dataset.employeeEdit,'1','Employee editing remains available');assert.equal(card.dataset.edit,people[orgCards.indexOf(card)].id,'Employee card and ID are retained');}
for(const card of sectionCards){assert.equal(card.children.length,1,'Every Section-chart employee gets exactly one JD button');assert.equal(card.children[0].dataset.jdEmployeeId,card.dataset.edit)}
assert.equal(wallet.previousElementSibling.children.length,1);assert.equal(wallet.previousElementSibling.children[0].dataset.jdEmployeeId,'A');
assert.equal(ctx.employeeJDContext('A').plant,'โรง 2');assert.equal(ctx.employeeJDContext('B').plant,'โรง 1');
vm.runInContext(source.slice(source.indexOf("window.addEventListener('click',e=>{\n const button=e.target.closest?.('[data-open-jd]')"),source.indexOf("window.addEventListener('afterprint'")),ctx);
function click(button){let stopped=false,prevented=false;listeners.click({target:{closest:()=>button},preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert(stopped&&prevented,'Must intercept before employee editor');}
click(formButton);click(wallet.previousElementSibling.children[0]);assert.deepEqual(calls,[['edit','A'],['edit','A']]);
ctx.records.personalA={employeeId:'A'};click(formButton);click(wallet.previousElementSibling.children[0]);assert.deepEqual(calls.slice(-2),[['view','personalA'],['view','personalA']],'Employee editor and skill card open the same personal JD');
let stopped=false,prevented=false,keyboardClicks=0;listeners.keydown({key:'Enter',target:{closest:()=>({click(){keyboardClicks++}})},preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert(stopped&&prevented);assert.equal(keyboardClicks,1);
cache.ppms_v3_deleted_employee_ids=['B'];assert.equal(ctx.employeeJDContext('B'),null);ctx.openEmployeeJD('B');assert.equal(calls.at(-1)[0],'alert');
assert(source.includes('.ppms-jd-person-button,.ppms-jd-card-toolbar{display:none!important}'));
console.log('Passed: JD actions scoped to Section-chart employee cards for all positions, overall-chart cards retained, idempotent rendering, skill-card and employee-editor JD entry, correct employee/plant selection, click and keyboard isolation, deleted-employee guard, print actions hidden.');
