/* Shared Google/Sheet photo URLs for organization cards, printing and Excel. */
(()=>{
 'use strict';
 const html=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function clean(value){
  const raw=String(value||'').trim().replace(/&amp;/g,'&');
  const formula=raw.match(/^=\s*(?:IMAGE|HYPERLINK)\s*\(\s*"([^"]+)"/i);return formula?formula[1]:raw;
 }
 function variants(value){
  const raw=clean(value);if(!raw)return [];
  let url;try{url=new URL(raw,location.href)}catch{return [raw]}
  const google=['drive.google.com','docs.google.com','drive.usercontent.google.com'].includes(url.hostname);
  const id=google?(url.pathname.match(/\/d\/([\w-]+)/)?.[1]||url.searchParams.get('id')):url.hostname==='lh3.googleusercontent.com'?url.pathname.match(/^\/d\/([\w-]+)/)?.[1]:'';
  if(!id)return [raw];
  const key=url.searchParams.get('resourcekey'),suffix=key?'?resourcekey='+encodeURIComponent(key):'';
  return [...new Set(['https://lh3.googleusercontent.com/d/'+encodeURIComponent(id)+'=w320'+suffix,'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w320'+(key?'&resourcekey='+encodeURIComponent(key):''),raw])];
 }
 const sources=employee=>[...new Set([employee?.photoData,employee?.photoUrl,employee?.photo].filter(v=>typeof v==='string'&&v.trim()).flatMap(variants))];
 function markup(employee,large=false){
  const urls=sources(employee),name=html(employee.name||employee.id||'Employee'),initials=String(employee.name||employee.id||'?').replace(/^(?:MR|MS|MRS)\.?\s*/i,'').trim().split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'?';
  const classes='avatar'+(large?' avatar-lg':'');if(!urls.length)return `<span class="${classes} avatar-fallback" aria-label="${name}">${html(initials)}</span>`;
  // Self-contained handler also runs in the separate print document.
  return `<img class="${classes}" src="${html(urls[0])}" alt="${name}" crossorigin="anonymous" referrerpolicy="no-referrer" decoding="async" data-photo-sources="${html(JSON.stringify(urls.slice(1)))}" data-initials="${html(initials)}" onerror="var sources=JSON.parse(this.dataset.photoSources||'[]');if(sources.length){this.dataset.photoSources=JSON.stringify(sources.slice(1));this.src=sources[0]}else{this.onerror=null;var fallback=this.ownerDocument.createElement('span');fallback.className=this.className+' avatar-fallback';fallback.setAttribute('aria-label',this.alt);fallback.textContent=this.dataset.initials;this.replaceWith(fallback)}">`;
 }
 window.PPMSEmployeePhotos={sources,variants,markup,displaySource:employee=>sources(employee)[0]||''};
})();
