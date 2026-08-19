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

/* Versi mini 65×8 — direplikasi pixel-per-pixel dari assetsmini/silver.png */
export const MINI_W = 65;
export const MINI_H = 8;

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
 * Ikon 8×7 (area x2..9, y2..8), semuanya diekstrak dari PNG rank asli.
 * b = base asli, p = palet hex, m = peta indeks palet per pixel.
 *
 * Dua pertama ("basic"/"custom") adalah yang dijual di store sebagai
 * Logo Biasa / Logo Custom. Sisanya dipakai studio Texture Rank di admin.
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
  /* ikon studio — dipilih admin, semuanya diwarnai ulang mengikuti base */
  normal: { b: 'd0d0d0', p: '9d9d9de3e3e3ebebebfffffff2f2f29f9f9fcdcdcda4a4a4e1e1e16e6e6e000000', m: 'AABCBBAA/AABDDEAA/AAFGGFHA/HAIICCHA/JEEDDDDJ/JDDDDDDJ/JKKKKKKJ' },
  bintang1: { b: 'e68eff', p: 'c700ff790eb0930bd99c40cba858d1000000bc7fdb', m: 'AAABBAAA/AACDDCAA/BBDEEDBB/FCDGGDCF/ACCEECCA/BBCFFCBB/FFFAAFFF' },
  bintang2: { b: 'f30000', p: 'aa00009313139a20208a0000983a3a000000a84646', m: 'AAABBAAA/AABCCBAA/DDCEECDD/FBCGGCBF/ABBEEBBA/DDBFFBDD/FFFAAFFF' },
  mahkota: { b: 'ffd700', p: 'b39700ffd700fff2a0806b00', m: 'AAAAAAAA/BAABBAAB/BAABBAAB/BBBBBBBB/BCCBBCCB/BBBBBBBB/DDDDDDDD' },
  pickaxe: { b: 'f30000', p: 'aa0000938a79adadad838383000000ad7100707070c98300e09914e7a62e', m: 'AAAAAAAA/AABBBCAA/ADEFEECA/GEAHAAEC/EAAIAAAE/AAAJAAAA/AAAJAAAA' },
  plus: { b: 'f30000', p: 'aa0000ffffff000000', m: 'AAABBAAA/AAABBAAA/ABBBBBBA/ABBBBBBA/ACCBBCCA/AAABBAAA/AAACCAAA' },
  yt: { b: 'f30000', p: 'aa0000ffffff000000', m: 'AAAAAAAA/ABBBAAAA/ABBBBBAA/ABBBBBBA/ABBBBCCA/ABBBCAAA/ACCCAAAA' },
  tiktok: { b: '00f2ea', p: '1f1f1fffffff00c8c2', m: 'AAAAAAAA/AAAABBBA/AAAABACA/AAAABAAA/ABBBBAAA/ABBBBAAA/AACCAAAA' },
  api: { b: 'ff6a00', p: '8a3800ff6a00ffd23c', m: 'AAABAAAA/AABBAAAA/ABBBBAAA/ABBCBBAA/ABCCCBAA/ABBCBBAA/AABBBAAA' },
  kosong: { b: 'd0d0d0', p: 'a8a8a8', m: 'AAAAAAAA/AAAAAAAA/AAAAAAAA/AAAAAAAA/AAAAAAAA/AAAAAAAA/AAAAAAAA' },
};

export const ICON_LABELS = { basic: 'Logo Biasa', custom: 'Logo Custom' };

/** Ikon yang tampil di studio Texture Rank admin (basic/custom khusus store). */
export const ICON_NAMES = ['normal', 'bintang1', 'bintang2', 'mahkota', 'pickaxe', 'plus', 'yt', 'tiktok', 'api', 'kosong'];

/** Label ikon studio. */
export const ICON_STUDIO_LABELS = {
  normal: 'Orang', bintang1: 'Bintang 1', bintang2: 'Bintang 2', mahkota: 'Mahkota',
  pickaxe: 'Pickaxe', plus: 'Plus', yt: 'YouTube', tiktok: 'TikTok', api: 'Api', kosong: 'Kosong',
};

