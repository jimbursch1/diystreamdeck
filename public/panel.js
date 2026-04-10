let pages = [];
let currentPage = 0;
const token = new URLSearchParams(window.location.search).get('token') || '';

async function init() {
  const res = await fetch('/buttons.json');
  pages = await res.json();
  renderPage(0);
}

function renderPage(i) {
  const panel = document.getElementById('panel');
  panel.innerHTML = '';
  const buttons = pages[i].buttons;

  const mainIdx  = pages.findIndex(p => p.page === 'Main');
  const navPages = pages.map((p, idx) => ({ ...p, idx })).filter(p => p.page !== 'Main');

  for (let cell = 0; cell < 36; cell++) {
    const el  = document.createElement('div');
    const num = document.createElement('span');
    num.className  = 'cell-num';
    num.textContent = cell + 1;
    el.appendChild(num);

    if (cell === 35) {
      // Cell 36 — Main
      if (mainIdx >= 0) {
        el.className = 'btn nav-btn nav-main' + (mainIdx === i ? ' nav-active' : '');
        el.appendChild(document.createTextNode(pages[mainIdx].page));
        el.addEventListener('click', () => switchPage(mainIdx));
      } else {
        el.className = 'btn empty';
      }

    } else if (cell >= 30 && cell <= 34) {
      // Cells 31–35 — other pages
      const slot = cell - 30; // 0–4
      if (slot < navPages.length) {
        const np = navPages[slot];
        el.className = 'btn nav-btn' + (np.idx === i ? ' nav-active' : '');
        el.appendChild(document.createTextNode(np.page));
        el.addEventListener('click', () => switchPage(np.idx));
      } else {
        el.className = 'btn empty';
      }

    } else if (cell < buttons.length) {
      // Regular action button
      const btn = buttons[cell];
      el.className = 'btn';
      el.appendChild(document.createTextNode(btn.label));
      el.addEventListener('click', () => fire(el, btn));

    } else {
      el.className = 'btn empty';
    }

    panel.appendChild(el);
  }
}

function switchPage(idx) {
  currentPage = idx;
  renderPage(idx);
}

async function fire(el, btn) {
  const endpoint = (btn.method === 'text' || btn.method === 'paste') ? '/text'
                 : btn.method === 'console' ? '/console'
                 : btn.method === 'chat'    ? '/chat'
                 : '/key';
  const body = (btn.method === 'text' || btn.method === 'paste' || btn.method === 'console' || btn.method === 'chat')
    ? { command: btn.command, ...((btn.method === 'paste' || btn.inputMethod === 'paste') ? { method: 'paste' } : {}) }
    : { key: btn.key };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
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
