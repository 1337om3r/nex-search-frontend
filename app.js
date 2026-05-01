/* ═══════════════════════════════════════════
   NexSearch v3.0 — app.js
   ═══════════════════════════════════════════ */

'use strict';

/* ── Config ── */
const DEFAULT_PROXY = 'https://proxy.ikunbeautiful.workers.dev/?url=';

const DEFAULT_FAVS = [
  { name: 'YouTube',   url: 'https://youtube.com',    icon: '▶️' },
  { name: 'GitHub',    url: 'https://github.com',     icon: '💻' },
  { name: 'Reddit',    url: 'https://reddit.com',     icon: '📰' },
  { name: 'Wikipedia', url: 'https://wikipedia.org',  icon: '📚' },
  { name: 'X',         url: 'https://x.com',          icon: '✦'  },
];

const EMOJI_OPTIONS = [
  '🔍','▶️','💻','📰','📚','🎮','🌐','🎵',
  '🛒','💬','📧','🎨','⚙️','🔒','📊','✦',
  '🚀','🌟','📡','🔗','🎯','🏠','🔑','💡',
];

/* ── Storage ── */
const store = {
  get: (k, d) => {
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; }
    catch { return d; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },
  remove: (k) => { try { localStorage.removeItem(k); } catch {} },
};

/* ── State ── */
let favs     = store.get('nx_favs', DEFAULT_FAVS);
let history  = store.get('nx_hist', []);
let settings = store.get('nx_settings', {
  proxyUrl:  DEFAULT_PROXY,
  newTab:    true,
  animation: true,
  compact:   false,
});
let selEmoji  = '🌐';
let toastTimer;
let currentPage = 'home';

/* ════════════════════════════
   NAVIGATE
   ════════════════════════════ */

function navigate(url) {
  if (!url) return;
  if (!/^https?:\/\//.test(url)) url = 'https://' + url;

  history = history.filter(h => h.url !== url);
  history.unshift({ url, ts: Date.now() });
  history = history.slice(0, 50);
  store.set('nx_hist', history);

  renderHistory();
  renderStats();

  fetch("https://nex-search-backend.onrender.com/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: url })
  })
  .then(res => res.text())
  .then(data => {
    document.open();
    document.write(data);
    document.close();
  });

  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  showToast('Bağlanıyor → ' + hostname);
}

/* ════════════════════════════
   PAGE ROUTING
   ════════════════════════════ */

function showPage(page) {
  currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.snav-item').forEach(a => a.classList.remove('active'));

  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');

  const link = document.querySelector(`.snav-item[data-page="${page}"]`);
  if (link) link.classList.add('active');

  // Refresh settings page counts if opened
  if (page === 'settings') refreshSettingsPage();
  if (page === 'about') refreshAboutPage();

  // Close sidebar on mobile
  closeSidebar();
}

document.querySelectorAll('.snav-item').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showPage(link.dataset.page);
  });
});

/* ════════════════════════════
   SIDEBAR (MOBILE)
   ════════════════════════════ */

const hamburger = document.getElementById('hamburger');
const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('sidebar-overlay');

hamburger.addEventListener('click', () => {
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) closeSidebar();
  else openSidebar();
});

overlay.addEventListener('click', closeSidebar);

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
  hamburger.classList.add('open');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  hamburger.classList.remove('open');
}

/* ════════════════════════════
   RENDER FAVS
   ════════════════════════════ */

