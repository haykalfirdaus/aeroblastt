import { Rcon } from 'rcon-client';

const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = Number(process.env.RCON_PORT) || 25575;
const RCON_PASSWORD = process.env.RCON_PASSWORD;

// LuckPerms rank keys in lowercase (LP group names usually lowercase)
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

/**
 * Sends a LuckPerms command via RCON to give a player their purchased rank.
 * For monthly purchases, also sets an expiry on the group node.
 *
 * @param {string} nick - Minecraft username
 * @param {string} rankKey - e.g. 'VORTEX'
 * @param {'permanent'|'monthly'} duration
 * @returns {Promise<{ok: boolean, response?: string, error?: string}>}
 */
export async function grantRank(nick, rankKey, duration) {
  if (!RCON_HOST || !RCON_PASSWORD) {
    return { ok: false, error: 'RCON env vars tidak dikonfigurasi' };
  }

  const group = RANK_GROUP[rankKey?.toUpperCase()];
  if (!group) {
    return { ok: false, error: `Rank key tidak dikenal: ${rankKey}` };
  }

  let rcon;
  try {
    rcon = await Rcon.connect({
      host: RCON_HOST,
      port: RCON_PORT,
      password: RCON_PASSWORD,
      timeout: 5000,
    });

    let response;
    if (duration === 'monthly') {
      // Expiry 30 hari dari sekarang dalam format LP (dd/MM/yy HH:mm)
      const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      const expStr = `${pad(exp.getDate())}/${pad(exp.getMonth() + 1)}/${String(exp.getFullYear()).slice(2)} ${pad(exp.getHours())}:${pad(exp.getMinutes())}`;
      response = await rcon.send(`lp user ${nick} parent addtemp ${group} ${expStr} replace`);
    } else {
      response = await rcon.send(`lp user ${nick} parent set ${group}`);
    }

    return { ok: true, response };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    rcon?.end().catch(() => {});
  }
}
