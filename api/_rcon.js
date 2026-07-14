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

// benber give <nick> <amount>
export async function giveMoney(nick, amount) {
  return rconSend(`benber give ${nick} ${amount}`);
}

// AuraSkills: sk skill addlevel <nick> <skill> <levels>
export async function giveSkill(nick, skillName, levels) {
  return rconSend(`sk skill addlevel ${nick} ${skillName} ${levels}`);
}
