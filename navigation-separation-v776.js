/* V776 - Visually separate Attendance from Organization pages in the existing website. */
(()=>{
  'use strict';
  const style=document.createElement('style');
  style.textContent=`
    #nav .nav-system-label{display:flex;align-items:center;padding:0 7px;color:#52677d;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px}
    #nav .nav-system-divider{width:1px;align-self:stretch;min-height:34px;margin:0 5px;background:#b8cadb}
    #nav button[data-page="attendanceAdmin"]{background:#137a52;color:#fff;border-color:#0f6845;box-shadow:0 2px 7px #0f684533}
    #nav button[data-page="attendanceAdmin"].active{background:#0b5f3d;color:#fff;outline:2px solid #8de0bd}
    #nav button[data-page="dashboard"]{border-color:#6f8dac}
    @media(max-width:800px){#nav .nav-system-label{width:100%;padding:4px 2px 0}#nav .nav-system-divider{display:none}}
  `;
  document.head.appendChild(style);

  function separateNavigation(){
    const nav=document.getElementById('nav');
    if(!nav||nav.dataset.separated==='1')return;
    const attendance=nav.querySelector('button[data-page="attendanceAdmin"]');
    const organization=nav.querySelector('button[data-page="dashboard"]');
    if(!attendance||!organization)return;
    attendance.textContent='Attendance System / ระบบเช็คชื่อ';
    organization.textContent='Division Organization Chart';
    const attendanceLabel=document.createElement('span');
    attendanceLabel.className='nav-system-label';attendanceLabel.textContent='Attendance';
    nav.insertBefore(attendanceLabel,attendance);
    const divider=document.createElement('span');
    divider.className='nav-system-divider';divider.setAttribute('aria-hidden','true');
    nav.insertBefore(divider,organization);
    const organizationLabel=document.createElement('span');
    organizationLabel.className='nav-system-label';organizationLabel.textContent='Organization';
    nav.insertBefore(organizationLabel,organization);
    nav.dataset.separated='1';
  }

  separateNavigation();
  new MutationObserver(()=>{
    const nav=document.getElementById('nav');
    if(nav&&nav.dataset.separated==='1'&&!nav.querySelector('.nav-system-label'))delete nav.dataset.separated;
    separateNavigation();
  }).observe(document.getElementById('nav')||document.body,{childList:true,subtree:true});
})();
