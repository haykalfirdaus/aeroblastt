import { SITE } from '@/data/config';
import { formatRupiah } from './currency';

/**
 * Builds a `wa.me` deep link that opens WhatsApp with a pre-filled message.
 * @param {string} message - plain text, real newlines.
 * @returns {string}
 */
export function buildWhatsAppLink(message) {
  return `https://wa.me/${SITE.waNumber}?text=${encodeURIComponent(message)}`;
}

/** Opens a WhatsApp deep link in a new tab. */
export function openWhatsApp(message) {
  window.open(buildWhatsAppLink(message), '_blank', 'noopener,noreferrer');
}

/**
 * Joins non-empty lines with real newlines — the shared skeleton every
 * order message is built from.
 */
function compose(bannerTitle, lines, footer) {
  const body = lines.filter(Boolean).join('\n');
  return [`--- [ ${bannerTitle} ] ---`, '', body, '', footer].filter((l) => l !== undefined).join('\n');
}

/** Payment destination block — mirrors legacy buildPaymentInfo(). */
export function buildPaymentInfo(methodKey) {
  const info = SITE.payment[methodKey];
  if (!info) return '';
  const imgUrl = `${SITE.baseUrl}${info.imgPath}`;
  if (methodKey === 'QRIS') {
    return `Tujuan Pembayaran: ${imgUrl}\n\n_Scan QRIS dan kirim bukti screenshot_`;
  }
  return `Tujuan Pembayaran: ${imgUrl}`;
}

const TNC_LINE = '_Saya menyetujui Syarat & Ketentuan._';

/* Special Rank application (Builder / Media) */
export function buildRankApplicationMessage({ nick, platform, rank, socialLink, followerCount }) {
  const lines = [
    'Halo Admin, saya ingin mendaftar Special Rank!',
    '',
    '*DETAIL PENDAFTARAN*',
    `*Nickname:* ${nick}`,
    `*Platform:* ${platform}`,
    `*Rank:* ${rank}`,
    rank === 'MEDIA' ? `*Akun:* ${socialLink}` : '',
    rank === 'MEDIA' && followerCount ? `*Jumlah Follower:* ${followerCount}` : '',
  ];
  return compose(
    'AEROBLAST SPECIAL RANK',
    lines,
    '*--- [ PENDAFTARAN TERVERIFIKASI ] ---*\n_Saya telah membaca dan menyetujui semua syarat & ketentuan._'
  );
}

/* Request feature */
export function buildRequestMessage({ nick, category, description }) {
  const lines = [`*Dari:* ${nick}`, `*Kategori:* ${category}`, `*Detail:*\n${description}`];
  return compose('AEROBLAST REQUEST', lines, '*--- [ AEROBLAST NETWORK ] ---*');
}

/* Report player */
export function buildReportMessage({ nick, target, category, description }) {
  const lines = [
    `*Pelapor:* ${nick}`,
    `*Dilaporkan:* ${target}`,
    `*Pelanggaran:* ${category}`,
    `*Detail:*\n${description}`,
  ];
  return compose('AEROBLAST REPORT', lines, '*--- [ AEROBLAST NETWORK ] ---*');
}

/* Store: Rank order */
export function buildRankOrderMessage({ nick, platform, target, owned, duration, discountPct, basePrice, finalAmount, paymentMethod }) {
  const lines = [
    `Nickname: ${nick}`,
    `Platform: ${platform}`,
    `Rank Tujuan: ${target}` +
      (owned && owned !== 'none' ? `\nUpgrade dari: ${owned.toUpperCase()}` : '') +
      `\nDurasi: ${duration}` +
      (discountPct > 0 ? `\nDiskon: ${discountPct}%` : ''),
    `Harga Normal: ${formatRupiah(basePrice)}`,
    `Total Bayar: ${formatRupiah(finalAmount)}`,
    '',
    buildPaymentInfo(paymentMethod),
  ];
  return compose('AEROBLAST RANK ORDER', lines, TNC_LINE);
}

/* Store: Gacha key order */
export function buildKeyOrderMessage({ nick, platform, keyName, qty, discountPct, finalAmount, paymentMethod }) {
  const lines = [
    `Nickname: ${nick}`,
    `Platform: ${platform}`,
    `Tipe Key: ${keyName}`,
    `Jumlah: ${qty}x` + (discountPct > 0 ? `\nDiskon: ${discountPct}%` : ''),
    `Total Bayar: ${formatRupiah(finalAmount)}`,
    '',
    buildPaymentInfo(paymentMethod),
  ];
  return compose('AEROBLAST GACHA KEY ORDER', lines, TNC_LINE);
}

/* Store: Skill boost order */
export function buildSkillOrderMessage({ nick, platform, skillName, levels, discountPct, finalAmount, paymentMethod }) {
  const lines = [
    `Nickname: ${nick}`,
    `Platform: ${platform}`,
    `Skill: ${skillName}`,
    `Jumlah Level: ${levels}x` + (discountPct > 0 ? `\nDiskon: ${discountPct}%` : ''),
    `Total Bayar: ${formatRupiah(finalAmount)}`,
    '',
    buildPaymentInfo(paymentMethod),
  ];
  return compose('AEROBLAST SKILL BOOST ORDER', lines, TNC_LINE);
}

/* Store: Balance order */
export function buildBalanceOrderMessage({ nick, platform, balance, discountPct, finalAmount, paymentMethod }) {
  const lines = [
    `Nickname: ${nick}`,
    `Platform: ${platform}`,
    `Balance: ${balance.toLocaleString('id-ID')}` + (discountPct > 0 ? `\nDiskon: ${discountPct}%` : ''),
    `Total Bayar: ${formatRupiah(finalAmount)}`,
    '',
    buildPaymentInfo(paymentMethod),
  ];
  return compose('AEROBLAST BALANCE ORDER', lines, TNC_LINE);
}

/* Store: Command access order */
export function buildCommandOrderMessage({ nick, platform, cmdName, duration, discountPct, finalAmount, paymentMethod }) {
  const lines = [
    `Nickname: ${nick}`,
    `Platform: ${platform}`,
    `Command: ${cmdName}\nDurasi: ${duration}` + (discountPct > 0 ? `\nDiskon: ${discountPct}%` : ''),
    `Total Bayar: ${formatRupiah(finalAmount)}`,
    '',
    buildPaymentInfo(paymentMethod),
  ];
  return compose('AEROBLAST COMMAND ORDER', lines, TNC_LINE);
}

/* Store: Custom prefix (cosmetic) order */
export function buildCosmeticOrderMessage({ nick, platform, prefixText, prefixColor, nickColor, discountPct, finalAmount, paymentMethod }) {
  const lines = [
    `Nickname: ${nick}`,
    `Platform: ${platform}`,
    `Teks Prefix: [${prefixText}]`,
    `Warna Prefix: ${prefixColor}` +
      (nickColor ? `\nWarna Nickname: ${nickColor}` : '') +
      (discountPct > 0 ? `\nDiskon: ${discountPct}%` : ''),
    `Total Bayar: ${formatRupiah(finalAmount)}`,
    '',
    buildPaymentInfo(paymentMethod),
  ];
  return compose('AEROBLAST CUSTOM PREFIX ORDER', lines, TNC_LINE);
}
