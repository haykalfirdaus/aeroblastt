const listeners = new Set();
let devtoolsOpen = false;

function notify(state) {
  if (devtoolsOpen === state) return;
  devtoolsOpen = state;
  listeners.forEach((fn) => fn(state));
}

export function isDevtoolsOpen() {
  return devtoolsOpen;
}

export function onDevtoolsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initDevtoolsProtection() {
  // ── 0. Hello message — tampil sekali sebelum console dikunci ────────────────
  console.log(
    '%c👋 Halo, Hacker!',
    'color:#22d3ee;font-family:Space Grotesk,sans-serif;font-size:22px;font-weight:800;'
  );
  console.log(
    '%cLagi ngintip ya? Gapapa, tapi gaada yang menarik di sini. 😄\n\nKalau kamu nemu bug atau celah keamanan, kabarin kita ya — bukan dieksploitasi.',
    'color:#94a3b8;font-family:Inter,sans-serif;font-size:13px;line-height:1.7;'
  );
  console.log(
    '%c⚡ AeroBlast Network — store.aeroblast.my.id',
    'color:#3b82f6;font-family:JetBrains Mono,monospace;font-size:11px;'
  );

  // ── 1. Override console completely ──────────────────────────────────────────
  const noop = () => {};
  ['log','warn','error','info','debug','dir','table','trace','group','groupCollapsed','groupEnd','time','timeEnd','assert','clear','count','profile','profileEnd'].forEach((m) => {
    try { Object.defineProperty(console, m, { value: noop, writable: false, configurable: false }); } catch { /* already locked */ }
  });

  // ── 2. Block all keyboard shortcuts that open devtools ─────────────────────
  const BLOCKED_KEYS = new Set(['F12']);
  const BLOCKED_CTRL_SHIFT = new Set(['i', 'I', 'j', 'J', 'c', 'C', 'k', 'K', 'e', 'E', 'm', 'M', 'p', 'P']);
  const BLOCKED_CTRL = new Set(['u', 'U', 's', 'S']);

  function blockKey(e) {
    if (BLOCKED_KEYS.has(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); return false; }
    if (e.ctrlKey && e.shiftKey && BLOCKED_CTRL_SHIFT.has(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); return false; }
    if (e.ctrlKey && !e.shiftKey && BLOCKED_CTRL.has(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); return false; }
    // Cmd+Option+I/J/C on Mac
    if (e.metaKey && e.altKey && BLOCKED_CTRL_SHIFT.has(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); return false; }
  }
  document.addEventListener('keydown', blockKey, true);
  document.addEventListener('keyup',   blockKey, true);

  // ── 3. Block right-click ────────────────────────────────────────────────────
  document.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopImmediatePropagation(); return false; }, true);

  // ── 4. Debugger trap — freezes devtools when JS panel is open ───────────────
  // Only runs in production (Vite drops this via dead-code elimination when
  // drop_debugger:true, but we wrap in a closure so mangling keeps it intact).
  (function devtoolsTrap() {
    function trap() {
      // The `debugger` statement pauses execution when devtools is open.
      // Calling it in a tight setInterval makes devtools unusable.
      // eslint-disable-next-line no-debugger
      debugger; // eslint-disable-line
    }
    setInterval(trap, 50);
  })();

  // ── 5. Size-delta detection (docked devtools) ───────────────────────────────
  const THRESHOLD = 160;
  function checkSize() {
    const w = window.outerWidth  - window.innerWidth;
    const h = window.outerHeight - window.innerHeight;
    notify(w > THRESHOLD || h > THRESHOLD);
  }
  setInterval(checkSize, 800);
  window.addEventListener('resize', checkSize);

  // ── 6. toString / getter trick (undocked devtools) ─────────────────────────
  // Custom objects whose .toString is called only when inspected in the console.
  let devtoolsProbeCount = 0;
  const probe = { toString() { devtoolsProbeCount++; if (devtoolsProbeCount > 1) notify(true); return ''; } };
  // Pushing it to console triggers toString on next devtools repaint.
  try { console.log('%c', probe); } catch { /* noop — console was locked above */ }

  checkSize();
}
