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

app.set('trust proxy', 1);
app.use(express.json());

// 存活檢查。刻意放在 session middleware 之前：這樣它不會碰到 connect-pg-simple
// 的資料庫 store，Neon 睡著或掛掉時一樣答得出來——回報的就是「網站程序還活著」。
// 若要連資料庫一起檢查，那是另一個端點，不要混進這裡。
// no-store 是必要的：少了它，中間的快取可能在服務已經掛掉時仍回一個舊的 200。
app.get('/healthz', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).end();
});

app.use(
  session({
    store: new pgSession({ pool, tableName: 'session', createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      // 'auto'：連線是 HTTPS 才加 Secure 旗標。不可以綁 NODE_ENV——自架在 Ubuntu 上是
      // 純 HTTP 但一樣是 production，寫死 secure: true 會讓 express-session 整個不發
      // session cookie，症狀是登入看似成功、下一個請求卻被當成未登入。
      // 搭配上面的 trust proxy，Render 那邊（HTTPS 經反向代理）仍然拿得到 Secure cookie。
      secure: 'auto',
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
