/* ESP32-Verbindung (WebSocket, JSON). Protokoll: siehe esp32/README.md
 *
 * window.Esp32Link.connect('192.168.4.1')  → ws://192.168.4.1:81/
 * window.Esp32Link.send({ t: 'power', on: true })
 * window.Esp32Link.subscribe(fn)           → fn({ state, info }), state: off | connecting | on | error
 */
(function () {
  const PORT = 81;
  const HEARTBEAT_MS = 1000;   // ESP32 stoppt alle Loks, wenn >3 s nichts ankommt
  const LOCO_THROTTLE_MS = 50; // Regler-Ziehen nicht mit hunderten Paketen fluten
  const RETRY_MS = 2000;

  let ws = null, host = '', wantOpen = false;
  let state = 'off', info = null;
  let hbTimer = null, retryTimer = null;
  const subs = new Set();
  const pendingLoco = new Map();   // addr → letzte Nachricht
  let flushTimer = null;

  function emit(next, nextInfo) {
    state = next;
    if (nextInfo !== undefined) info = nextInfo;
    subs.forEach((fn) => { try { fn({ state, info }); } catch (e) { console.error(e); } });
  }

  function rawSend(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) { ws.send(JSON.stringify(obj)); return true; }
    return false;
  }

  function flushLocos() {
    flushTimer = null;
    pendingLoco.forEach((m) => rawSend(m));
    pendingLoco.clear();
  }

  function clearTimers() {
    clearInterval(hbTimer); hbTimer = null;
    clearTimeout(retryTimer); retryTimer = null;
  }

  function open() {
    clearTimers();
    if (!wantOpen || !host) return;
    emit('connecting');
    let sock;
    try { sock = new WebSocket('ws://' + host + ':' + PORT + '/'); }
    catch (e) { emit('error'); retryTimer = setTimeout(open, RETRY_MS); return; }
    ws = sock;
    sock.onopen = () => {
      rawSend({ t: 'hello', client: 'railmaster' });
      hbTimer = setInterval(() => rawSend({ t: 'ping' }), HEARTBEAT_MS);
    };
    sock.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.t === 'hello') emit('on', m);   // erst nach Antwort des ESP32 gilt die Verbindung als aktiv
      else if (m.t === 'status') emit(state, Object.assign({}, info, m));
    };
    sock.onerror = () => { /* onclose folgt */ };
    sock.onclose = () => {
      if (ws !== sock) return;
      ws = null; clearInterval(hbTimer); hbTimer = null;
      if (wantOpen) { emit('error'); retryTimer = setTimeout(open, RETRY_MS); }
      else emit('off', null);
    };
  }

  window.Esp32Link = {
    connect(h) {
      host = String(h || '').trim().replace(/^wss?:\/\//, '').replace(/[:/].*$/, '');
      if (!host) return;
      wantOpen = true;
      if (ws) { const old = ws; ws = null; old.onclose = null; old.close(); }
      open();
    },
    disconnect() {
      wantOpen = false; clearTimers();
      if (ws) { const old = ws; ws = null; old.onclose = null; old.close(); }
      emit('off', null);
    },
    /** Lok-Befehle werden pro Adresse zusammengefasst; alles andere geht sofort raus. */
    send(msg) {
      if (msg.t === 'loco') {
        pendingLoco.set(msg.addr, msg);
        if (!flushTimer) flushTimer = setTimeout(flushLocos, LOCO_THROTTLE_MS);
        return true;
      }
      return rawSend(msg);
    },
    /** Not-Aus / Gleis aus: wartende Lok-Pakete verwerfen, damit nichts nachträglich "Gas" gibt. */
    dropPending() { pendingLoco.clear(); },
    subscribe(fn) { subs.add(fn); fn({ state, info }); return () => subs.delete(fn); },
    get state() { return state; },
  };
})();
