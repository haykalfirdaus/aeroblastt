'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Download, Package, Pencil, Plus, Trash2, X } from 'lucide-react';
import { PACK_ICON_B64, GLYPH_E2_B64 } from '@/lib/bedrockAssets';
import { useToast } from '@/context/ToastContext';
import {
  TAG_W,
  TAG_H,
  MINI_W,
  MINI_H,
  TEXT_MAX_W,
  MINI_TEXT_MAX_W,
  PRESETS,
  ICON_NAMES,
  autoTone,
  drawIconThumb,
  drawPrefixTag,
  drawMiniTag,
  prefixTagDataURL,
  miniTagDataURL,
  textWidth,
} from '@/lib/prefixTag';

/*
 * Studio Texture Rank — port penuh assets/rank-generator.html ke admin panel,
 * dirombak ke bahasa Soft UI web sekarang (cream #fff8f0, shadow
 * neumorphic --neu-out/--neu-in, aksen lime #BFFF5E). Fiturnya utuh:
 *  - preset warna rank + picker ikon lengkap (diwarnai ulang mengikuti base)
 *  - autoTone (mid/dark turunan base) atau override manual
 *  - geser teks X, spasi huruf, warna teks & shadow, ikon pakai warna sendiri
 *  - font provider (height/ascent/char/folder), pack multi-tag,
 *    default.json, download PNG satuan, download resourcepack .zip
 * Semua berjalan client-side; tidak ada state server.
 */

/* ---------- ZIP stored, tanpa dependensi (port dari generator) ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function zip(files) {
  const enc = new TextEncoder(), chunks = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = f.data, crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cStart = offset;
  let cSize = 0;
  central.forEach((c) => (cSize += c.length));
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cSize, true); end.setUint32(16, cStart, true);
  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}
function dataURLtoBytes(u) {
  const bin = atob(u.split(',')[1]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const toU = (ch) => '\\u' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

/* ---------- Bedrock pack (format persis sanzbedrock/potatosmpbedrock) ---------- */

const b64toBytes = (b64) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

/*
 * Posisi kiri-atas glyph di dalam sel 128px atlas glyph_E8 (grid 16×16,
 * karakter U+E8XY → sel baris X kolom Y). Aturan hasil reverse dari pack
 * contoh — WAJIB tepat sama:
 *   74×12 (besar/sanz)      → x=27, y=58 di semua sel
 *   65×8  (mini/potato)     → y=60, x = 30 − 3×kolom (30, 27, 24, …)
 */
function bedrockPlacement(w, h, col) {
  if (w === TAG_W && h === TAG_H) return { x: 27, y: 58 };
  if (w === MINI_W && h === MINI_H) return { x: Math.max(0, 30 - 3 * col), y: 60 };
  return { x: Math.floor((128 - w) / 2), y: Math.floor((128 - h) / 2) };
}

function randomUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

