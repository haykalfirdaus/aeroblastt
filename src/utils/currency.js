/**
 * Formats a number as Indonesian Rupiah, e.g. 20000 -> "Rp 20.000".
 * Mirrors the legacy `rupiah()` helper from store.js.
 * @param {number} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

/**
 * Formats a plain integer using Indonesian thousands separators,
 * e.g. 200000 -> "200.000". Used for balance / vote counts.
 * @param {number} amount
 * @returns {string}
 */
export function formatNumber(amount) {
  return Number(amount || 0).toLocaleString('id-ID');
}
