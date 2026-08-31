/* V641: repeat Skill Matrix document header and approval footer on every printed page */
(()=>{
  function removeRepeatRows(){
    document.querySelectorAll('.matrix-repeat-header-row,.matrix-repeat-footer').forEach(node=>node.remove());
  }

  function prepareMatrixPrint(){
    removeRepeatRows();
    const report=document.querySelector('.matrix-report');
    const table=report?.querySelector('.skill-matrix-table');
    const thead=table?.tHead;
    const originalHeader=report?.querySelector(':scope > .matrix-print-header');
    const originalCriteria=report?.querySelector(':scope > .criteria-grid');
    const originalFooter=report?.querySelector(':scope > .signature-row');
    if(!report||!table||!thead||!originalHeader||!originalCriteria||!originalFooter)return;

    const columnCount=Math.max(1,thead.rows[thead.rows.length-1]?.cells.length||1);

    const headerRow=document.createElement('tr');
    headerRow.className='matrix-repeat-header-row';
    const headerCell=document.createElement('th');
    headerCell.colSpan=columnCount;
    headerCell.appendChild(originalHeader.cloneNode(true));
    headerRow.appendChild(headerCell);
    thead.insertBefore(headerRow,thead.firstChild);

    const tfoot=table.tFoot||table.createTFoot();
    tfoot.className='matrix-repeat-footer';
    const footerRow=tfoot.insertRow();
    const footerCell=footerRow.insertCell();
    footerCell.colSpan=columnCount;
    const repeatBlock=document.createElement('div');
    repeatBlock.className='matrix-repeat-bottom-block';
    repeatBlock.appendChild(originalCriteria.cloneNode(true));
    repeatBlock.appendChild(originalFooter.cloneNode(true));
    footerCell.appendChild(repeatBlock);
  }

  const style=document.createElement('style');
  style.textContent=`
    @media print{
      body.print-matrix .matrix-report>.matrix-print-header,
      body.print-matrix .matrix-report>.criteria-grid,
      body.print-matrix .matrix-report>.signature-row{
        display:none!important;
      }
      body.print-matrix .matrix-repeat-header-row{
        display:table-row!important;
      }
      body.print-matrix .matrix-repeat-header-row>th{
        padding:0 0 2mm!important;
        border:0!important;
        background:#fff!important;
      }
      body.print-matrix .matrix-repeat-header-row .matrix-print-header{
        display:grid!important;
        width:100%!important;
        box-sizing:border-box!important;
      }
      body.print-matrix .matrix-repeat-footer{
        display:table-footer-group!important;
      }
      body.print-matrix .matrix-repeat-footer td{
        padding:2mm 0 0!important;
        border:0!important;
        background:#fff!important;
      }
      body.print-matrix .matrix-repeat-footer .criteria-grid{
        display:grid!important;
        padding:2mm 0 0!important;
        margin:0!important;
        break-inside:avoid!important;
      }
      body.print-matrix .matrix-repeat-footer .criteria-grid .acceptance-row{
        padding:1mm 2mm!important;
        min-height:0!important;
      }
      body.print-matrix .matrix-repeat-footer .signature-row{
        display:grid!important;
        padding:3mm 2mm 1mm!important;
        border-top:1px solid #9fb4c8!important;
        break-inside:avoid!important;
      }
    }`;
  document.head.appendChild(style);

  window.addEventListener('beforeprint',prepareMatrixPrint);
  window.addEventListener('afterprint',removeRepeatRows);
})();
