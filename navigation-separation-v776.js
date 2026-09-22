/* V782 - Keep clean chart merged after asynchronous employee data refresh. */
(()=>{
  'use strict';
  const CLEAN_PAGE='organizationClean';
  let openingClean=false;
  let cleanRefreshQueued=false;
  const style=document.createElement('style');
  style.textContent=`
    #nav button[data-page="attendanceAdmin"]{background:#137a52;color:#fff;border-color:#0f6845;box-shadow:0 2px 7px #0f684533;margin-right:14px}
    #nav button[data-page="attendanceAdmin"].active{background:#0b5f3d;color:#fff;outline:2px solid #8de0bd}
    #nav button[data-page="dashboard"]{border-left:3px solid #6f8dac;margin-left:5px}
    #nav button[data-page="organizationClean"]{background:#fff;color:#174a78;border-color:#9db9d3}
    #nav button[data-page="organizationClean"].active{background:#174f82;color:#fff;border-color:#174f82;box-shadow:0 2px 7px #174f8233}
    body.org-clean-view .org-current-shift-banner,
    body.org-clean-view .org-attendance-legend,
    body.org-clean-view .org-attendance-badge,
    body.org-clean-view .employee-attendance-mini,
    body.org-clean-view .org-shift-title,
    body.org-clean-view .org-shift-empty,
    body.org-clean-view .division-section-head small,
    body.org-clean-view #app>.cards>.card:nth-child(3){display:none!important}
    body.org-clean-view .org-live-person,
    body.org-clean-view .org-live-working,
    body.org-clean-view .org-live-leave,
    body.org-clean-view .org-live-absent,
    body.org-clean-view .org-live-waiting,
    body.org-clean-view .org-live-offshift{padding-top:8px!important;border:1px solid #ccd8e4!important;background:#fff!important;box-shadow:0 3px 10px rgba(18,51,84,.08)!important;animation:none!important}
    body.org-clean-view .org-shift-group,
    body.org-clean-view .org-shift-active,
    body.org-clean-view .org-shift-secondary{background:transparent!important;border-top:0!important;opacity:1!important}
    body.org-clean-view .org-shift-secondary .person{transform:none!important}
    body.org-clean-view .person.manager{border-color:#174f82!important;background:#edf6ff!important;box-shadow:inset 0 5px 0 #174f82,0 3px 10px rgba(18,51,84,.08)!important}
    body.org-clean-view .person.engineer{border-color:#2563eb!important;background:#eff6ff!important;box-shadow:inset 0 5px 0 #2563eb,0 3px 10px rgba(18,51,84,.08)!important}
    body.org-clean-view .person.supervisor{border-color:#7c3aed!important;background:#f5f3ff!important;box-shadow:inset 0 5px 0 #7c3aed,0 3px 10px rgba(18,51,84,.08)!important}
    body.org-clean-view .person.leader{border-color:#ea580c!important;background:#fff7ed!important;box-shadow:inset 0 5px 0 #ea580c,0 3px 10px rgba(18,51,84,.08)!important}
    body.org-clean-view .person.technician{border-color:#0891b2!important;background:#ecfeff!important;box-shadow:inset 0 5px 0 #0891b2,0 3px 10px rgba(18,51,84,.08)!important}
    body.org-clean-view .person.operator{border-color:#16a34a!important;background:#f0fdf4!important;box-shadow:inset 0 5px 0 #16a34a,0 3px 10px rgba(18,51,84,.08)!important}
    body.org-clean-view .person.other{border-color:#64748b!important;background:#f8fafc!important;box-shadow:inset 0 5px 0 #64748b,0 3px 10px rgba(18,51,84,.08)!important}
    .org-position-legend{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 14px;margin:0 0 14px;padding:10px 14px;background:#fff;border:1px solid #d7e3ef;border-radius:12px;box-shadow:0 3px 14px #16436d10;font-size:11px;font-weight:700}
    .org-position-legend span{display:flex;align-items:center;gap:6px}.org-position-legend i{width:12px;height:12px;border-radius:3px;display:inline-block}
    .org-position-legend .manager{background:#174f82}.org-position-legend .engineer{background:#2563eb}.org-position-legend .supervisor{background:#7c3aed}.org-position-legend .leader{background:#ea580c}.org-position-legend .technician{background:#0891b2}.org-position-legend .operator{background:#16a34a}.org-position-legend .other{background:#64748b}
    @media print{.org-position-legend{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;
  document.head.appendChild(style);

  function addCleanButton(){
    const nav=document.querySelector('#nav');
    const dashboard=nav?.querySelector('button[data-page="dashboard"]');
    if(!nav||!dashboard||nav.querySelector(`button[data-page="${CLEAN_PAGE}"]`))return;
    const button=document.createElement('button');
    button.type='button';
    button.dataset.page=CLEAN_PAGE;
    button.textContent='Organization Chart / ผังองค์กร';
    dashboard.insertAdjacentElement('afterend',button);
    if(document.body.classList.contains('org-clean-view'))button.classList.add('active');
  }

  function decorateCleanPage(){
    document.body.classList.add('org-clean-view');
    const title=document.querySelector('#app>.page-head h2');
    const subtitle=document.querySelector('#app>.page-head p, #app>.page-head small');
    if(title)title.textContent='Production Division Organization Chart';
    if(subtitle)subtitle.textContent='โครงสร้างองค์กร · Organization only';
    document.querySelectorAll('.division-section').forEach(section=>{
      if(section.dataset.cleanMerged==='1')return;
      const orderedLevels=[];
      ['supervisor','leader','engineer','technician','operator','other'].forEach(rank=>{
        const levels=[...section.querySelectorAll(`.rank-level-${rank}`)];
        if(!levels.length)return;
        const primary=levels.shift();
        const people=primary.querySelector('.people');
        primary.remove();
        levels.forEach(level=>{
          level.querySelectorAll('.person').forEach(person=>people?.appendChild(person));
        });
        orderedLevels.push(primary);
      });
      section.querySelectorAll('.org-fixed-leadership,.org-shift-group').forEach(group=>group.remove());
      orderedLevels.forEach(level=>section.appendChild(level));
      section.dataset.cleanMerged='1';
    });
    if(!document.querySelector('.org-position-legend')){
      const legend=document.createElement('div');
      legend.className='org-position-legend';
      legend.innerHTML='<span><i class="manager"></i>Manager</span><span><i class="engineer"></i>Engineer</span><span><i class="supervisor"></i>Supervisor</span><span><i class="leader"></i>Leader</span><span><i class="technician"></i>Technician</span><span><i class="operator"></i>Operator</span><span><i class="other"></i>Other</span>';
      document.querySelector('#app>.cards')?.insertAdjacentElement('beforebegin',legend);
    }
    addCleanButton();
    document.querySelector('#nav button[data-page="dashboard"]')?.classList.remove('active');
    document.querySelector(`#nav button[data-page="${CLEAN_PAGE}"]`)?.classList.add('active');
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('#nav button[data-page]');
    if(!button)return;
    if(button.dataset.page===CLEAN_PAGE){
      event.preventDefault();
      event.stopImmediatePropagation();
      openingClean=true;
      const dashboard=document.querySelector('#nav button[data-page="dashboard"]');
      if(dashboard){dashboard.click();decorateCleanPage()}
      openingClean=false;
      return;
    }
    if(!openingClean)document.body.classList.remove('org-clean-view');
    setTimeout(addCleanButton,0);
  },true);

  addCleanButton();

  const app=document.querySelector('#app');
  if(app){
    new MutationObserver(()=>{
      if(!document.body.classList.contains('org-clean-view')||cleanRefreshQueued)return;
      if(!app.querySelector('.division-section:not([data-clean-merged="1"])'))return;
      cleanRefreshQueued=true;
      requestAnimationFrame(()=>{
        cleanRefreshQueued=false;
        if(document.body.classList.contains('org-clean-view'))decorateCleanPage();
      });
    }).observe(app,{childList:true,subtree:true});
  }
})();
