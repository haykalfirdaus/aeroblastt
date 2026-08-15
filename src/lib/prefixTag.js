/*
 * Renderer tag prefix 74×12 — diport dari assets/rank-generator.html.
 *
 * Semua data pixel (font 5px, dither plate, ikon) diekstrak dari PNG rank
 * yang sudah ada, jadi hasilnya identik dengan tag rank in-game — yang
 * berubah hanya palet warna dan teks.
 *
 * Dipakai di dua tempat:
 *  - CosmeticsTab: preview live di canvas (user TIDAK bisa download).
 *  - AdminDashboard: render + download PNG untuk order yang SUDAH lunas.
 */

export const TAG_W = 74;
export const TAG_H = 12;

const ICO_X0 = 0, ICO_X1 = 11; // kotak ikon kiri
const GAP_X = 12;              // 1 kolom transparan
const PLT_X0 = 13, PLT_X1 = 73; // plate teks
const TXT_X0 = 15, TXT_X1 = 71; // area bebas untuk huruf
const TXT_Y0 = 3;

/* ---- font 5px, hasil vote dari semua PNG rank ---- */
const F = {};
const g = (ch, rows) => (F[ch] = rows.split('/'));
g('A', '.##./#..#/####/#..#/#..#');
g('B', '###./#..#/###./#..#/####');
g('C', '.##/#../#../#../.##');
g('D', '###./#..#/#..#/#..#/###.');
g('E', '###/#../##./#../###');
g('F', '###/#../##./#../#..');
g('G', '####/#.../#.##/#..#/####');
g('H', '#.#/#.#/###/#.#/#.#');
g('I', '#/#/#/#/#');
g('J', '..##/...#/...#/#..#/.##.');
g('K', '#..#/#.#./##../#.#./#.##');
g('L', '#../#../#../#../###');
g('M', '#...#/##.##/#.#.#/#...#/#...#');
g('N', '#..#/##.#/#.##/#..#/#..#');
g('O', '.##./#..#/#..#/#..#/.##.');
g('P', '###./#..#/###./#.../#...');
g('Q', '.##./#..#/#..#/#.#./.#.#');
g('R', '###./#..#/###./#..#/#..#');
g('S', '###/#../###/..#/###');
g('T', '#####/..#../..#../..#../..#..');
g('U', '#..#/#..#/#..#/#..#/.##.');
g('V', '#..#/#..#/#..#/#.#./.#..');
g('W', '#...#/#...#/#.#.#/##.##/#...#');
g('X', '#.#/#.#/.#./#.#/#.#');
g('Y', '#.#/#.#/.#./.#./.#.');
g('Z', '####/...#/.##./#.../####');
g('0', '.##./#..#/#..#/#..#/.##.');
g('1', '.#./##./.#./.#./###');
g('2', '##./..#/.#./#../###');
g('3', '###/..#/.##/..#/###');
g('4', '#.#/#.#/###/..#/..#');
g('5', '###/#../###/..#/###');
g('6', '.##/#../###/#.#/###');
g('7', '###/..#/.#./.#./.#.');
g('8', '###/#.#/###/#.#/###');
g('9', '###/#.#/###/..#/###');
g('+', '.../.#./###/.#./...');
g('-', '.../.../###/.../...');
g('.', './././././#');
g('!', '#/#/#/./#');
g('*', '.../#.#/.#./#.#/...');
g('#', '.#.#./#####/.#.#./#####/.#.#.');
g("'", '#/#/./././');
g('(', '.#/#./#./#./.#');
g(')', '#./.#/.#/.#/#.');
g('[', '##/#./#./#./##');
g(']', '##/.#/.#/.#/##');
g('/', '..#/..#/.#./#../#..');
g(':', './#/./#/.');
const SPACE_W = 2;

/* ---- dither background plate (dibaca dari member.png) ---- */
function bgTone(x, y) {
  switch (y) {
    case 2:
    case 3:
      return 0;
    case 4:
      return x % 4 === 1 ? 1 : 0;
    case 5:
      return x % 2 === 1 ? 1 : 0;
    case 6:
      return x % 2 === 0 ? 1 : 0;
    default:
      return 1;
  }
}

