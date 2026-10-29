const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function extract(file,name,next){const source=fs.readFileSync(file,'utf8'),start=source.indexOf('async function '+name+'(');assert(start>=0);return source.slice(start,source.indexOf(next,start))}
(async()=>{
 for(const [file,name,code]of [
  ['manpower-planning-v886.js','request',extract('manpower-planning-v886.js','request','\n function remember')],
  ['factory-layout-v808.js','request',extract('factory-layout-v808.js','request','\n  function remember')],
  ['admin-device-lock-v768.js','rest',extract('admin-device-lock-v768.js','rest','\n\n  function normalize')],
  ['app-v588.js','adminAccountsRequest',extract('app-v588.js','adminAccountsRequest','\n\nfunction isUserManagementOwner')]
 ]){
  let aborted=false;
  const c={AbortController,Error,clearTimeout,setTimeout:fn=>setTimeout(fn,20),PATH:'layout',base:()=> 'https://database.test',baseUrl:()=> 'https://database.test',window:{PPMS_FIREBASE_CONFIG:{databaseURL:'https://database.test'}},fetch:async(url,{signal})=>({ok:true,status:200,headers:{get:()=>null},json:()=>new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>{aborted=true;reject(Object.assign(Error('aborted body'),{name:'AbortError'}))},{once:true})})})};
  vm.createContext(c);vm.runInContext(code,c);await assert.rejects(c[name]('test'));assert(aborted,file+' must keep its deadline active after headers arrive');console.log('PASS body download timeout:',file);
 }
})().catch(error=>{console.error(error);process.exitCode=1});
