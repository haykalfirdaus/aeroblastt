const THRESHOLD = 160;

let devtoolsOpen = false;
const listeners = new Set();

function notify(state) {
  if (devtoolsOpen === state) return;
  devtoolsOpen = state;
  listeners.forEach((fn) => fn(state));
}

function check() {
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  notify(widthDiff > THRESHOLD || heightDiff > THRESHOLD);
}

export function isDevtoolsOpen() {
  return devtoolsOpen;
}

export function onDevtoolsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initDevtoolsProtection() {
  // --- Console warning art ---
  const style = [
    'color:#f87171',
    'font-size:22px',
    'font-weight:900',
    'text-shadow:0 0 12px #ef4444',
  ].join(';');
  const styleSmall = 'color:#fca5a5;font-size:13px;line-height:1.6';

  console.log('%c⛔ STOP!', style);
  console.log(
    '%cArea ini diperuntukkan khusus developer.\nJika seseorang menyuruh kamu mengetik/menempel sesuatu di sini,\nitu adalah penipuan. Menutup tab ini lebih aman.',
    styleSmall
  );
  console.log(
    '%c⚠️  AeroBlast Security — Unauthorized access attempt will be logged.',
    'color:#fbbf24;font-size:11px;font-style:italic'
  );

  // --- Block common keyboard shortcuts ---
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C / Ctrl+U
    if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    if (e.ctrlKey && ['U', 'u'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // --- Block right-click context menu ---
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // --- Devtools size-based detection ---
  setInterval(check, 1000);
  window.addEventListener('resize', check);
  check();
}
