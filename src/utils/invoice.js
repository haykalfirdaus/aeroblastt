export async function sendInvoice(payload) {
  try {
    await fetch('/api/invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // non-blocking — order via WA tetap jalan meski notif gagal
  }
}
