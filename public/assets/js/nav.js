// 共用頁首：漢堡鈕 + 抽屜式主選單（所有寬度一致）、主題切換鈕、登出。
// 各頁面只要放一個 <header id="app-header" data-current="circle-id 或 admin-users 等"></header>。
//
// 分兩段渲染：
//   1. renderShell() 同步跑，用 window.ISO26262_CIRCLES 畫出外殼與 8 圈連結
//   2. hydrate() 等 /api/auth/me 回來，才補上使用者名稱、ADMIN 徽章與管理者連結
// 這樣頁首和頁面其他部分同一幀繪出，後補的東西又都落在已關閉的抽屜或固定高度的列裡，
// 不會推動任何內容。未登入時 server 端已經會導去 /login.html，
// 這裡的 /api/auth/me 失敗時 api-client.js 也會處理導轉。
(function () {
  var header, panel, toggleBtn, scrim, navFoot, adminSlot;
  var userBoxes = [];
  var lastY = 0;
  var ticking = false;

  /* ---------- 小工具 ---------- */

  function navLink(href, text, isCurrent) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    if (isCurrent) {
      a.classList.add('is-current');
      a.setAttribute('aria-current', 'page');
    }
    return a;
  }

  function groupLabel(text) {
    var p = document.createElement('p');
    p.className = 'site-nav-group';
    p.textContent = text;
    return p;
  }

  // 使用者資訊與登出各建兩份：一份在頂列給寬視窗，一份在抽屜底部給窄視窗。
  // 兩份靠 CSS 互斥，同一時間只有一份在無障礙樹上。都不要給 id。
  function makeUserBox() {
    var box = document.createElement('div');
    box.className = 'site-user';
    userBoxes.push(box);
    return box;
  }

  function makeLogoutBtn() {
    var btn = document.createElement('button');
    btn.className = 'btn ghost';
    btn.type = 'button';
    btn.textContent = '登出';
    btn.addEventListener('click', async function () {
      await window.ISO26262Api.post('/api/auth/logout', {});
      window.location.href = '/login.html';
    });
    return btn;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- 外殼（不需要等 API） ---------- */

  function renderShell(current) {
    header.className = 'site-header';
    header.innerHTML = '';

    var inner = document.createElement('div');
    inner.className = 'site-header-inner';

    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'site-nav-toggle';
    toggleBtn.setAttribute('aria-controls', 'siteNavLinks');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', '開啟主選單');
    toggleBtn.textContent = '☰';
    toggleBtn.addEventListener('click', function () { setNavOpen(!isOpen()); });
    inner.appendChild(toggleBtn);

    var brand = document.createElement('a');
    brand.className = 'site-brand';
    brand.href = '/index.html';
    brand.textContent = 'ISO 26262 學習網站';
    inner.appendChild(brand);

    panel = document.createElement('nav');
    panel.className = 'site-nav-links';
    panel.id = 'siteNavLinks';
    panel.setAttribute('aria-label', '主要導覽');

    panel.appendChild(navLink('/index.html', '我的地圖', current === 'index'));
    panel.appendChild(groupLabel('學習圈'));
    (window.ISO26262_CIRCLES || []).forEach(function (circle) {
      panel.appendChild(navLink('/circles/' + circle.file, circle.title, current === circle.id));
    });

    adminSlot = document.createElement('div');   // hydrate() 時才填
    adminSlot.className = 'site-nav-slot';       // display: contents，讓子元素直接參與抽屜的欄狀 flex
    panel.appendChild(adminSlot);

    navFoot = document.createElement('div');
    navFoot.className = 'site-nav-foot';
    navFoot.appendChild(makeUserBox());
    navFoot.appendChild(makeLogoutBtn());
    panel.appendChild(navFoot);

    var spacer = document.createElement('div');
    spacer.className = 'site-header-spacer';
    inner.appendChild(spacer);

    var themeSlot = document.createElement('div');
    inner.appendChild(themeSlot);
    if (window.ISO26262Theme) window.ISO26262Theme.mountToggle(themeSlot);

    inner.appendChild(makeUserBox());
    inner.appendChild(makeLogoutBtn());

    header.appendChild(inner);

    scrim = document.createElement('div');
    scrim.className = 'site-nav-scrim';
    scrim.addEventListener('click', function () { setNavOpen(false); });

    // 抽屜與遮罩必須掛在 <body> 底下，不能放在 .site-header 裡面。
    // .site-header 有 will-change: transform（下滑隱藏用），那會讓它成為
    // position: fixed 子孫的 containing block —— 抽屜的 top/bottom 就會相對於
    // 57px 高的頁首計算，被壓成一條縫，而不是相對於視窗做成滿高面板。
    document.body.appendChild(panel);
    document.body.appendChild(scrim);

    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNavOpen(false);
    });
  }

  /* ---------- 抽屜開關 ---------- */

  function isOpen() { return header.classList.contains('nav-open'); }

  function setNavOpen(open) {
    if (open) reveal();   // 開抽屜前先確保頁首沒有被捲動隱藏
    header.classList.toggle('nav-open', open);
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-lock', open);
    scrim.classList.toggle('is-visible', open);
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', open ? '關閉主選單' : '開啟主選單');
    toggleBtn.textContent = open ? '✕' : '☰';
    if (open) {
      var first = panel.querySelector('a, button');
      if (first) first.focus();
    }
  }

  function onKeydown(e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      setNavOpen(false);
      toggleBtn.focus();
      return;
    }
    if (e.key !== 'Tab') return;
    // 焦點循環：漢堡鈕 + 抽屜內容形成一個封閉環，Tab 不會跑到背景頁面
    var items = [toggleBtn].concat(
      Array.prototype.slice.call(panel.querySelectorAll('a, button'))
        .filter(function (el) { return el.offsetParent !== null; })
    );
    var i = items.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    items[e.shiftKey ? (i - 1 + items.length) % items.length : (i + 1) % items.length].focus();
  }

  /* ---------- 下滑隱藏 / 上滑出現 ---------- */

  function reveal() { header.classList.remove('is-hidden'); }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = Math.max(0, window.scrollY);
      var dy = y - lastY;
      if (isOpen()) reveal();                       // 抽屜開著一律顯示
      else if (y < 80) reveal();                    // 靠近頂端一律顯示，避免回彈時閃動
      else if (dy > 6) header.classList.add('is-hidden');   // ±6px 死區吸收細碎捲動
      else if (dy < -6) reveal();
      lastY = y;
      ticking = false;
    });
  }

  /* ---------- 把實測頁首高度寫回 --header-h ---------- */

  function syncHeaderHeight() {
    var apply = function () {
      var h = Math.round(header.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--header-h', h + 'px');
    };
    apply();
    if ('ResizeObserver' in window) new ResizeObserver(apply).observe(header);
    else window.addEventListener('resize', apply);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  }

  /* ---------- 等 API 回來後補齊 ---------- */

  async function hydrate(current) {
    var me = await window.ISO26262Api.get('/api/auth/me');

    if (me.role === 'admin') {
      adminSlot.appendChild(groupLabel('管理者'));
      adminSlot.appendChild(navLink('/admin/manage-users.html', '成員管理', current === 'admin-manage-users'));
      adminSlot.appendChild(navLink('/admin/team-progress.html', '團隊進度', current === 'admin-team-progress'));
    }

    var roleBadge = me.role === 'admin' ? '<span class="role-badge">ADMIN</span>' : '';
    userBoxes.forEach(function (box) {
      box.innerHTML = '<b>' + escapeHtml(me.name) + '</b> ' + roleBadge;
    });

    if (me.mustChangePassword && current !== 'change-password') {
      window.location.href = '/login.html?forceChange=1';
    }
  }

  /* ---------- 啟動 ---------- */

  function start() {
    header = document.getElementById('app-header');
    if (!header) return;
    var current = header.getAttribute('data-current') || '';

    renderShell(current);
    syncHeaderHeight();

    lastY = Math.max(0, window.scrollY);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onScroll, { passive: true });
    header.addEventListener('focusin', reveal);      // 鍵盤 Tab 進頁首時不能是隱藏的
    window.addEventListener('hashchange', reveal);   // 點目錄跳轉時要看得到頁首

    hydrate(current).catch(function () { /* 401 由 api-client.js 導轉，其餘沉默 */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
