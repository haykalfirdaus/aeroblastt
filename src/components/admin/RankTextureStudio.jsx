'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import {
  TAG_W,
  TAG_H,
  MINI_W,
  MINI_H,
  TEXT_MAX_W,
  MINI_TEXT_MAX_W,
  PRESETS,
  ICON_NAMES,
  ICON_STUDIO_LABELS,
  autoTone,
  drawIconThumb,
  drawPrefixTag,
  drawMiniTag,
  prefixTagDataURL,
  miniTagDataURL,
  textWidth,
} from '@/lib/prefixTag';

/*
 * Studio Texture Rank — generator PNG murni. Tidak ada lagi pembuatan
 * resourcepack (zip Java/Bedrock, default.json, simpan pack ke server):
 * atur desain → download PNG. Fitur:
 *  - preset warna (nama warna, bukan nama rank) + picker ikon studio
 *  - autoTone atau override manual mid/dark, plus gradient mid/dark & teks
 *  - warna profile (kotak ikon kecil) bisa dibedakan dari warna utama
 *  - geser teks X, spasi huruf, warna teks & shadow, ikon warna sendiri
 * Semua berjalan client-side.
 */

/* Event dari section Custom Prefix Lunas → studio. */
export const EDIT_PREFIX_EVENT = 'aeroblast:edit-prefix';
export const STUDIO_ANCHOR_ID = 'rank-texture-studio';

/* ---------- primitives kecil, gaya admin ---------- */
const fieldCls =
  'w-full rounded-[var(--radius-neu)] bg-[#fff8f0] px-3 py-2 text-sm shadow-[var(--neu-in)] text-[#1d2b1f] placeholder:text-[#5a7048] outline-none transition-colors focus:border-[#BFFF5E]/70 focus:ring-2 focus:ring-[#BFFF5E]/20 disabled:cursor-not-allowed disabled:opacity-50';

function Label({ children }) {
  return <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#4a5e3a]">{children}</span>;
}

function Check({ checked, onChange, children }) {
  return (
    <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#1d2b1f]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#BFFF5E]" />
      {children}
    </label>
  );
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
  const label = ICON_STUDIO_LABELS[name] || name;
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
      {label}
    </button>
  );
}

