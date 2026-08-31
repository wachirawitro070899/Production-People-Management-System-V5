/* V637: lightweight isolated A4 duplex Skill Card printing */
(()=>{
  function waitForImages(root,timeout=8000){
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

  function copyCanvasImages(source,clone){
    const sourceCanvases=[...source.querySelectorAll('canvas')];
    const cloneCanvases=[...clone.querySelectorAll('canvas')];
    sourceCanvases.forEach((canvas,index)=>{
      const target=cloneCanvases[index];
      if(!target)return;
      try{
        const img=clone.ownerDocument.createElement('img');
        img.src=canvas.toDataURL('image/png');
        img.alt='QR Code';
        target.replaceWith(img);
      }catch(error){
        console.warn('QR copy skipped',error);
      }
    });
  }

  function printDocumentCss(){
    return `
      @page{size:A4 portrait;margin:7mm}
      html,body{margin:0!important;padding:0!important;background:#fff!important}
      body{font-family:Arial,Tahoma,sans-serif;color:#082d52}
      header,nav,.no-print,.modal,.statusbar{display:none!important}
      .wallet-duplex-print{display:block!important}
      .wallet-print-page{
        width:196mm!important;
        height:283mm!important;
        box-sizing:border-box!important;
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
      .wallet-print-page:last-child{
        break-after:auto!important;
        page-break-after:auto!important;
      }
      .wallet-print-page .wallet-card{
        width:85.6mm!important;
        height:53.98mm!important;
        margin:0!important;
        box-shadow:none!important;
        border-radius:0!important;
        break-inside:avoid!important;
        page-break-after:auto!important;
        -webkit-print-color-adjust:exact!important;
        print-color-adjust:exact!important;
      }
      .wallet-print-placeholder{width:85.6mm!important;height:53.98mm!important}
    `;
  }

  document.addEventListener('click',async event=>{
    const button=event.target.closest('#doDuplexPrint');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(button.disabled)return;

    const source=document.querySelector('.wallet-duplex-print');
    const pages=source?.querySelectorAll('.wallet-print-page').length||0;
    if(!source||pages<2){
      alert('ไม่พบหน้าบัตรด้านหน้าและด้านหลัง กรุณาปิดแล้วเปิดหน้า Skill Card ใหม่');
      return;
    }

    const printWindow=window.open('about:blank','ppmsSkillCardPrint');
    if(!printWindow){
      alert('เบราว์เซอร์บล็อกหน้าพิมพ์ กรุณาอนุญาต Pop-ups สำหรับเว็บไซต์นี้แล้วลองใหม่');
      return;
    }

    button.disabled=true;
    button.textContent='กำลังเตรียมหน้าพิมพ์...';

    try{
      printWindow.document.open();
      printWindow.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>Employee Skill Cards - A4 Duplex</title></head><body><div id="printRoot">กำลังเตรียมหน้าพิมพ์...</div></body></html>');
      printWindow.document.close();

      const link=printWindow.document.createElement('link');
      link.rel='stylesheet';
      link.href=new URL('app.css?v=629',location.href).href;
      printWindow.document.head.appendChild(link);

      const style=printWindow.document.createElement('style');
      style.textContent=printDocumentCss();
      printWindow.document.head.appendChild(style);

      const clone=source.cloneNode(true);
      copyCanvasImages(source,clone);
      const root=printWindow.document.getElementById('printRoot');
      root.replaceWith(clone);

      await Promise.race([
        new Promise(resolve=>{
          if(link.sheet)return resolve();
          link.addEventListener('load',resolve,{once:true});
          link.addEventListener('error',resolve,{once:true});
        }),
        new Promise(resolve=>setTimeout(resolve,3000))
      ]);
      await waitForImages(clone);
      await new Promise(resolve=>printWindow.requestAnimationFrame(()=>printWindow.requestAnimationFrame(resolve)));

      if(typeof closeModal==='function')closeModal();
      printWindow.focus();
      printWindow.addEventListener('afterprint',()=>setTimeout(()=>printWindow.close(),300),{once:true});
      printWindow.print();
    }catch(error){
      printWindow.close();
      console.error('Skill Card print failed',error);
      alert('เตรียมหน้าพิมพ์ไม่สำเร็จ: '+(error?.message||error));
    }finally{
      if(document.body.contains(button)){
        button.disabled=false;
        button.textContent='เปิดหน้าพิมพ์หน้าหลัง';
      }
    }
  },true);
})();
