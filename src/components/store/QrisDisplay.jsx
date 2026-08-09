'use client';
import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
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

/**
 * Menampilkan QRIS dinamis (nominal sudah tertanam) untuk sebuah order.
 * Kalau payload dinamis tidak tersedia (env belum diset), fallback ke
 * gambar QRIS statis — player mengetik nominal manual seperti sebelumnya.
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

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/* Ukuran QR mengikuti lebar container (dibatasi 8rem–11rem) supaya tetap
          muat di layar pendek tanpa mendorong tombol keluar dari modal. */}
      <div className="rounded-md border border-2 border-[#1d2b1f] bg-white p-2 shadow-lg">
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
      </div>

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
              className="flex w-full items-center justify-center gap-2 rounded-md border border-2 border-[#1d2b1f] bg-[#faf3e8] py-2 text-xs font-semibold text-[#1d2b1f] transition-all hover:bg-[#BFFF5E]"
            >
              <Download size={14} />
              Download QRIS
            </a>
          )}
          <p className="text-center text-[10px] leading-snug text-[#6b7f5a]">
            Bayar dari HP yang sama? Download QR-nya, lalu scan dari galeri.
          </p>
        </>
      )}
    </div>
  );
}
