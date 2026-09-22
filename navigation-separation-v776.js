/* V779 - Separate attendance-aware and clean organization chart pages. */
(()=>{
  'use strict';
  const CLEAN_PAGE='organizationClean';
  let openingClean=false;
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
})();
