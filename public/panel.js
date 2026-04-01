let pages = [];
let currentPage = 0;

// Pick up token from URL query param (?token=...) so the tablet URL carries auth automatically
const TOKEN = new URLSearchParams(window.location.search).get('token') || '';

async function init() {
  const res = await fetch('/buttons.json');
  pages = await res.json();
  renderTabs();
  renderPage(0);
}

function renderTabs() {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  pages.forEach((page, i) => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (i === currentPage ? ' active' : '');
    tab.textContent = page.page;
    tab.addEventListener('click', () => {
      currentPage = i;
      document.querySelectorAll('.tab').forEach((t, j) => {
        t.classList.toggle('active', j === i);
      });
      renderPage(i);
    });
    tabs.appendChild(tab);
  });
}

function renderPage(i) {
  const panel = document.getElementById('panel');
  panel.innerHTML = '';
  pages[i].buttons.forEach(btn => {
    const el = document.createElement('div');
    el.className = 'btn';
    el.textContent = btn.label;
    el.addEventListener('click', () => fire(el, btn));
    panel.appendChild(el);
  });
}

async function fire(el, btn) {
  const endpoint = btn.method === 'text' ? '/text' : '/key';
  const body = btn.method === 'text'
    ? { command: btn.command }
    : { key: btn.key };

  try {
    const res = await fetch(`${endpoint}?token=${encodeURIComponent(TOKEN)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    flash(el, data.ok ? 'success' : 'error');
  } catch {
    flash(el, 'error');
  }
}

function flash(el, cls) {
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 600);
}

init();
