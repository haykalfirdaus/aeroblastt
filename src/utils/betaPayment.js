export async function createBetaOrder(payload) {
  const res = await fetch('/api/beta-payment?action=create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal membuat order');
  return data; // { orderId, suffix, totalAmount, expiresAt }
}

export async function pollBetaOrderStatus(orderId) {
  const res = await fetch(`/api/beta-payment?action=status&orderId=${orderId}`);
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal cek status');
  return data; // { status, nick, type, totalAmount, expiresAt, paidAt }
}
