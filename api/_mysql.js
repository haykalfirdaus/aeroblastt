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

