/**
 * Konverter QRIS statis → dinamis (EMVCo TLV).
 *
 * QRIS statis tidak membawa nominal, jadi player harus mengetik sendiri dan
 * sering salah. Dengan menyisipkan tag 54 (transaction amount) nominalnya
 * sudah terisi otomatis saat di-scan — termasuk suffix unik yang dipakai
 * `beta_orders` untuk mencocokkan pembayaran.
 *
 * Payload statis dibaca dari env `QRIS_STATIC_PAYLOAD`.
 */

const TAG_POI_METHOD = '01'; // 11 = statis, 12 = dinamis
const TAG_AMOUNT = '54';
const TAG_CRC = '63';

/** CRC16-CCITT (poly 0x1021, init 0xFFFF) — checksum wajib EMVCo. */
export function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Pecah payload jadi [{ tag, value }] berurutan. Throw kalau strukturnya rusak. */
export function parseTLV(payload) {
  const out = [];
  let i = 0;
  while (i < payload.length) {
    const tag = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (tag.length < 2 || !Number.isInteger(len)) throw new Error('Payload QRIS rusak (TLV tidak valid)');
    const value = payload.slice(i + 4, i + 4 + len);
    if (value.length !== len) throw new Error('Payload QRIS rusak (panjang tidak cocok)');
    out.push({ tag, value });
    i += 4 + len;
  }
  return out;
}

function encodeTLV(items) {
  return items.map(({ tag, value }) => `${tag}${String(value.length).padStart(2, '0')}${value}`).join('');
}

/**
 * Buang blok CRC penutup. Selalu 8 karakter terakhir ("6304" + 4 hex digit) —
 * jangan pakai lastIndexOf('6304') karena "6304" bisa muncul di dalam value.
 */
function stripCrc(payload) {
  const tail = payload.slice(-8);
  return tail.startsWith(TAG_CRC + '04') ? payload.slice(0, -8) : payload;
}

/** Validasi checksum payload statis supaya salah-tempel ketahuan lebih awal. */
export function isValidQrisPayload(payload) {
  if (typeof payload !== 'string' || payload.length < 20) return false;
  const tail = payload.slice(-8);
  if (!tail.startsWith(TAG_CRC + '04')) return false;
  const body = payload.slice(0, -4);
  return crc16(body) === tail.slice(4).toUpperCase();
}

/**
 * Ubah QRIS statis menjadi dinamis dengan nominal `amount` (rupiah, integer).
 * Mengembalikan string payload baru yang siap di-encode jadi QR.
 */
export function convertToDynamic(staticPayload, amount) {
  const value = Number(amount);
  if (!Number.isInteger(value) || value <= 0) throw new Error('Nominal QRIS tidak valid');

  const raw = String(staticPayload || '').trim();
  if (!raw) throw new Error('QRIS_STATIC_PAYLOAD belum dikonfigurasi');

  // Buang CRC lama — akan dihitung ulang setelah payload berubah.
  const items = parseTLV(stripCrc(raw)).filter((it) => it.tag !== TAG_CRC && it.tag !== TAG_AMOUNT);

  const poi = items.find((it) => it.tag === TAG_POI_METHOD);
  if (poi) poi.value = '12';
  else items.unshift({ tag: TAG_POI_METHOD, value: '12' });

  // Tag harus menaik: sisipkan 54 sebelum tag pertama yang nomornya di atas 54.
  const amountItem = { tag: TAG_AMOUNT, value: String(value) };
  const at = items.findIndex((it) => Number(it.tag) > Number(TAG_AMOUNT));
  if (at === -1) items.push(amountItem);
  else items.splice(at, 0, amountItem);

  const rebuilt = `${encodeTLV(items)}${TAG_CRC}04`;
  return `${rebuilt}${crc16(rebuilt)}`;
}

/** Payload statis dari env, tervalidasi. Return null kalau belum diset/rusak. */
export function getStaticQrisPayload() {
  const payload = (process.env.QRIS_STATIC_PAYLOAD || '').trim();
  if (!payload) return null;
  if (!isValidQrisPayload(payload)) return null;
  return payload;
}

// Hasil decode PNG di-cache selama proses hidup — decoding QR itu mahal dan
// gambarnya hanya berubah saat deploy.
let pngPayloadCache;

/**
 * Baca payload QRIS langsung dari `public/payment/qris.png`.
 * Dipakai kalau `QRIS_STATIC_PAYLOAD` tidak diset, supaya ganti QRIS cukup
 * dengan menimpa file gambarnya — tanpa menyalin string EMVCo manual.
 * Return null (bukan throw) kalau gambar tidak ada / tidak bisa dibaca.
 */
async function readPayloadFromPng() {
  if (pngPayloadCache !== undefined) return pngPayloadCache;

  try {
    const [{ default: sharp }, { default: jsQR }, path] = await Promise.all([
      import('sharp'),
      import('jsqr'),
      import('node:path'),
    ]);

    const file = path.join(process.cwd(), 'public', 'payment', 'qris.png');
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);

    const payload = decoded?.data?.trim();
    pngPayloadCache = payload && isValidQrisPayload(payload) ? payload : null;
  } catch {
    pngPayloadCache = null;
  }

  return pngPayloadCache;
}

/**
 * Payload dinamis untuk sebuah nominal, atau null kalau QRIS sumber tidak
 * bisa dibaca (client akan fallback ke gambar QRIS statis).
 *
 * Sumber payload, berurutan: env `QRIS_STATIC_PAYLOAD` (override manual),
 * lalu hasil decode `public/payment/qris.png`.
 */
export async function buildDynamicQris(amount) {
  const staticPayload = getStaticQrisPayload() || (await readPayloadFromPng());
  if (!staticPayload) return null;
  try {
    return convertToDynamic(staticPayload, amount);
  } catch {
    return null;
  }
}
