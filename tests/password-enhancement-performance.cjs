const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dom=new JSDOM('<html><body><main>'+Array.from({length:1200},()=>'<p>ข้อมูล</p>').join('')+'<div id="status"></div></main><div id="modal"></div></body></html>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
 try{
  w.eval(fs.readFileSync('admin-device-lock-v768.js','utf8'));await wait(20);
  let fullScans=0;const query=w.document.querySelectorAll.bind(w.document);w.document.querySelectorAll=function(selector){if(selector.includes('password')||selector.includes('resetAdminPasswordForm'))fullScans++;return query(selector)};
  for(let i=0;i<5;i++){w.document.getElementById('status').textContent='อัปเดต '+i;await wait(10)}
  assert.equal(fullScans,0,'Status changes must not scan all password/reset forms');
  const host=w.document.getElementById('modal');host.innerHTML='<form id="login"><input type="password" name="password"></form>';await wait(20);
  const input=host.querySelector('input');assert.equal(input.dataset.passwordToggleReady,'1');const button=host.querySelector('button');assert(button,'New login field gets its visibility control');button.click();assert.equal(input.type,'text');button.click();assert.equal(input.type,'password');
  host.insertAdjacentHTML('beforeend','<form id="resetAdminPasswordForm"></form>');await wait(20);assert(host.querySelector('#resetAdminPasswordFormV775'),'Inserted reset form gets its submission handler');assert.equal(fullScans,0,'New controls are enhanced only within their inserted subtree');
  console.log('PASS password controls and reset forms enhance dynamically without rescanning the document on status updates.');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exit(1)});
