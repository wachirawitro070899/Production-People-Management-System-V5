// Show the same four assessment levels in the matrix and its printed/PDF report.
(()=>{'use strict';
 const levels=[
  [1,'Basic Knowledge','มีความรู้พื้นฐาน ต้องได้รับการสอนและควบคุมอย่างใกล้ชิด','#fee2e2'],
  [2,'Basic Operation','ปฏิบัติงานพื้นฐานได้ แต่ยังต้องได้รับคำแนะนำหรือการตรวจสอบ','#fef3c7'],
  [3,'Independent Operation','ปฏิบัติงานได้ด้วยตนเองตามมาตรฐาน','#d1fae5'],
  [4,'Advanced Skill / Trainer','มีความชำนาญ ทำงานได้เอง แก้ไขปัญหาและฝึกสอนผู้อื่นได้ (ระดับสูงสุด)','#dbeafe']
 ];
 const style=document.createElement('style');
 style.textContent='.matrix-proficiency{margin:16px 0;padding:12px 14px;border:1px solid #adc5df;border-radius:8px;color:#123d66;background:#fff;break-inside:avoid;page-break-inside:avoid}.matrix-proficiency h3{font-size:14px;margin:0 0 10px}.matrix-score-note{font-size:12px;margin:0 0 10px}.matrix-proficiency-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.matrix-proficiency-item{padding:10px;border:1px solid #d4deeb;border-top:4px solid var(--level-color);border-radius:6px;line-height:1.45}.matrix-proficiency-item b{display:block;font-size:13px}.matrix-proficiency-item strong{display:block;font-size:11px;margin:4px 0}.matrix-proficiency-item p{font-size:12px;margin:0}@media screen and (max-width:800px){.matrix-proficiency-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media screen and (max-width:450px){.matrix-proficiency-grid{grid-template-columns:1fr}}@media print{.matrix-proficiency{margin:8px 0;padding:8px;border-radius:0}.matrix-proficiency-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.matrix-proficiency-item{padding:6px}.matrix-proficiency-item p{font-size:9px}.matrix-proficiency-item b,.matrix-proficiency-item strong{font-size:10px}}';
 document.head.append(style);
 function mount(){
  const report=document.querySelector('#app .matrix-report');
  if(!report||report.querySelector('.matrix-proficiency'))return;
  const topicCount=report.querySelectorAll('.skill-matrix-table thead tr:last-child th').length-6;
  if(topicCount<1||!window.PPMS_RUNTIME?.skillScoreRanges)return;
  const ranges=window.PPMS_RUNTIME.skillScoreRanges(topicCount);
  const legend=document.createElement('section');legend.className='matrix-proficiency';
  legend.setAttribute('aria-label','ระดับความเชี่ยวชาญ 1–4');
  legend.innerHTML='<h3>ระดับความเชี่ยวชาญ / Skill Proficiency Levels</h3><p class="matrix-score-note">'+topicCount+' หัวข้อ · คะแนนรวมเต็ม '+(topicCount*4)+' คะแนน / Maximum score '+(topicCount*4)+'</p><p class="matrix-score-note"><b>อ้างอิงการสอบปรับระดับ:</b> สอบผ่านตั้งแต่ 80% ปรับขึ้นครั้งละ 1 ระดับ เฉพาะหัวข้อที่สอบปรับระดับ สูงสุด Level 4 โดยเลือกหัวข้อระดับต่ำสุดก่อน ครั้งละไม่เกิน 3 หัวข้อ · ระดับในตารางใช้ค่าล่าสุดที่บันทึกไว้ (รวมการประเมิน Baseline โดยผู้ดูแล) คะแนนรวมเป็นผลรวมระดับของทุกหัวข้อ ไม่ใช่เปอร์เซ็นต์คะแนนสอบ</p><div class="matrix-proficiency-grid">'+levels.map(([level,en,th,color])=>`<div class="matrix-proficiency-item" style="--level-color:${color}"><b>Level ${level} · ${ranges[level-1].min}–${ranges[level-1].max} คะแนน</b><strong>${en}</strong><p>${th}</p><p><b>${level===1?'ระดับเริ่มต้น / ผลประเมิน Baseline':'คะแนนสอบปรับเป็น Level '+level+': ตั้งแต่ 80%'}</b></p></div>`).join('')+'</div>';
  report.insertBefore(legend,report.querySelector('.matrix-approval'));
 }
 const app=document.getElementById('app');if(app)new MutationObserver(mount).observe(app,{childList:true,subtree:true});
 mount();
})();

