import { Rcon } from 'rcon-client';

const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = Number(process.env.RCON_PORT) || 25575;
const RCON_PASSWORD = process.env.RCON_PASSWORD;

// Whitelist patterns — reject anything that could break/extend a command string
const SAFE_NICK    = /^[a-zA-Z0-9_.]{1,36}$/;
const SAFE_LABEL   = /^[a-zA-Z0-9_\-. ]{1,64}$/;
const SAFE_DIGITS  = /^\d{1,19}$/;
const SAFE_DATETIME = /^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}$/;
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

// Only purchasable rank names, descending tier order (highest first).
// Non-purchasable ranks (builder, media, default, member, etc.) are intentionally
// absent — if LP output only lists those, getPlayerRank returns null (= no rank).
const PURCHASABLE_RANKS_DESC = ['universe', 'galatics', 'quantum', 'vortex', 'ravest', 'orbiter', 'voyager', 'scout'];

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

  if (duration === 'monthly') {
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const expStr = `${pad(exp.getDate())}/${pad(exp.getMonth() + 1)}/${String(exp.getFullYear()).slice(2)} ${pad(exp.getHours())}:${pad(exp.getMinutes())}`;
    try { guard(expStr, SAFE_DATETIME, 'expStr'); } catch (e) { return { ok: false, error: e.message }; }
    return rconSend(`lp user ${nick} parent addtemp ${group} ${expStr} replace`);
  }
  return rconSend(`lp user ${nick} parent set ${group}`);
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

// case key give <nick> <keyName> <qty>
export async function giveKey(nick, keyName, qty) {
  try { guard(nick, SAFE_NICK, 'nick'); guard(String(qty), SAFE_DIGITS, 'qty'); } catch (e) { return { ok: false, error: e.message }; }
  if (!KEY_NAMES.includes(keyName)) {
    return { ok: false, error: `Key tidak dikenal: ${keyName}` };
  }
  return rconSend(`case key give ${nick} ${keyName} ${qty}`);
}

// lp user <nick> parent info — returns { ok, rank: 'SCOUT'|...|null }
// Hanya rank yang bisa dibeli di store yang dihitung. Rank lain (builder, media,
// default, dll) diabaikan — jika tidak ada rank purchasable sama sekali, rank: null.
export async function getPlayerRank(nick) {
  try { guard(nick, SAFE_NICK, 'nick'); } catch (e) { return { ok: false, rank: null, error: e.message }; }
  const result = await rconSend(`lp user ${nick} parent info`);
  if (!result.ok) return { ok: false, rank: null, error: result.error };
  const lower = (result.response || '').toLowerCase();
  // Word-boundary check: rank name harus dikelilingi non-alphanumeric agar tidak
  // false-match substring (misal "scout" dalam nama pemain "escoutxyz")
  for (const name of PURCHASABLE_RANKS_DESC) {
    const re = new RegExp(`(?<![a-z0-9])${name}(?![a-z0-9])`);
    if (re.test(lower)) return { ok: true, rank: name.toUpperCase() };
  }
  return { ok: true, rank: null };
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
