const fs = require('fs');
const path = require('path');
const { pool } = require('../db');
const { hashPassword } = require('../lib/passwords');

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME;
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email || !name || !initialPassword) {
    console.log('未設定 ADMIN_EMAIL / ADMIN_NAME / ADMIN_INITIAL_PASSWORD，略過建立管理者帳號。');
    return;
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log(`管理者帳號 ${email} 已存在，略過建立。`);
    return;
  }

  const passwordHash = await hashPassword(initialPassword);
  await pool.query(
    `INSERT INTO users (email, name, password_hash, role, must_change_password)
     VALUES ($1, $2, $3, 'admin', true)`,
    [email, name, passwordHash]
  );
  console.log(`已建立管理者帳號：${email}（第一次登入會強制要求改密碼）`);
}

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('執行 schema.sql 建立資料表...');
  await pool.query(schema);
  console.log('資料表建立完成。');

  await ensureAdminUser();

  await pool.end();
  console.log('Migration 完成。');
}

migrate().catch((err) => {
  console.error('Migration 失敗：', err);
  process.exit(1);
});