async function buildGlyphE8(pack) {
  const atlas = document.createElement('canvas');
  atlas.width = 2048; atlas.height = 2048;
  const ctx = atlas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (const p of pack) {
    const code = p.char.codePointAt(0);
    if ((code & 0xff00) !== 0xe800) {
      throw new Error(`Karakter ${toU(p.char)} (${p.file}) di luar halaman E8 — pack Bedrock hanya memuat U+E800..U+E8FF.`);
    }
    const idx = code & 0xff;
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = p.dataURL; });
    const pos = bedrockPlacement(img.width, img.height, idx & 0x0f);
    ctx.drawImage(img, (idx & 0x0f) * 128 + pos.x, (idx >> 4) * 128 + pos.y);
  }
  const blob = await new Promise((res) => atlas.toBlob(res, 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

function buildJSON(pack) {
  const provs = pack.map(
    (p) => `        {
            "type": "bitmap",
            "file": "minecraft:${p.folder}/${p.file}.png",
            "ascent": ${p.ascent},
            "height": ${p.height},
            "chars": ["${p.char}"]
        }`,
  );
  return '{\n    "providers": [\n' + provs.join(',\n') + '\n    ]\n}';
}

/* ---------- primitives kecil, gaya admin ---------- */
const fieldCls =
  'w-full rounded-[var(--radius-neu)] bg-[#fff8f0] px-3 py-2 text-sm shadow-[var(--neu-in)] text-[#1d2b1f] placeholder:text-[#5a7048] outline-none transition-colors focus:border-[#BFFF5E]/70 focus:ring-2 focus:ring-[#BFFF5E]/20 disabled:cursor-not-allowed disabled:opacity-50';

function Label({ children }) {
  return <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#4a5e3a]">{children}</span>;
}

function ColorInput({ label, value, onChange, disabled }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-[10px] bg-[#fff8f0] p-0.5 shadow-[var(--neu-in)] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldCls} font-mono uppercase`}
        />
      </span>
    </label>
  );
}

function IconThumb({ name, color, selected, onClick }) {
  const ref = useRef(null);
  useEffect(() => {
    drawIconThumb(ref.current, name, color);
  }, [name, color]);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-1 rounded-[10px] px-1.5 py-1.5 text-[9px] font-semibold [transition:box-shadow_150ms_ease,color_150ms_ease] ${
        selected
          ? 'bg-[#eef3e2] text-[#1d2b1f] shadow-[var(--neu-in)]'
          : 'bg-[#fff8f0] text-[#4a5e3a] shadow-[var(--neu-out)] hover:text-[#1d2b1f]'
      }`}
    >
      <canvas ref={ref} className="[image-rendering:pixelated]" style={{ width: 24, height: 21 }} />
      {name.length > 8 ? name.slice(0, 8) : name}
    </button>
  );
}

/* ---------- studio ---------- */
export function RankTextureStudio() {
  const showToast = useToast();

  // versi: 'big' 74×12 (template member.png) / 'mini' 65×8 (template silver.png)
  const [size, setSize] = useState('big');

  // desain
  const [text, setText] = useState('MEMBER');
  const [fname, setFname] = useState('member');
  const [offx, setOffx] = useState(0);
  const [tracking, setTracking] = useState(1);
  const [base, setBase] = useState('#d0d0d0');
  const [useAutoTone, setUseAutoTone] = useState(true);
  const [mid, setMid] = useState('#9d9d9d');
  const [dark, setDark] = useState('#6c6c6c');
  const [textColor, setTextColor] = useState('#ffffff');
  const [shadowColor, setShadowColor] = useState('#000000');
  const [icon, setIcon] = useState('member');
  const [icOwnColor, setIcOwnColor] = useState(false);
  const [iconColor, setIconColor] = useState('#ffaa00');

  // font provider
  const [fheight, setFheight] = useState(11);
  const [fascent, setFascent] = useState(9);
  const [glyph, setGlyph] = useState('');
  const [folder, setFolder] = useState('ranks');

  // pack — karakter auto dari halaman glyph_E8 (U+E800.., konvensi
  // libglyph-mcbe) supaya char yang sama valid di Java dan Bedrock
  const [pack, setPack] = useState([]);
  const [editIdx, setEditIdx] = useState(-1); // -1 = mode tambah
  const nextCode = useRef(0xe800);

  const tone = autoTone(base);
  const cfg = useMemo(
    () => ({
      text,
      base,
      icon,
      mid: useAutoTone ? tone.mid : mid,
      dark: useAutoTone ? tone.dark : dark,
      textColor,
      shadowColor,
      offx: Number(offx) || 0,
      tracking: Number(tracking) || 0,
      iconColor: icOwnColor ? iconColor : undefined,
    }),
    [text, base, icon, useAutoTone, tone.mid, tone.dark, mid, dark, textColor, shadowColor, offx, tracking, icOwnColor, iconColor],
  );

  const isMini = size === 'mini';
  const W = isMini ? MINI_W : TAG_W;
  const H = isMini ? MINI_H : TAG_H;
  const maxW = isMini ? MINI_TEXT_MAX_W : TEXT_MAX_W;
  const tw = textWidth(text, cfg.tracking);
  const fits = tw <= maxW;
  const toPng = isMini ? miniTagDataURL : prefixTagDataURL;

  const prevRef = useRef(null);
  const chatRef = useRef(null);
  useEffect(() => {
    const draw = isMini ? drawMiniTag : drawPrefixTag;
    draw(prevRef.current, cfg, 6);
    draw(chatRef.current, cfg, 2);
  }, [cfg, isMini]);

  const allocChar = useCallback(() => {
    const used = new Set(pack.map((p) => p.char));
    while (used.has(String.fromCodePoint(nextCode.current))) nextCode.current++;
    return String.fromCodePoint(nextCode.current++);
  }, [pack]);

  function handleAdd() {
    if (!text.trim()) return showToast('Nama rank masih kosong', 'error');
    if (!fits) return showToast(`Teks ${tw}px melebihi area ${maxW}px`, 'error');
    let ch = glyph ? [...glyph][0] : (editIdx !== -1 ? pack[editIdx].char : allocChar());
    if (pack.some((p, i) => i !== editIdx && p.char === ch)) return showToast(`Karakter ${toU(ch)} sudah dipakai`, 'error');
    const name = (fname.trim() || 'tag').replace(/[^\w.-]/g, '_');
    if (pack.some((p, i) => i !== editIdx && p.file === name)) return showToast(`Nama file "${name}" sudah ada`, 'error');
    const dataURL = toPng(cfg, 1);
    const item = {
      file: name, char: ch, dataURL,
      height: Number(fheight), ascent: Number(fascent), folder: folder.trim() || 'ranks',
      // seluruh state form disimpan agar item bisa diedit ulang nanti
      design: { size, text, fname: name, offx, tracking, base, useAutoTone, mid, dark, textColor, shadowColor, icon, icOwnColor, iconColor },
    };
    if (editIdx !== -1) {
      setPack((prev) => prev.map((p, i) => (i === editIdx ? item : p)));
      setEditIdx(-1);
      showToast(`"${name}.png" diperbarui`, 'success');
    } else {
      setPack((prev) => [...prev, item]);
      showToast(`"${name}.png" ditambahkan ke pack`, 'success');
    }
    setGlyph('');
  }

  /* Muat balik desain item pack ke form untuk diedit ulang */
  function handleEdit(i) {
    const p = pack[i];
    if (!p.design) return showToast('Item lama tanpa data desain — hapus lalu buat ulang.', 'error');
    const d = p.design;
    setSize(d.size); setText(d.text); setFname(p.file);
    setOffx(d.offx); setTracking(d.tracking);
    setBase(d.base); setUseAutoTone(d.useAutoTone); setMid(d.mid); setDark(d.dark);
    setTextColor(d.textColor); setShadowColor(d.shadowColor);
    setIcon(d.icon); setIcOwnColor(d.icOwnColor); setIconColor(d.iconColor);
    setFheight(p.height); setFascent(p.ascent); setFolder(p.folder); setGlyph(p.char);
    setEditIdx(i);
  }

  function handleCancelEdit() {
    setEditIdx(-1);
    setGlyph('');
  }

  /* Naik-turunkan urutan pack — urutan ini dipakai default.json Java */
  function moveItem(i, dir) {
    setPack((prev) => {
      const next = [...prev];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
    setEditIdx((cur) => (cur === i ? i + dir : cur === i + dir ? i : cur));
  }

  function handleDownloadPng() {
    const url = toPng(cfg, 1);
    if (!url) return;
    const a = document.createElement('a');
    a.download = (fname.trim() || 'tag') + '.png';
    a.href = url;
    a.click();
  }

  function handleCopyJson() {
    navigator.clipboard
      .writeText(buildJSON(pack))
      .then(() => showToast('default.json disalin', 'success'))
      .catch(() => showToast('Gagal menyalin', 'error'));
  }

  function handleDownloadZip() {
    if (!pack.length) return showToast('Pack masih kosong — tambahkan tag dulu', 'error');
    const enc = new TextEncoder();
    const files = [
      { name: 'pack.mcmeta', data: enc.encode(JSON.stringify({ pack: { pack_format: 15, description: 'Custom Rank Tags' } }, null, 4)) },
      { name: 'assets/minecraft/font/default.json', data: enc.encode(buildJSON(pack)) },
      { name: 'chars.txt', data: enc.encode(pack.map((p) => `${p.file}\t${toU(p.char)}\t${p.char}`).join('\n')) },
      ...pack.map((p) => ({ name: `assets/minecraft/textures/${p.folder}/${p.file}.png`, data: dataURLtoBytes(p.dataURL) })),
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip(files));
    a.download = 'rank-tags-pack.zip';
    a.click();
  }

  /*
   * Convert langsung ke pack Bedrock — struktur & aturan persis pack contoh:
   * manifest "Made By Aeroblast Developer", UUID baru tiap generate,
   * version selalu [0,0,1]; glyph_E8 dirakit dari isi pack.
   */
  async function handleDownloadBedrock() {
    if (!pack.length) return showToast('Pack masih kosong — tambahkan tag dulu', 'error');
    let glyphE8;
    try { glyphE8 = await buildGlyphE8(pack); }
    catch (e) { return showToast(e.message, 'error'); }

    const enc = new TextEncoder();
    const manifest = {
      format_version: 2,
      header: {
        description: 'Made By Aeroblast Developer',
        name: 'Aeroblast Pack',
        uuid: randomUUID(),
        version: [0, 0, 1],
        min_engine_version: [1, 20, 0],
      },
      modules: [{ type: 'resources', uuid: randomUUID(), version: [0, 0, 1] }],
    };
    const files = [
      { name: 'pack_icon.png', data: b64toBytes(PACK_ICON_B64) },
      { name: 'manifest.json', data: enc.encode(JSON.stringify(manifest, null, 2)) },
      { name: 'font/glyph_E2.png', data: b64toBytes(GLYPH_E2_B64) },
      { name: 'font/glyph_E8.png', data: glyphE8 },
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip(files));
    a.download = 'aeroblast-bedrock-pack.zip';
    a.click();
  }

  function applyPreset(p) {
    setBase(p.base);
    setMid(p.mid);
    setDark(p.dark);
    setUseAutoTone(false);
    setIcon(p.ico);
  }

  const iconTarget = icOwnColor ? iconColor : base;

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      {/* ===== Kontrol ===== */}
      <div className="flex flex-col gap-4">
        {/* Toggle versi */}
        <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-out)]">
          <Label>Versi template</Label>
          <div className="flex gap-2">
            {[
              { id: 'big', label: `Besar ${TAG_W}×${TAG_H}`, hint: 'template member.png' },
              { id: 'mini', label: `Mini ${MINI_W}×${MINI_H}`, hint: 'template silver.png' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setSize(v.id);
                  // default provider yang pas untuk masing-masing template
                  if (v.id === 'mini') { setFheight(8); setFascent(7); }
                  else { setFheight(11); setFascent(9); }
                }}
                aria-pressed={size === v.id}
                className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-neu)] px-3 py-2 text-xs font-bold [transition:box-shadow_150ms_ease,color_150ms_ease] ${
                  size === v.id
                    ? 'bg-[#eef3e2] text-[#1d2b1f] shadow-[var(--neu-in)]'
                    : 'bg-[#fff8f0] text-[#4a5e3a] shadow-[var(--neu-out)] hover:text-[#1d2b1f]'
                }`}
              >
                {v.label}
                <span className="font-mono text-[10px] font-semibold opacity-70">{v.hint}</span>
              </button>
            ))}
          </div>
          {isMini && (
            <p className="mt-2 text-[11px] text-[#4a5e3a]">
              Versi mini: ikon blok polos (tanpa gambar), teks &amp; warna tetap bisa diatur.
            </p>
          )}
        </div>

        {/* Rank */}
        <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-out)]">
          <Label>Nama rank (teks di plate)</Label>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="contoh: LEGEND" className={fieldCls} />
          <div className="mt-3">
            <Label>Nama file (tanpa .png)</Label>
            <input type="text" value={fname} onChange={(e) => setFname(e.target.value)} className={fieldCls} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="block">
              <Label>Geser teks X</Label>
              <input type="number" min={-20} max={20} value={offx} onChange={(e) => setOffx(e.target.value)} className={fieldCls} />
            </label>
            <label className="block">
              <Label>Spasi huruf</Label>
              <input type="number" min={0} max={4} value={tracking} onChange={(e) => setTracking(e.target.value)} className={fieldCls} />
            </label>
          </div>
          {!fits && (
            <p className="mt-2 text-xs font-semibold text-warning">
              Teks {tw}px melebihi area {TEXT_MAX_W}px — kurangi huruf atau set spasi 0.
            </p>
          )}
        </div>

        {/* Warna */}
        <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-out)]">
          <Label>Preset warna rank</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.n}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-md border border-[#1d2b1f]/10/30 bg-[#fffdf9] px-1 py-1.5 text-[10px] font-semibold leading-tight text-[#4a5e3a] transition-colors hover:border-[#1d2b1f] hover:text-[#1d2b1f]"
                style={{ borderLeftColor: p.base, borderLeftWidth: 4 }}
              >
                {p.n}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <ColorInput label="Base — garis luar & baris terang" value={base} onChange={setBase} />
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#1d2b1f]">
            <input type="checkbox" checked={useAutoTone} onChange={(e) => setUseAutoTone(e.target.checked)} className="h-4 w-4 accent-[#BFFF5E]" />
            Turunkan mid &amp; dark otomatis dari base
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ColorInput label="Mid (isi bg)" value={useAutoTone ? tone.mid : mid} onChange={setMid} disabled={useAutoTone} />
            <ColorInput label="Dark (bayangan)" value={useAutoTone ? tone.dark : dark} onChange={setDark} disabled={useAutoTone} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ColorInput label="Teks" value={textColor} onChange={setTextColor} />
            <ColorInput label="Shadow teks" value={shadowColor} onChange={setShadowColor} />
          </div>
        </div>

        {/* Ikon — hanya versi besar; ikon mini adalah blok polos dari template */}
        {!isMini && (
        <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-out)]">
          <Label>Ikon kiri (12×12) — diwarnai ulang mengikuti base</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {ICON_NAMES.map((name) => (
              <IconThumb key={name} name={name} color={iconTarget} selected={icon === name} onClick={() => setIcon(name)} />
            ))}
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#1d2b1f]">
            <input type="checkbox" checked={icOwnColor} onChange={(e) => setIcOwnColor(e.target.checked)} className="h-4 w-4 accent-[#BFFF5E]" />
            Ikon pakai warna sendiri
          </label>
          {icOwnColor && (
            <div className="mt-2">
              <ColorInput label="Warna ikon" value={iconColor} onChange={setIconColor} />
            </div>
          )}
        </div>
        )}

        {/* Font provider */}
        <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-out)]">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <Label>height</Label>
              <input type="number" value={fheight} onChange={(e) => setFheight(e.target.value)} className={fieldCls} />
            </label>
            <label className="block">
              <Label>ascent</Label>
              <input type="number" value={fascent} onChange={(e) => setFascent(e.target.value)} className={fieldCls} />
            </label>
          </div>
          <div className="mt-3">
            <Label>Karakter (kosong = auto dari glyph_E8, U+E800…)</Label>
            <input type="text" value={glyph} onChange={(e) => setGlyph(e.target.value)} placeholder="auto — halaman E8 (libglyph-mcbe)" className={fieldCls} />
          </div>
          <div className="mt-3">
            <Label>Folder texture</Label>
            <input type="text" value={folder} onChange={(e) => setFolder(e.target.value)} className={fieldCls} />
          </div>
        </div>

        {/* Aksi */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[#BFFF5E]/60 bg-[#BFFF5E]/20 py-2.5 text-sm font-bold text-[#1d2b1f] transition-colors hover:bg-[#BFFF5E]/35"
          >
            <Plus size={15} /> {editIdx === -1 ? 'Tambah ke pack' : 'Simpan perubahan'}
          </button>
          {editIdx !== -1 && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[#1d2b1f]/10 bg-[#fffdf9] py-2 text-xs font-semibold text-[#1d2b1f] transition-colors hover:bg-[#f5ece0]"
            >
              <X size={13} /> Batal edit
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadPng}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[#1d2b1f]/10 bg-[#fffdf9] py-2 text-xs font-semibold text-[#1d2b1f] transition-colors hover:bg-[#f5ece0]"
          >
            <Download size={13} /> Download PNG tag ini
          </button>
        </div>
      </div>

      {/* ===== Preview + pack ===== */}
      <div className="flex min-w-0 flex-col gap-4">
        <p className="text-xs text-[#4a5e3a]">
          Texture <b className="text-[#1d2b1f]">{W} × {H}px</b> · lebar teks{' '}
          <b className={fits ? 'text-[#1d2b1f]' : 'text-warning'}>{tw}/{maxW}px</b> · height{' '}
          <b className="text-[#1d2b1f]">{fheight}</b>, ascent <b className="text-[#1d2b1f]">{fascent}</b>
        </p>

        {/* Preview besar — papan checker seperti generator asli */}
        <div
          className="overflow-x-auto rounded-[var(--radius-neu-lg)] p-5 shadow-[var(--neu-in)]"
          style={{
            background:
              'linear-gradient(45deg,#e8dfd2 25%,transparent 25%,transparent 75%,#e8dfd2 75%), linear-gradient(45deg,#e8dfd2 25%,#f5ece0 25%,#f5ece0 75%,#e8dfd2 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 8px 8px',
          }}
        >
          <canvas ref={prevRef} className="[image-rendering:pixelated]" style={{ width: W * 6, maxWidth: '100%', height: 'auto' }} />
        </div>

        {/* Chat line */}
        <div className="flex items-center gap-1.5 rounded-[var(--radius-neu-lg)] bg-[#2b2b2b] shadow-[var(--neu-in)] px-4 py-3 font-mono text-sm">
          <canvas ref={chatRef} className="shrink-0 [image-rendering:pixelated]" style={{ width: W * 1.5, height: 'auto' }} />
          <span className="text-white">Steve&gt; halo semua</span>
        </div>

        {/* Isi pack */}
        <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] shadow-[var(--neu-out)]">
          <div className="flex items-center gap-2 border-b border-[#1d2b1f]/10 px-4 py-3">
            <Package size={15} className="text-[#1d2b1f]" />
            <h3 className="text-sm font-bold text-[#1d2b1f]">Isi pack ({pack.length})</h3>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                disabled={!pack.length}
                className="flex items-center gap-1 rounded-lg border border-[#1d2b1f]/10 bg-[#f5ece0] px-2.5 py-1 text-[11px] font-semibold text-[#1d2b1f] transition-colors hover:bg-[#e8dfd2] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Copy size={11} /> Salin JSON
              </button>
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={!pack.length}
                className="flex items-center gap-1 rounded-lg border border-[#BFFF5E]/60 bg-[#BFFF5E]/20 px-2.5 py-1 text-[11px] font-bold text-[#1d2b1f] transition-colors hover:bg-[#BFFF5E]/35 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={11} /> Java (.zip)
              </button>
              <button
                type="button"
                onClick={handleDownloadBedrock}
                disabled={!pack.length}
                className="flex items-center gap-1 rounded-lg border border-[#BFFF5E]/60 bg-[#BFFF5E]/20 px-2.5 py-1 text-[11px] font-bold text-[#1d2b1f] transition-colors hover:bg-[#BFFF5E]/35 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={11} /> Bedrock (.zip)
              </button>
            </div>
          </div>

          {pack.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[#4a5e3a]">Belum ada tag. Atur desain lalu klik "Tambah ke pack".</p>
          ) : (
            <div className="divide-y divide-[#1d2b1f]/15">
              {pack.map((p, i) => (
                <div key={p.file} className={`flex items-center gap-3 px-4 py-2.5 ${i === editIdx ? 'bg-[#BFFF5E]/10' : ''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataURL} alt={p.file} className="h-6 rounded bg-[#2b2b2b] p-0.5 [image-rendering:pixelated]" />
                  <span className="min-w-0 truncate font-mono text-xs text-[#1d2b1f]">{p.file}.png</span>
                  <code className="rounded border border-[#1d2b1f]/30 bg-[#f5ece0] px-1.5 py-0.5 font-mono text-[10px] text-[#4a5e3a]">{toU(p.char)}</code>
                  <span className="text-[10px] text-[#4a5e3a]">{p.folder}/</span>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(i, -1)}
                      disabled={i === 0}
                      aria-label={`Naikkan urutan ${p.file}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1d2b1f]/10 bg-[#fffdf9] text-[#4a5e3a] transition-colors hover:bg-[#f5ece0] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(i, 1)}
                      disabled={i === pack.length - 1}
                      aria-label={`Turunkan urutan ${p.file}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1d2b1f]/10 bg-[#fffdf9] text-[#4a5e3a] transition-colors hover:bg-[#f5ece0] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(i)}
                      aria-label={`Edit ${p.file}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1d2b1f]/10 bg-[#fffdf9] text-[#4a5e3a] transition-colors hover:bg-[#f5ece0]"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (i === editIdx) setEditIdx(-1); setPack((prev) => prev.filter((_, j) => j !== i)); }}
                      aria-label={`Hapus ${p.file}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-danger/30 bg-danger/[0.07] text-danger transition-colors hover:bg-danger/15"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pack.length > 0 && (
            <pre className="max-h-64 overflow-auto border-t border-[#1d2b1f]/10 bg-[#1d2b1f] p-4 text-[11px] leading-relaxed text-[#BFFF5E]">
              {buildJSON(pack)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