/* ---------- studio ---------- */
export function RankTextureStudio() {
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
  // gradient plate: mid/dark kiri → mid2/dark2 kanan
  const [useGradient, setUseGradient] = useState(false);
  const [mid2, setMid2] = useState('#3b82f6');
  const [dark2, setDark2] = useState('#1d4ed8');
  // teks
  const [textColor, setTextColor] = useState('#ffffff');
  const [useTextGradient, setUseTextGradient] = useState(false);
  const [textColor2, setTextColor2] = useState('#22d3ee');
  const [shadowColor, setShadowColor] = useState('#000000');
  // profile (kotak ikon kecil) — default ikut warna utama
  const [profileOwn, setProfileOwn] = useState(false);
  const [profileBase, setProfileBase] = useState('#d0d0d0');
  // ikon
  const [icon, setIcon] = useState('normal');
  const [icOwnColor, setIcOwnColor] = useState(false);
  const [iconColor, setIconColor] = useState('#ffaa00');

  /* Prefill dari tombol "Edit File" di section Custom Prefix Lunas */
  useEffect(() => {
    function onEditPrefix(ev) {
      const d = ev.detail || {};
      setSize('big');
      setText(d.prefixText || 'CUSTOM');
      setFname((d.prefixText || 'custom').toLowerCase().replace(/[^\w-]/g, '_'));
      setBase(d.base || d.prefixColor || '#d0d0d0');
      setUseAutoTone(true);
      setUseGradient(false);
      setUseTextGradient(false);
      setProfileOwn(false);
      setTextColor(d.textColor || '#ffffff');
      setShadowColor(d.shadowColor || '#000000');
      setIcon(ICON_NAMES.includes(d.icon) ? d.icon : 'normal');
      setIcOwnColor(false);
    }
    window.addEventListener(EDIT_PREFIX_EVENT, onEditPrefix);
    return () => window.removeEventListener(EDIT_PREFIX_EVENT, onEditPrefix);
  }, []);

  const tone = autoTone(base);
  const cfg = useMemo(
    () => ({
      text,
      base,
      icon,
      mid: useAutoTone ? tone.mid : mid,
      dark: useAutoTone ? tone.dark : dark,
      mid2: useGradient ? mid2 : undefined,
      dark2: useGradient ? dark2 : undefined,
      textColor,
      textColor2: useTextGradient ? textColor2 : undefined,
      shadowColor,
      profileBase: profileOwn ? profileBase : undefined,
      offx: Number(offx) || 0,
      tracking: Number(tracking) || 0,
      iconColor: icOwnColor ? iconColor : undefined,
    }),
    [text, base, icon, useAutoTone, tone.mid, tone.dark, mid, dark, useGradient, mid2, dark2, textColor, useTextGradient, textColor2, shadowColor, profileOwn, profileBase, offx, tracking, icOwnColor, iconColor],
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

  function handleDownloadPng() {
    const url = toPng(cfg, 1);
    if (!url) return;
    const a = document.createElement('a');
    a.download = (fname.trim() || 'tag') + '.png';
    a.href = url;
    a.click();
  }

  function applyPreset(p) {
    setBase(p.base);
    setMid(p.mid);
    setDark(p.dark);
    setUseAutoTone(false);
    setIcon(p.ico);
  }

  const iconTarget = icOwnColor ? iconColor : (profileOwn ? profileBase : base);

  return (
    <div id={STUDIO_ANCHOR_ID} className="grid gap-5 lg:grid-cols-[340px_1fr]">
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
                onClick={() => setSize(v.id)}
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

        {/* Teks */}
        <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-out)]">
          <Label>Teks di plate</Label>
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
              Teks {tw}px melebihi area {maxW}px — kurangi huruf atau set spasi 0.
            </p>
          )}
        </div>

        {/* Warna */}
        <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-out)]">
          <Label>Preset warna</Label>
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
          <Check checked={useAutoTone} onChange={setUseAutoTone}>Turunkan mid &amp; dark otomatis dari base</Check>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ColorInput label="Mid (isi bg)" value={useAutoTone ? tone.mid : mid} onChange={setMid} disabled={useAutoTone} />
            <ColorInput label="Dark (bayangan)" value={useAutoTone ? tone.dark : dark} onChange={setDark} disabled={useAutoTone} />
          </div>
          <Check checked={useGradient} onChange={setUseGradient}>Gradient mid &amp; dark (kiri → kanan)</Check>
          {useGradient && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <ColorInput label="Mid kanan" value={mid2} onChange={setMid2} />
              <ColorInput label="Dark kanan" value={dark2} onChange={setDark2} />
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ColorInput label="Teks" value={textColor} onChange={setTextColor} />
            <ColorInput label="Shadow teks" value={shadowColor} onChange={setShadowColor} />
          </div>
          <Check checked={useTextGradient} onChange={setUseTextGradient}>Gradient warna teks</Check>
          {useTextGradient && (
            <div className="mt-2">
              <ColorInput label="Teks kanan" value={textColor2} onChange={setTextColor2} />
            </div>
          )}
          <Check checked={profileOwn} onChange={setProfileOwn}>Warna profile (kotak kecil) dibedakan sendiri</Check>
          {profileOwn ? (
            <div className="mt-2">
              <ColorInput label="Base profile — mid & dark ikut turunan" value={profileBase} onChange={setProfileBase} />
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-[#4a5e3a]">Profile kecil memakai mid &amp; dark yang sama dengan warna utama.</p>
          )}
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
          <Check checked={icOwnColor} onChange={setIcOwnColor}>Ikon pakai warna sendiri</Check>
          {icOwnColor && (
            <div className="mt-2">
              <ColorInput label="Warna ikon" value={iconColor} onChange={setIconColor} />
            </div>
          )}
        </div>
        )}

        {/* Aksi */}
        <button
          type="button"
          onClick={handleDownloadPng}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-[#BFFF5E]/60 bg-[#BFFF5E]/20 py-2.5 text-sm font-bold text-[#1d2b1f] transition-colors hover:bg-[#BFFF5E]/35"
        >
          <Download size={15} /> Download PNG
        </button>
      </div>

      {/* ===== Preview ===== */}
      <div className="flex min-w-0 flex-col gap-4">
        <p className="text-xs text-[#4a5e3a]">
          Texture <b className="text-[#1d2b1f]">{W} × {H}px</b> · lebar teks{' '}
          <b className={fits ? 'text-[#1d2b1f]' : 'text-warning'}>{tw}/{maxW}px</b>
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
      </div>
    </div>
  );
}
