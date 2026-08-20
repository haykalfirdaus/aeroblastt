import { Rcon } from 'rcon-client';

const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = Number(process.env.RCON_PORT) || 25575;
const RCON_PASSWORD = process.env.RCON_PASSWORD;

// Whitelist patterns — reject anything that could break/extend a command string
const SAFE_NICK    = /^[a-zA-Z0-9_.]{1,36}$/;
const SAFE_LABEL   = /^[a-zA-Z0-9_\-. ]{1,64}$/;
const SAFE_DIGITS  = /^\d{1,19}$/;
const SAFE_DURATION = /^\d{1,4}[dhmwy]$/;
const SAFE_SUBACT  = /^(add|reduce)$/;

function guard(value, re, label) {
  if (typeof value !== 'string' || !re.test(value))
    throw new Error(`RCON guard: invalid ${label} — "${value}"`);
  return value;
}

const RANK_GROUP = {
  SCOUT: 'scout',
  VOYAGER: 'voyager',
  ORBITER: 'orbiter',
  RAVEST: 'ravest',
  VORTEX: 'vortex',
  QUANTUM: 'quantum',
  GALATICS: 'galatics',
  UNIVERSE: 'universe',
};

export const KEY_NAMES = ['basic', 'vote', 'vip', 'legend', 'aerospace'];


function stripMcColors(str) {
  return String(str ?? '').replace(/§[0-9a-fk-orx]/gi, '').trim();
}

async function rconSend(command) {
  if (!RCON_HOST || !RCON_PASSWORD) {
    return { ok: false, error: 'RCON env vars tidak dikonfigurasi' };
  }
  let rcon;
  try {
    rcon = await Rcon.connect({
      host: RCON_HOST,
      port: RCON_PORT,
      password: RCON_PASSWORD,
      timeout: 5000,
    });
    const raw = await rcon.send(command);
    return { ok: true, response: stripMcColors(raw) };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    rcon?.end().catch(() => {});
  }
}

export async function grantRank(nick, rankKey, duration) {
  try { guard(nick, SAFE_NICK, 'nick'); } catch (e) { return { ok: false, error: e.message }; }
  const group = RANK_GROUP[rankKey?.toUpperCase()];
  if (!group) return { ok: false, error: `Rank key tidak dikenal: ${rankKey}` };

  const days = { monthly: 30, quarterly: 90 }[duration];
  if (days) {
    const dur = `${days}d`;
    try { guard(dur, SAFE_DURATION, 'duration'); } catch (e) { return { ok: false, error: e.message }; }
    return rconSend(`lp user ${nick} parent addtemp ${group} ${dur} replace`);
  }
  return rconSend(`lp user ${nick} parent add ${group}`);
}

// Permission node LuckPerms per command yang dijual di store.
const COMMAND_PERMS = {
  FLY: ['essentials.fly'],
  GOD: ['essentials.god'],
  FEED: ['essentials.feed'],
  HEAL: ['essentials.heal'],
  TP: ['essentials.tp'],
  REPAIR: ['essentials.repair'],
  INVSEE: ['essentials.invsee'],
  VANISH: ['essentials.vanish'],
  WEATHER: ['essentials.weather'],
  TIME: ['essentials.time', 'essentials.time.set'],
  UTILITY: ['essentials.anvil', 'essentials.enderchest', 'essentials.workbench'],
};

const SAFE_PERM = /^[a-z0-9._-]{1,64}$/;

/**
 * Beri akses command lewat LuckPerms.
 * `duration`: 'monthly' | 'quarterly' → permission sementara; selain itu permanen.
 * Bundle (UTILITY) memberi beberapa node sekaligus — semuanya harus sukses.
 */