/** Preset warna (nama warna saja, bukan nama rank). */
export const PRESETS = [
  { n: 'Silver', base: '#d0d0d0', mid: '#9d9d9d', dark: '#6c6c6c', ico: 'normal' },
  { n: 'Kuning', base: '#fffa00', mid: '#c8c400', dark: '#787500', ico: 'bintang1' },
  { n: 'Cyan', base: '#00e1ff', mid: '#3bb8c8', dark: '#009baf', ico: 'normal' },
  { n: 'Hijau', base: '#1fff00', mid: '#18c500', dark: '#139c00', ico: 'normal' },
  { n: 'Merah', base: '#ff2929', mid: '#d20000', dark: '#930000', ico: 'api' },
  { n: 'Ungu', base: '#a03dff', mid: '#6a3999', dark: '#351356', ico: 'bintang1' },
  { n: 'Biru Muda', base: '#33ccff', mid: '#3b8aa3', dark: '#16596f', ico: 'normal' },
  { n: 'Emas', base: '#f9ff00', mid: '#ffce00', dark: '#ff9200', ico: 'mahkota' },
  { n: 'Pink', base: '#e68eff', mid: '#c700ff', dark: '#9100ba', ico: 'bintang1' },
  { n: 'Merah Tua', base: '#f30000', mid: '#aa0000', dark: '#6f0000', ico: 'bintang2' },
  { n: 'Hitam', base: '#494949', mid: '#171717', dark: '#171717', ico: 'kosong' },
  { n: 'Emerald', base: '#00ffa2', mid: '#00c67e', dark: '#009459', ico: 'normal' },
];

/* ===================== util warna ===================== */
const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb2hex = (a) =>
  '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mulc = (h, f) => rgb2hex(hex2rgb(h).map((v) => v * f));

/* Interpolasi linear dua hex (t 0..1) — untuk gradient mid/dark/teks. */
function lerpc(h1, h2, t) {
  const a = hex2rgb(h1), b = hex2rgb(h2);
  return rgb2hex(a.map((v, i) => v + (b[i] - v) * t));
}
/* Buat fungsi warna-per-x: solid kalau c2 kosong, gradient kalau ada. */
const colorAt = (c1, c2, x0, x1) =>
  c2 ? (x) => lerpc(c1, c2, Math.max(0, Math.min(1, (x - x0) / Math.max(1, x1 - x0)))) : () => c1;

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
export function textFits(text, tracking = 1) {
  return layout(text, tracking).width <= TEXT_MAX_W;
}

/** Lebar teks dalam px (untuk indikator fit di studio admin). */
export function textWidth(text, tracking = 1) {
  return layout(text, tracking).width;
}

/** Turunan mid/dark otomatis dari base — dipakai UI saat autoTone aktif. */
export function autoTone(base) {
  return { mid: mulc(base, 0.78), dark: mulc(base, 0.52) };
}

/** Gambar thumbnail ikon 8×7 ke canvas (untuk picker di studio admin). */
export function drawIconThumb(targetCanvas, name, targetColor) {
  const ico = ICONS[name];
  if (!ico || !targetCanvas) return false;
  targetCanvas.width = 8;
  targetCanvas.height = 7;
  const cx = targetCanvas.getContext('2d');
  const pal = iconPalette(ico, targetColor || '#' + ico.b);
  ico.m.split('/').forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      cx.fillStyle = pal[row.charCodeAt(rx) - 65];
      cx.fillRect(rx, ry, 1, 1);
    }
  });
  return true;
}

/**
 * Render tag 74×12 ke canvas baru.
 * cfg: { text, base, icon, textColor?, shadowColor?,
 *        mid?, dark?          — override manual (default: turunan base),
 *        offx?, tracking?     — geser teks & spasi huruf (default 0 / 1),
 *        iconColor?           — ikon pakai warna sendiri, bukan base }
 * Store hanya memakai subset (base + teks + shadow); studio Texture Rank
 * di admin memakai semuanya.
 */
