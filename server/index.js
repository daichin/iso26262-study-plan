const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const { pool } = require('./db');
const authRoutes = require('./routes/auth');
const quizAttemptsRoutes = require('./routes/quiz-attempts');
const adminRoutes = require('./routes/admin-users');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(express.json());

app.use(
  session({
    store: new pgSession({ pool, tableName: 'session', createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/quiz-attempts', quizAttemptsRoutes);
app.use('/api/admin', adminRoutes);

const publicDir = path.join(__dirname, '..', 'public');

// 靜態頁面守門：assets 與 login.html 一律放行，其餘 .html 頁面需要登入，
// admin/*.html 另外需要 admin 角色。API 走上面的路由，不會經過這裡。
app.use((req, res, next) => {
  const p = req.path;
  if (p.startsWith('/assets/')) return next();
  if (p === '/login.html') return next();

  const isPage = p === '/' || p.endsWith('.html');
  if (!isPage) return next();

  if (!req.session || !req.session.userId) {
    return res.redirect('/login.html');
  }
  if (p.startsWith('/admin/') && req.session.role !== 'admin') {
    return res.redirect('/');
  }
  next();
});

app.use(express.static(publicDir));

app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`ISO 26262 學習網站啟動於 http://localhost:${PORT}`);
});
