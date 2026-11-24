// Shared helpers for player (index.html) and admin (admin.html)
(function () {
  const C = window.CONTENT;
  const S = window.Sync;
  const U = {};

  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.html = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstElementChild; };
  U.fmt = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
  U.norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

  // seeded random
  U.seed = (str) => { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; };
  U.rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  U.shuffle = (arr, rand = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- team / players ----------
  U.TEAMS = ['red', 'blue'];
  U.other = (t) => (t === 'red' ? 'blue' : 'red');
  U.players = (teamState) => {
    const p = (teamState && teamState.players) || {};
    return Object.keys(p).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1))).map((k) => ({ pkey: k, ...p[k] }));
  };
  U.stageOf = (teamState) => (teamState && teamState.stage) || 0;
  U.NSTAGES = C.stages.length;

  // ---------- art ----------
  U.zombie = (size = 80, opts = {}) => {
    const skin = opts.skin || '#8fc657';
    const general = opts.general;
    return `<svg class="zombie" width="${size}" height="${size * 1.1}" viewBox="0 0 100 110" aria-hidden="true">
      <circle cx="50" cy="66" r="33" fill="${skin}" stroke="#2d4a1a" stroke-width="3"/>
      <path d="M31 56 l10 10 M41 56 l-10 10" stroke="#2d1a1a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="64" cy="61" r="8" fill="#fff" stroke="#2d1a1a" stroke-width="2"/><circle cx="66" cy="63" r="3.2" fill="#c62828"/>
      <path d="M36 82 q14 8 28 0" fill="none" stroke="#2d1a1a" stroke-width="3" stroke-linecap="round"/>
      <path d="M41 82 v6 M50 85 v6 M59 82 v6" stroke="#2d1a1a" stroke-width="2"/>
      <circle cx="76" cy="77" r="3" fill="#6b9a3a"/><circle cx="30" cy="80" r="2" fill="#6b9a3a"/>
      <path d="M24 42 L29 ${general ? 2 : 10} L71 ${general ? 2 : 10} L76 42 Z" fill="#1f2a5a" stroke="#0e1530" stroke-width="2"/>
      <path d="M28 ${general ? 8 : 15} L72 ${general ? 8 : 15}" stroke="#c62828" stroke-width="7"/>
      ${general ? '<path d="M31 22 L69 22 M32 28 L68 28" stroke="#f2c94c" stroke-width="2.5"/>' : ''}
      <circle cx="50" cy="31" r="5" fill="#f2c94c" stroke="#a07c1a" stroke-width="1.5"/>
      <ellipse cx="50" cy="43" rx="31" ry="6" fill="#111"/>
    </svg>`;
  };

  // treble staff with one note (note like 'F4', 'C5')
  U.staff = (note) => {
    const order = ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'];
    const i = order.indexOf(note);
    const y = 65 - i * 5;
    const lines = [25, 35, 45, 55, 65].map((ly) => `<line x1="5" x2="195" y1="${ly}" y2="${ly}" stroke="currentColor" stroke-width="1.5"/>`).join('');
    return `<svg class="staff" viewBox="0 0 200 90" width="200" height="90" aria-label="a note on a music staff">
      ${lines}
      <text x="8" y="72" font-size="62" fill="currentColor" font-family="serif">𝄞</text>
      <ellipse cx="120" cy="${y}" rx="7.2" ry="5" transform="rotate(-20 120 ${y})" fill="currentColor"/>
      <line x1="${y > 45 ? 126.5 : 113.5}" x2="${y > 45 ? 126.5 : 113.5}" y1="${y}" y2="${y > 45 ? y - 32 : y + 32}" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  };

  U.painting = (p, cls = '') => {
    const local = `img/paintings/${p.id}.jpg`;
    const remote = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(p.commons.replace(/ /g, '_')) + '?width=800';
    return `<figure class="painting ${cls}" data-id="${p.id}">
      <img src="${local}" alt="${U.esc(p.title)}" loading="lazy"
        onerror="if(!this.dataset.r){this.dataset.r=1;this.src='${remote}';}else{this.closest('figure').classList.add('noimg');}">
      <div class="ph"><b>${U.esc(p.title)}</b>${p.desc ? `<small>${U.esc(p.desc)}</small>` : ''}</div>
    </figure>`;
  };

  // ---------- audio ----------
  const A = (U.audio = {});
  let ctx = null;
  A.ctx = () => {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  document.addEventListener('pointerdown', () => A.ctx(), { once: false, passive: true });
  A.tone = (freq, dur = 0.4, wave = 'sawtooth', when = 0, vol = 0.18) => {
    const c = A.ctx(); if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = wave; o.frequency.value = freq;
    f.type = 'lowpass'; f.frequency.value = wave === 'sine' ? 4000 : 1800;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.setValueAtTime(vol, t + Math.max(0.05, dur - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  };
  A.jingle = () => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => A.tone(f, i === 3 ? 0.6 : 0.16, 'sawtooth', i * 0.13, 0.14)); };
  A.groan = () => {
    const c = A.ctx(); if (!c) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 1.1);
    f.type = 'lowpass'; f.frequency.value = 500;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(f); f.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 1.3);
  };
  A.splat = (good = true) => A.tone(good ? 900 : 120, good ? 0.08 : 0.3, good ? 'square' : 'sawtooth', 0, 0.12);

  // "When the Saints Go Marching In" (traditional). Returns line start times in seconds.
  const NF = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440, C5: 523.25 };
  const SAINTS = [
    [['C4', 1], ['E4', 1], ['F4', 1], ['G4', 5], ['C4', 1], ['E4', 1], ['F4', 1], ['G4', 5]],
    [['C4', 1], ['E4', 1], ['F4', 1], ['G4', 2], ['E4', 2], ['C4', 2], ['E4', 2], ['D4', 5]],
    [['E4', 1], ['E4', 1], ['D4', 1], ['C4', 3], ['C4', 1], ['E4', 2], ['G4', 2], ['G4', 1], ['F4', 3], ['F4', 1]],
    [['E4', 1], ['F4', 1], ['G4', 2], ['E4', 2], ['C4', 2], ['D4', 2], ['C4', 6]],
  ];
  A.saints = (nLines = 8, beat = 0.3) => {
    const starts = []; let t = 0.2;
    for (let l = 0; l < nLines; l++) {
      starts.push(t);
      SAINTS[l % 4].forEach(([n, b]) => {
        A.tone(NF[n], b * beat * 0.92, 'sawtooth', t, 0.13);
        A.tone(NF[n] / 2, b * beat * 0.92, 'square', t, 0.05);
        t += b * beat;
      });
      t += beat;
    }
    starts.push(t);
    return starts;
  };

  // ---------- speech ----------
  U.speak = (w) => {
    if (!('speechSynthesis' in window)) return false;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(w.text);
    const voices = synth.getVoices();
    const norm = (l) => (l || '').replace('_', '-').toLowerCase();
    const v = voices.find((x) => norm(x.lang) === w.lang.toLowerCase()) || voices.find((x) => norm(x.lang).startsWith('en'));
    if (v) u.voice = v;
    u.lang = w.lang; u.pitch = w.pitch || 1; u.rate = w.rate || 1;
    synth.speak(u);
    return true;
  };
  if ('speechSynthesis' in window) window.speechSynthesis.getVoices();

  // ---------- game actions ----------
  const G = (U.game = {});
  G.lock = async (team, secs, reason) => {
    await S.transaction(`teams/${team}/lockUntil`, (cur) => Math.max(cur || 0, S.now()) + secs * 1000);
    await S.set(`teams/${team}/lockReason`, reason || 'The kepi zombies caught you!');
  };
  G.advance = async (team, from) => {
    const r = await S.transaction(`teams/${team}/stage`, (cur) => ((cur || 0) === from ? from + 1 : undefined));
    if (r.committed && from + 1 >= U.NSTAGES) {
      await S.transaction(`teams/${team}/finishedAt`, (cur) => (cur ? undefined : S.now()));
    }
    return r.committed;
  };
  G.useHint = async (team, stage) => {
    const r = await S.transaction(`teams/${team}/tokens`, (cur) => ((cur || 0) > 0 ? cur - 1 : undefined));
    if (!r.committed) await G.lock(team, 30, 'You paid for a hint with 30 seconds of zombie attack!');
    await S.transaction(`teams/${team}/hints/h${stage}`, (cur) => Math.min((cur || 0) + 1, 9));
  };
  G.addToken = (team, n = 1) => S.transaction(`teams/${team}/tokens`, (cur) => Math.max(0, (cur || 0) + n));
  // duel result: winner gets a hint token, loser gets a zombie attack
  G.applyDuel = async (winner, penalty) => {
    const r = await S.transaction('event/applied', (cur) => (cur ? undefined : true));
    if (!r.committed) return;
    await S.update('event', { winner: winner || 'draw', phase: 'done', doneAt: S.now() });
    if (winner === 'red' || winner === 'blue') {
      await G.addToken(winner, 1);
      await G.lock(U.other(winner), penalty, 'You lost the duel! The horde is on you.');
    }
  };

  window.U = U;
})();