function renderFavs() {
  const grid = document.getElementById('fav-grid');

  const cards = favs.map((f, i) => {
    const host = (() => { try { return new URL(f.url).hostname; } catch { return f.url; } })();
    const safe = f.url.replace(/'/g, "\\'");
    return `<div class="fav-card" role="button" tabindex="0"
      onclick="navigate('${safe}')"
      onkeydown="if(event.key==='Enter')navigate('${safe}')"
      style="animation-delay:${i * 0.04}s"
      title="${escHtml(f.name)}">
      <div class="fav-icon">${f.icon}</div>
      <div class="fav-name">${escHtml(f.name)}</div>
      <div class="fav-host">${escHtml(host)}</div>
    </div>`;
  }).join('');

  const addBtn = `<div class="fav-card fav-add" role="button" tabindex="0"
    onclick="openModal()"
    onkeydown="if(event.key==='Enter')openModal()"
    style="animation-delay:${favs.length * 0.04}s"
    title="Favori ekle">
    <div class="add-plus">+</div>
    <div class="fav-name">Ekle</div>
  </div>`;

  grid.innerHTML = cards + addBtn;
  renderStats();
}

/* ════════════════════════════
   RENDER HISTORY
   ════════════════════════════ */

function renderHistory() {
  const list  = document.getElementById('history-list');
  const count = document.getElementById('hist-count');

  count.textContent = history.length ? `${history.length} ziyaret` : '0 ziyaret';

  if (!history.length) {
    list.innerHTML = `<li class="empty-state">
      <div class="empty-icon">◌</div>
      <p class="empty-text">Henüz ziyaret geçmişi yok</p>
    </li>`;
    return;
  }

  list.innerHTML = history.map((item, i) => {
    const host     = (() => { try { return new URL(item.url).hostname; } catch { return item.url; } })();
    const time     = relativeTime(item.ts);
    const favicon  = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;

    return `<li class="history-item" style="animation-delay:${i * 0.025}s">
      <div class="h-favicon">
        <img src="${favicon}" alt="" loading="lazy" onerror="this.style.display='none'">
      </div>
      <a class="h-link" href="#" onclick="navigate('${item.url.replace(/'/g, "\\'")}'); return false;"
         title="${escHtml(item.url)}">${escHtml(item.url)}</a>
      <time class="h-time">${time}</time>
      <button class="h-del" onclick="deleteHistoryItem(${i})" aria-label="Sil">✕</button>
    </li>`;
  }).join('');
}

/* ════════════════════════════
   STATS
   ════════════════════════════ */

function renderStats() {
  document.getElementById('stat-total').textContent      = history.length;
  document.getElementById('fav-tab-count').textContent   = favs.length;
  document.getElementById('hist-tab-count').textContent  = history.length;
}

function refreshAboutPage() {
  const af = document.getElementById('ab-stat-favs');
  const ah = document.getElementById('ab-stat-hist');
  if (af) af.textContent = favs.length;
  if (ah) ah.textContent = history.length;
}

function refreshSettingsPage() {
  const sf = document.getElementById('settings-fav-count');
  const sh = document.getElementById('settings-hist-count');
  if (sf) sf.textContent = favs.length;
  if (sh) sh.textContent = history.length;

  const proxyInput = document.getElementById('proxy-url-input');
  if (proxyInput) proxyInput.value = settings.proxyUrl;

  document.getElementById('toggle-newtab').checked  = settings.newTab;
  document.getElementById('toggle-anim').checked    = settings.animation;
  document.getElementById('toggle-compact').checked = settings.compact;
}

/* ════════════════════════════
   HISTORY ACTIONS
   ════════════════════════════ */

function deleteHistoryItem(i) {
  history.splice(i, 1);
  store.set('nx_hist', history);
  renderHistory(); renderStats();
}

function clearHistory() {
  if (!history.length) return;
  history = [];
  store.set('nx_hist', history);
  renderHistory(); renderStats();
  showToast('Geçmiş temizlendi');
}

/* ════════════════════════════
   TABS
   ════════════════════════════ */

document.getElementById('ql-tabs').addEventListener('click', e => {
  const btn = e.target.closest('.ptab');
  if (!btn) return;

  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  btn.classList.add('active');
  document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

  const clearBtn = document.getElementById('clear-all');
  clearBtn.style.display = btn.dataset.tab === 'history' ? 'flex' : 'none';
});

/* ════════════════════════════
   SEARCH INPUT
   ════════════════════════════ */

const urlInput = document.getElementById('url-input');
const clearBtn = document.getElementById('clear-input');

urlInput.addEventListener('input', () => {
  clearBtn.classList.toggle('visible', urlInput.value.length > 0);
});

clearBtn.addEventListener('click', () => {
  urlInput.value = '';
  clearBtn.classList.remove('visible');
  urlInput.focus();
});

document.getElementById('go-btn').addEventListener('click', () => navigate(urlInput.value.trim()));
document.getElementById('go-btn-2').addEventListener('click', () => navigate(urlInput.value.trim()));

urlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') navigate(urlInput.value.trim());
});

document.getElementById('lucky-btn').addEventListener('click', () => {
  if (favs.length) navigate(favs[Math.floor(Math.random() * favs.length)].url);
  else showToast('Önce favori ekle!');
});