export async function grantCommand(nick, cmdKey, duration) {
  try { guard(nick, SAFE_NICK, 'nick'); } catch (e) { return { ok: false, error: e.message }; }

  const perms = COMMAND_PERMS[String(cmdKey || '').toUpperCase()];
  if (!perms) return { ok: false, error: `Command tidak dikenal: ${cmdKey}` };

  const days = { monthly: 30, quarterly: 90 }[duration];
  const dur = days ? `${days}d` : null;
  if (dur) {
    try { guard(dur, SAFE_DURATION, 'duration'); } catch (e) { return { ok: false, error: e.message }; }
  }

  const done = [];
  for (const perm of perms) {
    try { guard(perm, SAFE_PERM, 'permission'); } catch (e) { return { ok: false, error: e.message }; }
    const cmd = dur
      ? `lp user ${nick} permission settemp ${perm} true ${dur} replace`
      : `lp user ${nick} permission set ${perm} true`;
    const result = await rconSend(cmd);
    if (!result.ok) return { ok: false, error: `Gagal set ${perm}: ${result.error}` };
    done.push(perm);
  }

  return { ok: true, response: `${done.join(', ')} diberikan${dur ? ` selama ${dur}` : ' permanen'}` };
}

// nlogin verify <nick> — returns { ok, registered, response }
export async function verifyPlayer(nick) {
  try { guard(nick, SAFE_NICK, 'nick'); } catch (e) { return { ok: false, registered: false, error: e.message }; }
  const result = await rconSend(`nlogin verify ${nick}`);
  if (!result.ok) return { ok: false, registered: false, error: result.error };
  const resp = (result.response || '').toLowerCase();
  // NLogin response saat user tidak ditemukan biasanya mengandung "not found" / "no account" / "not registered"
  const notFound = resp.includes('not found') || resp.includes('no account') || resp.includes('not registered') || resp.includes('couldn') || resp.trim() === '';
  return { ok: true, registered: !notFound, response: result.response };
}

// eco give <nick> <amount>
export async function giveMoney(nick, amount) {
  try { guard(nick, SAFE_NICK, 'nick'); guard(String(amount), SAFE_DIGITS, 'amount'); } catch (e) { return { ok: false, error: e.message }; }
  return rconSend(`eco give ${nick} ${amount}`);
}

// acb <nick> <amount> — tambah claim limit (GriefPrevention adjust bonus claims)
export async function giveClaimLimit(nick, amount) {
  try { guard(nick, SAFE_NICK, 'nick'); guard(String(amount), SAFE_DIGITS, 'amount'); } catch (e) { return { ok: false, error: e.message }; }
  return rconSend(`acb ${nick} ${amount}`);
}

// Cek claim limit player via PlaceholderAPI: accrued + bonus claims
export async function getPlayerClaims(nick) {
  try { guard(nick, SAFE_NICK, 'nick'); } catch (e) { return { ok: false, claims: null, error: e.message }; }
  const parseNum = async (ph) => {
    const result = await rconSend(`papi parse ${nick} ${ph}`);
    if (!result.ok) return null;
    const m = String(result.response || '').replace(/§./g, '').match(/-?\d+(?:[.,]\d+)?/);
    return m ? Math.floor(parseFloat(m[0].replace(',', '.'))) : null;
  };
  const accrued = await parseNum('%griefprevention_accruedclaims%');
  const bonus = await parseNum('%griefprevention_bonusclaims%');
  if (accrued == null && bonus == null) return { ok: false, claims: null, error: 'Placeholder tidak terbaca' };
  return { ok: true, claims: (accrued ?? 0) + (bonus ?? 0), accrued: accrued ?? 0, bonus: bonus ?? 0 };
}

// Cek jumlah coins player via PlaceholderAPI (%excellenteconomy_balance_raw_coins%)
export async function getPlayerCoins(nick) {
  try { guard(nick, SAFE_NICK, 'nick'); } catch (e) { return { ok: false, coins: null, error: e.message }; }
  const result = await rconSend(`papi parse ${nick} %excellenteconomy_balance_raw_coins%`);
  if (!result.ok) return { ok: false, coins: null, error: result.error };
  // Respons bisa mengandung kode warna / teks lain — ambil angka pertama.
  const m = String(result.response || '').replace(/§./g, '').match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return { ok: false, coins: null, error: `Placeholder tidak terbaca: ${result.response}` };
  return { ok: true, coins: Math.floor(parseFloat(m[0].replace(',', '.'))) };
}

