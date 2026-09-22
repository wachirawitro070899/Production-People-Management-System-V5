/* V778 - CSS-only separation. Never intercept or rebuild navigation clicks. */
(()=>{
  'use strict';
  const style=document.createElement('style');
  style.textContent=`
    #nav button[data-page="attendanceAdmin"]{
      background:#137a52;color:#fff;border-color:#0f6845;
      box-shadow:0 2px 7px #0f684533;margin-right:14px;
    }
    #nav button[data-page="attendanceAdmin"].active{
      background:#0b5f3d;color:#fff;outline:2px solid #8de0bd;
    }
    #nav button[data-page="dashboard"]{
      border-left:3px solid #6f8dac;margin-left:5px;
    }
  `;
  document.head.appendChild(style);
})();
