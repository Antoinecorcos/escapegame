// ===== PLAYER APP (phone) =====
(function () {
  const C = window.CONTENT, S = window.Sync, U = window.U, G = U.game;
  const { $, $$, esc, html } = U;
  const qs = new URLSearchParams(location.search);
  const store = S.mode === 'local' ? sessionStorage : localStorage; // local mode: one player per tab

  const ME = {
    team: qs.get('team'),
    pid: qs.get('pid') || store.getItem('eg-pid') || Math.random().toString(36).slice(2, 10),
    pkey: null,
  };
  store.setItem('eg-pid', ME.pid);

  const st = { game: null, event: null, team: null, otherStage: 0, otherFinished: null, claim: null };
  const app = $('#app');
  let screen = { key: null, comp: null };
  let eventComp = { key: null, comp: null };
  let lastStage = null;

  // ---------- derived ----------
  const players = () => U.players(st.team);
  const myIndex = () => players().findIndex((p) => p.pkey === ME.pkey);
  const stage = () => U.stageOf(st.team);
  const now = () => S.now();
  const timeLeft = () => (st.game && st.game.startAt ? st.game.startAt + st.game.duration - now() : 0);
  // cards distribution: card i goes to player (i % n)
  const myCards = (count) => {
    const n = players().length, me = myIndex();
    if (me < 0 || me >= count) return [];
    return Array.from({ length: count }, (_, i) => i).filter((i) => i % n === me);
  };

  // ---------- subscriptions ----------
  function subscribe() {
    S.on('game', (v) => { st.game = v; render(); });
    S.on('event', (v) => { st.event = v; render(); });
    S.on(`teams/${ME.team}`, (v) => {
      st.team = v;
      const p = U.players(v).find((x) => x.id === ME.pid);
      ME.pkey = p ? p.pkey : null;
      const sg = U.stageOf(v);
      if (lastStage !== null && sg > lastStage) celebrate(sg);
      lastStage = sg;
      render();
    });
    S.on(`teams/${U.other(ME.team)}/stage`, (v) => { st.otherStage = v || 0; renderHud(); });
    S.on(`teams/${U.other(ME.team)}/finishedAt`, (v) => { st.otherFinished = v; });
    S.on(`claims/${ME.team}_${ME.pid}`, (v) => { st.claim = v; renderSheet(); });
  }

  function celebrate(sg) {
    U.audio.jingle();
    const r = C.stages[sg - 1] && C.stages[sg - 1].reward;
    toast(`✅ Stage cleared! ${r ? 'New card in your 🎒' : ''}`);
  }
  function toast(msg) {
    const t = html(`<div class="toast">${esc(msg)}</div>`);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // ---------- main render ----------
  function render() {
    let key, make;
    if (!ME.team || !C.teams[ME.team]) { key = 'pickteam'; make = PickTeam; }
    else if (!ME.pkey) { key = 'join'; make = Join; }
    else if (!st.game || st.game.status === 'lobby' || !st.game.status) { key = 'lobby'; make = Lobby; }
    else if (st.team && (st.team.finishedAt || stage() >= U.NSTAGES)) { key = 'finished'; make = Finished; }
    else if (st.game.status === 'ended' || timeLeft() <= 0) { key = 'ended'; make = Ended; }
    else { key = 'stage' + stage(); make = STAGES[C.stages[stage()].id]; }

    document.body.dataset.team = ME.team || '';
    if (key !== screen.key) {
      if (screen.comp && screen.comp.destroy) screen.comp.destroy();
      const main = $('#main');
      main.innerHTML = '';
      screen = { key, comp: make(main) };
      main.scrollTop = 0; window.scrollTo(0, 0);
    }
    if (screen.comp && screen.comp.update) screen.comp.update();
    renderHud();
    renderEvent();
  }

  function renderHud() {
    const hud = $('#hud');
    const inGame = ME.pkey && st.game && st.game.status === 'running';
    hud.hidden = !ME.pkey;
    if (!ME.pkey) return;
    const T = C.teams[ME.team];
    const sg = stage();
    const stg = C.stages[Math.min(sg, U.NSTAGES - 1)];
    const tokens = (st.team && st.team.tokens) || 0;
    hud.innerHTML = `
      <div class="hud-row">
        <span class="badge" style="background:${T.color}">${esc(T.name)}</span>
        <span class="hud-title">${inGame && sg < U.NSTAGES ? `${stg.icon} ${sg + 1}/${U.NSTAGES} · ${esc(C.places[stg.place].label)}` : ''}</span>
        <span class="timer" id="hud-timer">${inGame ? U.fmt(timeLeft()) : ''}</span>
      </div>
      <div class="hud-row small">
        <button class="chip" data-act="bag">🎒 Inventory</button>
        <button class="chip" data-act="mission">🕵️ Mission</button>
        ${inGame ? `<button class="chip" data-act="hint">💡 Hint</button>` : ''}
        <span class="chip ghost" title="Hint tokens">🎟️ ${tokens}</span>
        ${inGame ? `<span class="chip ghost">${C.teams[U.other(ME.team)].emoji} ${Math.min(st.otherStage, U.NSTAGES)}/${U.NSTAGES}</span>` : ''}
      </div>`;
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'bag') openSheet('bag');
    if (act === 'mission') openSheet('mission');
    if (act === 'close-sheet') closeSheet();
    if (act === 'hint') askHint();
    if (act === 'claim') claimMission();
  });

  // ---------- sheets (inventory / mission) ----------
  let sheetMode = null;
  function openSheet(m) { sheetMode = m; renderSheet(); }
  function closeSheet() { sheetMode = null; renderSheet(); }
  function missionText() {
    const slot = parseInt((ME.pkey || 'p1').slice(1)) - 1;
    const off = ME.team === 'blue' ? 6 : 0;
    return C.missions[(slot + off) % C.missions.length];
  }
  function renderSheet() {
    const el = $('#sheet');
    if (!sheetMode) { el.hidden = true; return; }
    el.hidden = false;
    let body = '';
    if (sheetMode === 'bag') {
      const got = C.stages.slice(0, stage()).map((s) => s.reward).filter(Boolean);
      body = `<h2>🎒 Inventory</h2>${got.length ? got.map((r) => `<div class="card reward"><span class="big">${r.icon}</span><p>${esc(r.text)}</p></div>`).join('') : '<p class="muted">Nothing yet. Clear stages to collect cards… you will need them at the end!</p>'}`;
    } else {
      const c = st.claim;
      const status = !c ? '' : c.status === 'pending' ? '<p class="muted">⏳ Waiting for the game master…</p>' : c.status === 'ok' ? '<p class="ok">✅ Validated! +1 hint token for your team.</p>' : '<p class="bad">❌ Refused. Try again!</p>';
      body = `<h2>🕵️ Secret mission</h2>
        <p class="muted">Only you can see this. Don't show it to anyone!</p>
        <div class="card mission"><p>${esc(missionText())}</p></div>
        ${status}
        ${!c || c.status === 'no' ? '<button class="btn" data-act="claim">I did it! (game master will check)</button>' : ''}`;
    }
    el.innerHTML = `<div class="sheet-inner">${body}<button class="btn ghost" data-act="close-sheet">Close</button></div>`;
  }
  function claimMission() {
    const me = players().find((p) => p.pkey === ME.pkey);
    S.set(`claims/${ME.team}_${ME.pid}`, { team: ME.team, name: me ? me.name : '?', mission: missionText(), status: 'pending', at: now() });
  }

  function askHint() {
    const sg = stage();
    const tokens = (st.team && st.team.tokens) || 0;
    const shown = (st.team && st.team.hints && st.team.hints['h' + sg]) || 0;
    if (shown >= C.stages[sg].hints.length) { toast('No more hints for this stage!'); return; }
    const msg = tokens > 0 ? 'Use 1 hint token? Your whole team will see the hint.' : 'No hint token left: a hint costs a 30-second zombie attack. Go?';
    if (confirm(msg)) G.useHint(ME.team, sg);
  }
  function hintsBlock(sg) {
    const n = (st.team && st.team.hints && st.team.hints['h' + sg]) || 0;
    const hs = C.stages[sg].hints.slice(0, n);
    return hs.length ? `<div class="hints">${hs.map((h) => `<div class="hint">💡 ${esc(h)}</div>`).join('')}</div>` : '';
  }
  // helper used by stages: keep a hints container up to date
  function hintsUpdater(container, sg) {
    let last = null;
    return () => { const h = hintsBlock(sg); if (h !== last) { container.innerHTML = h; last = h; } };
  }

  // ---------- overlays: lock + events ----------
  function renderLock() {
    const el = $('#lock');
    const until = (st.team && st.team.lockUntil) || 0;
    const left = until - now();
    const active = ME.pkey && left > 0 && st.game && st.game.status === 'running' && !(st.team && st.team.finishedAt);
    if (!active) { if (!el.hidden) el.hidden = true; return; }
    if (el.hidden) {
      el.hidden = false;
      U.audio.groan();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      el.innerHTML = `<div class="horde">${U.zombie(70)}${U.zombie(90)}${U.zombie(70)}</div>
        <h2>${esc((st.team && st.team.lockReason) || 'Zombie attack!')}</h2>
        <p>Hold the barricade…</p><div class="lock-timer" id="lock-timer"></div>`;
    }
    $('#lock-timer').textContent = U.fmt(left);
  }

  function renderEvent() {
    const el = $('#event');
    const ev = st.event;
    const show = ME.pkey && ev && st.game && st.game.status === 'running';
    const key = show ? ev.type + ':' + ev.startAt + ':' + (ev.phase || '') : null;
    if (key !== eventComp.key) {
      if (eventComp.comp && eventComp.comp.destroy) eventComp.comp.destroy();
      eventComp = { key, comp: null };
      el.innerHTML = '';
      el.hidden = !show;
      if (show) eventComp.comp = (ev.type === 'raid' ? Raid : Karaoke)(el, ev);
    }
    if (eventComp.comp && eventComp.comp.update) eventComp.comp.update(ev);
  }

  setInterval(() => {
    const t = $('#hud-timer');
    if (t && st.game && st.game.status === 'running') t.textContent = U.fmt(timeLeft());
    renderLock();
    if (screen.comp && screen.comp.tick) screen.comp.tick();
    if (eventComp.comp && eventComp.comp.tick) eventComp.comp.tick();
    if (st.game && st.game.status === 'running' && timeLeft() <= 0 && screen.key !== 'ended' && screen.key !== 'finished') render();
  }, 250);

  // ================= SCREENS =================
  function PickTeam(main) {
    main.innerHTML = `<div class="center">
      <div class="hero">${U.zombie(110)}</div>
      <h1>${esc(C.title)}</h1><p>Choose your team</p>
      ${U.TEAMS.map((t) => `<a class="btn big" style="background:${C.teams[t].color}" href="?team=${t}">${esc(C.teams[t].name)}</a>`).join('')}
    </div>`;
    return {};
  }

  function Join(main) {
    const T = C.teams[ME.team];
    main.innerHTML = `<div class="center">
      <div class="hero">${U.zombie(110)}</div>
      <h1>${esc(C.title)}</h1>
      <p class="badge big" style="background:${T.color}">${esc(T.name)}</p>
      <p>${esc(C.tagline)}</p>
      <form id="join" class="stack">
        <input id="name" maxlength="16" placeholder="Your first name" autocomplete="off" required value="${esc(store.getItem('eg-name') || '')}">
        <button class="btn big">Join the march ✊</button>
      </form>
      <p class="muted" id="join-msg"></p>
    </div>`;
    $('#join', main).addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#name', main).value.trim().slice(0, 16);
      if (!name) return;
      store.setItem('eg-name', name);
      U.audio.ctx();
      const r = await S.transaction(`teams/${ME.team}/players`, (cur) => {
        cur = cur || {};
        const mine = Object.keys(cur).find((k) => cur[k] && cur[k].id === ME.pid);
        if (mine) { cur[mine].name = name; return cur; }
        for (let i = 1; i <= 8; i++) if (!cur['p' + i]) { cur['p' + i] = { id: ME.pid, name }; return cur; }
        return undefined;
      });
      if (!r.committed) $('#join-msg', main).textContent = 'This team is full!';
    });
    return {};
  }

  function Lobby(main) {
    const box = html('<div class="center"></div>');
    main.appendChild(box);
    return {
      update() {
        const T = C.teams[ME.team];
        box.innerHTML = `<div class="hero">${U.zombie(100)}</div>
          <h1>Ready, ${esc((players().find((p) => p.pkey === ME.pkey) || {}).name || '')}?</h1>
          <p>You are in the <b style="color:${T.color}">${esc(T.name)}</b>.</p>
          <div class="card"><p>${esc(C.tagline)}</p>
          <ul class="rules">
            <li>📱 Each phone shows <b>different clues</b>: talk to your team (in English!).</li>
            <li>❌ Wrong answers = zombie attack: your team is frozen for a while.</li>
            <li>💡 Hints cost a token… or 30 seconds.</li>
            <li>⚔️ Watch the board: duels can start at any time!</li>
            <li>🕵️ Check your secret mission now (button above).</li>
          </ul></div>
          <h3>Your team (${players().length})</h3>
          <p>${players().map((p) => `<span class="chip">${esc(p.name)}</span>`).join(' ')}</p>
          <p class="muted pulse">Waiting for the game master to start…</p>`;
      },
    };
  }

  function Finished(main) {
    const mine = st.team.finishedAt || now(), other = st.otherFinished;
    const first = !other || mine <= other;
    main.innerHTML = `<div class="center">
      <div class="hero">🏆</div>
      <h1>${first ? 'You saved Paris!' : 'Bunker opened!'}</h1>
      <p>${first ? 'Your march reached the Élysée first. The kepi zombies are defeated!' : 'The other team was faster this time… but you made it!'}</p>
      <p class="muted">Look at the board.</p></div>`;
    return {};
  }

  function Ended(main) {
    main.innerHTML = `<div class="center"><div class="horde">${U.zombie(70)}${U.zombie(90)}${U.zombie(70)}</div>
      <h1>Time's up!</h1><p>The kepi zombies have taken Paris… Look at the board.</p></div>`;
    return {};
  }

  function stageShell(main, sg) {
    const s = C.stages[sg];
    main.innerHTML = `<section class="stage">
      <h1>${s.icon} ${esc(s.title)}</h1>
      <p class="place">📍 ${esc(C.places[s.place].label)}</p>
      <div class="card intro"><p>${esc(s.intro)}</p></div>
      <div class="body"></div>
      <div class="hints-wrap"></div>
    </section>`;
    return { s, body: $('.body', main), hints: hintsUpdater($('.hints-wrap', main), sg) };
  }

  // ---------- shared bits ----------
  function keypad(container, len, onSubmit) {
    let code = '';
    container.innerHTML = `<div class="code-display"></div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✔'].map((k) => `<button class="btn key" data-k="${k}">${k}</button>`).join('')}</div>`;
    const disp = $('.code-display', container);
    const show = () => { disp.textContent = (code + '_'.repeat(len)).slice(0, len).split('').join(' '); };
    container.addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]'); if (!k) return;
      const v = k.dataset.k;
      if (v === '⌫') code = code.slice(0, -1);
      else if (v === '✔') { if (code.length === len) { onSubmit(code); code = ''; } }
      else if (code.length < len) { code += v; U.audio.tone(600 + (+v) * 40, 0.08, 'square', 0, 0.08); }
      show();
    });
    show();
  }

  // ---------- STAGE: riddles -> letter padlock ----------
  function Riddles(main) {
    const { s, body, hints } = stageShell(main, 0);
    let lastN = -1;
    body.innerHTML = `<div class="cards"></div>
      <div class="card lock-card"><div class="padlock">🔒</div>
      <form class="answer stack"><label>Letter padlock (${s.answer.length} letters)</label>
        <input name="a" maxlength="12" autocomplete="off" autocapitalize="characters" placeholder="${'?'.repeat(s.answer.length)}">
        <button class="btn">Open the padlock</button></form></div>`;
    $('.answer', body).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = U.norm(e.target.a.value);
      if (!v) return;
      if (v === U.norm(s.answer)) G.advance(ME.team, 0);
      else { e.target.a.value = ''; G.lock(ME.team, s.lockSeconds, 'Wrong combination! The padlock was booby-trapped…'); }
    });
    return {
      update() {
        hints();
        const n = players().length;
        if (n === lastN) return;
        lastN = n;
        const mine = myCards(s.riddles.length);
        $('.cards', body).innerHTML = mine.length
          ? mine.map((i) => `<div class="card riddle"><span class="num">#${i + 1}</span><p>${esc(s.riddles[i])}</p></div>`).join('')
          : '<p class="muted">Your teammates hold the riddles. Help them!</p>';
      },
    };
  }

  // ---------- STAGE: emoji cipher -> digicode ----------
  function Cipher(main) {
    const { s, body, hints } = stageShell(main, 1);
    let lastN = -1;
    const words = s.message.split(' ');
    body.innerHTML = `<div class="card"><p><b>📻 Intercepted message</b> <small class="muted">(tap under an emoji to write its letter)</small></p>
      <div class="cipher">${words.map((w) => `<span class="cw">${w.split('').map((ch) => `<label class="ce"><span>${s.key[ch]}</span><input maxlength="1" data-e="${s.key[ch]}" autocomplete="off" autocapitalize="characters"></label>`).join('')}</span>`).join('')}</div></div>
      <div class="cards"></div>
      <div class="card"><p><b>🚇 Metro gate code</b></p><div class="kp"></div></div>`;
    // the same emoji gets the same letter everywhere
    body.addEventListener('input', (e) => {
      const i = e.target.closest('[data-e]'); if (!i) return;
      $$(`[data-e="${i.dataset.e}"]`, body).forEach((x) => { x.value = i.value.toUpperCase(); });
    });
    keypad($('.kp', body), s.answer.length, (code) => {
      if (code === s.answer) G.advance(ME.team, 1);
      else G.lock(ME.team, s.lockSeconds, 'WRONG CODE! The metro gate calls the zombies…');
    });
    return {
      update() {
        hints();
        const n = players().length;
        if (n === lastN) return;
        lastN = n;
        const mine = myCards(s.cards.length);
        $('.cards', body).innerHTML = mine.length
          ? mine.map((i) => `<div class="card keycard"><b>🔑 Key piece ${i + 1}/${s.cards.length}</b><div class="keys">${s.cards[i].map((l) => `<span class="kv">${s.key[l]} = <b>${l}</b></span>`).join('')}</div></div>`).join('')
          : '<p class="muted">Your teammates hold the key pieces. Ask them!</p>';
      },
    };
  }

  // ---------- STAGE: six-seven (judged by the game master) ----------
  function SixSeven(main) {
    const { s, body, hints } = stageShell(main, 2);
    body.innerHTML = '<div class="center"><div class="sixseven-hero">🤲</div><div class="judge-box"></div></div>';
    body.addEventListener('click', (e) => {
      if (e.target.closest('[data-judge]')) S.set(`teams/${ME.team}/judge`, now());
    });
    let last = null;
    return {
      update() {
        hints();
        const j = !!(st.team && st.team.judge);
        if (j === last) return;
        last = j;
        $('.judge-box', body).innerHTML = j
          ? '<h2 class="pulse">👀 The judge is watching!</h2><p>Everybody stands up, faces the board and does the gesture NOW: <b>“SIX… SEVEN!”</b></p>'
          : '<p>When your whole team is ready, call the judge.</p><button class="btn big" data-judge>🙋 We are ready! Call the judge</button>';
      },
    };
  }

  // ---------- STAGE: pictionary (Louvre) ----------
  function Pictionary(main) {
    const { s, body, hints } = stageShell(main, 3);
    const words = s.words[ME.team];
    const pic = () => (st.team && st.team.pic) || {};
    const wi = () => pic().wi || 0;
    const drawer = () => { const ps = players(); return ps.length ? ps[wi() % ps.length] : null; };
    let rendered = null, canvasApi = null, lastImg = null, busy = false;

    async function next(found, imgForGallery) {
      if (busy) return; busy = true;
      const myWi = wi(), d = drawer();
      const r = await S.transaction(`teams/${ME.team}/pic`, (cur) => {
        cur = cur || {};
        if ((cur.wi || 0) !== myWi) return undefined;
        cur.wi = myWi + 1; cur.img = null;
        if (found) {
          cur.found = (cur.found || 0) + 1;
          cur.gallery = cur.gallery || {};
          cur.gallery['g' + myWi] = { img: imgForGallery || '', word: words[myWi % words.length].w, by: d ? d.name : '?' };
        }
        return cur;
      });
      busy = false;
      if (r.committed && found && (r.value.found || 0) >= s.rounds) G.advance(ME.team, 3);
      return r.committed;
    }

    function view() {
      const d = drawer(), w = words[wi() % words.length];
      const progress = `<p class="progress-line">🖼️ Drawings found: <b>${pic().found || 0}/${s.rounds}</b></p>`;
      if (d && d.pkey === ME.pkey) {
        return `${progress}<div class="card"><p>🎨 <b>You draw!</b> Your word: <span class="word">${esc(w.w)}</span></p>
          <p class="muted">No letters, no numbers, no talking! Your team sees your drawing live.</p>
          <canvas width="360" height="300"></canvas>
          <div class="row colors">${['#111', '#c62828', '#1e5bd8', '#2e7d32', '#f2c94c'].map((c) => `<button class="swatch" data-color="${c}" style="background:${c}"></button>`).join('')}
          <button class="btn small ghost" data-clear>Clear</button></div>
          <button class="btn small ghost" data-skip>Too hard? Skip this word (−${s.skipSeconds}s)</button></div>`;
      }
      return `${progress}<div class="card"><p><b>${esc(d ? d.name : '?')}</b> is drawing… What is it? <b>Answer in English!</b></p>
        <img class="drawing live" alt="live drawing">
        <form class="guess row"><input name="g" autocomplete="off" placeholder="It's a…"><button class="btn">Guess</button></form>
        <p class="guess-msg muted"></p></div>`;
    }

    body.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-color]');
      if (c && canvasApi) canvasApi.color(c.dataset.color);
      if (e.target.closest('[data-clear]') && canvasApi) { canvasApi.clear(); push(); }
      if (e.target.closest('[data-skip]') && confirm('Skip this word? The zombies will attack for a few seconds.')) {
        if (await next(false)) G.lock(ME.team, s.skipSeconds, 'You skipped a word… the zombie guard is angry!');
      }
    });
    body.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target.closest('.guess'); if (!f) return;
      const g = U.norm(f.g.value); if (!g) return;
      const w = words[wi() % words.length];
      if (w.ok.some((a) => g.includes(U.norm(a)))) { U.audio.jingle(); next(true, pic().img); }
      else { $('.guess-msg', body).textContent = `❌ "${f.g.value}"? Nope! Try again.`; f.g.value = ''; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
    });

    let pushT = null;
    function push() {
      if (!canvasApi) return;
      clearTimeout(pushT);
      pushT = setTimeout(() => S.set(`teams/${ME.team}/pic/img`, canvasApi.export()), 300);
    }

    return {
      update() {
        hints();
        const d = drawer();
        const key = wi() + ':' + (d ? d.pkey : '');
        if (key !== rendered) {
          rendered = key; lastImg = null;
          body.innerHTML = view();
          const cv = $('canvas', body);
          canvasApi = cv ? drawingCanvas(cv, push) : null;
        }
        const img = $('img.live', body);
        const src = pic().img;
        if (img && src !== lastImg) { lastImg = src; if (src) img.src = src; else img.removeAttribute('src'); }
        const pl = $('.progress-line b', body); if (pl) pl.textContent = `${pic().found || 0}/${s.rounds}`;
      },
    };
  }

  function drawingCanvas(cv, onChange) {
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
    let drawing = false, lastPush = 0;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (cv.width / r.width), (e.clientY - r.top) * (cv.height / r.height)]; };
    cv.addEventListener('pointerdown', (e) => { drawing = true; cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y); ctx.stroke(); });
    cv.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke();
      if (onChange && Date.now() - lastPush > 900) { lastPush = Date.now(); onChange(); }
    });
    const stop = () => { if (drawing && onChange) onChange(); drawing = false; };
    cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
    return {
      color: (c) => { ctx.strokeStyle = c; },
      clear: () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); },
      export: () => cv.toDataURL('image/jpeg', 0.6),
    };
  }

  // ---------- STAGE: bunker ----------
  function Bunker(main) {
    const { s, body, hints } = stageShell(main, 4);
    let lastN = -1;
    body.innerHTML = `<div class="boss">${U.zombie(130, { general: true })}</div><div class="cards"></div><div class="card kp"></div>`;
    keypad($('.kp', body), s.answer.length, (code) => {
      if (code === s.answer) G.advance(ME.team, 4);
      else G.lock(ME.team, s.lockSeconds, 'WRONG CODE! The General releases his horde!');
    });
    return {
      update() {
        hints();
        const n = players().length;
        if (n === lastN) return;
        lastN = n;
        const mine = myCards(s.lines.length);
        $('.cards', body).innerHTML = mine.length ? mine.map((i) => `<div class="card speech">🪖 “${esc(s.lines[i])}”</div>`).join('') : '<p class="muted">Your teammates heard the General. Listen to them!</p>';
      },
    };
  }

  const STAGES = { riddles: Riddles, cipher: Cipher, sixseven: SixSeven, pictionary: Pictionary, bunker: Bunker };

  // ================= EVENTS (duels) =================
  function eventResult(ev) {
    if (ev.phase !== 'done') return '';
    if (ev.winner === 'draw') return '<h2>Draw!</h2>';
    const w = C.teams[ev.winner];
    return `<h2 style="color:${w.color}">🏆 ${esc(w.name)} wins the duel!</h2><p>${ev.winner === ME.team ? '+1 hint token for your team 🎟️' : 'The horde is coming for you…'}</p>`;
  }

  function Raid(el, ev) {
    const R = C.raid;
    if (ev.phase === 'done' || now() > ev.endAt) {
      el.innerHTML = `<div class="center pad">${eventResult(ev) || '<h2>⏱ Time!</h2>'}<p class="muted">Look at the board.</p></div>`;
      return {};
    }
    el.innerHTML = `<div class="raid">
      <div class="raid-hud"><b>⚔️ ${esc(R.title)}</b><span class="raid-score">0</span><span class="raid-time"></span></div>
      <p class="raid-help">${esc(R.instructions)}</p>
      <canvas></canvas></div>`;
    const cv = $('canvas', el), ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, H;
    const resize = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener('resize', resize);
    const zImg = new Image(); zImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(U.zombie(100).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
    let objs = [], fx = [], score = 0, sent = -1, last = performance.now(), spawnT = 0, trail = [], raf;
    const spawn = () => {
      const tourist = Math.random() < 0.22;
      objs.push({ x: 40 + Math.random() * (W - 80), y: H + 40, vx: (Math.random() - 0.5) * 120, vy: -(H * 1.05 + Math.random() * H * 0.35), r: 34, tourist, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 4 });
    };
    function hit(x1, y1, x2, y2) {
      objs.forEach((o) => {
        if (o.dead) return;
        const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((o.x - x1) * dx + (o.y - y1) * dy) / l2));
        const px = x1 + t * dx, py = y1 + t * dy;
        if ((o.x - px) ** 2 + (o.y - py) ** 2 < o.r * o.r) {
          o.dead = true;
          score += o.tourist ? -3 : 1;
          U.audio.splat(!o.tourist);
          if (o.tourist && navigator.vibrate) navigator.vibrate(150);
          fx.push({ x: o.x, y: o.y, t: 0, txt: o.tourist ? '−3' : '+1', bad: o.tourist });
        }
      });
    }
    let prev = null;
    cv.addEventListener('pointerdown', (e) => { const r = cv.getBoundingClientRect(); prev = [e.clientX - r.left, e.clientY - r.top]; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => {
      if (!prev) return;
      const r = cv.getBoundingClientRect(), p = [e.clientX - r.left, e.clientY - r.top];
      hit(prev[0], prev[1], p[0], p[1]); trail.push({ x: p[0], y: p[1], t: 0 }); prev = p;
    });
    const up = () => { prev = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const running = now() < ev.endAt;
      spawnT -= dt;
      if (running && spawnT <= 0) { spawn(); if (Math.random() < 0.35) spawn(); spawnT = 0.55; }
      const g = H * 1.1;
      ctx.clearRect(0, 0, W, H);
      objs.forEach((o) => {
        o.vy += g * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
        if (o.dead) return;
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(Math.sin(o.rot) * 0.4);
        if (o.tourist) { ctx.font = '56px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🤳', 0, 0); }
        else ctx.drawImage(zImg, -36, -40, 72, 80);
        ctx.restore();
      });
      objs = objs.filter((o) => !o.dead && o.y < H + 80);
      trail.forEach((p) => (p.t += dt)); trail = trail.filter((p) => p.t < 0.15);
      if (trail.length > 1) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); trail.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); }
      fx.forEach((f) => { f.t += dt; ctx.globalAlpha = Math.max(0, 1 - f.t); ctx.fillStyle = f.bad ? '#ff5a5a' : '#b6f36b'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.txt, f.x, f.y - f.t * 60); ctx.globalAlpha = 1; });
      fx = fx.filter((f) => f.t < 1);
      $('.raid-score', el).textContent = score;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const sync = setInterval(() => { if (score !== sent) { sent = score; S.set(`raid/${ME.team}/${ME.pkey}`, score); } }, 700);
    return {
      tick() {
        const left = ev.endAt - now();
        $('.raid-time', el).textContent = '⏱ ' + U.fmt(left);
        if (left <= 0) { $('.raid-help', el).textContent = `⏱ Time! Your score: ${score}. Look at the board!`; S.set(`raid/${ME.team}/${ME.pkey}`, score); }
      },
      destroy() { cancelAnimationFrame(raf); clearInterval(sync); window.removeEventListener('resize', resize); S.set(`raid/${ME.team}/${ME.pkey}`, score); },
    };
  }

  const NUM = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
  function Karaoke(el, ev) {
    const K = C.karaoke;
    if (ev.phase === 'sing') {
      el.innerHTML = `<div class="center pad"><div class="hero">🎤</div><h2>Look at the board and SING!</h2><p>When the music plays, your whole team stands up and sings!</p></div>`;
      return {};
    }
    if (ev.phase === 'done') { el.innerHTML = `<div class="center pad">${eventResult(ev)}</div>`; return {}; }
    el.innerHTML = `<div class="pad"><h2>🎤 ${esc(K.title)}</h2>
      <p>${esc(K.instructions)}</p><p class="muted">Song: <b>${esc(K.song)}</b> · Your whole team shares the same answers.</p>
      <div class="card lyrics-preview"></div>
      <form class="stack">${K.blanks.map((b, n) => `<label>Missing word ${NUM[n]}</label><input data-b="${b.id}" maxlength="24" autocomplete="off">`).join('')}</form>
      <p class="countdown" data-cd></p></div>`;
    const timers = {}, edited = {};
    el.addEventListener('input', (e) => {
      const i = e.target.closest('[data-b]'); if (!i) return;
      const id = i.dataset.b, v = i.value.trim();
      edited[id] = Date.now();
      clearTimeout(timers[id]);
      timers[id] = setTimeout(() => S.set(`teams/${ME.team}/karaoke/${id}`, v), 250);
      preview();
    });
    const vals = () => Object.fromEntries(K.blanks.map((b) => [b.id, ($(`[data-b="${b.id}"]`, el) || {}).value || '']));
    function preview() {
      const v = vals();
      $('.lyrics-preview', el).innerHTML = K.lines.slice(0, 4).map((l) => '<div>' + esc(l).replace(/\{(b\d)\}/g, (_, k) => `<b>${esc(v[k] || '____' + NUM[K.blanks.findIndex((b) => b.id === k)])}</b>`) + '</div>').join('');
    }
    return {
      update() {
        const k = (st.team && st.team.karaoke) || {};
        K.blanks.forEach((b) => { const i = $(`[data-b="${b.id}"]`, el); if (i && document.activeElement !== i && Date.now() - (edited[b.id] || 0) > 1500 && (k[b.id] || '') !== i.value) i.value = k[b.id] || ''; });
        preview();
      },
      tick() { const c = $('[data-cd]', el); if (c && ev.endAt) c.textContent = '⏱ ' + U.fmt(ev.endAt - now()); },
    };
  }

  // ---------- boot ----------
  $('#mode').textContent = S.mode === 'local' ? 'LOCAL TEST MODE' : '';
  if (ME.team && C.teams[ME.team]) subscribe();
  render();
})();
