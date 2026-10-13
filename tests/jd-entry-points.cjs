const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('jd-manager-v837.js','utf8');
const people=['Manager','Engineer','Supervisor','Leader','Technician','Operator','Custom Position'].map((position,i)=>({id:String.fromCharCode(65+i),name:'Employee '+i,section:i%2?'CNC Section':'Stamping Section',position}));
const cache={ppms_employee_organization_v1:{A:{division:'Production Division',plant:'โรง 2'}},ppms_v3_deleted_employee_ids:[]};
function node(dataset={}){return {dataset,children:[],append(child){child.parent=this;this.children.push(child)},querySelector(){return this.children.find(b=>b.dataset.jdEmployeeId)},querySelectorAll(){return this.children.filter(b=>b.dataset.jdEmployeeId)},remove(){if(this.parent)this.parent.children=this.parent.children.filter(b=>b!==this)}}}
const orgCards=people.map(person=>{const card=node({edit:person.id});card.append(node({employeeEdit:'1'}));card.append(node({openJd:'1',jdEmployeeId:person.id}));return card});
const sectionCards=people.map(person=>{const card=node({edit:person.id});card.append(node({employeeEdit:'1'}));card.append(node({openJd:'1',jdEmployeeId:person.id}));return card});
const history=node({edit:'A'});history.append(node({employeeEdit:'1'}));history.append(node({openJd:'1',jdEmployeeId:'A'}));
const factory=node({edit:'A'}),formLabel=node(),formButton=node({openJd:'1'});formLabel.append(formButton);
const wallet=node({employeeId:'A'}),walletParent=node(),walletToolbar=node({jdCardToolbar:'1'});walletToolbar.append(node({openJd:'1',jdEmployeeId:'A'}));walletParent.append(walletToolbar);walletParent.append(wallet);
const calls=[],listeners={};
const ctx={ORG:'ppms_employee_organization_v1',read:(key,fallback)=>cache[key]||fallback,roster:()=>people,master:()=>({plants:['โรง 1']}),admin:()=>true,records:{},filters:null,viewer:id=>calls.push(['view',id]),editor:(id,scope)=>calls.push(['edit',scope.employeeId]),manager:()=>calls.push(['manager']),scope:()=>({division:'Production Division',plant:'โรง 1',employeeId:'A'}),alert:message=>calls.push(['alert',message]),document:{createElement:()=>node(),querySelectorAll:selector=>{
 if(selector.includes('.section-org-report [data-open-jd]'))return [...sectionCards,history].flatMap(card=>card.children.filter(button=>button.dataset.openJd)).concat(formLabel.children,walletParent.children.filter(item=>item.dataset.jdCardToolbar));
 if(selector.includes('.division-org:not(.employee-history-report)'))return [...orgCards,factory];
 throw Error('Unexpected selector: '+selector);
}},window:{addEventListener:(type,handler,capture)=>{assert.equal(capture,true);listeners[type]=handler}}};
vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('function employeeJDContext('),source.indexOf('function controls(')),ctx);
ctx.cardControls();ctx.cardControls();
for(const card of orgCards){assert.equal(card.children.length,2,'JD actions remain on main organization cards for every position');assert.equal(card.children[1].dataset.jdEmployeeId,card.dataset.edit);assert.equal(card.children[0].dataset.employeeEdit,'1','Employee editing remains available');assert.equal(card.dataset.edit,people[orgCards.indexOf(card)].id,'Employee card and ID are retained');}
for(const card of sectionCards){assert.equal(card.children.length,1,'Section charts remove JD actions for every position');assert.equal(card.children[0].dataset.employeeEdit,'1','Employee edit icon is retained')}
assert.equal(factory.children.length,1,'Factory overview retains one JD action');assert.equal(history.children.length,1,'Employee history does not expose JD editing');assert.equal(formLabel.children.length,0,'Employee form does not add a separate JD action');assert(!walletParent.children.includes(walletToolbar),'Legacy skill-card JD toolbar is removed');assert(walletParent.children.includes(wallet),'Skill card remains intact');
assert.equal(ctx.employeeJDContext('A').plant,'โรง 2');assert.equal(ctx.employeeJDContext('B').plant,'โรง 1');
vm.runInContext(source.slice(source.indexOf("window.addEventListener('click',e=>{\n const button=e.target.closest?.('[data-open-jd]')"),source.indexOf("window.addEventListener('afterprint'")),ctx);
function click(button){let stopped=false,prevented=false;listeners.click({target:{closest:()=>button},preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert(stopped&&prevented,'Must intercept before employee editor');}
click(orgCards[0].children[1]);click(factory.children[0]);assert.deepEqual(calls,[['edit','A'],['edit','A']]);
ctx.records.personalA={employeeId:'A'};click(orgCards[0].children[1]);click(factory.children[0]);assert.deepEqual(calls.slice(-2),[['view','personalA'],['view','personalA']],'Main and Factory charts open the same saved personal JD');
let stopped=false,prevented=false,keyboardClicks=0;listeners.keydown({key:'Enter',target:{closest:()=>({click(){keyboardClicks++}})},preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert(stopped&&prevented);assert.equal(keyboardClicks,1);
cache.ppms_v3_deleted_employee_ids=['B'];assert.equal(ctx.employeeJDContext('B'),null);ctx.openEmployeeJD('B');assert.equal(calls.at(-1)[0],'alert');
assert(source.includes('.ppms-jd-person-button,.ppms-jd-card-toolbar{display:none!important}'));
console.log('Passed: JD actions only on the main organization and Factory overview, no Section/history/skill-card/form JD actions, all employee cards and edit icons retained, stable repeat rendering, personal JD context, saved records, keyboard isolation, deleted-employee guard, print actions hidden.');
