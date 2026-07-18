import mysql from 'mysql2/promise';

// Lazy singleton pool — created once, reused across warm invocations
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

// Returns true if the username exists in NLogin's nlogin table
export async function isRegisteredInAuthme(nick) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT 1 FROM nlogin WHERE last_name = ? LIMIT 1',
    [nick]
  );
  return rows.length > 0;
}

// LuckPerms group names yang bisa dibeli di store, urutan tertinggi dulu
const PURCHASABLE_RANKS_DESC = ['universe', 'galatics', 'quantum', 'vortex', 'ravest', 'orbiter', 'voyager', 'scout'];

// Query rank purchasable tertinggi milik player langsung dari tabel LP
// LP simpan UUID player — cari UUID dari nlogin, lalu cek luckperms_user_permissions
export async function getPlayerRankFromDB(nick) {
  const db = getPool();

  // Cari UUID dari tabel nlogin (LP pakai UUID, bukan nama)
  const [uuidRows] = await db.execute(
    'SELECT uuid FROM nlogin WHERE last_name = ? LIMIT 1',
    [nick]
  );
  if (uuidRows.length === 0) return null;

  const uuid = uuidRows[0].uuid;

  // Query semua grup aktif milik player ini dari LP
  // permission berformat "group.namagrup", expiry 0 = permanen, >0 = temp (unix timestamp)
  const [rows] = await db.execute(
    `SELECT permission FROM luckperms_user_permissions
     WHERE uuid = ?
       AND permission LIKE 'group.%'
       AND (expiry = 0 OR expiry > UNIX_TIMESTAMP())`,
    [uuid]
  );

  const groups = rows.map((r) => r.permission.replace('group.', '').toLowerCase());

  // Return rank purchasable tertinggi yang dimiliki
  for (const rank of PURCHASABLE_RANKS_DESC) {
    if (groups.includes(rank)) return rank.toUpperCase();
  }
  return null;
}