export function renderPrefixTag(cfg, doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return null;
  const base = cfg.base || '#d0d0d0';
  const tone = autoTone(base);
  const mid = cfg.mid || tone.mid;
  const dark = cfg.dark || tone.dark;
  const textColor = cfg.textColor || '#ffffff';
  const shadowColor = cfg.shadowColor || '#000000';
  const tracking = Number.isFinite(cfg.tracking) ? cfg.tracking : 1;
  const offx = Number.isFinite(cfg.offx) ? cfg.offx : 0;

  /* gradient (opsional): mid2/dark2 di plate, textColor2 di teks.
     profileMid/profileDark hanya kalau kotak ikon dibedakan sendiri. */
  const midAt = colorAt(mid, cfg.mid2, TXT_X0, TXT_X1);
  const darkAt = colorAt(dark, cfg.dark2, TXT_X0, TXT_X1);
  const pBase = cfg.profileBase || base;
  const pDark = cfg.profileDark || (cfg.profileBase ? autoTone(pBase).dark : dark);

  const cv = doc.createElement('canvas');
  cv.width = TAG_W;
  cv.height = TAG_H;
  const ctx = cv.getContext('2d');
  const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); };
  const K = '#000000';

  /* kotak ikon kiri — warna profile (default sama dengan utama) */
  for (let x = ICO_X0; x <= ICO_X1; x++) { px(x, 0, K); px(x, TAG_H - 1, K); }
  for (let y = 1; y <= TAG_H - 2; y++) { px(ICO_X0, y, K); px(ICO_X1, y, K); }
  for (let x = 1; x <= 10; x++) { px(x, 1, pBase); px(x, 9, pBase); px(x, 10, pDark); }
  for (let y = 2; y <= 8; y++) { px(1, y, pBase); px(10, y, pBase); }
  const ico = ICONS[cfg.icon] || ICONS.basic;
  const pal = iconPalette(ico, cfg.iconColor || pBase);
  ico.m.split('/').forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) px(2 + rx, 2 + ry, pal[row.charCodeAt(rx) - 65]);
  });

  /* plate teks */
  for (let x = PLT_X0; x <= PLT_X1; x++) { px(x, 0, K); px(x, TAG_H - 1, K); }
  for (let y = 1; y <= TAG_H - 2; y++) { px(PLT_X0, y, K); px(PLT_X1, y, K); }
  for (let x = 14; x <= 72; x++) { px(x, 1, base); px(x, 9, base); px(x, 10, darkAt(x)); }
  for (let y = 2; y <= 8; y++) {
    px(14, y, base); px(72, y, base);
    for (let x = TXT_X0; x <= TXT_X1; x++) px(x, y, bgTone(x, y) ? darkAt(x) : midAt(x));
  }

  /* huruf + shadow lurus ke bawah */
  const L = layout(cfg.text || '', tracking);
  const startX = Math.floor(43 - L.width / 2) + offx;
  const textAt = colorAt(textColor, cfg.textColor2, startX, startX + Math.max(1, L.width - 1));
  const inArea = (x, y) => x >= TXT_X0 && x <= TXT_X1 && y >= 2 && y <= 8;
  for (const p of L.cells) {
    const sx = startX + p.x, sy = TXT_Y0 + p.y + 1;
    if (inArea(sx, sy)) px(sx, sy, shadowColor);
  }
  for (const p of L.cells) {
    const sx = startX + p.x, sy = TXT_Y0 + p.y;
    if (inArea(sx, sy)) px(sx, sy, textAt(sx));
  }

  /* kolom pemisah transparan */
  ctx.clearRect(GAP_X, 0, 1, TAG_H);

  return cv;
}

/*
 * ===== Versi MINI 65×8 =====
 * Replika pixel-per-pixel template assetsmini/silver.png — hanya palet dan
 * teksnya yang diganti. Anatomi (dibaca dari PNG):
 *  - kotak ikon x0..7 (border hitam #1d1d1d, isi blok dengan shading),
 *    kolom x8 transparan, plate x9..64.
 *  - turunan warna dari base: i92 = base×0.92 (isi ikon), mid = base×0.85,
 *    dark = base×0.62 (silver: d0d0d0 → bfbfbf / b1b1b1 / 818181).
 *  - teks glyph 5px di y1..y5, shadow +1/+1 memakai dark.
 */
function miniBgTone(x, y) {
  // 0 = base, 1 = mid — pola dither plate silver.png
  switch (y) {
    case 1: return 0;
    case 2: return x % 4 === 0 ? 1 : 0;
    case 3: return x % 2 === 0 ? 1 : 0;
    case 4: return x % 2 === 1 ? 1 : 0;
    default: return 1; // y5, y6
  }
}