/*
 * Dua pilihan ikon yang dijual:
 *  - "basic"  → Logo Biasa  (bentuk orang; gratis, termasuk harga dasar)
 *  - "custom" → Logo Custom (bentuk bintang; premium +15rb)
 * b = base asli, p = palet hex, m = peta indeks palet per pixel.
 */
const ICONS = {
  basic: {
    b: 'fffa00',
    p: 'c8c400f6f5aafffd91fffb44fffc72e9e64d787500000000',
    m: 'AABBBBAA/AACDDEAA/AAAFFAAA/AAFFEEAA/GCCDDDDG/GDDDDDDG/GHHHHHHG',
  },
  custom: {
    b: 'e68eff',
    p: 'c700ff790eb0930bd99c40cba858d1000000bc7fdb',
    m: 'AAABBAAA/AACDDCAA/BBDEEDBB/FCDGGDCF/ACCEECCA/BBCFFCBB/FFFAAFFF',
  },
};

export const ICON_LABELS = { basic: 'Logo Biasa', custom: 'Logo Custom' };

/* ===================== util warna ===================== */
const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb2hex = (a) =>
  '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mulc = (h, f) => rgb2hex(hex2rgb(h).map((v) => v * f));

function rgb2hsl([r, gr, b]) {
  r /= 255; gr /= 255; b /= 255;
  const mx = Math.max(r, gr, b), mn = Math.min(r, gr, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === r) h = (gr - b) / d + (gr < b ? 6 : 0);
  else if (mx === gr) h = (b - r) / d + 2;
  else h = (r - gr) / d + 4;
  return [h / 6, s, l];
}
function hsl2rgb([h, s, l]) {
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/* Warnai ulang satu warna palet ikon mengikuti base baru; shading dijaga. */
function recolor(colorHex, oldBaseHex, newBaseHex) {
  if (colorHex === oldBaseHex) return newBaseHex;
  const c = rgb2hsl(hex2rgb(colorHex));
  const o = rgb2hsl(hex2rgb(oldBaseHex));
  const n = rgb2hsl(hex2rgb(newBaseHex));
  if (c[2] < 0.04) return colorHex; // hampir hitam: biarkan
  const dh = c[0] - o[0];
  const s = o[1] < 0.02 ? (c[1] * n[1]) / Math.max(o[1], 0.02) : Math.min(1, c[1] * (n[1] / o[1]));
  const l = c[2] + (n[2] - o[2]) * 0.35;
  return rgb2hex(hsl2rgb([n[0] + dh, Math.min(1, s), Math.max(0, Math.min(1, l))]));
}

function iconPalette(ico, target) {
  const oldBase = '#' + ico.b;
  const cols = ico.p.match(/.{6}/g).map((s) => '#' + s);
  if (target.toLowerCase() === oldBase) return cols;
  return cols.map((col) => recolor(col, oldBase, target.toLowerCase()));
}

/* ===================== layout teks ===================== */
function layout(text, tracking) {
  const cells = [];
  let x = 0;
  for (const ch of String(text).toUpperCase()) {
    if (ch === ' ') { x += SPACE_W + tracking; continue; }
    const rows = F[ch];
    if (!rows) continue;
    for (let ry = 0; ry < rows.length; ry++)
      for (let rx = 0; rx < rows[ry].length; rx++)
        if (rows[ry][rx] === '#') cells.push({ x: x + rx, y: ry });
    x += rows[0].length + tracking;
  }
  return { cells, width: Math.max(0, x - tracking) };
}

/** Lebar teks maksimum yang muat di plate (px). */
export const TEXT_MAX_W = TXT_X1 - TXT_X0 + 1;

/** Cek apakah teks muat di plate dengan tracking 1. */
export function textFits(text) {
  return layout(text, 1).width <= TEXT_MAX_W;
}

/**
 * Render tag 74×12 ke canvas baru.
 * cfg: { text, base, icon: 'basic'|'custom', textColor?, shadowColor? }
 * Mid & dark SELALU diturunkan otomatis dari base (aturan produk —
 * pembeli hanya memilih base). Warna teks & shadow bebas.
 */
export function renderPrefixTag(cfg, doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return null;
  const base = cfg.base || '#d0d0d0';
  const mid = mulc(base, 0.78);
  const dark = mulc(base, 0.52);
  const textColor = cfg.textColor || '#ffffff';
  const shadowColor = cfg.shadowColor || '#000000';
  const tracking = 1;

  const cv = doc.createElement('canvas');
  cv.width = TAG_W;
  cv.height = TAG_H;
  const ctx = cv.getContext('2d');
  const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); };
  const K = '#000000';
  const TONE = [mid, dark];

  /* kotak ikon kiri */
  for (let x = ICO_X0; x <= ICO_X1; x++) { px(x, 0, K); px(x, TAG_H - 1, K); }
  for (let y = 1; y <= TAG_H - 2; y++) { px(ICO_X0, y, K); px(ICO_X1, y, K); }
  for (let x = 1; x <= 10; x++) { px(x, 1, base); px(x, 9, base); px(x, 10, dark); }
  for (let y = 2; y <= 8; y++) { px(1, y, base); px(10, y, base); }
  const ico = ICONS[cfg.icon] || ICONS.basic;
  const pal = iconPalette(ico, base);
  ico.m.split('/').forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) px(2 + rx, 2 + ry, pal[row.charCodeAt(rx) - 65]);
  });

  /* plate teks */
  for (let x = PLT_X0; x <= PLT_X1; x++) { px(x, 0, K); px(x, TAG_H - 1, K); }
  for (let y = 1; y <= TAG_H - 2; y++) { px(PLT_X0, y, K); px(PLT_X1, y, K); }
  for (let x = 14; x <= 72; x++) { px(x, 1, base); px(x, 9, base); px(x, 10, dark); }
  for (let y = 2; y <= 8; y++) {
    px(14, y, base); px(72, y, base);
    for (let x = TXT_X0; x <= TXT_X1; x++) px(x, y, TONE[bgTone(x, y)]);
  }

  /* huruf + shadow lurus ke bawah */
  const L = layout(cfg.text || '', tracking);
  const startX = Math.floor(43 - L.width / 2);
  const inArea = (x, y) => x >= TXT_X0 && x <= TXT_X1 && y >= 2 && y <= 8;
  for (const p of L.cells) {
    const sx = startX + p.x, sy = TXT_Y0 + p.y + 1;
    if (inArea(sx, sy)) px(sx, sy, shadowColor);
  }
  for (const p of L.cells) {
    const sx = startX + p.x, sy = TXT_Y0 + p.y;
    if (inArea(sx, sy)) px(sx, sy, textColor);
  }

  /* kolom pemisah transparan */
  ctx.clearRect(GAP_X, 0, 1, TAG_H);

  return cv;
}

/** Gambar tag ke canvas tujuan dengan zoom pixelated. */
export function drawPrefixTag(targetCanvas, cfg, zoom = 4) {
  const src = renderPrefixTag(cfg);
  if (!src || !targetCanvas) return false;
  targetCanvas.width = TAG_W * zoom;
  targetCanvas.height = TAG_H * zoom;
  const cx = targetCanvas.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  cx.drawImage(src, 0, 0, targetCanvas.width, targetCanvas.height);
  return true;
}

/** dataURL PNG resolusi tinggi (untuk download admin setelah lunas). */
export function prefixTagDataURL(cfg, scale = 1) {
  const src = renderPrefixTag(cfg);
  if (!src) return null;
  if (scale === 1) return src.toDataURL('image/png');
  const cv = document.createElement('canvas');
  cv.width = TAG_W * scale;
  cv.height = TAG_H * scale;
  const cx = cv.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.drawImage(src, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/png');
}
