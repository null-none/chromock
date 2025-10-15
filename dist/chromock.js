/**
 * Chromock.js — lightweight mock for Chrome Extension API
 * Use for testing or developing extensions in normal browsers.
 * (c) 2025 — MIT License
 */
(function (root) {
  if (root.chrome) return; // already exists

  const LOG = true;
  const log = (...a) => LOG && console.log("[chromock]", ...a);

  const createEvent = () => {
    const listeners = [];
    return {
      addListener(fn) { if (typeof fn === "function") listeners.push(fn); },
      removeListener(fn) { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); },
      hasListeners() { return listeners.length > 0; },
      emit(...args) { for (const fn of [...listeners]) { try { fn(...args); } catch(e){ console.error(e); } } }
    };
  };

  // --- runtime ---
  const onMessage = createEvent();
  const runtime = {
    id: "chromock-id",
    onMessage,
    sendMessage(msg, cb) {
      log("runtime.sendMessage", msg);
      let responded = false;
      const sendResponse = (r) => { responded = true; cb && cb(r); };
      onMessage.emit(msg, { id: runtime.id, url: root.location?.href || "" }, sendResponse);
      if (!responded && cb) sendResponse({ ok: true, echo: msg });
    },
    getURL(path){ return (root.location?.origin || "http://localhost") + "/" + (path || ""); }
  };

  // --- storage.local (in-memory) ---
  const store = {};
  const storage = {
    local: {
      get(keys, cb) {
        log("storage.get", keys);
        const res = {};
        if (!keys) Object.assign(res, store);
        else if (Array.isArray(keys)) keys.forEach(k => res[k] = store[k]);
        else if (typeof keys === "string") res[keys] = store[keys];
        else { // defaults object
          Object.assign(res, keys);
          Object.keys(keys).forEach(k => { if (k in store) res[k] = store[k]; });
        }
        cb ? cb(res) : Promise.resolve(res);
      },
      set(obj, cb) {
        log("storage.set", obj);
        Object.assign(store, obj || {});
        cb && cb();
      },
      remove(keys, cb) {
        log("storage.remove", keys);
        (Array.isArray(keys) ? keys : [keys]).forEach(k => delete store[k]);
        cb && cb();
      },
      clear(cb) {
        log("storage.clear");
        for (const k in store) delete store[k];
        cb && cb();
      },
    },
  };

  // --- tabs ---
  const tabs = {
    query(info, cb) {
      log("tabs.query", info);
      const res = [{ id: 1, title: "Mock tab", url: "https://example.com", active: true }];
      cb ? cb(res) : Promise.resolve(res);
    },
    sendMessage(id, msg, cb) {
      log("tabs.sendMessage", id, msg);
      runtime.sendMessage({ __toTabId: id, ...msg }, cb);
    },
    get(id, cb){
      log("tabs.get", id);
      const t = { id, title: "Mock tab "+id, url: "https://example.com/"+id, active: id===1 };
      cb ? cb(t) : Promise.resolve(t);
    },
    create(props, cb){
      log("tabs.create", props);
      const t = { id: Math.floor(Math.random()*1000)+2, title: props?.title || "New Tab", url: props?.url || "about:blank", active: !!props?.active };
      cb ? cb(t) : Promise.resolve(t);
    }
  };

  // --- alarms ---
  const onAlarm = createEvent();
  const alarms = {
    create(name, info = {}) {
      const n = typeof name === "string" ? name : (name?.name || "chromock-alarm");
      const opts = typeof name === "string" ? (info || {}) : (name || {});
      const delay = (opts.delayInMinutes || 0) * 60_000;
      log("alarms.create", n, opts);
      setTimeout(() => onAlarm.emit({ name: n, scheduledTime: Date.now() }), delay);
    },
    onAlarm,
  };

  // --- contextMenus ---
  const onClicked = createEvent();
  const contextMenus = {
    create(opts, cb) {
      log("contextMenus.create", opts);
      cb && cb(opts?.id || "menu-item");
    },
    onClicked,
    // helper for manual click in tests
    __click(id, info = {}, tab = { id: 1 }) { onClicked.emit({ menuItemId: id, ...info }, tab); }
  };

  // --- notifications (minimal) ---
  const notifications = {
    create(id, options, cb){
      const realId = id || ("notif-"+Math.random().toString(36).slice(2));
      log("notifications.create", realId, options);
      cb && cb(realId);
    },
    clear(id, cb){ log("notifications.clear", id); cb && cb(true); }
  };

  // --- windows (minimal) ---
  const windows = {
    getCurrent(cb){ const w = { id: 1, focused: true, state: "normal", type: "normal" }; cb ? cb(w) : Promise.resolve(w); },
    create(opts, cb){ const w = { id: Math.floor(Math.random()*10000), ...opts }; log("windows.create", w); cb ? cb(w) : Promise.resolve(w); }
  };

  root.chrome = { runtime, storage, tabs, alarms, contextMenus, notifications, windows };
  log("Chromock attached ✅");
})(typeof globalThis !== "undefined" ? globalThis : window);
