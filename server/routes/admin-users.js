const express = require('express');
const { pool } = require('../db');
const { hashPassword } = require('../lib/passwords');
const { requireAdmin } = require('../middleware/require-admin');
const { CIRCLE_IDS } = require('../circles');

const router = express.Router();

router.use(requireAdmin);

router.get('/users', async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, must_change_password, created_at FROM users ORDER BY created_at ASC'
  );
  res.json(result.rows);
});

router.post('/users', async (req, res) => {
  const { name, email, initialPassword, role } = req.body || {};

  if (!name || !email || !initialPassword) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (initialPassword.length < 8) {
    return res.status(400).json({ error: 'password_too_short' });
  }
  const finalRole = role === 'admin' ? 'admin' : 'member';

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'email_taken' });
  }

  const passwordHash = await hashPassword(initialPassword);
  const result = await pool.query(
    `INSERT INTO users (email, name, password_hash, role, must_change_password)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, name, email, role, must_change_password, created_at`,
    [email, name, passwordHash, finalRole]
  );

  res.status(201).json(result.rows[0]);
});

router.get('/team-progress', async (req, res) => {
  const usersResult = await pool.query(
    "SELECT id, name, email FROM users WHERE role = 'member' OR role = 'admin' ORDER BY name ASC"
  );

  const attemptsResult = await pool.query(
    `SELECT DISTINCT ON (user_id, circle_id) user_id, circle_id, percentage, created_at
     FROM quiz_attempts
     ORDER BY user_id, circle_id, created_at DESC`
  );

  const attemptsByUser = {};
  for (const row of attemptsResult.rows) {
    if (!attemptsByUser[row.user_id]) attemptsByUser[row.user_id] = {};
    attemptsByUser[row.user_id][row.circle_id] = {
      percentage: Number(row.percentage),
      lastAttemptAt: row.created_at,
    };
  }

  const members = usersResult.rows.map((user) => {
    const circles = attemptsByUser[user.id] || {};
    const completed = CIRCLE_IDS.filter((id) => circles[id]).length;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      circles,
      completedCircles: completed,
      overallPercentage: Math.round((completed / CIRCLE_IDS.length) * 10000) / 100,
    };
  });

  res.json({ circleIds: CIRCLE_IDS, members });
});

module.exports = router;
