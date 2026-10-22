/* Shared position-based access: staff maintenance stays within the actor's Section. */
(()=>{'use strict';
 function level(position){const p=String(position||'').trim();if(/assistant\s+leader|ผู้ช่วยหัวหน้าทีม/i.test(p))return 0;if(/manager|director|ผู้จัดการ|ผู้อำนวยการ/i.test(p))return 4;if(/engineer|specialist|วิศวกร|ผู้เชี่ยวชาญ/i.test(p))return 3;if(/supervisor|\bsup\b|หัวหน้าแผนก|หัวหน้าฝ่าย|หัวหน้าส่วน/i.test(p))return 2;if(/\bleader\b|หัวหน้าทีม/i.test(p))return 1;return 0}
 const eligible=e=>level(e?.position)>0;
 const allSections=e=>level(e?.position)>=2;
 const key=value=>window.PPMSOrganizationScope?.sectionKey?.(value)||String(value||'').trim().toLowerCase();
 function sameSection(actor,target){if(!eligible(actor)||!actor?.section||!target?.section||key(actor.section)!==key(target.section))return false;const scope=window.PPMSOrganizationScope?.employeeScope;if(!scope)return String(actor.organizationDivision||'Production Division')===String(target.organizationDivision||'Production Division')&&String(actor.organizationPlant||'โรง 1')===String(target.organizationPlant||'โรง 1');const a=scope(actor),b=scope(target);return a.division===b.division&&a.plant===b.plant}
 window.PPMSSectionAccess={level,eligible,allSections,sameSection};
})();
