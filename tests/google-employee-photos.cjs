const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const dom=new JSDOM('<body></body>',{url:'https://example.test/',runScripts:'dangerously'}),w=dom.window;
try{
 w.eval(fs.readFileSync('employee-photos-v878.js','utf8'));const photos=w.PPMSEmployeePhotos,id='fixture_google_file_0123456789',direct='https://lh3.googleusercontent.com/d/'+id+'=w320';
 for(const value of ['https://drive.google.com/file/d/'+id+'/view?usp=sharing','https://drive.google.com/open?id='+id,'https://drive.google.com/thumbnail?id='+id+'&sz=w1000','=IMAGE("https://drive.google.com/uc?id='+id+'",1)','=HYPERLINK("https://drive.google.com/file/d/'+id+'/view","Photo")'])assert.equal(photos.variants(value)[0],direct);
 assert.equal(photos.variants('https://drive.google.com/file/d/'+id+'/view?resourcekey=key123')[0],direct+'?resourcekey=key123');
 assert.equal(photos.variants('https://photos.example.test/d/'+id)[0],'https://photos.example.test/d/'+id,'Other hosts retain their original URL');
 assert.equal(photos.variants('https://drive.google.com.evil.test/file/d/'+id)[0],'https://drive.google.com.evil.test/file/d/'+id,'Lookalike hosts are not treated as Google');
 const employee={id:'001',name:'MR. A <QA> "TEST"',photoUrl:'https://drive.google.com/thumbnail?id='+id+'&sz=w1000'};
 const imageDoc=new JSDOM('<body>'+photos.markup(employee)+'</body>',{url:'https://example.test/',runScripts:'dangerously'});
 try{const img=imageDoc.window.document.querySelector('img');assert.equal(img.src,direct);assert.equal(img.referrerPolicy||img.getAttribute('referrerpolicy'),'no-referrer');assert.equal(img.crossOrigin,'anonymous');assert.equal(img.alt,employee.name);img.dispatchEvent(new imageDoc.window.Event('error'));assert(img.src.includes('drive.google.com/thumbnail'));img.dispatchEvent(new imageDoc.window.Event('error'));img.dispatchEvent(new imageDoc.window.Event('error'));assert(imageDoc.window.document.querySelector('.avatar-fallback'),'Failure terminates at initials even in an isolated print window')}finally{imageDoc.window.close()}
 const data='data:image/png;base64,stored';assert.equal(photos.sources({...employee,photoData:data})[0],data,'Uploaded images retain priority');assert.equal(photos.sources({photo:' https://photo.test/legacy.png '})[0],'https://photo.test/legacy.png');
 console.log('PASS Drive share/open/thumbnail and Sheet IMAGE/HYPERLINK links, direct image delivery, resource keys, trusted hosts, uploaded photo priority, escaped names, referrer/CORS attributes, and self-contained print fallbacks.');
}finally{w.close()}
