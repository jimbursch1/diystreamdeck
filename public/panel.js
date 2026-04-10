let pages = [];
let currentPage = 0;
const token = new URLSearchParams(window.location.search).get('token') || '';

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
    tab.className = 'tab' + (i === currentPage ? ' active' : '') + (page.page === 'Main' ? ' tab-main' : '');
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
  const buttons = pages[i].buttons;
  for (let cell = 0; cell < 64; cell++) {
    const el = document.createElement('div');
    const num = document.createElement('span');
    num.className = 'cell-num';
    num.textContent = cell + 1;
    el.appendChild(num);
    if (cell < buttons.length) {
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

async function fire(el, btn) {
  const endpoint = btn.method === 'text'    ? '/text'
                 : btn.method === 'console' ? '/console'
                 : btn.method === 'chat'    ? '/chat'
                 : '/key';
  const body = (btn.method === 'text' || btn.method === 'console' || btn.method === 'chat')
    ? { command: btn.command }
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
