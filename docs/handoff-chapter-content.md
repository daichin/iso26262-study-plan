# 交接：章節內容深化與出處引用

這份文件是 2026-09-10 交接給後續工作階段的簡報，也是背景 agent `05ae5043`
（`Deepen ISO 26262 chapter content + citations`）啟動時使用的提示內容。
保留在版控裡，是為了讓「當時查證到什麼、為什麼這樣決定」不會只存在於某個
session 的記憶體中。

## 使用者的訴求（原文）

> 下一次我要改每一章節的內容, 目前的內容太空洞, 都是一堆大標題然後就沒了,
> 我之前說裡面要給出處和連結也都沒有

## 已查證的事實

以下都是實際量測與 grep 出來的結果，不是推測，接手時不需要重新導出。

1. 八個章節頁：`public/circles/circle-00..07-*.html`
2. 每個 section 的實際結構就是 `<h2 class="step">` + **一段** `<p class="lede">`，
   偶爾多一個 `<div class="note">`。這就是「太空洞」的具體形狀。
3. 篇幅與結構密度：

   | 章節 | 中文字數 | `<p>` | `<h3>` |
   |---|---|---|---|
   | circle-00 詞彙與導讀 | 2,969 | 2 | 0 |
   | circle-01 軟體層開發 | 3,909 | 3 | 0 |
   | circle-02 支援流程 | 5,097 | 9 | 1 |
   | circle-03 安全分析 | 3,789 | 6 | 0 |
   | circle-04 系統層開發 | 2,861 | 5 | 0 |
   | circle-05 硬體層基礎 | 3,283 | 4 | 0 |
   | circle-06 概念與管理 | 4,316 | 10 | 7 |
   | circle-07 鄰近標準 | 4,757 | 9 | 2 |

   近三千到五千字，卻只有 2–10 個段落；八章中有五章完全沒有 `<h3>`。
4. **`ISO26262_SOURCES` 在八個章節頁被引用 0 次。** `sources.js` 每頁都載入了，
   但內文從未使用。
5. 章節頁裡唯一的 `href="http"` 是 `<head>` 中的三個 Google Fonts `<link>`。
   **內文出處連結數為 0** —— 先前要求的出處確實從未被實作。

## 關鍵線索：引用機制早就存在，只是沒用在內文

不需要重新發明，既有機制可直接沿用：

- `public/assets/data/sources.js` — 27 個已查證的連結，以 key 索引
  （`iso26262_part1`…`part12`、`iso26262_overview`、`misra`、`misra_publications`、
  `aspice_vda`、`aspice_pam40`、`sotif`、`iso21434`、`iec61508_hub`、
  `iec61508_part1`、`autosar`、`autosar_standards`）
- `public/assets/data/circle-0X.quiz.js` — 每道題帶一個 `sourceKey` 欄位
- `public/assets/js/quiz-engine.js` 第 5–9 行 `sourceLink()` —— 把 key 渲染成
  「📎 出處：<label>」的連結

合理的做法是把這套 key 機制延伸到內文，而不是在八個 HTML 檔裡硬寫網址。
`sources.js` 檔頭註解本來就寫明它是「所有原始出處連結的單一維護點」。

## 硬性限制

- **ISO 26262 條文有版權，不可逐字複製。** 只能改寫並註明出處。這是學習輔助
  教材，不是條文重製。
- 有份量的論述都應附出處。新增連結請加進 `sources.js`，不要內嵌網址。
- 新增的外部連結要實際驗證可開啟（`sources.js` 聲稱既有連結都已逐一查證）。
- 純 vanilla JS，無相依套件，無建置步驟。
- 11 個 HTML 頁面是手工維護的重複檔案，沒有樣板機制。「改每一章」等於改八個檔案；
  能放在共用 JS／CSS／資料檔的就不要散進 HTML。

## 可重用的設計系統類別

定義在 `public/assets/css/theme.css`：`h2.step`（含 `<span class="num">` 編號徽章）、
`p.lede`、`div.note` / `div.note.warn`（搭配 `p.note-title`）、`.card-grid`、
`.circle-card`、`.progress-bar`、`details`。動手前先看 theme.css，不要另創類別。

## 部署現況（動手部署前務必先看）

- Render 服務 `srv-daghp815efls73alg6q0`，分支 `main`，
  https://iso26262-study-plan.onrender.com
- **自動部署實際上沒有運作。** 設定顯示 `autoDeploy: yes` / `trigger: commit`，
  但 GitHub repo 的 webhooks 是空的，且服務歷來所有部署的 trigger 都是
  `manual` / `blueprint_sync` / `api`，從未出現 `commit`。
  根因幾乎確定是 Render 的 GitHub App 沒有安裝到這個 repo
  —— Render 現在採 GitHub App 整合，所以 Settings→Webhooks 是空的屬於正常，
  本身不是問題所在。
- 使用者最後正在 https://github.com/settings/installations 處理這件事。
  **推送前先問他修好了沒**，未修好就得用 Render MCP 的 `trigger_deploy`
  手動觸發（workspaceId `tea-da7hipafngtc73fh2gsg`）。
- 未經明確同意不要推 `main` 或合併。先前的同意只針對那一次特定合併，不會延續。

## 前一階段的工作（不要重做）

頁首瘦身：手機 347px→57px、桌機 170px→57px，全寬度統一漢堡抽屜，下滑自動隱藏。
commit `f48da2f`，已部署並驗證上線。

## 如何驗證畫面

`server/index.js` 會把所有 `.html` 擋在 session 之後且需要活的資料庫，
**不要**用它做視覺檢查。改用一支臨時靜態伺服器服務 `public/`，同時 stub
`/api/auth/me` 回傳 `{name, role:'admin', mustChangePassword:false}`，
再以 CDP 驅動 Playwright 內建的 Chromium。完整做法與兩個會算出錯誤數字的陷阱，
記錄在專案 memory 的 `chromium-cdp-layout-measurement.md`。
