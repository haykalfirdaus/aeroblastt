import mysql from 'mysql2/promise';

// ── nlogin pool (auth server) ─────────────────────────────────────────────────
let pool;

function getPool() {
  if (!pool) {
    const url = process.env.MYSQL_URL;
    if (url) {
      pool = mysql.createPool(url);
    } else {
      pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 5,
        connectTimeout: 8000,
      });
    }
  }
  return pool;
}

// ── LuckPerms pool (separate DB) ──────────────────────────────────────────────
let lpPool;

function getLpPool() {
  if (!lpPool) {
    lpPool = mysql.createPool({
      host: process.env.MYSQL_LP_HOST,
      port: Number(process.env.MYSQL_LP_PORT) || 3306,
      user: process.env.MYSQL_LP_USER,
      password: process.env.MYSQL_LP_PASSWORD,
      database: process.env.MYSQL_LP_DATABASE,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 8000,
    });
  }
  return lpPool;
}

// Returns true if the username exists in NLogin's nlogin table
export async function isRegisteredInAuthme(nick) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT 1 FROM nlogin WHERE last_name = ? LIMIT 1',
    [nick]
  );
  return rows.length > 0;
}

// LuckPerms rank purchasable, urutan tertinggi dulu
const PURCHASABLE_RANKS_DESC = ['universe', 'galatics', 'quantum', 'vortex', 'ravest', 'orbiter', 'voyager', 'scout'];

// Query rank purchasable tertinggi milik player dari DB LuckPerms
export async function getPlayerRankFromLP(nick) {
  if (!process.env.MYSQL_LP_HOST) return null; // LP DB belum dikonfigurasi

  const db = getLpPool();

  // luckperms_players: uuid, username — LP update setiap player join
  const [lpRows] = await db.execute(
    'SELECT uuid FROM luckperms_players WHERE username = ? LIMIT 1',
    [nick]
  );
  if (lpRows.length === 0) return null;

  const uuid = lpRows[0].uuid;

  const [rows] = await db.execute(
    `SELECT permission FROM luckperms_user_permissions
     WHERE uuid = ?
       AND permission LIKE 'group.%'
       AND (expiry = 0 OR expiry > UNIX_TIMESTAMP())`,
    [uuid]
  );

  const groups = rows.map((r) => r.permission.replace('group.', '').toLowerCase());

  for (const rank of PURCHASABLE_RANKS_DESC) {
    if (groups.includes(rank)) return rank.toUpperCase();
  }
  return null;
}

