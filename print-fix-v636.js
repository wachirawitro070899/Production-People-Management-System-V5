/* V636: reliable A4 duplex Skill Card printing */
(()=>{
  const PRINT_CLASS='print-skill-cards';
  const STYLE_ID='skillCardDuplexPrintStyleV636';

  function installPrintStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent=`
      @media print{
        @page{size:A4 portrait;margin:7mm}
        body.${PRINT_CLASS} main{padding:0!important;margin:0!important;max-width:none!important}
        body.${PRINT_CLASS} main>*:not(.wallet-duplex-print){display:none!important}
        body.${PRINT_CLASS} .wallet-duplex-print{display:block!important}
        body.${PRINT_CLASS} .wallet-print-page{
          page:auto!important;
          width:196mm!important;
          height:283mm!important;
          display:grid!important;
          grid-template-columns:85.6mm 85.6mm!important;
          grid-template-rows:repeat(5,53.98mm)!important;
          gap:3mm!important;
          align-content:start!important;
          justify-content:center!important;
          overflow:hidden!important;
          break-after:page!important;
          page-break-after:always!important;
        }
        body.${PRINT_CLASS} .wallet-print-page:last-child{
          break-after:auto!important;
          page-break-after:auto!important;
        }
      }`;
  }

  function waitForPrintImages(root,timeout=5000){
    const pending=[...root.querySelectorAll('img')].filter(img=>!img.complete);
    if(!pending.length)return Promise.resolve();
    return Promise.race([
      Promise.all(pending.map(img=>new Promise(resolve=>{
        img.addEventListener('load',resolve,{once:true});
        img.addEventListener('error',resolve,{once:true});
      }))),
      new Promise(resolve=>setTimeout(resolve,timeout))
    ]);
  }

  function cleanup(){
    document.body.classList.remove(PRINT_CLASS);
    window.removeEventListener('afterprint',cleanup);
  }

  document.addEventListener('click',async event=>{
    const button=event.target.closest('#doDuplexPrint');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(button.disabled)return;

    const sheet=document.querySelector('.wallet-duplex-print');
    const pages=sheet?.querySelectorAll('.wallet-print-page').length||0;
    if(!sheet||pages<2){
      alert('ไม่พบหน้าบัตรด้านหน้าและด้านหลัง กรุณาปิดแล้วเปิดหน้า Skill Card ใหม่');
      return;
    }

    button.disabled=true;
    button.textContent='กำลังเตรียมหน้าพิมพ์...';
    installPrintStyle();
    document.getElementById('dynamicPrintStyle')?.remove();
    document.body.classList.add(PRINT_CLASS);

    try{
      if(typeof closeModal==='function')closeModal();
      await waitForPrintImages(sheet);
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      window.addEventListener('afterprint',cleanup,{once:true});
      window.print();
      setTimeout(cleanup,30000);
    }catch(error){
      cleanup();
      console.error('Skill Card print failed',error);
      alert('เตรียมหน้าพิมพ์ไม่สำเร็จ: '+(error?.message||error));
    }
  },true);
})();
