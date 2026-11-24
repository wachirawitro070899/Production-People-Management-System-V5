const assert=require('node:assert/strict'),{setup}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const records=new Map();let writes=0;
 const fixture=await setup(true,'index.html',{beforeScripts(w){
  const fallback=w.fetch;w.fetch=async(url,options={})=>{
   const path=new URL(String(url)).pathname.slice(1).replace(/\.json$/,'');
   if(path.startsWith('ppmsTrainingLessonDecks/')){
    if(options.method&&options.method!=='GET')writes++;
    return {ok:true,status:200,headers:{get:()=> '"legacy"'},json:async()=>records.get(path)||null};
   }
   return fallback(url,options);
  };
 }}),w=fixture.w;
 try{
  const api=w.PPMSNewEmployeeCourse,scope={division:'Production Division',plant:'โรง 1'};
  const examples={
   'Stamping Section':'Crack', 'Welding Section':'Missing Weld', 'CNC Section':'Tool Mark',
   'Tapping Section':'Go / No-Go', 'Bending Section':'มุมพับ', 'Sorting 12 Section':'Rust',
   'Die Casting Section':'Short Shot', 'Aluminum smelting Section':'วัตถุดิบชื้น',
   'Die-Casting Mold Maintenance Section':'Punch / Die',
   'Polishing/Shot Blasting/X-Ray Section':'เจียรกินเนื้อ',
   'Machine Maintenance Section':'สายไฟชำรุด', 'Warehouse Section':'บรรจุภัณฑ์ชำรุด',
   'Quality Section':'ผลทดสอบ', 'Unlisted Process Section':'ผลลัพธ์ไม่ตรง WI'
  };
  for(const [section,example] of Object.entries(examples)){
   const input={section,year:2026,scope,count:40};
   const base=api.buildBase(input),pages=base.deck.pages.filter(page=>page.topicKey);
   assert.equal(pages.length,2);assert(base.deck.pages.length<=25,section);
   assert(pages[0].points.join(' ').includes(example),section+' gets its own defect examples');
   assert(pages[1].points.join(' ').includes('แยกกัก'));assert(pages[1].points.join(' ').includes('ห้ามปรับ Parameter'));
   assert(pages[0].callout.includes('เกณฑ์ตัดสิน'));
   const legacy=base.deck.pages.filter(page=>!page.topicKey).map(page=>JSON.parse(JSON.stringify(page)));
   legacy[1].title='หัวข้อที่ผู้สอนแก้ไข';legacy[1].points[0]='เนื้อหาเฉพาะที่เคยบันทึก';
   legacy[1].image='data:image/png;base64,AAAA';legacy.at(-2).points[0]='OJT ที่ปรับไว้';
   const record={topic:base.deck.source.topic,revision:'legacy',pages:legacy};
   const path=w.PPMSTrainingLessonEditor.identity(base.input);records.set(path,record);
   const before=JSON.stringify(record),course=await api.prepare(input,{force:true});
   assert.equal(JSON.stringify(record),before,'Reading never writes/mutates an existing course');
   assert.equal(course.deck.pages.length,base.deck.pages.length);
   assert.equal(course.deck.pages[1].title,legacy[1].title);assert.equal(course.deck.pages[1].image,legacy[1].image);
   assert.equal(course.deck.pages.at(-2).points[0],'OJT ที่ปรับไว้');
   for(const page of pages){
    const topic=course.topics.find(topic=>topic.index===page.topicIndex);
    assert(topic.facts.includes(page.points[0]));
    const questions=api.questions(input).filter(question=>question.trainingTopicIndex===topic.index);
    assert(questions.length,'New observation topics are included in the existing exam');
    for(const question of questions)assert(topic.facts.includes(question.options[question.correct]));
   }
   const current=w.PPMSTrainingLessonEditor.sanitizePages(course.deck.pages,base.deck.pages);
   assert.equal(current.find(page=>page.topicKey==='process-defects').points[0],pages[0].points[0]);
   assert.throws(()=>w.PPMSTrainingLessonEditor.sanitizePages(legacy.slice(1),base.deck.pages));
  }
  // The slide viewer/editor also loads the older saved course through its own reader.
  const input={section:'Welding Section',year:2026,scope};const view=await api.open(input);
  await wait(150);assert.equal(view.deck.pages[1].points[0],'เนื้อหาเฉพาะที่เคยบันทึก');
  assert.equal(view.deck.pages.filter(page=>page.topicKey).length,2);view.close();
  assert.equal(writes,0);assert.deepEqual(fixture.errors,[]);
  console.log('PASS process-specific defects/abnormalities, slide-sourced exam coverage, legacy edited course/image preservation, viewer migration and read-only loading.');
 }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(250);w.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
