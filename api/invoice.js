import { setCorsHeaders } from './_auth.js';
import { supabase } from './_supabase.js';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const requests = new Map();
const MAX_REQ = 10;
const WINDOW_MS = 60 * 1000;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requests.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= MAX_REQ) return true;
  entry.count++;
  return false;
}

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

const ORDER_COLORS = {
  rank: 0x3b82f6,
  key: 0xf59e0b,
  skill: 0x10b981,
  balance: 0x8b5cf6,
  command: 0xef4444,
  cosmetic: 0xec4899,
};

const ORDER_TITLES = {
  rank: '🎖️ Order Rank',
  key: '🗝️ Order Gacha Key',
  skill: '⚡ Order Skill Boost',
  balance: '💰 Order Balance',
  command: '⌨️ Order Command',
  cosmetic: '✨ Order Custom Prefix',
};

function s(val, limit = 100) {
  return String(val ?? '').slice(0, limit);
}

function buildDetails(type, body) {
  const d = {};
  if (type === 'rank') {
    d.target = body.target;
    if (body.owned && body.owned !== 'none') d.owned = body.owned;
    d.duration = body.duration;
    if (body.basePrice) d.basePrice = body.basePrice;
  } else if (type === 'key') {
    d.keyName = body.keyName;
    d.qty = body.qty;
  } else if (type === 'skill') {
    d.skillName = body.skillName;
    d.levels = body.levels;
  } else if (type === 'balance') {
    d.balance = body.balance;
  } else if (type === 'command') {
    d.cmdName = body.cmdName;
    d.duration = body.duration;
  } else if (type === 'cosmetic') {
    d.prefixText = body.prefixText;
    d.prefixColor = body.prefixColor;
    if (body.nickColor) d.nickColor = body.nickColor;
  }
  if (body.discountPct > 0) d.discountPct = body.discountPct;
  return d;
}

function buildEmbed(body, invoiceId) {
  const { type, nick, platform, finalAmount, paymentMethod, discountPct } = body;

  const fields = [
    { name: 'Invoice ID', value: `\`${invoiceId.slice(0, 8).toUpperCase()}\``, inline: true },
    { name: 'Nickname', value: s(nick), inline: true },
    { name: 'Platform', value: s(platform), inline: true },
    { name: 'Pembayaran', value: s(paymentMethod), inline: true },
  ];

  if (type === 'rank') {
    fields.push({ name: 'Rank Tujuan', value: s(body.target), inline: true });
    if (body.owned && body.owned !== 'none') {
      fields.push({ name: 'Upgrade Dari', value: s(body.owned).toUpperCase(), inline: true });
    }
    fields.push({ name: 'Durasi', value: s(body.duration), inline: true });
  } else if (type === 'key') {
    fields.push({ name: 'Tipe Key', value: s(body.keyName), inline: true });
    fields.push({ name: 'Jumlah', value: `${body.qty}x`, inline: true });
  } else if (type === 'skill') {
    fields.push({ name: 'Skill', value: s(body.skillName), inline: true });
    fields.push({ name: 'Level', value: `${body.levels}x`, inline: true });
  } else if (type === 'balance') {
    fields.push({ name: 'Balance', value: Number(body.balance).toLocaleString('id-ID'), inline: true });
  } else if (type === 'command') {
    fields.push({ name: 'Command', value: s(body.cmdName), inline: true });
    fields.push({ name: 'Durasi', value: s(body.duration), inline: true });
  } else if (type === 'cosmetic') {
    fields.push({ name: 'Prefix', value: `[${s(body.prefixText, 50)}]`, inline: true });
    fields.push({ name: 'Warna Prefix', value: s(body.prefixColor, 50), inline: true });
    if (body.nickColor) {
      fields.push({ name: 'Warna Nick', value: s(body.nickColor, 50), inline: true });
    }
  }

  if (discountPct > 0) {
    fields.push({ name: 'Diskon', value: `${discountPct}%`, inline: true });
  }

  fields.push({ name: 'Total Bayar', value: formatRupiah(finalAmount), inline: true });
  fields.push({ name: 'Status', value: '⏳ Menunggu Pembayaran', inline: true });
  fields.push({ name: 'Berlaku Hingga', value: '24 jam dari sekarang', inline: true });

  return {
    title: ORDER_TITLES[type] || '📦 Order Baru',
    color: ORDER_COLORS[type] || 0x3b82f6,
    fields,
    footer: { text: 'AeroBlast Network • Invoice akan expired dalam 24 jam jika tidak dibayar' },
    timestamp: new Date().toISOString(),
  };
}

const VALID_TYPES = ['rank', 'key', 'skill', 'balance', 'command', 'cosmetic'];

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  if (!DISCORD_WEBHOOK_URL) {
    res.status(500).json({ ok: false, error: 'Server misconfigured: DISCORD_WEBHOOK_URL not set' });
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({ ok: false, error: 'Terlalu banyak request. Coba lagi nanti.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' });
      return;
    }
  }

  const { type, nick, platform, finalAmount, paymentMethod } = body || {};

  if (!VALID_TYPES.includes(type)) {
    res.status(400).json({ ok: false, error: 'type tidak valid' });
    return;
  }
  if (!nick || typeof nick !== 'string' || nick.trim() === '') {
    res.status(400).json({ ok: false, error: 'nick diperlukan' });
    return;
  }
  if (!platform || typeof platform !== 'string') {
    res.status(400).json({ ok: false, error: 'platform diperlukan' });
    return;
  }
  if (!finalAmount || typeof finalAmount !== 'number' || finalAmount <= 0) {
    res.status(400).json({ ok: false, error: 'finalAmount tidak valid' });
    return;
  }
  if (!paymentMethod || typeof paymentMethod !== 'string') {
    res.status(400).json({ ok: false, error: 'paymentMethod diperlukan' });
    return;
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Simpan ke Supabase
  const { data: invoice, error: dbError } = await supabase
    .from('invoices')
    .insert({
      type,
      nick: nick.trim(),
      platform,
      final_amount: finalAmount,
      payment_method: paymentMethod,
      details: buildDetails(type, body),
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (dbError || !invoice) {
    res.status(502).json({ ok: false, error: 'Gagal simpan invoice', detail: dbError?.message });
    return;
  }

  // Kirim ke Discord
  try {
    const embed = buildEmbed(body, invoice.id);
    const webhookRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!webhookRes.ok) {
      throw new Error(`Discord webhook HTTP ${webhookRes.status}`);
    }
  } catch {
    // Invoice tetap tersimpan meski Discord gagal
  }

  res.status(200).json({ ok: true, invoiceId: invoice.id });
}
