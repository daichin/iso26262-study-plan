# ISO 26262 學習網站

給軟韌體工程師的 ISO 26262 互動學習規劃：分八個「圈層」由核心工作往外拓展，每一圈有內容、圖解、可點擊的原始出處連結，以及作答後即時對答案、算分數的測驗。支援多使用者，成績存在 Neon Postgres，跨裝置、跨瀏覽器都看得到自己的進度；管理者另外看得到整個團隊的學習進度。

## 技術棧

- 後端：Node.js + Express + `pg`（連線 Neon Postgres）+ `express-session`（session 存在 Postgres）
- 前端：純 HTML/CSS/JS（不用框架），每個章節是獨立 `.html`，共用 `public/assets/` 底下的樣式與腳本
- 部署：GitHub 存放程式碼，Render 一鍵部署（Blueprint），資料庫用自己的 Neon 專案

## 本機開發

```bash
cp .env.example .env
# 編輯 .env，填入你的 Neon 連線字串與管理者帳號設定
npm install
npm run migrate   # 建立資料表 + 第一個管理者帳號
npm start          # http://localhost:3000
```

## 部署到 Render

完整步驟（含流程圖）見 [`docs/deployment-guide.html`](docs/deployment-guide.html)，照著做即可完工。

## 專案結構

```
server/            Express 後端：auth、quiz、admin API，資料庫 schema 與 migration
public/            前端靜態頁面
  index.html        個人首頁：學習地圖 + 我的進度
  login.html         登入 / 強制改密碼
  circles/           八個章節內容頁（circle-0X-*.html）
  admin/              管理者：成員管理、團隊進度
  assets/
    css/theme.css     共用設計系統（深色/淺色跟隨系統設定）
    js/                共用邏輯：導覽列、測驗引擎、進度圖表、主題切換
    data/              章節中繼資料、出處連結總表、各章節題庫
docs/
  deployment-guide.html   部署手冊
```

## 之後要擴充內容

- **新增一圈**：在 `public/circles/` 加一個 `circle-0X-xxx.html`、在 `public/assets/data/` 加對應的 `circle-0X.quiz.js`，並在 `public/assets/data/circles.js` 與 `server/circles.js` 各加一筆設定。不需要動資料庫結構。
- **加測驗題**：直接編輯對應的 `circle-0X.quiz.js`，每題格式固定：`{ id, question, options, correctIndex, explanation, sourceKey }`。
- **加出處連結**：在 `public/assets/data/sources.js` 加一筆，題目與內容頁引用同一個 `sourceKey`，之後網址異動只要改一處。
