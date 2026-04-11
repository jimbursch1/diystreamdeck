let pages = [];
let currentPage = 0;
const token    = new URLSearchParams(window.location.search).get('token') || '';
const editMode = new URLSearchParams(window.location.search).has('edit');

async function init() {
  if (editMode) {
    document.getElementById('edit-banner').removeAttribute('hidden');
  }
  const res = await fetch('/buttons.json');
  pages = await res.json();
  renderPage(0);
}

function renderPage(i) {
  const panel = document.getElementById('panel');

  if (pages[i].type === 'reference') {
    renderReferencePage(i, panel);
    return;
  }

  panel.className = '';
  panel.innerHTML = '';
  const buttons = pages[i].buttons;

  const mainIdx   = pages.findIndex(p => p.page === 'Main');
  const navPages  = pages.map((p, idx) => ({ ...p, idx })).filter(p => p.page !== 'Main' && p.type !== 'reference');
  const pageLetter = String.fromCharCode(65 + i); // A, B, C…

  for (let cell = 0; cell < 36; cell++) {
    const el  = document.createElement('div');
    const num = document.createElement('span');
    num.className  = 'cell-num';
    num.textContent = pageLetter + (cell + 1);
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
      el.className = 'btn' + (editMode ? ' edit-mode' : '');
      el.appendChild(document.createTextNode(btn.label));
      if (editMode) {
        const badge = document.createElement('span');
        badge.className = 'btn-method method-' + btn.method;
        badge.textContent = btn.method;
        el.appendChild(badge);
      }
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

function renderReferencePage(i, panel) {
  panel.className = 'reference';
  const mainIdx = pages.findIndex(p => p.page === 'Main');
  panel.innerHTML = `
    <div class="ref-header">
      <span class="ref-title">CLI REFERENCE</span>
      <button class="ref-back" onclick="switchPage(${mainIdx})">&#8592; Main</button>
    </div>
    <div class="ref-content">
      <div class="ref-section">
        <div class="ref-section-title">Player</div>
        <div class="ref-row"><span class="ref-cmd">health</span><span class="ref-desc">Restore full health</span></div>
        <div class="ref-row"><span class="ref-cmd">armor</span><span class="ref-desc">Restore full armor</span></div>
        <div class="ref-row"><span class="ref-cmd">wanted [0-5]</span><span class="ref-desc">Set wanted level</span></div>
        <div class="ref-row"><span class="ref-cmd">clearwanted</span><span class="ref-desc">Clear wanted level</span></div>
        <div class="ref-row"><span class="ref-cmd">e [emote]</span><span class="ref-desc">dance dance2 dance3 salute celebrate facepalm surrender crossarms laydown sit lean coffee notepad text wave point stop</span></div>
        <div class="ref-row"><span class="ref-cmd">w [style]</span><span class="ref-desc">cop cop2 tough casual injured drunk quick stop</span></div>
        <div class="ref-row"><span class="ref-cmd">coordinates</span><span class="ref-desc">Copy player coords to clipboard</span></div>
        <div class="ref-row"><span class="ref-cmd">dp</span><span class="ref-desc">Delete ped in front (10m)</span></div>
      </div>
      <div class="ref-section">
        <div class="ref-section-title">Vehicle</div>
        <div class="ref-row"><span class="ref-cmd">spawn [model]</span><span class="ref-desc">Spawn vehicle by model name</span></div>
        <div class="ref-row"><span class="ref-cmd">repair</span><span class="ref-desc">Repair current vehicle</span></div>
        <div class="ref-row"><span class="ref-cmd">paint [color]</span><span class="ref-desc">red blue green yellow black white orange purple pink gray</span></div>
        <div class="ref-row"><span class="ref-cmd">boost</span><span class="ref-desc">Speed boost</span></div>
        <div class="ref-row"><span class="ref-cmd">siren</span><span class="ref-desc">Cycle: off → lights only → lights+sound</span></div>
        <div class="ref-row"><span class="ref-cmd">dv</span><span class="ref-desc">Delete vehicle in front (10m)</span></div>
      </div>
      <div class="ref-section">
        <div class="ref-section-title">World</div>
        <div class="ref-row"><span class="ref-cmd">time [HH:MM]</span><span class="ref-desc">Set time</span></div>
        <div class="ref-row"><span class="ref-cmd">morning</span><span class="ref-desc">Set time to 05:00</span></div>
        <div class="ref-row"><span class="ref-cmd">weather [type]</span><span class="ref-desc">clear rain fog overcast thunder snow</span></div>
        <div class="ref-row"><span class="ref-cmd">tp [target]</span><span class="ref-desc">waypoint missionrow vespucci field — or X Y Z coords</span></div>
        <div class="ref-row"><span class="ref-cmd">tf [sub]</span><span class="ref-desc">thintraffic slowtraffic stoptraffic clearvehicles deletevehicle</span></div>
      </div>
      <div class="ref-section">
        <div class="ref-section-title">Spawn</div>
        <div class="ref-row"><span class="ref-cmd">ped [model]</span><span class="ref-desc">Spawn ped by model name</span></div>
        <div class="ref-row"><span class="ref-cmd">object [model]</span><span class="ref-desc">Spawn prop by model name</span></div>
        <div class="ref-row"><span class="ref-cmd">harvey</span><span class="ref-desc">Spawn Harvey and Pugsley</span></div>
      </div>
      <div class="ref-section">
        <div class="ref-section-title">LSPDFR</div>
        <div class="ref-row"><span class="ref-cmd">gohere</span><span class="ref-desc">Order camera-targeted ped to follow</span></div>
        <div class="ref-row"><span class="ref-cmd">grab</span><span class="ref-desc">Grab/escort ped (camera target, 3m)</span></div>
        <div class="ref-row"><span class="ref-cmd">arrest</span><span class="ref-desc">Arrest ped (camera target, 5m)</span></div>
        <div class="ref-row"><span class="ref-cmd">placeincar</span><span class="ref-desc">Place arrested ped in vehicle backseat</span></div>
        <div class="ref-row"><span class="ref-cmd">takeoutcar</span><span class="ref-desc">Remove ped from vehicle</span></div>
        <div class="ref-row"><span class="ref-cmd">inoutcar</span><span class="ref-desc">Toggle ped in/out of vehicle</span></div>
        <div class="ref-row"><span class="ref-cmd">pursuit [end]</span><span class="ref-desc">Pursuit control</span></div>
        <div class="ref-row"><span class="ref-cmd">backup</span><span class="ref-desc">Call backup</span></div>
        <div class="ref-row"><span class="ref-cmd">duty</span><span class="ref-desc">Go on duty</span></div>
        <div class="ref-row"><span class="ref-cmd">cad</span><span class="ref-desc">Computer Aided Dispatch</span></div>
      </div>
      <div class="ref-section">
        <div class="ref-section-title">PedPsych — pp</div>
        <div class="ref-row"><span class="ref-cmd">pp id</span><span class="ref-desc">Identify/track camera-targeted ped</span></div>
        <div class="ref-row"><span class="ref-cmd">pp detain</span><span class="ref-desc">Detain camera-targeted ped</span></div>
        <div class="ref-row"><span class="ref-cmd">pp release</span><span class="ref-desc">Release camera-targeted ped</span></div>
        <div class="ref-row"><span class="ref-cmd">pp cite</span><span class="ref-desc">Issue citation to nearest ped</span></div>
        <div class="ref-row"><span class="ref-cmd">pp card</span><span class="ref-desc">Give business card to nearest ped</span></div>
        <div class="ref-row"><span class="ref-cmd">pp info</span><span class="ref-desc">Show ped info on screen</span></div>
        <div class="ref-row"><span class="ref-cmd">pp list</span><span class="ref-desc">List all tracked peds</span></div>
        <div class="ref-row"><span class="ref-cmd">pp profile [#n | id]</span><span class="ref-desc">View ped profile</span></div>
        <div class="ref-row"><span class="ref-cmd">pp profiles</span><span class="ref-desc">List all saved profiles</span></div>
        <div class="ref-row"><span class="ref-cmd">pp note [#n | id] "text"</span><span class="ref-desc">Add note to ped</span></div>
        <div class="ref-row"><span class="ref-cmd">pp spawn [limit]</span><span class="ref-desc">Spawn peds from saved profiles</span></div>
        <div class="ref-row"><span class="ref-cmd">pp stress [low|elevated|high]</span><span class="ref-desc">Set community stress level</span></div>
        <div class="ref-row"><span class="ref-cmd">pp reset</span><span class="ref-desc">Reset ped state</span></div>
        <div class="ref-row"><span class="ref-cmd">pp log</span><span class="ref-desc">Open log entry keyboard</span></div>
        <div class="ref-row"><span class="ref-cmd">pp ss</span><span class="ref-desc">Screenshot</span></div>
        <div class="ref-row"><span class="ref-cmd">pp help</span><span class="ref-desc">PedPsych help</span></div>
      </div>
      <div class="ref-section">
        <div class="ref-section-title">BOW / EOW</div>
        <div class="ref-row"><span class="ref-cmd">bow</span><span class="ref-desc">Beginning of Watch — start patrol log</span></div>
        <div class="ref-row"><span class="ref-cmd">eow</span><span class="ref-desc">End of Watch — export and upload log</span></div>
      </div>
      <div class="ref-section">
        <div class="ref-section-title">Ambient</div>
        <div class="ref-row"><span class="ref-cmd">ambient [sub]</span><span class="ref-desc">trigger on off status</span></div>
      </div>
      <div class="ref-section">
        <div class="ref-section-title">Utility</div>
        <div class="ref-row"><span class="ref-cmd">keybind / kb</span><span class="ref-desc">Manage keybinds [key "cmd" | list | remove | clear]</span></div>
        <div class="ref-row"><span class="ref-cmd">help</span><span class="ref-desc">Show all commands in-game</span></div>
        <div class="ref-row"><span class="ref-cmd">clear</span><span class="ref-desc">Clear CLI screen</span></div>
      </div>
    </div>
  `;
}

async function fire(el, btn) {
  if (editMode) return;
  if (btn.method === 'page') {
    const idx = pages.findIndex(p => p.page === btn.page);
    if (idx >= 0) switchPage(idx);
    return;
  }
  const endpoint = (btn.method === 'text' || btn.method === 'paste') ? '/text'
                 : btn.method === 'console' ? '/console'
                 : btn.method === 'chat'    ? '/chat'
                 : '/key';
  const body = (btn.method === 'text' || btn.method === 'paste' || btn.method === 'console' || btn.method === 'chat')
    ? { command: btn.command, ...(btn.method === 'paste' ? { method: 'paste' } : {}) }
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