export function renderMiniTag(cfg, doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return null;
  const base = cfg.base || '#d0d0d0';
  const mid = cfg.mid || mulc(base, 0.85);
  const dark = cfg.dark || mulc(base, 0.62);
  const textColor = cfg.textColor || '#ffffff';
  const shadowColor = cfg.shadowColor || dark;
  const tracking = Number.isFinite(cfg.tracking) ? cfg.tracking : 1;
  const offx = Number.isFinite(cfg.offx) ? cfg.offx : 0;
  const K = '#1d1d1d';

  /* gradient plate/teks + warna profile terpisah (default = utama) */
  const midAt = colorAt(mid, cfg.mid2, 10, 63);
  const pBase = cfg.profileBase || base;
  const pMid = cfg.profileMid || (cfg.profileBase ? mulc(pBase, 0.85) : mid);
  const pDark = cfg.profileDark || (cfg.profileBase ? mulc(pBase, 0.62) : dark);
  const i92 = mulc(pBase, 0.92);

  const cv = doc.createElement('canvas');
  cv.width = MINI_W;
  cv.height = MINI_H;
  const ctx = cv.getContext('2d');
  const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); };

  /* kotak ikon x0..7 — blok shading persis silver.png */
  for (let x = 0; x <= 7; x++) { px(x, 0, K); px(x, 7, K); }
  for (let y = 1; y <= 6; y++) { px(0, y, K); px(7, y, K); }
  for (let y = 1; y <= 2; y++) { px(1, y, pBase); px(6, y, pBase); for (let x = 2; x <= 5; x++) px(x, y, i92); }
  px(1, 3, pBase); px(2, 3, pBase); px(3, 3, i92); px(4, 3, i92); px(5, 3, pBase); px(6, 3, pBase);
  for (let y = 4; y <= 5; y++) { px(1, y, pMid); px(6, y, pMid); for (let x = 2; x <= 5; x++) px(x, y, i92); }
  px(1, 6, pMid); px(6, 6, pMid); for (let x = 2; x <= 5; x++) px(x, 6, pDark);

  /* plate x9..64 */
  for (let x = 9; x <= 64; x++) { px(x, 0, K); px(x, 7, K); }
  for (let y = 1; y <= 6; y++) { px(9, y, K); px(64, y, K); }
  for (let y = 1; y <= 6; y++)
    for (let x = 10; x <= 63; x++) px(x, y, miniBgTone(x, y) ? midAt(x) : base);

  /* teks 5px di y1..y5, shadow lurus 1px ke bawah (sama seperti versi besar) */
  const L = layout(cfg.text || '', tracking);
  const startX = Math.floor(37 - L.width / 2) + offx;
  const textAt = colorAt(textColor, cfg.textColor2, startX, startX + Math.max(1, L.width - 1));
  const inArea = (x, y) => x >= 10 && x <= 63 && y >= 1 && y <= 6;
  for (const p of L.cells) {
    const sx = startX + p.x, sy = 2 + p.y;
    if (inArea(sx, sy)) px(sx, sy, shadowColor);
  }
  for (const p of L.cells) {
    const sx = startX + p.x, sy = 1 + p.y;
    if (inArea(sx, sy)) px(sx, sy, textAt(sx));
  }

  /* kolom pemisah x8 transparan */
  ctx.clearRect(8, 0, 1, MINI_H);

  return cv;
}

/** Lebar teks maksimum versi mini (px). */
export const MINI_TEXT_MAX_W = 63 - 10 + 1;

/** Gambar tag mini ke canvas tujuan dengan zoom pixelated. */
export function drawMiniTag(targetCanvas, cfg, zoom = 4) {
  const src = renderMiniTag(cfg);
  if (!src || !targetCanvas) return false;
  targetCanvas.width = MINI_W * zoom;
  targetCanvas.height = MINI_H * zoom;
  const cx = targetCanvas.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  cx.drawImage(src, 0, 0, targetCanvas.width, targetCanvas.height);
  return true;
}

/** dataURL PNG versi mini. */
export function miniTagDataURL(cfg, scale = 1) {
  const src = renderMiniTag(cfg);
  if (!src) return null;
  if (scale === 1) return src.toDataURL('image/png');
  const cv = document.createElement('canvas');
  cv.width = MINI_W * scale;
  cv.height = MINI_H * scale;
  const cx = cv.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.drawImage(src, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/png');
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
