import './style.css';

// ── Tauri helpers ─────────────────────────────────────────────────────────────

function tauriWin() {
  try { return window.__TAURI__?.window?.getCurrent(); } catch(_) { return null; }
}

async function startWindowDrag() {
  try {
    const win = tauriWin();
    if (win?.startDragging) { await win.startDragging(); }
  } catch(_) {}
}

async function closeWindow() {
  try {
    const win = tauriWin();
    if (win?.close) { await win.close(); }
  } catch(_) {}
}

async function resizeWindow(w, h) {
  try {
    const win = tauriWin();
    if (win?.setSize) {
      const { LogicalSize } = window.__TAURI__.window;
      await win.setSize(new LogicalSize(w, h));
    }
  } catch(_) {}
}

// ── State ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'streak_widget_data';

function defaultData() {
  return {
    counters: [
      {
        id: 1,
        type: 'streak',       // 'streak' | 'countdown' | 'counter'
        label: 'Days Without Incidents',
        startDate: todayISO(),
        targetDate: null,
        count: 0,
        emoji: '🔥',
      },
    ],
    activeId: 1,
    nextId: 2,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultData();
  } catch { return defaultData(); }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(a, b) {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.floor((msB - msA) / 86400000);
}

// ── Computed value per counter ────────────────────────────────────────────────

function getValue(c) {
  const today = todayISO();
  if (c.type === 'streak') {
    return Math.max(0, daysBetween(c.startDate, today));
  }
  if (c.type === 'countdown') {
    if (!c.targetDate) return '—';
    const d = daysBetween(today, c.targetDate);
    return d >= 0 ? d : 0;
  }
  if (c.type === 'counter') {
    return c.count;
  }
  return 0;
}

function getUnit(c) {
  if (c.type === 'countdown') return 'days left';
  return 'days';
}

// ── Render ────────────────────────────────────────────────────────────────────

let data = load();
let view = 'main'; // 'main' | 'edit' | 'add'
let editingId = null;
let minimized = false;

function render() {
  const app = document.getElementById('app');
  if (minimized) { app.innerHTML = renderMinimized(); bindEvents(); return; }
  if (view === 'main') app.innerHTML = renderMain();
  else if (view === 'edit') app.innerHTML = renderEdit();
  else if (view === 'add') app.innerHTML = renderAdd();
  bindEvents();
}

function renderMinimized() {
  const c = data.counters.find(x => x.id === data.activeId) || data.counters[0];
  const val = c ? getValue(c) : 0;
  return `
    <div class="widget-mini" id="drag-handle" data-tauri-drag-region>
      <span class="mini-emoji">${c ? c.emoji : '🔥'}</span>
      <span class="mini-count">${val}</span>
      <button class="mini-expand" id="btn-expand" title="Expand">▲</button>
    </div>
  `;
}

function renderMain() {
  const c = data.counters.find(x => x.id === data.activeId) || data.counters[0];
  if (!c) return renderEmpty();

  const val = getValue(c);
  const digits = String(val).split('');
  const dotCount = Math.min(Math.max(Number(val), 0), 30);

  const tabsHTML = data.counters.map(ct => `
    <button class="tab ${ct.id === data.activeId ? 'active' : ''}" data-id="${ct.id}">
      <span class="tab-emoji">${ct.emoji}</span>
      <span class="tab-label">${ct.label}</span>
    </button>
  `).join('');

  const dotsHTML = Array.from({length: dotCount}, (_, i) =>
    `<span class="dot" style="animation-delay:${i * 40}ms"></span>`
  ).join('');

  const unit = c.type === 'counter' ? '' : getUnit(c);

  const actionHTML = c.type === 'counter' ? `
    <div class="counter-actions">
      <button class="btn-round" id="btn-decrement">−</button>
      <button class="btn-round accent" id="btn-increment">+</button>
    </div>
  ` : `
    <button class="btn-reset" id="btn-reset">
      ${c.type === 'streak' ? 'Reset streak' : 'Reset'}
    </button>
  `;

  const pct = Math.min((Number(val) / 100) * 100, 100);

  return `
    <div class="widget">
      <div class="topbar">
        <div class="drag-handle" id="drag-handle" data-tauri-drag-region>
          <div class="drag-icon">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="2" x2="3" y2="14" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="6" y1="2" x2="6" y2="14" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="9" y1="2" x2="9" y2="14" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="11" y1="2" x2="13" y2="14" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
</div>
          <span class="drag-title">Tally</span>
        </div>
        <div class="topbar-actions">
          <button class="icon-btn" id="btn-add" title="Add counter">＋</button>
          <button class="icon-btn" id="btn-edit" title="Edit">✎</button>
          <button class="icon-btn" id="btn-minimize" title="Minimize">▼</button>
          <button class="icon-btn danger" id="btn-close" title="Close">✕</button>
        </div>
      </div>

      <div class="tabs-row">${tabsHTML}</div>

      <div class="counter-display">
        <div class="emoji-big">${c.emoji}</div>
        <div class="number-row">
          ${digits.map(d => `<span class="digit">${d}</span>`).join('')}
        </div>
        ${unit ? `<div class="unit-label">${unit}</div>` : ''}
        <div class="counter-label">${c.label}</div>
      </div>

      <div class="progress-area">
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pct}%"></div>
        </div>
        <div class="dots-row">${dotsHTML}</div>
      </div>

      <div class="actions-row">
        ${actionHTML}
      </div>
    </div>
  `;
}

function renderEmpty() {
  return `
    <div class="widget">
      <div class="topbar">
        <div class="drag-handle" data-tauri-drag-region>
          <div class="drag-icon">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="2" x2="3" y2="14" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="6" y1="2" x2="6" y2="14" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="9" y1="2" x2="9" y2="14" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="11" y1="2" x2="13" y2="14" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
</div>
          <span class="drag-title">Tally</span>
        </div>
        <button class="icon-btn" id="btn-add">＋</button>
      </div>
      <div class="empty-state">
        <p>No counters yet.</p>
        <button class="btn-primary" id="btn-add-2">Add one</button>
      </div>
    </div>
  `;
}

function renderEdit() {
  const c = data.counters.find(x => x.id === editingId);
  if (!c) { view = 'main'; return renderMain(); }
  return renderForm(c, 'Edit', 'save-edit');
}

function renderAdd() {
  return renderForm({
    id: null, type: 'streak', label: '', startDate: todayISO(),
    targetDate: '', count: 0, emoji: '🔥'
  }, 'New Counter', 'save-add');
}

function renderForm(c, title, saveAction) {
  const typeOpts = ['streak', 'countdown', 'counter'].map(t => `
    <label class="segment-opt ${c.type === t ? 'selected' : ''}">
      <input type="radio" name="type" value="${t}" ${c.type === t ? 'checked' : ''}>
      ${{streak:'Streak', countdown:'Countdown', counter:'Counter'}[t]}
    </label>
  `).join('');

  const extraFields = c.type === 'streak' ? `
    <label class="field-label">Start Date
      <input type="date" id="f-startDate" value="${c.startDate}">
    </label>
  ` : c.type === 'countdown' ? `
    <label class="field-label">Target Date
      <input type="date" id="f-targetDate" value="${c.targetDate || ''}">
    </label>
  ` : `
    <label class="field-label">Starting Count
      <input type="number" id="f-count" value="${c.count}" min="0">
    </label>
  `;

  return `
    <div class="widget form-view">
      <div class="topbar">
        <div class="drag-handle" id="drag-handle" data-tauri-drag-region>
          <div class="drag-icon">✎</div>
          <span class="drag-title">${title}</span>
        </div>
        <button class="icon-btn" id="btn-back" title="Back">←</button>
      </div>
      <div class="form-body">
        <div class="form-row">
          <div class="label-group" style="gap:8px">
  <label class="field-label">Icon
    <input type="text" id="f-emoji" value="${c.emoji}" maxlength="2" 
      style="font-size:22px; text-align:center; width:60px; border-radius:12px; padding:8px;">
  </label>
  <label class="field-label">Label
    <input type="text" id="f-label" value="${c.label}" placeholder="e.g. Days sober" maxlength="32">
  </label>
</div>
        </div>
        <div class="field-label">Counter Type
          <div class="segment-control">${typeOpts}</div>
        </div>
        <div id="extra-fields">${extraFields}</div>
        ${c.id ? `<button class="btn-danger" id="btn-delete">Delete counter</button>` : ''}
      </div>
      <div class="form-footer">
        <button class="btn-primary" id="btn-save" data-action="${saveAction}">Save Changes</button>
      </div>
    </div>
  `;
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  // Drag — works in both minimized and full view
  const handle = document.getElementById('drag-handle');
  if (handle) {
    handle.addEventListener('mousedown', (e) => {
      // Don't drag if clicking a button inside the handle
      if (e.target.closest('button')) return;
      startWindowDrag();
    });
  }

  // Close
  q('#btn-close')?.addEventListener('click', () => closeWindow());

  // Minimize
  q('#btn-minimize')?.addEventListener('click', () => {
    minimized = true;
    render();
    resizeWindow(160, 48);
  });

  // Expand
  q('#btn-expand')?.addEventListener('click', () => {
    minimized = false;
    render();
    resizeWindow(320, 520);
  });

  // Add
  q('#btn-add')?.addEventListener('click', () => { view = 'add'; render(); });
  q('#btn-add-2')?.addEventListener('click', () => { view = 'add'; render(); });

  // Edit
  q('#btn-edit')?.addEventListener('click', () => {
    editingId = data.activeId;
    view = 'edit';
    render();
  });

  // Back
  q('#btn-back')?.addEventListener('click', () => { view = 'main'; render(); });

  // Tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      data.activeId = Number(btn.dataset.id);
      save(data);
      render();
    });
  });

  // Reset / increment / decrement
  q('#btn-reset')?.addEventListener('click', () => {
    const c = activeCounter();
    if (!c) return;
    if (c.type === 'streak') c.startDate = todayISO();
    else if (c.type === 'countdown') c.targetDate = null;
    save(data);
    render();
  });
  q('#btn-increment')?.addEventListener('click', () => {
    const c = activeCounter();
    if (c) { c.count++; save(data); render(); }
  });
  q('#btn-decrement')?.addEventListener('click', () => {
    const c = activeCounter();
    if (c && c.count > 0) { c.count--; save(data); render(); }
  });

  // Type radio changes
  document.querySelectorAll('input[name="type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const label = q('#f-label')?.value || '';
      const emoji = q('#f-emoji')?.value || '🔥';
      const fakeC = { type: radio.value, label, emoji, startDate: todayISO(), targetDate: '', count: 0 };
      q('#extra-fields').innerHTML = renderExtraFields(fakeC);
      document.querySelectorAll('.segment-opt').forEach(el => el.classList.remove('selected'));
      radio.closest('.segment-opt').classList.add('selected');
    });
  });

  // Save form
  q('#btn-save')?.addEventListener('click', () => {
    const action = q('#btn-save').dataset.action;
    const type = document.querySelector('input[name="type"]:checked')?.value || 'streak';
    const label = q('#f-label')?.value?.trim() || 'Untitled';
    const emoji = q('#f-emoji')?.value?.trim() || '🔥';
    const startDate = q('#f-startDate')?.value || todayISO();
    const targetDate = q('#f-targetDate')?.value || null;
    const count = parseInt(q('#f-count')?.value || '0', 10);

    if (action === 'save-add') {
      const newC = { id: data.nextId++, type, label, emoji, startDate, targetDate, count };
      data.counters.push(newC);
      data.activeId = newC.id;
    } else {
      const c = data.counters.find(x => x.id === editingId);
      if (c) Object.assign(c, { type, label, emoji, startDate, targetDate, count });
    }
    save(data);
    view = 'main';
    render();
  });

  // Delete
  q('#btn-delete')?.addEventListener('click', () => {
    data.counters = data.counters.filter(x => x.id !== editingId);
    if (!data.counters.find(x => x.id === data.activeId)) {
      data.activeId = data.counters[0]?.id || null;
    }
    save(data);
    view = 'main';
    render();
  });
}

function renderExtraFields(c) {
  if (c.type === 'streak') return `<label class="field-label">Start Date<input type="date" id="f-startDate" value="${c.startDate}"></label>`;
  if (c.type === 'countdown') return `<label class="field-label">Target Date<input type="date" id="f-targetDate" value="${c.targetDate || ''}"></label>`;
  return `<label class="field-label">Starting Count<input type="number" id="f-count" value="${c.count}" min="0"></label>`;
}

function activeCounter() {
  return data.counters.find(x => x.id === data.activeId);
}

function q(sel) { return document.querySelector(sel); }

// ── Init ──────────────────────────────────────────────────────────────────────
render();

// Refresh every minute so streak counts stay live
setInterval(() => { if (view === 'main') render(); }, 60000);