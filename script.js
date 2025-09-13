/* script.js — shared logic for plugins and admin auth
   NOTE: Password is NOT shown in the UI. For client-side demo, the credentials are:
     username: admin
     password: Anuga123
   (these are used only by JS to validate login; for production, use a server.)
*/

const STORAGE_KEY = 'anuga_plugins_v2';
const VIEWS_KEY = 'anuga_total_views_v1';

// ---------- ADMIN CREDENTIALS (client-side demo only) ----------
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'Anuga123' // keep out of UI
};

// ---------- Utilities ----------
function loadPlugins(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('loadPlugins error', e);
    return [];
  }
}
function savePlugins(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function incrementViewCount(){
  const v = Number(localStorage.getItem(VIEWS_KEY) || 0) + 1;
  localStorage.setItem(VIEWS_KEY, String(v));
}
function getTotalViews(){
  return Number(localStorage.getItem(VIEWS_KEY) || 0);
}
function isAdminSession(){
  return sessionStorage.getItem('anuga_is_admin') === '1';
}
function authenticateAdmin(u,p){
  return u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password;
}

// ---------- Matrix background ----------
(function matrixBackground(){
  const canvas = document.getElementById('matrix');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = innerWidth;
  let height = canvas.height = innerHeight;
  const fontSize = 14;
  let columns = Math.floor(width / fontSize);
  let drops = new Array(columns).fill(0);

  function resize(){
    width = canvas.width = innerWidth;
    height = canvas.height = innerHeight;
    columns = Math.floor(width / fontSize);
    drops = new Array(columns).fill(0);
  }
  addEventListener('resize', resize);

  function draw(){
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#00ff99';
    ctx.font = fontSize + 'px monospace';
    for(let i=0;i<drops.length;i++){
      const text = String.fromCharCode(33 + Math.random() * 90);
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      ctx.fillText(text, x, y);
      if(y > height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ---------- Public rendering (index.html) ----------
function renderPublicPlugins(){
  const list = loadPlugins();
  const root = document.getElementById('plugin-list');
  const statPlugins = document.getElementById('stat-plugins');
  const statViews = document.getElementById('stat-views');
  if(!root) return;
  root.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'plugin-card';
    const img = document.createElement('img');
    img.src = p.img || 'https://via.placeholder.com/800x300?text=Plugin';
    img.alt = p.title || 'plugin';
    const title = document.createElement('h3');
    title.className = 'plugin-title';
    title.textContent = p.title;
    const desc = document.createElement('p');
    desc.className = 'plugin-desc';
    desc.textContent = p.desc || '';
    const actions = document.createElement('div');
    actions.className = 'plugin-actions';
    const open = document.createElement('a');
    open.className = 'btn';
    open.textContent = 'Open';
    open.href = p.link || '#';
    open.target = '_blank';
    open.rel = 'noopener';

    actions.appendChild(open);
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(actions);
    root.appendChild(card);
  });
  if(statPlugins) statPlugins.textContent = list.length;
  if(statViews) statViews.textContent = getTotalViews();
}

// ---------- Admin UI (admin-dashboard.html) ----------
let adminEditingId = null;

function renderAdminStats(){
  const sPlugins = document.getElementById('admin-total-plugins');
  const sViews = document.getElementById('admin-total-views');
  if(sPlugins) sPlugins.textContent = loadPlugins().length;
  if(sViews) sViews.textContent = getTotalViews();
}

function renderAdminPlugins(){
  const list = loadPlugins();
  const root = document.getElementById('admin-plugin-list');
  if(!root) return;
  root.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'plugin-card';
    const img = document.createElement('img'); img.src = p.img || 'https://via.placeholder.com/800x300?text=Plugin';
    const title = document.createElement('h3'); title.className = 'plugin-title'; title.textContent = p.title;
    const desc = document.createElement('p'); desc.className = 'plugin-desc'; desc.textContent = p.desc || '';
    const actions = document.createElement('div'); actions.className = 'plugin-actions';

    const open = document.createElement('a'); open.className = 'btn'; open.textContent='Open'; open.href = p.link || '#'; open.target='_blank'; open.rel='noopener';
    const edit = document.createElement('button'); edit.className='btn ghost'; edit.textContent='Edit';
    const del = document.createElement('button'); del.className='btn ghost'; del.textContent='Delete';

    edit.addEventListener('click', () => {
      adminEditingId = p.id;
      openAdminModal(p);
    });
    del.addEventListener('click', () => {
      if(!isAdminSession()){ alert('Only admins can delete.'); return; }
      if(!confirm('Delete this plugin?')) return;
      const arr = loadPlugins().filter(x => x.id !== p.id);
      savePlugins(arr);
      renderAdminPlugins(); renderAdminStats();
    });

    actions.appendChild(open); actions.appendChild(edit); actions.appendChild(del);
    card.appendChild(img); card.appendChild(title); card.appendChild(desc); card.appendChild(actions);
    root.appendChild(card);
  });
  renderAdminStats();
}

// ---------- Admin modal logic (shared between admin page and single-page admin flows) ----------
function openAdminModal(plugin){
  const modal = document.getElementById('modal');
  if(!modal) return;
  modal.classList.remove('hidden');
  document.getElementById('modal-title').textContent = plugin ? 'Edit Plugin' : 'Add Plugin';
  document.getElementById('plugin-title').value = plugin ? plugin.title : '';
  document.getElementById('plugin-desc').value = plugin ? plugin.desc : '';
  document.getElementById('plugin-link').value = plugin ? plugin.link : '';
  document.getElementById('plugin-img').value = plugin ? plugin.img : '';
  adminEditingId = plugin ? plugin.id : null;
}

function closeAdminModal(){
  const modal = document.getElementById('modal');
  if(!modal) return;
  modal.classList.add('hidden');
  adminEditingId = null;
  document.getElementById('plugin-title').value = '';
  document.getElementById('plugin-desc').value = '';
  document.getElementById('plugin-link').value = '';
  document.getElementById('plugin-img').value = '';
}

// modal event wiring (if admin page present)
(function modalWire(){
  const modal = document.getElementById('modal');
  if(!modal) return;
  document.getElementById('modal-close').addEventListener('click', closeAdminModal);
  document.getElementById('plugin-cancel').addEventListener('click', closeAdminModal);
  document.getElementById('plugin-save').addEventListener('click', () => {
    if(!isAdminSession()){ alert('Only admins may save plugins.'); closeAdminModal(); return; }
    const title = document.getElementById('plugin-title').value.trim();
    if(!title){ alert('Provide a title'); return; }
    const desc = document.getElementById('plugin-desc').value.trim();
    const link = document.getElementById('plugin-link').value.trim();
    const img = document.getElementById('plugin-img').value.trim();
    const list = loadPlugins();
    if(adminEditingId){
      const idx = list.findIndex(p => p.id === adminEditingId);
      if(idx > -1){
        list[idx].title = title; list[idx].desc = desc; list[idx].link = link; list[idx].img = img;
        list[idx].updatedAt = new Date().toISOString();
      }
    } else {
      const id = 'p_' + Date.now();
      list.unshift({ id, title, desc, link, img, createdAt: new Date().toISOString() });
    }
    savePlugins(list);
    closeAdminModal();
    renderAdminPlugins();
  });
  // allow clicking outside to close
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeAdminModal(); });
})();

// ---------- Seed demo if empty ----------
function seedIfEmpty(){
  const list = loadPlugins();
  if(list.length === 0){
    const demo = [
      { id: 'p_demo_1', title:'Auto Greeting Plugin', desc:'Sends welcome messages to new members.', link:'#', img:'https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=800&q=60', createdAt:new Date().toISOString() },
      { id: 'p_demo_2', title:'Quick Reply Commands', desc:'Create quick replies & keyword triggers.', link:'#', img:'', createdAt:new Date().toISOString() }
    ];
    savePlugins(demo);
  }
}

// ---------- Misc: expose some functions for pages ----------
window.loadPlugins = loadPlugins;
window.savePlugins = savePlugins;
window.isAdminSession = isAdminSession;
window.authenticateAdmin = authenticateAdmin;
window.renderAdminPlugins = renderAdminPlugins;
window.renderAdminStats = renderAdminStats;
window.renderPublicPlugins = renderPublicPlugins;
window.incrementViewCount = incrementViewCount;
window.seedIfEmpty = seedIfEmpty;
