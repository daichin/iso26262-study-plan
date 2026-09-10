const fs = require('fs');
const path = require('path');
const { pool } = require('../db');
const { hashPassword } = require('../lib/passwords');

async function userColumns() {
  const result = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users'"
  );
  return result.rows.map((row) => row.column_name);
}

// 從「email + name」改成單一 login_id 的線上升級。
// schema.sql 用的是 CREATE TABLE IF NOT EXISTS，對已經存在的資料表不會有任何作用，
// 所以既有部署必須靠這裡把欄位補上、把資料搬過去，才不會掉帳號。
// 每一步都先看目前欄位再決定要不要做，重複執行不會出錯。
async function migrateToLoginId() {
  const columns = await userColumns();

  if (!columns.includes('login_id')) {
    console.log('升級 users：新增 login_id 欄位');
    await pool.query('ALTER TABLE users ADD COLUMN login_id TEXT');
  }

  // 舊帳號沒有 login_id，用 email 的 @ 前半段當作預設 ID，讓既有使用者還登得進來。
  if (columns.includes('email')) {
    await pool.query(
      "UPDATE users SET login_id = split_part(email, '@', 1) WHERE login_id IS NULL OR login_id = ''"
    );
  }
  // 連 email 都沒有的極端情況，至少給一個不重複的值，才能加上 NOT NULL
  await pool.query("UPDATE users SET login_id = 'user' || id::text WHERE login_id IS NULL OR login_id = ''");

  const dupes = await pool.query(
    'SELECT login_id, count(*) AS n FROM users GROUP BY login_id HAVING count(*) > 1'
  );
  if (dupes.rows.length > 0) {
    // 兩個不同 email 的 @ 前半段可能相同，這種情況不能自動決定誰該保留原 ID
    throw new Error(
      '升級中止：以下 login_id 重複，請先手動處理再重跑 migrate → ' +
        dupes.rows.map((r) => `${r.login_id}(${r.n})`).join(', ')
    );
  }

  await pool.query('ALTER TABLE users ALTER COLUMN login_id SET NOT NULL');
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS users_login_id_key ON users (login_id)');

  if (columns.includes('email')) {
    console.log('升級 users：移除 email 欄位');
    await pool.query('ALTER TABLE users DROP COLUMN email');
  }
  if (columns.includes('name')) {
    console.log('升級 users：移除 name 欄位');
    await pool.query('ALTER TABLE users DROP COLUMN name');
  }
}

async function ensureAdminUser() {
  const loginId = process.env.ADMIN_ID;
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!loginId || !initialPassword) {
    console.log('未設定 ADMIN_ID / ADMIN_INITIAL_PASSWORD，略過建立管理者帳號。');
    return;
  }

  const existing = await pool.query('SELECT id FROM users WHERE login_id = $1', [loginId]);
  if (existing.rows.length > 0) {
    console.log(`管理者帳號 ${loginId} 已存在，略過建立。`);
    return;
  }

  const passwordHash = await hashPassword(initialPassword);
  await pool.query(
    `INSERT INTO users (login_id, password_hash, role, must_change_password)
     VALUES ($1, $2, 'admin', true)`,
    [loginId, passwordHash]
  );
  console.log(`已建立管理者帳號：${loginId}（第一次登入會強制要求改密碼）`);
}

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('執行 schema.sql 建立資料表...');
  await pool.query(schema);
  console.log('資料表建立完成。');

  await migrateToLoginId();
  await ensureAdminUser();

  await pool.end();
  console.log('Migration 完成。');
}

migrate().catch((err) => {
  console.error('Migration 失敗：', err);
  process.exit(1);
});
