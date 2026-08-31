(()=>{
  const SECTION_FIELDS={
    sorting:["sortingGroup"],
    stamping:["stampingShift","stampingGroup","stampingRole","stampingMachines"]
  };

  function fieldContainer(form,name){
    const field=form.querySelector('[name="'+name+'"]');
    if(!field)return null;
    return field.closest("label")||field.parentElement;
  }

  function setVisible(form,name,visible){
    const container=fieldContainer(form,name);
    if(!container)return;
    container.hidden=!visible;
    container.style.display=visible?"":"none";
    const field=form.querySelector('[name="'+name+'"]');
    if(field)field.disabled=!visible;
  }

  function bind(form){
    if(form.dataset.sectionFieldsBound==="1")return;
    const section=form.querySelector('select[name="section"]');
    if(!section)return;
    form.dataset.sectionFieldsBound="1";

    let hint=form.querySelector("[data-section-fields-hint]");
    if(!hint){
      hint=document.createElement("small");
      hint.dataset.sectionFieldsHint="1";
      hint.style.cssText="display:block;margin-top:5px;color:#64748b;font-size:12px";
      const sectionContainer=section.closest("label")||section.parentElement;
      sectionContainer&&sectionContainer.appendChild(hint);
    }

    const sync=()=>{
      const value=section.value;
      const sorting=value==="Sorting Section";
      const stamping=value==="Stamping Section";
      SECTION_FIELDS.sorting.forEach(name=>setVisible(form,name,sorting));
      SECTION_FIELDS.stamping.forEach(name=>setVisible(form,name,stamping));
      if(hint){
        hint.textContent=sorting
          ?"กรอกเฉพาะข้อมูลความรับผิดชอบของ Sorting Section"
          :stamping
            ?"กรอกเฉพาะทีม กลุ่ม หน้าที่ และเครื่องจักรของ Stamping Section"
            :"ส่วนข้อมูลความรับผิดชอบจะแสดงเมื่อเลือก Sorting หรือ Stamping Section";
      }
    };

    section.addEventListener("change",sync);
    sync();
  }

  function scan(root=document){
    root.querySelectorAll("form").forEach(form=>{
      if(form.querySelector('select[name="section"]'))bind(form);
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>scan());
  }else{
    scan();
  }

  new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches&&node.matches("form"))bind(node);
        scan(node);
      }
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
})();