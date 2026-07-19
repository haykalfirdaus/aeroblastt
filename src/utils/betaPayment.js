async function safeJson(res) {
  const text = await res.text();
  if (!text) throw new Error(`Server mengembalikan respons kosong (${res.status})`);
  try { return JSON.parse(text); } catch { throw new Error(`Respons tidak valid dari server (${res.status})`); }
}

export async function createBetaOrder(payload) {
  const res = await fetch('/api/beta-payment?action=create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal membuat order');
  return data; // { orderId, suffix, totalAmount, expiresAt }
}

export async function pollBetaOrderStatus(orderId) {
  const res = await fetch(`/api/beta-payment?action=status&orderId=${orderId}`);
  const data = await safeJson(res);
  if (!data.ok) throw new Error(data.error || 'Gagal cek status');
  return data; // { status, expiresAt, paidAt }
}
