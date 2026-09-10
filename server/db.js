require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 未設定，請參考 .env.example');
}

// Neon 這類雲端 Postgres 的連線字串會帶 sslmode=require，一定要開 SSL；
// 自架在同一台機器上的 PostgreSQL 預設沒開 SSL，硬加 ssl 會被伺服器直接拒絕
// （The server does not support SSL connections）。所以依連線字串決定，不要寫死。
const connectionString = process.env.DATABASE_URL;
const wantsSsl = /sslmode=(require|verify-ca|verify-full)/.test(connectionString);

const pool = new Pool({
  connectionString: connectionString,
  ssl: wantsSsl ? { rejectUnauthorized: false } : false,
});

module.exports = { pool };
