'use strict';
const gallery = document.querySelector('#gallery');
const status = document.querySelector('#status');
const viewer = document.querySelector('#viewer');
const full = document.querySelector('#full');
const imageStatus = document.querySelector('#image-status');
const toggle = document.querySelector('#contact-toggle');
const contact = document.querySelector('#contact');
let photos = [], active = 0, opener;
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
function featuredOrder(items) {
  const pinned=items.filter(photo=>Number.isInteger(photo.pin)&&photo.pin>0).sort((a,b)=>a.pin-b.pin||a.full.localeCompare(b.full));
  return pinned.concat(shuffle(items.filter(photo=>!Number.isInteger(photo.pin)||photo.pin<=0)));
}
function show(index) {
  active = (index + photos.length) % photos.length;
  const photo = photos[active];
  imageStatus.textContent = 'Loading…';
  full.alt = photo.alt || 'Wildlife photograph by Michael Horowitz';
  full.onload = () => { imageStatus.textContent = ''; };
  full.onerror = () => { imageStatus.textContent = 'This photograph could not load. Try another.'; };
  full.src = photo.full;
}
gallery.addEventListener('click', event => {
  const button = event.target.closest('.photo');
  if (!button) return;
  opener = button;
  show(Number(button.dataset.index));
  viewer.showModal();
  document.querySelector('#close').focus();
});
document.querySelector('#close').onclick = () => viewer.close();
document.querySelector('#previous').onclick = () => show(active - 1);
document.querySelector('#next').onclick = () => show(active + 1);
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('close', () => { full.removeAttribute('src'); opener?.focus({preventScroll:true}); });
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {event.preventDefault(); show(active - 1);}
  if (event.key === 'ArrowRight') {event.preventDefault(); show(active + 1);}
});
let touchStart;
viewer.addEventListener('touchstart', event => { if(event.touches.length===1) touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY}; else touchStart=null; },{passive:true});
viewer.addEventListener('touchend', event => {
  if (!touchStart || !event.changedTouches.length) return;
  const dx=event.changedTouches[0].clientX-touchStart.x, dy=event.changedTouches[0].clientY-touchStart.y;
  if(Math.abs(dx)>65 && Math.abs(dx)>Math.abs(dy)*1.5) show(active + (dx<0?1:-1));
  touchStart=null;
},{passive:true});
function hideContact(){contact.hidden=true;toggle.setAttribute('aria-expanded','false');}
toggle.onclick=()=>{contact.hidden=!contact.hidden;toggle.setAttribute('aria-expanded',String(!contact.hidden));};
document.addEventListener('click',event=>{if(!contact.contains(event.target)&&!toggle.contains(event.target))hideContact();});
document.addEventListener('keydown',event=>{if(event.key==='Escape')hideContact();});
function renderGallery(){
    const fragment=document.createDocumentFragment();
    photos.forEach((photo,index)=>{
      const button=document.createElement('button');button.className='photo';button.dataset.index=index;
      button.setAttribute('aria-label',`Open photograph ${index+1}`);
      const img=document.createElement('img');img.src=photo.thumb;img.alt=photo.alt||'';
      img.width=800;img.height=600;img.loading=index<4?'eager':'lazy';img.decoding='async';
      img.style.objectPosition=photo.position||'50% 50%';
      button.append(img);fragment.append(button);
    });
    gallery.replaceChildren(fragment);
}
document.querySelector('#sort-controls').addEventListener('click',event=>{
  const button=event.target.closest('button[data-sort]');
  if(!button || button.getAttribute('aria-pressed')==='true') return;
  if(button.dataset.sort==='newest') photos.sort((a,b)=>(b.captured||0)-(a.captured||0)||a.full.localeCompare(b.full));
  else if(button.dataset.sort==='featured') photos=featuredOrder(photos);
  else shuffle(photos);
  document.querySelectorAll('[data-sort]').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
  renderGallery();
});
async function loadGallery(){
  try {
    const response=await fetch('photos.json',{cache:'no-cache'});
    if(!response.ok) throw new Error('Photo list unavailable');
    const items=await response.json();
    const hasPins=items.some(photo=>Number.isInteger(photo.pin)&&photo.pin>0);
    const featured=document.querySelector('[data-sort="featured"]');
    const random=document.querySelector('[data-sort="random"]');
    featured.hidden=!hasPins;
    featured.setAttribute('aria-pressed',String(hasPins));
    random.setAttribute('aria-pressed',String(!hasPins));
    photos=hasPins?featuredOrder(items):shuffle(items);
    renderGallery();status.textContent=photos.length?'':'No photographs yet.';
  } catch(error) { status.textContent='The photographs could not load. Please refresh to try again.'; }
}
loadGallery();
