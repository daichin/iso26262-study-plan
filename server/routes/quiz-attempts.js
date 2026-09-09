const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/require-auth');
const { CIRCLE_IDS } = require('../circles');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res) => {
  const { circleId, score, totalQuestions, answers } = req.body || {};

  if (!circleId || !CIRCLE_IDS.includes(circleId)) {
    return res.status(400).json({ error: 'invalid_circle_id' });
  }
  if (typeof score !== 'number' || typeof totalQuestions !== 'number' || totalQuestions <= 0) {
    return res.status(400).json({ error: 'invalid_score' });
  }

  const percentage = Math.round((score / totalQuestions) * 10000) / 100;

  const result = await pool.query(
    `INSERT INTO quiz_attempts (user_id, circle_id, score, total_questions, percentage, answers)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, circle_id, score, total_questions, percentage, created_at`,
    [req.session.userId, circleId, score, totalQuestions, percentage, JSON.stringify(answers || null)]
  );

  res.status(201).json(result.rows[0]);
});

router.get('/', async (req, res) => {
  const { circleId } = req.query;
  if (!circleId || !CIRCLE_IDS.includes(circleId)) {
    return res.status(400).json({ error: 'invalid_circle_id' });
  }

  const result = await pool.query(
    `SELECT id, circle_id, score, total_questions, percentage, created_at
     FROM quiz_attempts
     WHERE user_id = $1 AND circle_id = $2
     ORDER BY created_at DESC
     LIMIT 20`,
    [req.session.userId, circleId]
  );

  res.json(result.rows);
});

router.get('/progress-summary', async (req, res) => {
  const result = await pool.query(
    `SELECT DISTINCT ON (circle_id) circle_id, score, total_questions, percentage, created_at
     FROM quiz_attempts
     WHERE user_id = $1
     ORDER BY circle_id, created_at DESC`,
    [req.session.userId]
  );

  const bestResult = await pool.query(
    `SELECT circle_id, MAX(percentage) AS best_percentage
     FROM quiz_attempts
     WHERE user_id = $1
     GROUP BY circle_id`,
    [req.session.userId]
  );
  const bestByCircle = Object.fromEntries(
    bestResult.rows.map((row) => [row.circle_id, Number(row.best_percentage)])
  );

  const byCircle = Object.fromEntries(
    result.rows.map((row) => [
      row.circle_id,
      {
        latestPercentage: Number(row.percentage),
        bestPercentage: bestByCircle[row.circle_id] ?? Number(row.percentage),
        lastAttemptAt: row.created_at,
      },
    ])
  );

  res.json({ circles: byCircle, totalCircles: CIRCLE_IDS.length });
});

module.exports = router;
