const express = require('express');
const { pool } = require('../db');
const { hashPassword, verifyPassword } = require('../lib/passwords');
const { requireAuth } = require('../middleware/require-auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { loginId, password } = req.body || {};
  if (!loginId || !password) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const result = await pool.query('SELECT * FROM users WHERE login_id = $1', [loginId]);
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({
    id: user.id,
    loginId: user.login_id,
    role: user.role,
    mustChangePassword: user.must_change_password,
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, login_id, role, must_change_password FROM users WHERE id = $1',
    [req.session.userId]
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  res.json({
    id: user.id,
    loginId: user.login_id,
    role: user.role,
    mustChangePassword: user.must_change_password,
  });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'password_too_short' });
  }

  const passwordHash = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
    [passwordHash, req.session.userId]
  );
  res.json({ ok: true });
});

module.exports = router;
