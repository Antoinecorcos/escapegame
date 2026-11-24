// ===== ADMIN / PROJECTOR SCREEN =====
(function () {
  const C = window.CONTENT, S = window.Sync, U = window.U, G = U.game;
  const { $, $$, esc, html } = U;
  const cfg = window.GAME_CONFIG || {};
  let R = {}; // whole game state
  let prevStages = {}, prevLocks = {};
  let view = null;
  const now = () => S.now();
  const game = () => R.game || {};
  const team = (t) => (R.teams && R.teams[t]) || {};
  const timeLeft = () => (game().startAt ? game().startAt + game().duration - now() : 0);

  S.on('', (v) => {
    R = v || {};
    detectChanges();
    render();
  });

  function detectChanges() {
    U.TEAMS.forEach((t) => {
      const sg = U.stageOf(team(t));
      if (prevStages[t] !== undefined && sg > prevStages[t]) { U.audio.jingle(); flash(`${C.teams[t].name} cleared ${C.stages[sg - 1].title}!`, C.teams[t].color); }
      prevStages[t] = sg;
      const lk = team(t).lockUntil || 0;
      if (prevLocks[t] !== undefined && lk > prevLocks[t] && lk > now()) U.audio.groan();
      prevLocks[t] = lk;
    });
  }
  function flash(msg, color) {
    let box = $('.flashes');
    if (!box) { box = html('<div class="flashes"></div>'); document.body.appendChild(box); }
    const f = html(`<div class="flash" style="border-color:${color}">${esc(msg)}</div>`);
    box.appendChild(f); setTimeout(() => f.remove(), 4000);
  }

  // ---------- main render ----------
  function render() {
    const status = game().status || 'lobby';
    const over = status === 'ended' || (status === 'running' && timeLeft() <= 0) || U.TEAMS.every((t) => team(t).finishedAt);
    const v = status === 'lobby' ? 'lobby' : over ? 'end' : 'map';
    if (v !== view) { view = v; $('#screen').innerHTML = ''; ({ lobby: mountLobby, map: mountMap, end: mountEnd })[v](); }
    ({ lobby: updateLobby, map: updateMap, end: updateEnd })[v]();
    renderEvent();
    renderJudge();
    renderControls();
  }

  // ---------- LOBBY ----------
  function joinUrl(t) {
    const u = new URL('index.html', location.href);
    u.searchParams.set('team', t);
    return u.href;
  }
  function qr(text) {
    const q = window.qrcode(0, 'M'); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }
  function mountLobby() {
    $('#screen').innerHTML = `<div class="lobby">
      <div class="lobby-title">${U.zombie(120)}<div><h1>${esc(C.title)}</h1><p>${esc(C.tagline)}</p></div></div>
      <div class="lobby-teams">${U.TEAMS.map((t) => `
        <div class="lobby-team" style="--c:${C.teams[t].color}">
          <h2>${esc(C.teams[t].name)}</h2>
          <div class="qr">${qr(joinUrl(t))}</div>
          <p class="url">${esc(joinUrl(t))}</p>
          <div class="names" id="names-${t}"></div>
        </div>`).join('')}</div>
      ${S.mode === 'local' ? '<p class="warn">⚠️ LOCAL TEST MODE: phones cannot join. Open index.html?team=red in other tabs of this browser to test, or configure Firebase (README).</p>' : ''}
    </div>`;
  }
  function updateLobby() {
    U.TEAMS.forEach((t) => {
      const el = $('#names-' + t); if (!el) return;
      const ps = U.players(team(t));
      el.innerHTML = ps.length ? ps.map((p) => `<span class="chip">${esc(p.name)}</span>`).join(' ') : '<span class="muted">Scan to join!</span>';
    });
  }

  // ---------- MAP ----------
  const P = C.places;
  const stageXY = (sg) => P[C.stages[Math.min(sg, U.NSTAGES - 1)].place];
  function mountMap() {
    const route = C.stages.map((s) => P[s.place]);
    const routeD = route.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ');
    const placeEls = Object.entries(P).map(([k, p]) => {
      const st = C.stages.find((s) => s.place === k);
      const duel = C.raid.place === k ? '⚔️' : C.karaoke.place === k ? '🎤' : '';
      return `<g class="place ${st ? '' : 'duel'}" transform="translate(${p.x} ${p.y})">
        <circle r="${st ? 13 : 10}"/><text class="pi" y="5" text-anchor="middle">${st ? st.icon : duel}</text>
        <text class="pl" y="${k === 'pontneuf' ? 34 : -22}" text-anchor="middle">${esc(p.label)}</text></g>`;
    }).join('');
    $('#screen').innerHTML = `<div class="mapview">
      <header class="topbar">
        <h1>${esc(C.title)}</h1>
        <div class="bigtimer" id="bigtimer"></div>
      </header>
      <div class="mapwrap">
        <svg viewBox="0 0 1000 560" class="map" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="tide" cx="50%" cy="50%" r="75%"><stop offset="45%" stop-color="#5fa83a" stop-opacity="0"/><stop offset="100%" stop-color="#5fa83a" stop-opacity="1"/></radialGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.04)"/></pattern>
          </defs>
          <rect width="1000" height="560" fill="url(#grid)"/>
          <path class="boulevard" d="M790 120 L700 235 L575 285 M790 120 L410 130 L170 175 M410 130 L405 285 M170 175 L300 300"/>
          <path class="seine" d="M1010 470 C880 430 720 370 590 352 C470 336 360 318 280 312 C180 306 110 360 60 450 L20 560"/>
          <ellipse class="island" cx="572" cy="352" rx="78" ry="13" transform="rotate(-6 572 352)"/>
          <path class="route" d="${routeD}"/>
          ${U.TEAMS.map((t) => `<path class="trail" id="trail-${t}" stroke="${C.teams[t].color}"/>`).join('')}
          ${placeEls}
          ${U.TEAMS.map((t, i) => `<g class="marker" id="mk-${t}"><circle r="20" fill="${C.teams[t].color}" stroke="#fff" stroke-width="3"/><text y="7" text-anchor="middle" font-size="20">✊</text><text class="mk-lock" y="-26" text-anchor="middle" font-size="22"></text></g>`).join('')}
          <rect id="tiderect" width="1000" height="560" fill="url(#tide)" opacity="0" pointer-events="none"/>
          <g id="hordes"></g>
        </svg>
      </div>
      <div class="teampanels">${U.TEAMS.map((t) => `<div class="teampanel" id="tp-${t}" style="--c:${C.teams[t].color}"></div>`).join('')}</div>
    </div>`;
  }
  function updateMap() {
    U.TEAMS.forEach((t, i) => {
      const ts = team(t), sg = U.stageOf(ts);
      const p = stageXY(sg), off = i ? 20 : -20;
      const mk = $('#mk-' + t);
      if (mk) mk.setAttribute('transform', `translate(${p.x + off} ${p.y + (sg >= U.NSTAGES ? 0 : 26)})`);
      const pts = C.stages.slice(0, Math.min(sg, U.NSTAGES - 1) + 1).map((s) => P[s.place]);
      const tr = $('#trail-' + t);
      if (tr) tr.setAttribute('d', pts.map((q, k) => (k ? 'L' : 'M') + (q.x + off / 2) + ' ' + (q.y + off / 4)).join(' '));
      const panel = $('#tp-' + t);
      if (panel) panel.innerHTML = teamPanel(t);
    });
    tickMap();
  }
  function teamPanel(t) {
    const ts = team(t), sg = U.stageOf(ts), ps = U.players(ts);
    const lockLeft = (ts.lockUntil || 0) - now();
    let detail = '';
    if (sg === 2 && ts.judge) detail = '🤲 Waiting for the judge!';
    if (sg === 3) detail = `🎨 ${(ts.pic && ts.pic.found) || 0}/${C.stages[3].rounds} drawings found`;
    return `<div class="tp-head"><h2>${esc(C.teams[t].name)}</h2>
        <span>👥 ${ps.length}</span><span>🎟️ ${ts.tokens || 0}</span>
        ${ts.finishedAt ? '<span class="ok">🏆 ' + U.fmt(ts.finishedAt - game().startAt) + '</span>' : ''}</div>
      <ol class="steps">${C.stages.map((s, k) => `<li class="${k < sg ? 'done' : k === sg ? 'now' : ''}">${s.icon} <span>${esc(s.title)}</span></li>`).join('')}</ol>
      <div class="tp-foot">${lockLeft > 0 ? `<span class="locked">🧟 ZOMBIE ATTACK ${U.fmt(lockLeft)}</span>` : ''} ${detail}</div>`;
  }
  function tickMap() {
    const bt = $('#bigtimer'); if (!bt) return;
    const left = timeLeft(), total = game().duration || 1;
    bt.textContent = U.fmt(left);
    bt.classList.toggle('danger', left < 5 * 60000);
    const frac = Math.min(1, Math.max(0, 1 - left / total));
    const tide = $('#tiderect'); if (tide) tide.setAttribute('opacity', (frac * 0.55).toFixed(3));
    // zombie hordes appear around the map as time passes
    const hz = $('#hordes');
    const want = Math.floor(frac * 14);
    if (hz && hz.childElementCount !== want) {
      const rand = U.rng(42); let out = '';
      for (let k = 0; k < want; k++) {
        const edge = k % 4, a = rand();
        const x = edge === 0 ? a * 1000 : edge === 1 ? 960 : edge === 2 ? a * 1000 : 10;
        const y = edge === 0 ? 10 : edge === 1 ? a * 560 : edge === 2 ? 500 : a * 560;
        out += `<g transform="translate(${x - 20} ${y - 22})"><g class="hz" style="animation-delay:${(a * 2).toFixed(2)}s">${U.zombie(44)}</g></g>`;
      }
      hz.innerHTML = out;
    }
    U.TEAMS.forEach((t) => {
      const mk = $('#mk-' + t + ' .mk-lock');
      if (mk) mk.textContent = (team(t).lockUntil || 0) > now() ? '🧟' : '';
    });
  }

  // ---------- END ----------
  function ranking() {
    return U.TEAMS.slice().sort((a, b) => {
      const fa = team(a).finishedAt || Infinity, fb = team(b).finishedAt || Infinity;
      if (fa !== fb) return fa - fb;
      return U.stageOf(team(b)) - U.stageOf(team(a));
    });
  }
  function mountEnd() { $('#screen').innerHTML = '<div class="endview"></div>'; U.audio.jingle(); }
  function updateEnd() {
    const r = ranking(), w = r[0];
    const tie = !team(r[0]).finishedAt && U.stageOf(team(r[0])) === U.stageOf(team(r[1]));
    $('.endview').innerHTML = `
      <div class="hero">${tie ? U.zombie(160, { general: true }) : '🏆'}</div>
      <h1>${tie ? "It's a draw… the zombies win!" : `<span style="color:${C.teams[w].color}">${esc(C.teams[w].name)}</span> ${team(w).finishedAt ? 'saved Paris!' : 'went the furthest!'}`}</h1>
      <div class="podium">${r.map((t, i) => {
        const ts = team(t);
        return `<div class="pod" style="--c:${C.teams[t].color}"><h2>${i + 1}. ${esc(C.teams[t].name)}</h2>
          <p>${ts.finishedAt ? '⏱ ' + U.fmt(ts.finishedAt - game().startAt) : `Stage ${Math.min(U.stageOf(ts) + 1, U.NSTAGES)}/${U.NSTAGES}`}</p>
          <p>💡 ${Object.values(ts.hints || {}).reduce((a, b) => a + b, 0)} hints used</p></div>`;
      }).join('')}</div>
      <button class="btn" data-a="chains">🎨 Show the Louvre drawings</button>`;
  }

  // ---------- EVENTS ----------
  const NUM = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
  let evKey = null, karaokeStarts = null, karaokeTimer = null;
  function raidTotals() {
    const r = R.raid || {};
    return Object.fromEntries(U.TEAMS.map((t) => [t, Object.values(r[t] || {}).reduce((a, b) => a + (+b || 0), 0)]));
  }
  function renderEvent() {
    const el = $('#event'), ev = R.event;
    const key = ev ? ev.type + ev.startAt + (ev.phase || '') : null;
    if (key !== evKey) {
      evKey = key;
      el.hidden = !ev;
      if (!ev) { el.innerHTML = ''; return; }
      if (ev.type === 'raid') el.innerHTML = `<div class="ev raid-ev"><h1>⚔️ ${esc(C.raid.title)}</h1><p>${esc(C.raid.instructions)} · Everybody on your phones!</p>
        <div class="ev-timer" id="ev-timer"></div><div class="bars">${U.TEAMS.map((t) => `<div class="bar" style="--c:${C.teams[t].color}"><span>${esc(C.teams[t].name)}</span><div class="fill" id="bar-${t}"></div><b id="sc-${t}">0</b></div>`).join('')}</div>
        <div class="ev-result" id="ev-result"></div></div>`;
      else mountKaraoke(el, ev);
    }
    if (!ev) return;
    if (ev.type === 'raid') {
      const tot = raidTotals(), mx = Math.max(10, ...Object.values(tot));
      U.TEAMS.forEach((t) => { const b = $('#bar-' + t); if (b) { b.style.width = Math.max(2, (tot[t] / mx) * 100) + '%'; $('#sc-' + t).textContent = tot[t]; } });
    }
    const res = $('#ev-result');
    if (res && ev.phase === 'done') {
      res.innerHTML = ev.winner === 'draw' ? '<h2>Draw!</h2>' : `<h2 style="color:${C.teams[ev.winner].color}">🏆 ${esc(C.teams[ev.winner].name)} wins!</h2><p>+1 hint token · the losers get a zombie attack</p>`;
    }
  }
  function mountKaraoke(el, ev) {
    const K = C.karaoke;
    if (ev.phase === 'write') {
      el.innerHTML = `<div class="ev karaoke-ev"><h1>🎤 ${esc(K.title)}</h1><p>${esc(K.instructions)}</p>
        <div class="ev-timer" id="ev-timer"></div>
        <div class="lyrics template">${K.lines.slice(0, 4).map((l) => `<div>${esc(l).replace(/\{(b\d)\}/g, (_, b) => `<span class="blank">____${NUM[K.blanks.findIndex((x) => x.id === b)]}</span>`)}</div>`).join('')}</div>
        <div class="kstatus">${U.TEAMS.map((t) => `<span class="chip" style="background:${C.teams[t].color}" id="ks-${t}"></span>`).join(' ')}</div></div>`;
      return;
    }
    el.innerHTML = `<div class="ev karaoke-ev"><h1>🎤 ${esc(K.title)}</h1>
      <div class="kcols">${U.TEAMS.map((t) => {
        const k = team(t).karaoke || {};
        const good = (b) => U.norm(k[b.id]) === U.norm(b.answer);
        const score = K.blanks.filter(good).length;
        return `<div class="kcol" style="--c:${C.teams[t].color}"><h2>${esc(C.teams[t].name)} · ${score}/${K.blanks.length} ✔</h2>
          <div class="lyrics" id="ly-${t}">${K.lines.map((l) => `<div>${esc(l).replace(/\{(b\d)\}/g, (_, b) => { const bl = K.blanks.find((x) => x.id === b); return good(bl) ? `<b class="good">${esc(bl.answer)}</b>` : `<b class="wrongw">${esc(k[b] || '???')}</b><b class="good small">(${esc(bl.answer)})</b>`; })}</div>`).join('')}</div>
          ${ev.phase === 'sing' ? (K.youtube ? `<a class="btn" href="${esc(K.youtube)}" target="_blank" rel="noopener">▶ Open the music</a>` : `<button class="btn" data-a="sing" data-t="${t}">▶ Play the music & sing!</button>`) : ''}</div>`;
      }).join('')}</div>
      ${ev.phase === 'sing' ? `<p class="muted">Then the game master chooses the winner (controls ⚙️)</p>` : ''}
      <div class="ev-result" id="ev-result"></div></div>`;
  }
  function singAlong(t) {
    clearInterval(karaokeTimer);
    const lines = $$('#ly-' + t + ' > div');
    const base = U.audio.ctx().currentTime;
    karaokeStarts = U.audio.melody(C.karaoke.melody);
    karaokeTimer = setInterval(() => {
      const el = U.audio.ctx().currentTime - base;
      const idx = karaokeStarts.findIndex((s, i) => el >= s && el < karaokeStarts[i + 1]);
      lines.forEach((l, i) => l.classList.toggle('on', i === idx));
      if (el > karaokeStarts[karaokeStarts.length - 1]) { clearInterval(karaokeTimer); lines.forEach((l) => l.classList.remove('on')); }
    }, 60);
  }

  function tickEvent() {
    const ev = R.event; if (!ev) return;
    const t = $('#ev-timer');
    if (t && ev.endAt && ev.phase !== 'done') t.textContent = U.fmt(ev.endAt - now());
    if (ev.type === 'raid' && ev.phase === 'play' && now() > ev.endAt + 2500) {
      const tot = raidTotals();
      G.applyDuel(tot.red === tot.blue ? 'draw' : tot.red > tot.blue ? 'red' : 'blue', C.raid.penaltySeconds);
    }
    if (ev.type === 'karaoke' && ev.phase === 'write') {
      U.TEAMS.forEach((tm) => { const s = $('#ks-' + tm); if (s) { const k = team(tm).karaoke || {}; s.textContent = `${C.teams[tm].name}: ${C.karaoke.blanks.filter((b) => k[b.id]).length}/${C.karaoke.blanks.length} ✍️`; } });
      if (now() > ev.endAt) S.update('event', { phase: 'sing' });
    }
    if (ev.phase === 'done' && ev.doneAt && now() > ev.doneAt + 9000) S.transaction('event', (cur) => (cur && cur.startAt === ev.startAt ? null : undefined));
  }

  // ---------- CONTROLS ----------
  function renderControls() {
    const el = $('#controls');
    const ev = R.event, status = game().status || 'lobby';
    const claims = Object.entries(R.claims || {}).filter(([, c]) => c.status === 'pending');
    $('#claims-badge').textContent = claims.length ? claims.length : '';
    $('#claims-badge').hidden = !claims.length;
    if (el.hidden) return;
    el.innerHTML = `
      <div class="ctl-row"><b>Game</b>
        ${status === 'lobby' ? '<button class="btn" data-a="start">▶ START</button>' : ''}
        ${status === 'running' ? '<button class="btn small" data-a="plus5">+5 min</button><button class="btn small" data-a="minus1">−1 min</button><button class="btn small ghost" data-a="end">End game</button>' : ''}
        <button class="btn small ghost" data-a="chains">🎨 Louvre drawings</button>
        <button class="btn small ghost" data-a="reset">↺ New game (keep players)</button>
        <button class="btn small danger" data-a="wipe">🗑 Full reset</button>
        <span class="muted">mode: ${S.mode}${S.mode === 'local' ? ' (test)' : ''} · game: ${esc(cfg.gameId || 'main')}</span></div>
      <div class="ctl-row"><b>Duels</b>
        ${!ev ? `<button class="btn" data-a="raid">⚔️ Launch raid (Marais)</button><button class="btn" data-a="karaoke">🎤 Launch karaoke (Garnier)</button>` : ''}
        ${ev && ev.type === 'karaoke' && ev.phase === 'write' ? '<button class="btn" data-a="sing-phase">Reveal lyrics → sing</button>' : ''}
        ${ev && ev.phase !== 'done' ? U.TEAMS.map((t) => `<button class="btn small" style="background:${C.teams[t].color}" data-a="win" data-t="${t}">${esc(C.teams[t].name)} wins</button>`).join('') + '<button class="btn small ghost" data-a="win" data-t="draw">Draw</button>' : ''}
        ${ev ? '<button class="btn small ghost" data-a="close-ev">Close duel</button>' : ''}
        <span class="muted">Suggested: raid ≈ 8 min, karaoke ≈ 18 min</span></div>
      ${U.TEAMS.map((t) => `<div class="ctl-row"><b style="color:${C.teams[t].color}">${esc(C.teams[t].name)}</b>
        <button class="btn small" data-a="tok" data-t="${t}">+1 🎟️</button>
        <button class="btn small" data-a="lock" data-t="${t}">🧟 Lock 30s</button>
        <button class="btn small" data-a="unlock" data-t="${t}">Unlock</button>
        <button class="btn small" data-a="skip" data-t="${t}">Skip stage ⏭</button>
        <button class="btn small ghost" data-a="back" data-t="${t}">⏮ Back</button>
        <span class="muted">${U.players(team(t)).map((p) => esc(p.name)).join(', ')}</span></div>`).join('')}
      <div class="ctl-row claims"><b>🕵️ Missions</b>${claims.length ? claims.map(([k, c]) => `<span class="claim"><span style="color:${C.teams[c.team].color}">${esc(c.name)}</span>: <i>${esc(c.mission)}</i>
        <button class="btn small" data-a="claim-ok" data-k="${k}">✓</button><button class="btn small ghost" data-a="claim-no" data-k="${k}">✗</button></span>`).join('') : '<span class="muted">No pending claim.</span>'}</div>`;
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'c' && !/input|textarea/i.test(e.target.tagName)) toggleControls(); });
  function toggleControls() { $('#controls').hidden = !$('#controls').hidden; renderControls(); }

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, t = b.dataset.t;
    U.audio.ctx();
    if (a === 'toggle') toggleControls();
    if (a === 'start') { await S.set('game', { status: 'running', startAt: now(), duration: (cfg.durationMinutes || 30) * 60000 }); U.audio.jingle(); }
    if (a === 'plus5') S.transaction('game/duration', (d) => (d || 0) + 5 * 60000);
    if (a === 'minus1') S.transaction('game/duration', (d) => Math.max(60000, (d || 0) - 60000));
    if (a === 'end') { if (confirm('End the game now?')) S.update('game', { status: 'ended' }); }
    if (a === 'reset') { if (confirm('Start a new game? Players stay, progress is erased.')) resetGame(false); }
    if (a === 'wipe') { if (confirm('Erase EVERYTHING (players included)?')) resetGame(true); }
    if (a === 'raid') { await S.remove('raid'); S.set('event', { type: 'raid', phase: 'play', startAt: now(), endAt: now() + C.raid.seconds * 1000 + 3000 }); }
    if (a === 'karaoke') { await Promise.all(U.TEAMS.map((x) => S.remove(`teams/${x}/karaoke`))); S.set('event', { type: 'karaoke', phase: 'write', startAt: now(), endAt: now() + C.karaoke.writeSeconds * 1000 }); }
    if (a === 'sing-phase') S.update('event', { phase: 'sing' });
    if (a === 'sing') singAlong(t);
    if (a === 'win') G.applyDuel(t, R.event && R.event.type === 'raid' ? C.raid.penaltySeconds : C.karaoke.penaltySeconds);
    if (a === 'close-ev') S.remove('event');
    if (a === 'tok') G.addToken(t, 1);
    if (a === 'lock') G.lock(t, 30, 'The game master sent the zombies!');
    if (a === 'unlock') S.set(`teams/${t}/lockUntil`, 0);
    if (a === 'skip') { const sg = U.stageOf(team(t)); if (sg < U.NSTAGES && confirm(`Skip "${C.stages[sg].title}" for ${C.teams[t].name}?`)) G.advance(t, sg); }
    if (a === 'back') { S.transaction(`teams/${t}/stage`, (s) => Math.max(0, (s || 0) - 1)); S.set(`teams/${t}/finishedAt`, null); }
    if (a === 'claim-ok') { const c = R.claims[b.dataset.k]; await S.update(`claims/${b.dataset.k}`, { status: 'ok' }); G.addToken(c.team, 1); }
    if (a === 'claim-no') S.update(`claims/${b.dataset.k}`, { status: 'no' });
    if (a === 'chains') showChains();
    if (a === 'judge-ok') { await S.remove(`teams/${t}/judge`); G.advance(t, 2); }
    if (a === 'judge-no') { await S.remove(`teams/${t}/judge`); G.lock(t, C.stages[2].lockSeconds, 'The zombie kids were NOT convinced! Practise and try again.'); }
    if (a === 'close-modal') $('#modal').hidden = true;
  });

  async function resetGame(wipe) {
    if (wipe) { await S.remove(''); return; }
    const up = { game: { status: 'lobby' }, event: null, raid: null, claims: null };
    U.TEAMS.forEach((t) => { up[`teams/${t}/stage`] = 0; ['lockUntil', 'lockReason', 'tokens', 'hints', 'judge', 'pic', 'karaoke', 'finishedAt'].forEach((k) => (up[`teams/${t}/${k}`] = null)); });
    await S.update('', up);
  }

  function showChains() {
    const m = $('#modal');
    m.hidden = false;
    m.innerHTML = `<div class="modal-inner"><h1>🎨 The Louvre drawings</h1>
      ${U.TEAMS.map((t) => {
        const gal = (team(t).pic && team(t).pic.gallery) || {};
        const items = Object.keys(gal).sort((a, b) => a.slice(1) - b.slice(1)).map((k) => gal[k]);
        return `<h2 style="color:${C.teams[t].color}">${esc(C.teams[t].name)}</h2><div class="chainrow">${items.length ? items.map((it) => `<div class="chainitem">${it.img ? `<img src="${it.img}">` : ''}<p><b>${esc(it.word)}</b></p><small>by ${esc(it.by)}</small></div>`).join('') : '<p class="muted">No drawing yet.</p>'}</div>`;
      }).join('')}
      <button class="btn" data-a="close-modal">Close</button></div>`;
  }

  // ---------- SIX-SEVEN JUDGE (shown on the board) ----------
  function renderJudge() {
    const el = $('#judge');
    const t = !R.event && game().status === 'running' && U.TEAMS.find((x) => team(x).judge && U.stageOf(team(x)) === 2);
    const key = t || null;
    if (el.dataset.k === String(key)) return;
    el.dataset.k = String(key);
    el.hidden = !t;
    if (!t) { el.innerHTML = ''; return; }
    U.audio.jingle();
    el.innerHTML = `<div class="ev judge-ev" style="--c:${C.teams[t].color}">
      <div class="judge-kids">${U.zombie(110, { skin: '#a9d46f' })}${U.zombie(140, { skin: '#a9d46f' })}${U.zombie(110, { skin: '#a9d46f' })}</div>
      <h1><span style="color:${C.teams[t].color}">${esc(C.teams[t].name)}</span>: SIX-SEVEN CHECK!</h1>
      <p>Whole team, stand up and do the gesture… <b>“SIX… SEVEN!”</b> 🤲</p>
      <div class="row judge-btns"><button class="btn huge-ok" data-a="judge-ok" data-t="${t}">✅ Approved</button>
      <button class="btn huge-no" data-a="judge-no" data-t="${t}">❌ Not convinced</button></div></div>`;
  }

  setInterval(() => {
    if (view === 'map') { tickMap(); U.TEAMS.forEach((t) => { const p = $('#tp-' + t); if (p && (team(t).lockUntil || 0) > now() - 1000) p.innerHTML = teamPanel(t); }); }
    if (view === 'map' && game().status === 'running' && timeLeft() <= 0) render();
    tickEvent();
  }, 250);

  $('#mode').textContent = S.mode === 'local' ? 'LOCAL TEST MODE' : '';
  render();
})();