// coins give <nick> <amount>
export async function giveCoins(nick, amount) {
  try { guard(nick, SAFE_NICK, 'nick'); guard(String(amount), SAFE_DIGITS, 'amount'); } catch (e) { return { ok: false, error: e.message }; }
  return rconSend(`coins give ${nick} ${amount}`);
}

// case key give <nick> <keyName> <qty>
export async function giveKey(nick, keyName, qty) {
  try { guard(nick, SAFE_NICK, 'nick'); guard(String(qty), SAFE_DIGITS, 'qty'); } catch (e) { return { ok: false, error: e.message }; }
  if (!KEY_NAMES.includes(keyName)) {
    return { ok: false, error: `Key tidak dikenal: ${keyName}` };
  }
  return rconSend(`case key give ${nick} ${keyName} ${qty}`);
}

import { getPlayerRankFromLP } from './_mysql.js';

// Query rank via MySQL LP (primary) — instant dan reliable
export async function getPlayerRank(nick) {
  try { guard(nick, SAFE_NICK, 'nick'); } catch (e) { return { ok: false, rank: null, error: e.message }; }
  try {
    const info = await getPlayerRankFromLP(nick);
    return {
      ok: true,
      rank: info?.rank ?? null,
      permanent: info?.permanent ?? null,
      expiry: info?.expiry ?? null,
    };
  } catch (err) {
    return { ok: false, rank: null, permanent: null, expiry: null, error: err.message };
  }
}

// bansos <keyName> <amount> [duration]
export async function giveBansos(keyName, amount, duration) {
  try { guard(String(amount), SAFE_DIGITS, 'amount'); } catch (e) { return { ok: false, error: e.message }; }
  if (!KEY_NAMES.includes(keyName)) {
    return { ok: false, error: `Key tidak dikenal: ${keyName}` };
  }
  if (duration !== undefined) {
    try { guard(String(duration), SAFE_LABEL, 'duration'); } catch (e) { return { ok: false, error: e.message }; }
  }
  const cmd = duration ? `bansos ${keyName} ${amount} ${duration}` : `bansos ${keyName} ${amount}`;
  return rconSend(cmd);
}

// bansos cancel <id>
export async function bansosCancel(id) {
  try { guard(String(id), SAFE_LABEL, 'id'); } catch (e) { return { ok: false, error: e.message }; }
  return rconSend(`bansos cancel ${id}`);
}

// bansos list
export async function bansosList() {
  return rconSend('bansos list');
}

// eventadmin add <nama> <waktu_mulai> <durasi>
export async function eventAdd(name, startTime, duration) {
  try {
    guard(name,      SAFE_LABEL, 'name');
    guard(startTime, SAFE_LABEL, 'startTime');
    guard(duration,  SAFE_LABEL, 'duration');
  } catch (e) { return { ok: false, error: e.message }; }
  return rconSend(`eventadmin add ${name} ${startTime} ${duration}`);
}

// eventadmin clear <id/nama>
export async function eventClear(target) {
  try { guard(target, SAFE_LABEL, 'target'); } catch (e) { return { ok: false, error: e.message }; }
  return rconSend(`eventadmin clear ${target}`);
}

// eventadmin time <add|reduce> <id/nama> <waktu>
export async function eventTime(subAction, target, time) {
  try {
    guard(subAction, SAFE_SUBACT, 'subAction');
    guard(target,    SAFE_LABEL,  'target');
    guard(time,      SAFE_LABEL,  'time');
  } catch (e) { return { ok: false, error: e.message }; }
  return rconSend(`eventadmin time ${subAction} ${target} ${time}`);
}
