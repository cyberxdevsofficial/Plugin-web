/* script.js
   Implements:
   - Matrix background
   - plugin storage in localStorage
   - admin password flow (Anuga123)
*/

const ADMIN_PASSWORD = 'Anuga123';
const STORAGE_KEY = 'anuga_plugins_v1';

// --- Matrix background ---
(function matrixBackground(){
  const canvas = document.getElementById('matrix');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = innerWidth;
  let height = canvas.height = innerHeight;
  const cols = Math.floor(width / 14);
  const ypos = Array(cols).fill(0);

  function resize(){
    width = canvas.width = innerWidth;
    height = canvas.height = innerHeight;
  }
  addEventListener('resize', resize);

  function draw(){
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0,0,width,height);

    ctx.fillStyle = '#00ff99';
    ctx.font = '14px monospace';

    ypos.forEach((y, ind) => {
      const text = String.fromCharCode(33 + Math.random()*33);
      const x = ind * 14;
      ctx.fillText(text, x, y);
      if (y > 100 + Math.random()*10000) ypos[ind] = 0;
      else ypos[ind] = y + 14;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// --- Helper DOM references ---
const btnAdd = document.getElementById('btn-add-plugin');
const btnClear = document.getElementById('btn-clear-storage');
const pluginListEl = document.getElementById('plugin-list');
const statPlugins = document.getElementById('stat-plugins');
const statUsers = document.getElementById('stat-users');
const statViews = document.getElementById('stat-views');

// Modal elements
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const passwordStep = document.getElementById('password-step');
const pluginStep = document.getElementById('plugin-step');
const adminPasswordInput = document.getElementById('admin-password');
const passwordConfirm = document.getElementById('password-confirm');
const passwordError = document.getElementById('password-error');

const pluginTitle = document.getElementById('plugin-title');
const pluginDesc = document.getElementById('plugin-desc');
const pluginLink = document.getElementById('plugin-link');
const pluginImg = document.getElementById('plugin-img');
const pluginSave = document.getElementById('plugin-save');
const pluginCancel = document.getElementById('plugin-cancel');
const modalTitle = document.getElementById('modal-title');

let editingId = null;
let viewCount = 0;

// --- Storage functions ---
function loadPlugins(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('load error', e);
    return [];
  }
}
function savePlugins(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// --- UI rendering ---
function renderPlugins(){
  const list = loadPlugins();
  pluginListEl.innerHTML = '';
  list.forEach(plugin => {
    const card = document.createElement('article');
    card.className = 'plugin-card';
    card.dataset.id = plugin.id;

    const img = document.createElement('img');
    img.src = plugin.img || 'https://via.placeholder.com/600x200?text=Plugin';
    img.alt = plugin.title;

    const title = document.createElement('h3');
    title.className = 'plugin-title';
    title.textContent = plugin.title;

    const desc = document.createElement('p');
    desc.className = 'plugin-desc';
    desc.textContent = plugin.desc || '';

    const actions = document.createElement('div');
    actions.className = 'plugin-actions';

    const openBtn = document.createElement('a');
    openBtn.className = 'btn';
    openBtn.textContent = 'Open';
    openBtn.href = plugin.link || '#';
    openBtn.target = '_blank';
    openBtn.rel = 'noopener';

    // admin only actions (edit/delete) - require password flow
    const editBtn = document.createElement('button');
    editBtn.className = 'btn ghost';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => openEditFlow(plugin.id);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn ghost';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => confirmDelete(plugin.id);

    actions.appendChild(openBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(actions);

    pluginListEl.appendChild(card);
  });

  statPlugins.textContent = list.length;
  statViews.textContent = viewCount;
}

// --- Modal flows ---
function openModal(){
  modal.classList.remove('hidden');
  passwordStep.classList.remove('hidden');
  pluginStep.classList.add('hidden');
  adminPasswordInput.value = '';
  passwordError.classList.add('hidden');
  modalTitle.textContent = editingId ? 'Edit Plugin' : 'Add Plugin';
}
function closeModal(){
  modal.classList.add('hidden');
  editingId = null;
  clearPluginForm();
}

function clearPluginForm(){
  pluginTitle.value = '';
  pluginDesc.value = '';
  pluginLink.value = '';
  pluginImg.value = '';
}

// Password confirm
passwordConfirm.addEventListener('click', () => {
  const val = adminPasswordInput.value || '';
  if(val === ADMIN_PASSWORD){
    // allowed, reveal plugin form
    passwordStep.classList.add('hidden');
    pluginStep.classList.remove('hidden');

    // if editing, populate form
    if(editingId){
      const list = loadPlugins();
      const plugin = list.find(p => p.id === editingId);
      if(plugin){
        pluginTitle.value = plugin.title || '';
        pluginDesc.value = plugin.desc || '';
        pluginLink.value = plugin.link || '';
        pluginImg.value = plugin.img || '';
      }
    }
  } else {
    passwordError.classList.remove('hidden');
    passwordError.textContent = 'Wrong password — try again.';
  }
});

// Save plugin
pluginSave.addEventListener('click', () => {
  const title = pluginTitle.value.trim();
  if(!title){
    alert('Please provide a plugin title.');
    return;
  }
  const desc = pluginDesc.value.trim();
  const link = pluginLink.value.trim();
  const img = pluginImg.value.trim();

  const list = loadPlugins();
  if(editingId){
    // update
    const idx = list.findIndex(p => p.id === editingId);
    if(idx > -1){
      list[idx].title = title;
      list[idx].desc = desc;
      list[idx].link = link;
      list[idx].img = img;
      list[idx].updatedAt = new Date().toISOString();
    }
  } else {
    const id = 'p_' + Date.now();
    list.unshift({
      id, title, desc, link, img, createdAt: new Date().toISOString()
    });
  }
  savePlugins(list);
  renderPlugins();
  closeModal();
});

// Cancel in form
pluginCancel.addEventListener('click', closeModal);

// open add plugin button -> start modal (password step)
btnAdd.addEventListener('click', () => {
  editingId = null;
  openModal();
});

// Clear all local storage (danger)
btnClear.addEventListener('click', () => {
  if(confirm('Clear ALL plugin entries from localStorage? This cannot be undone.')){
    localStorage.removeItem(STORAGE_KEY);
    renderPlugins();
  }
});

// Modal close
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if(e.target === modal) closeModal();
});

// --- Edit / Delete flows require admin password first ---
function openEditFlow(id){
  editingId = id;
  openModal();
  // Password step takes care of showing form after correct password
}

function confirmDelete(id){
  const ok = confirm('Are you sure you want to delete this plugin? (Admin password required)');
  if(!ok) return;
  // prompt for password
  const pw = prompt('Enter admin password to delete:');
  if(pw !== ADMIN_PASSWORD){
    alert('Wrong password. Action cancelled.');
    return;
  }
  const list = loadPlugins().filter(p => p.id !== id);
  savePlugins(list);
  renderPlugins();
}

// increment view count when user clicks into page
window.addEventListener('focus', ()=>{ viewCount++; statViews.textContent = viewCount; });

// initial seed demo plugin if empty
(function seedIfEmpty(){
  const list = loadPlugins();
  if(list.length === 0){
    const demo = [
      {
        id: 'p_demo_1',
        title: 'Auto Greeting Plugin',
        desc: 'Sends automatic welcome messages to new group members with variables and buttons.',
        link: '#',
        img: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=800&q=60',
        createdAt: new Date().toISOString()
      },
      {
        id: 'p_demo_2',
        title: 'Quick Reply Commands',
        desc: 'Framework for creating quick command replies & keyword triggers for your bot.',
        link: '#',
        img: '',
        createdAt: new Date().toISOString()
      }
    ];
    savePlugins(demo);
  }
  renderPlugins();
})();
