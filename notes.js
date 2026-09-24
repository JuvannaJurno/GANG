(() => {
 const section = document.createElement('section');
 section.className = 'extra-notes';
 section.innerHTML = '<h2>Extra Notlar</h2><p class="notes-description">Görsel adına dokun, notlarını aç ve yakınlaştırarak incele.</p><div class="notes-list"></div>';
 document.querySelector('main footer').before(section);
 const list = section.querySelector('.notes-list');
 const dialog = document.createElement('dialog');
 dialog.className = 'note-viewer';
 dialog.setAttribute('aria-labelledby', 'note-title');
 dialog.innerHTML = `<div class="viewer-layout"><div class="viewer-header"><h2 id="note-title"></h2><button type="button" data-close aria-label="Notu kapat">✕</button></div><div class="viewer-controls"><button type="button" data-out aria-label="Küçült">−</button><output aria-live="polite">100%</output><button type="button" data-in aria-label="Büyüt">+</button><button type="button" data-fit>Ekrana sığdır</button><a class="note-original" target="_blank" rel="noopener">Orijinal ↗</a></div><p class="viewer-help">İki parmakla yakınlaştır, sürükleyerek gez. Çift dokunarak da büyütebilirsin.</p><div class="note-stage"><img class="note-image" draggable="false"><p class="note-status" role="status">Görsel yükleniyor…</p></div><div class="viewer-bottom"></div></div>`;
 document.body.append(dialog);
 const stage = dialog.querySelector('.note-stage'), img = dialog.querySelector('img'), status = dialog.querySelector('.note-status');
 let scale = 1, base = 1, x = 0, y = 0, ready = false, opener, oldOverflow;
 const pointers = new Map();
 function paint() {
  const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
  x = w <= stage.clientWidth ? (stage.clientWidth-w)/2 : Math.min(0,Math.max(stage.clientWidth-w,x));
  y = h <= stage.clientHeight ? (stage.clientHeight-h)/2 : Math.min(0,Math.max(stage.clientHeight-h,y));
  img.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
  dialog.querySelector('output').textContent = Math.round(scale/base*100)+'%';
 }
 function fit() {
  if (!ready) return;
  base = Math.min(stage.clientWidth/img.naturalWidth,stage.clientHeight/img.naturalHeight,1);
  scale=base; x=0; y=0; paint();
 }
 function zoom(next,cx=stage.clientWidth/2,cy=stage.clientHeight/2) {
  if (!ready) return;
  next=Math.max(base,Math.min(base*8,next));
  x=cx-(cx-x)*next/scale; y=cy-(cy-y)*next/scale; scale=next; paint();
 }
 function open(note,button) {
  opener=button; ready=false; pointers.clear(); img.hidden=true; status.hidden=false; status.textContent='Görsel yükleniyor…';
  dialog.querySelector('h2').textContent=note.name; img.alt=note.name+' — extra not görseli';
  const url=note.path.split('/').map(encodeURIComponent).join('/');
  dialog.querySelector('a').href=url;
  oldOverflow=document.body.style.overflow; document.body.style.overflow='hidden';
  dialog.showModal(); img.src=url;
 }
 img.onload=()=>{ready=true; img.hidden=false; status.hidden=true; fit();};
 img.onerror=()=>{ready=false; status.textContent='Görsel yüklenemedi. Orijinal bağlantısından tekrar açmayı deneyebilirsin.';};
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow; pointers.clear(); opener?.focus();});
 dialog.querySelector('[data-in]').onclick=()=>zoom(scale*1.5);
 dialog.querySelector('[data-out]').onclick=()=>zoom(scale/1.5);
 dialog.querySelector('[data-fit]').onclick=fit;
 dialog.addEventListener('keydown',e=>{
  if(e.key==='+'||e.key==='='){e.preventDefault();zoom(scale*1.5);}
  if(e.key==='-'){e.preventDefault();zoom(scale/1.5);}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault(); x+=e.key==='ArrowLeft'?50:e.key==='ArrowRight'?-50:0; y+=e.key==='ArrowUp'?50:e.key==='ArrowDown'?-50:0; paint();}
 });
 const point=e=>{const r=stage.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 stage.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,point(e)); stage.setPointerCapture(e.pointerId);});
 stage.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)||!ready)return;
  const before=[...pointers.values()]; pointers.set(e.pointerId,point(e)); const after=[...pointers.values()];
  if(before.length===1){x+=after[0].x-before[0].x; y+=after[0].y-before[0].y; paint();}
  else if(before.length===2){
   const distance=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
   const bx=(before[0].x+before[1].x)/2,by=(before[0].y+before[1].y)/2;
   if(distance(before)>0)zoom(scale*distance(after)/distance(before),bx,by);
   x+=(after[0].x+after[1].x)/2-bx; y+=(after[0].y+after[1].y)/2-by; paint();
  }
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,e=>pointers.delete(e.pointerId));
 stage.addEventListener('dblclick',e=>{const p=point(e);zoom(scale>base*1.1?base:base*2.5,p.x,p.y);});
 stage.addEventListener('wheel',e=>{e.preventDefault();const p=point(e);zoom(scale*Math.exp(-e.deltaY*.002),p.x,p.y);},{passive:false});
 new ResizeObserver(()=>{if(dialog.open)fit();}).observe(stage);
 function renderNotes(){
  list.replaceChildren();
  const heading=section.querySelector('h2');heading.textContent='Extra Notlar';if(extraNotes.some(n=>n.section===active))heading.append(newTag());
  const term=normalize(query.value.trim());
  const notes=extraNotes.filter(n=>n.section===active&&(!term||normalize(n.name+' '+n.topic+' Extra Notlar').includes(term)));
  if(!notes.length){const p=document.createElement('p');p.className='notes-empty';p.textContent=term?'Aramana uygun extra not bulunamadı.':'Bu ders için henüz extra not eklenmedi.';list.append(p);return;}
  document.getElementById('empty').hidden=true;
  document.getElementById('result-count').textContent+=' · '+notes.length+' extra not';
  const topics=[...new Set(notes.map(n=>n.topic))];
  for(const topic of topics){
   const card=document.createElement('details'); card.open=true;
   const heading=document.createElement('summary');heading.className='note-topic';heading.textContent=topic.split(' · ').slice(1).join(' · ');
   const links=document.createElement('div');links.className='note-links';
   for(const note of notes.filter(n=>n.topic===topic)){
    const button=document.createElement('button');button.type='button';button.className='test note-link';
    const name=document.createElement('span');name.className='test-title';name.textContent=note.name;name.append(newTag());
    const action=document.createElement('span');action.className='open';action.textContent='Görseli aç ↗';action.setAttribute('aria-hidden','true');
    button.append(name,action);button.onclick=()=>open(note,button);links.append(button);
   }
   card.append(heading,links);list.append(card);
  }
 }
 query.placeholder='Konu, test veya extra not ara…';query.setAttribute('aria-label','Seçili derste konu, test veya extra not ara');
 new MutationObserver(renderNotes).observe(document.getElementById('groups'),{childList:true});
 renderNotes();
})();
