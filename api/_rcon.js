import { Rcon } from 'rcon-client';

const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = Number(process.env.RCON_PORT) || 25575;
const RCON_PASSWORD = process.env.RCON_PASSWORD;

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
    const response = await rcon.send(command);
    return { ok: true, response };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    rcon?.end().catch(() => {});
  }
}

export async function grantRank(nick, rankKey, duration) {
  const group = RANK_GROUP[rankKey?.toUpperCase()];
  if (!group) return { ok: false, error: `Rank key tidak dikenal: ${rankKey}` };

  if (duration === 'monthly') {
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const expStr = `${pad(exp.getDate())}/${pad(exp.getMonth() + 1)}/${String(exp.getFullYear()).slice(2)} ${pad(exp.getHours())}:${pad(exp.getMinutes())}`;
    return rconSend(`lp user ${nick} parent addtemp ${group} ${expStr} replace`);
  }
  return rconSend(`lp user ${nick} parent set ${group}`);
}

// eco give <nick> <amount>
export async function giveMoney(nick, amount) {
  return rconSend(`eco give ${nick} ${amount}`);
}

// case key give <nick> <keyName> <qty>
export async function giveKey(nick, keyName, qty) {
  if (!KEY_NAMES.includes(keyName)) {
    return { ok: false, error: `Key tidak dikenal: ${keyName}` };
  }
  return rconSend(`case key give ${nick} ${keyName} ${qty}`);
}

// bansos <keyName> <amount> [duration]
export async function giveBansos(keyName, amount, duration) {
  if (!KEY_NAMES.includes(keyName)) {
    return { ok: false, error: `Key tidak dikenal: ${keyName}` };
  }
  const cmd = duration ? `bansos ${keyName} ${amount} ${duration}` : `bansos ${keyName} ${amount}`;
  return rconSend(cmd);
}

// bansos cancel <id>
export async function bansosCancel(id) {
  return rconSend(`bansos cancel ${id}`);
}

// bansos list
export async function bansosList() {
  return rconSend('bansos list');
}

// eventadmin add <nama> <waktu_mulai> <durasi>
export async function eventAdd(name, startTime, duration) {
  return rconSend(`eventadmin add ${name} ${startTime} ${duration}`);
}

// eventadmin clear <id/nama>
export async function eventClear(target) {
  return rconSend(`eventadmin clear ${target}`);
}

// eventadmin time <add|reduce> <id/nama> <waktu>
export async function eventTime(subAction, target, time) {
  return rconSend(`eventadmin time ${subAction} ${target} ${time}`);
}