document.getElementById('clear-all').addEventListener('click', clearHistory);

/* ════════════════════════════
   SETTINGS ACTIONS
   ════════════════════════════ */

document.getElementById('save-proxy').addEventListener('click', () => {
  const val = document.getElementById('proxy-url-input').value.trim();
  if (!val) { showToast('Proxy URL boş olamaz'); return; }
  settings.proxyUrl = val;
  store.set('nx_settings', settings);
  showToast('Proxy kaydedildi');
});

document.getElementById('toggle-newtab').addEventListener('change', e => {
  settings.newTab = e.target.checked;
  store.set('nx_settings', settings);
  showToast(settings.newTab ? 'Yeni sekme açık' : 'Aynı sekmede açılır');
});

document.getElementById('toggle-anim').addEventListener('change', e => {
  settings.animation = e.target.checked;
  store.set('nx_settings', settings);
});

document.getElementById('toggle-compact').addEventListener('change', e => {
  settings.compact = e.target.checked;
  store.set('nx_settings', settings);
  document.body.classList.toggle('compact', settings.compact);
});

document.getElementById('clear-history-btn').addEventListener('click', () => {
  clearHistory();
  refreshSettingsPage();
});

document.getElementById('reset-favs-btn').addEventListener('click', () => {
  favs = [...DEFAULT_FAVS];
  store.set('nx_favs', favs);
  renderFavs(); renderStats();
  refreshSettingsPage();
  showToast('Favoriler sıfırlandı');
});

document.getElementById('nuke-btn').addEventListener('click', () => {
  if (!confirm('Tüm veriler silinecek. Emin misin?')) return;
  store.remove('nx_favs');
  store.remove('nx_hist');
  store.remove('nx_settings');
  favs = [...DEFAULT_FAVS];
  history = [];
  settings = { proxyUrl: DEFAULT_PROXY, newTab: true, animation: true, compact: false };
  renderFavs(); renderHistory(); renderStats();
  refreshSettingsPage();
  showToast('Tüm veriler silindi');
});

/* ════════════════════════════
   MODAL
   ════════════════════════════ */

function openModal() {
  document.getElementById('fav-name-input').value = '';
  document.getElementById('fav-url-input').value  = '';
  selEmoji = '🌐';
  renderEmojiPicker();
  document.getElementById('modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('fav-name-input').focus(), 60);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function renderEmojiPicker() {
  document.getElementById('emoji-row').innerHTML = EMOJI_OPTIONS.map(e => `
    <div class="emoji-opt${e === selEmoji ? ' selected' : ''}"
         role="radio" tabindex="0"
         onclick="selectEmoji('${e}')"
         onkeydown="if(event.key==='Enter')selectEmoji('${e}')">${e}</div>
  `).join('');
}

function selectEmoji(emoji) {
  selEmoji = emoji;
  renderEmojiPicker();
}

document.getElementById('modal-close-btn').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target.id === 'modal-overlay') closeModal();
});

document.getElementById('modal-save').addEventListener('click', () => {
  const name = document.getElementById('fav-name-input').value.trim();
  let   url  = document.getElementById('fav-url-input').value.trim();
  if (!name || !url) { showToast('Ad ve URL zorunlu'); return; }
  if (!/^https?:\/\//.test(url)) url = 'https://' + url;
  favs.push({ name, url, icon: selEmoji });
  store.set('nx_favs', favs);
  renderFavs(); closeModal();
  showToast('Favori eklendi: ' + name);
});

/* ════════════════════════════
   KEYBOARD SHORTCUTS
   ════════════════════════════ */

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    showPage('home');
    setTimeout(() => urlInput.focus(), 50);
  }
  if (e.key === 'Escape') closeModal();
});

/* ════════════════════════════
   TOAST
   ════════════════════════════ */

function showToast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ════════════════════════════
   UTILITIES
   ════════════════════════════ */

function relativeTime(ts) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60_000);
  const h = Math.floor(d / 3_600_000);
  const day = Math.floor(d / 86_400_000);
  if (m < 1)  return 'şimdi';
  if (m < 60) return `${m}dk`;
  if (h < 24) return `${h}sa`;
  return `${day}g`;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ════════════════════════════
   INIT
   ════════════════════════════ */

renderFavs();
renderHistory();
renderStats();
refreshSettingsPage();

// Apply compact mode if saved
if (settings.compact) document.body.classList.add('compact');
