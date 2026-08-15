'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, ZoomIn } from 'lucide-react';
import QRCode from 'qrcode';
import { formatRupiah } from '@/utils/currency';
import { SITE } from '@/data/config';

const STATIC_QRIS_IMG = SITE.payment.QRIS?.imgPath || '/payment/qris.png';

// Ukuran render QR. Besar supaya tetap tajam saat di-zoom / discan dari layar lain,
// lalu dikecilkan lewat CSS agar tidak memakan ruang modal.
const CANVAS_SIZE = 640;
// Ukuran file download — lebih besar lagi, dengan quiet zone lebar supaya
// tetap terbaca walau discan dari galeri HP.
const DOWNLOAD_SIZE = 1024;

/*
 * Perbesar QR di TAB BARU — pendekatan lightbox/overlay ditinggalkan karena
 * kalah tumpuk dengan modal pembayaran di sebagian device.
 *
 * Halaman dibuat sebagai BLOB URL, bukan document.write ke about:blank:
 * about:blank di mobile sering mengabaikan meta viewport (QR jadi mungil di
 * pojok kiri atas) dan isinya lenyap saat tab di-refresh karena tidak punya
 * URL sungguhan. Blob URL punya dokumen beneran — viewport dihormati dan
 * refresh tetap merender ulang halaman yang sama selama tab asal masih hidup.
 */
function openQrisTab(src, amount) {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>QRIS AeroBlast — ${formatRupiah(amount)}</title>
<style>
  html,body{margin:0;min-height:100%;background:#1d2b1f;font-family:system-ui,sans-serif}
  body{display:grid;place-items:center;min-height:100vh;min-height:100dvh}
  .wrap{display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px}
  .qr{background:#fff;padding:2vmin;line-height:0}
  img{width:min(92vmin,92vw);height:auto;aspect-ratio:1;object-fit:contain;display:block}
  p{color:#fff8f0;font-weight:700;font-size:16px;margin:0}
  small{color:#fff8f0;opacity:.6;font-size:12px;text-align:center}
</style>
</head>
<body>
  <div class="wrap">
    <div class="qr"><img src="${src}" alt="QRIS AeroBlast"></div>
    <p>${formatRupiah(amount)}</p>
    <small>Scan QR ini dengan aplikasi pembayaran,<br>lalu kembali ke tab sebelumnya.</small>
  </div>
</body>
</html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const win = window.open(url, '_blank');
  // Jangan langsung revoke — refresh tab butuh blob-nya masih hidup.
  // Dibersihkan saat halaman asal ditutup oleh browser.
  if (!win) URL.revokeObjectURL(url); // popup diblok: bersihkan saja
}

/**
 * Menampilkan QRIS dinamis (nominal sudah tertanam) untuk sebuah order.
 * Kalau payload dinamis tidak tersedia (env belum diset), fallback ke
 * gambar QRIS statis — player mengetik nominal manual seperti sebelumnya.
 * Tekan gambar QR untuk membukanya besar di tab baru.
 */
export function QrisDisplay({ payload, amount, label }) {
  const canvasRef = useRef(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!payload) return;
    let cancelled = false;

    const opts = { errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#FFFFFF' } };

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, payload, { ...opts, width: CANVAS_SIZE, margin: 2 })
        .then(() => {
          // Library qrcode menulis style.width/height = "640px" langsung ke
          // elemen. Inline style menang atas class Tailwind, jadi QR melar
          // memenuhi modal. Hapus supaya ukuran kembali diatur CSS.
          const el = canvasRef.current;
          if (!cancelled && el) {
            el.style.removeProperty('width');
            el.style.removeProperty('height');
          }
        })
        .catch(() => { if (!cancelled) setFailed(true); });
    }

    QRCode.toDataURL(payload, { ...opts, width: DOWNLOAD_SIZE, margin: 4 })
      .then((url) => { if (!cancelled) setDownloadUrl(url); })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => { cancelled = true; };
  }, [payload]);

  const useStatic = !payload || failed;
  const fileName = `qris-aeroblast-${amount}.png`;
  // Sumber gambar tab pembesar: dataURL resolusi download untuk QR dinamis,
  // gambar statis untuk fallback.
  const zoomSrc = useStatic ? STATIC_QRIS_IMG : downloadUrl;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/* Ukuran QR mengikuti lebar container (dibatasi 8rem–11rem) supaya tetap
          muat di layar pendek tanpa mendorong tombol keluar dari modal. */}
      <button
        type="button"
        onClick={() => zoomSrc && openQrisTab(zoomSrc, amount)}
        aria-label="Buka QRIS besar di tab baru"
        title="Tekan untuk membuka versi besar di tab baru"
        className="cursor-zoom-in rounded-[var(--radius-neu-lg)] bg-white p-3 shadow-[var(--neu-out)] [transition:transform_150ms_ease] active:scale-[0.97]"
      >
        {useStatic ? (
          <img
            src={STATIC_QRIS_IMG}
            alt="QRIS AeroBlast"
            className="block aspect-square w-[min(44vw,9rem)] object-contain sm:w-44"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="block aspect-square w-[min(44vw,9rem)] sm:w-44"
            aria-label={`QRIS ${label || ''} ${formatRupiah(amount)}`}
          />
        )}
      </button>

      {/* Hint kecil & transparan — fitur zoom tidak kasat mata tanpa ini */}
      <p className="flex items-center gap-1 text-center text-[10px] leading-snug text-[#1d2b1f]/45">
        <ZoomIn size={10} aria-hidden="true" /> Tekan QR untuk versi besar (tab baru)
      </p>

      {useStatic ? (
        <p className="text-center text-[11px] leading-snug text-[#4a5e3a]">
          Masukkan nominal <span className="font-semibold text-[#1d2b1f]">{formatRupiah(amount)}</span> secara manual saat membayar.
        </p>
      ) : (
        <>
          <p className="text-center text-[11px] leading-snug text-[#4a5e3a]">
            Nominal terisi otomatis saat di-scan.
          </p>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={fileName}
              className="neu-press flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] py-2 text-xs font-semibold text-[#1d2b1f] shadow-[var(--neu-out)]"
            >
              <Download size={14} aria-hidden="true" />
              Download QRIS
            </a>
          )}
          <p className="text-center text-[10px] leading-snug text-[#5a7048]">
            Bayar dari HP yang sama? Download QR-nya, lalu scan dari galeri.
          </p>
        </>
      )}
    </div>
  );
}
