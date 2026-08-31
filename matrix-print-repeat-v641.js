/* V643: build explicit balanced Skill Matrix pages before printing */
(()=>{
  const PAGE_CLASS='matrix-explicit-print-pages';

  function cleanup(){
    document.querySelectorAll('.'+PAGE_CLASS).forEach(node=>node.remove());
    document.body.classList.remove('matrix-explicit-print-active');
  }

  function buildPage(report,rows,columnHeader,pageNumber,totalPages){
    const page=document.createElement('section');
    page.className='matrix-explicit-print-page';

    const header=report.querySelector(':scope > .matrix-print-header');
    const legend=report.querySelector(':scope > .skill-legend');
    const sourceTable=report.querySelector('.skill-matrix-table');
    const criteria=report.querySelector(':scope > .criteria-grid');
    const signatures=report.querySelector(':scope > .signature-row');

    if(header){
      const headerClone=header.cloneNode(true);
      const effectiveDate=new Intl.DateTimeFormat('en-CA',{
        timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'
      }).format(new Date());
      const docBox=headerClone.querySelector('.doc-box,.matrix-print-doc');
      if(docBox){
        const dateRow=document.createElement('div');
        dateRow.className='matrix-effective-date-print';
        dateRow.innerHTML='<b>วันที่เริ่มใช้ / Effective Date:</b> '+effectiveDate;
        docBox.appendChild(dateRow);
      }
      page.appendChild(headerClone);
    }
    if(legend)page.appendChild(legend.cloneNode(true));

    const tableWrap=document.createElement('div');
    tableWrap.className='table-wrap skill-table-wrap';
    const table=sourceTable.cloneNode(false);
    table.className=sourceTable.className+' matrix-explicit-table';

    const thead=document.createElement('thead');
    thead.appendChild(columnHeader.cloneNode(true));
    table.appendChild(thead);

    const tbody=document.createElement('tbody');
    rows.forEach(row=>tbody.appendChild(row.cloneNode(true)));
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    page.appendChild(tableWrap);

    if(criteria)page.appendChild(criteria.cloneNode(true));
    if(signatures)page.appendChild(signatures.cloneNode(true));

    const marker=document.createElement('div');
    marker.className='matrix-print-page-number';
    marker.textContent='Page '+pageNumber+' / '+totalPages;
    page.appendChild(marker);
    return page;
  }

  function prepare(){
    cleanup();
    if(!document.body.classList.contains('print-matrix'))return;

    const report=document.querySelector('.matrix-report');
    const table=report?.querySelector('.skill-matrix-table');
    const columnHeader=[...(table?.tHead?.rows||[])].find(row=>!row.classList.contains('matrix-repeat-header-row'));
    const rows=[...(table?.tBodies?.[0]?.rows||[])];
    if(!report||!table||!columnHeader||!rows.length)return;

    const perPage=14;
    const chunks=[];
    for(let index=0;index<rows.length;index+=perPage)chunks.push(rows.slice(index,index+perPage));

    const pages=document.createElement('div');
    pages.className=PAGE_CLASS;
    chunks.forEach((chunk,index)=>pages.appendChild(buildPage(report,chunk,columnHeader,index+1,chunks.length)));
    report.insertAdjacentElement('beforebegin',pages);
    document.body.classList.add('matrix-explicit-print-active');
  }

  const style=document.createElement('style');
  style.textContent=`
    .${PAGE_CLASS}{display:none}
    @media print{
      body.matrix-explicit-print-active .matrix-report{display:none!important}
      body.print-matrix.matrix-explicit-print-active main>.${PAGE_CLASS}{display:block!important;visibility:visible!important}
      body.matrix-explicit-print-active .matrix-explicit-print-page{
        display:block!important;
        width:100%!important;
        box-sizing:border-box!important;
        background:#fff!important;
        overflow:visible!important;
        break-after:page!important;
        page-break-after:always!important;
      }
      body.matrix-explicit-print-active .matrix-explicit-print-page:last-child{
        break-after:auto!important;
        page-break-after:auto!important;
      }
      body.matrix-explicit-print-active .matrix-print-header{
        display:grid!important;
        position:static!important;
        top:auto!important;
        left:auto!important;
        right:auto!important;
        width:100%!important;
        height:auto!important;
        min-height:16mm!important;
        margin:0 0 1mm!important;
        z-index:auto!important;
        transform:none!important;
      }
      body.matrix-explicit-print-active .matrix-effective-date-print{
        margin-top:1mm!important;
        padding-top:1mm!important;
        border-top:0.2mm solid rgba(255,255,255,.55)!important;
        white-space:nowrap!important;
        font-size:6px!important;
      }
      body.matrix-explicit-print-active .skill-legend{
        display:flex!important;
        margin:0!important;
        padding:1.5mm 2mm!important;
      }
      body.matrix-explicit-print-active .matrix-explicit-table{
        width:100%!important;
        min-width:0!important;
        table-layout:fixed!important;
      }
      body.matrix-explicit-print-active .matrix-explicit-table thead{
        display:table-header-group!important;
      }
      body.matrix-explicit-print-active .matrix-explicit-table tbody tr{
        break-inside:avoid!important;
        page-break-inside:avoid!important;
      }
      body.matrix-explicit-print-active .matrix-explicit-print-page>.criteria-grid{
        display:grid!important;
        margin:2mm 0 0!important;
        padding:0!important;
        break-inside:avoid!important;
      }
      body.matrix-explicit-print-active .matrix-explicit-print-page>.criteria-grid .acceptance-row{
        padding:1mm 2mm!important;
        min-height:0!important;
      }
      body.matrix-explicit-print-active .matrix-explicit-print-page>.signature-row{
        display:grid!important;
        padding:2mm 2mm 1mm!important;
        break-inside:avoid!important;
      }
      body.matrix-explicit-print-active .matrix-print-page-number{
        display:block!important;
        text-align:right!important;
        margin-top:1mm!important;
        font-size:7px!important;
        color:#52677d!important;
      }
    }`;
  document.head.appendChild(style);

  window.addEventListener('beforeprint',prepare);
  window.addEventListener('afterprint',cleanup);
})();
