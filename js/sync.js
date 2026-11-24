// Real-time sync layer.
// - Firebase Realtime Database when js/config.js contains a firebase config (real game: phones + projector).
// - Otherwise "local mode": state lives in localStorage and is shared between tabs of the SAME browser
//   (perfect to test the game on one computer: open admin.html + several index.html tabs).
(function () {
  const cfg = window.GAME_CONFIG || {};
  const ROOT = 'games/' + (cfg.gameId || 'main');
  const split = (p) => (p || '').split('/').filter(Boolean);
  const join = (...ps) => ps.filter(Boolean).join('/');
  const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));

  function firebaseImpl() {
    firebase.initializeApp(cfg.firebase);
    const db = firebase.database();
    let offset = 0;
    db.ref('.info/serverTimeOffset').on('value', (s) => { offset = s.val() || 0; });
    const ref = (p) => db.ref(join(ROOT, p));
    return {
      mode: 'firebase',
      now: () => Date.now() + offset,
      on(path, cb) {
        const r = ref(path);
        const h = (snap) => cb(snap.val());
        r.on('value', h);
        return () => r.off('value', h);
      },
      get: (path) => ref(path).once('value').then((s) => s.val()),
      set: (path, v) => ref(path).set(v),
      update: (path, obj) => ref(path).update(obj),
      remove: (path) => ref(path).remove(),
      push: (path, v) => ref(path).push(v).then((r) => r.key),
      transaction: (path, fn) =>
        ref(path).transaction((cur) => fn(cur)).then((r) => ({ committed: r.committed, value: r.snapshot.val() })),
    };
  }

  function localImpl() {
    const KEY = 'escapegame-state:' + ROOT;
    const listeners = new Set();
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
    const getAt = (obj, path) => split(path).reduce((o, k) => (o == null ? null : o[k] === undefined ? null : o[k]), obj);
    function setAt(obj, path, v) {
      const ks = split(path);
      if (!ks.length) return v == null ? {} : v;
      let o = obj;
      for (let i = 0; i < ks.length - 1; i++) {
        if (typeof o[ks[i]] !== 'object' || o[ks[i]] === null) o[ks[i]] = {};
        o = o[ks[i]];
      }
      if (v == null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = clone(v);
      return obj;
    }
    function notify() {
      const s = read();
      listeners.forEach((l) => {
        const v = getAt(s, l.path);
        const j = JSON.stringify(v);
        if (j !== l.last) { l.last = j; l.cb(clone(v)); }
      });
    }
    function write(mut) {
      const s = mut(read());
      localStorage.setItem(KEY, JSON.stringify(s));
      setTimeout(notify, 0);
    }
    window.addEventListener('storage', (e) => { if (e.key === KEY) notify(); });
    let ids = 0;
    return {
      mode: 'local',
      now: () => Date.now(),
      on(path, cb) {
        const l = { path, cb, last: undefined };
        listeners.add(l);
        setTimeout(notify, 0);
        return () => listeners.delete(l);
      },
      get: (path) => Promise.resolve(clone(getAt(read(), path))),
      set: (path, v) => Promise.resolve(write((s) => setAt(s, path, v))),
      update: (path, obj) =>
        Promise.resolve(write((s) => { Object.keys(obj).forEach((k) => setAt(s, join(path, k), obj[k])); return s; })),
      remove: (path) => Promise.resolve(write((s) => setAt(s, path, null))),
      push(path, v) {
        const k = 'k' + Date.now().toString(36) + (ids++) + Math.random().toString(36).slice(2, 6);
        write((s) => setAt(s, join(path, k), v));
        return Promise.resolve(k);
      },
      transaction(path, fn) {
        let res = { committed: false, value: null };
        write((s) => {
          const cur = clone(getAt(s, path));
          const nv = fn(cur);
          if (nv === undefined) { res.value = cur; return s; }
          res = { committed: true, value: clone(nv) };
          return setAt(s, path, nv);
        });
        return Promise.resolve(res);
      },
    };
  }

  const useFirebase = cfg.firebase && cfg.firebase.databaseURL && window.firebase;
  window.Sync = useFirebase ? firebaseImpl() : localImpl();
})();
