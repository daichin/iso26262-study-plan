// 共用頁首：讀取登入者身份、渲染導覽列（含 admin 連結）、登出按鈕、主題切換鈕。
// 各頁面只要放一個 <header id="app-header" data-current="circle-id 或 admin-users 等"></header>，
// 這支腳本會在 DOMContentLoaded 時自動把內容填進去。未登入時 server 端已經會導去 /login.html，
// 這裡的 /api/auth/me 失敗時（例如 session 剛好過期）api-client.js 也會處理導轉。
(function () {
  async function mount() {
    const header = document.getElementById('app-header');
    if (!header) return;
    const current = header.getAttribute('data-current') || '';

    const me = await window.ISO26262Api.get('/api/auth/me');

    header.className = 'site-header';
    const inner = document.createElement('div');
    inner.className = 'site-header-inner';

    const brand = document.createElement('a');
    brand.className = 'site-brand';
    brand.href = '/index.html';
    brand.textContent = 'ISO 26262 學習網站';
    inner.appendChild(brand);

    const links = document.createElement('nav');
    links.className = 'site-nav-links';

    const homeLink = document.createElement('a');
    homeLink.href = '/index.html';
    homeLink.textContent = '我的地圖';
    if (current === 'index') homeLink.classList.add('is-current');
    links.appendChild(homeLink);

    (window.ISO26262_CIRCLES || []).forEach(function (circle) {
      const a = document.createElement('a');
      a.href = '/circles/' + circle.file;
      a.textContent = circle.title;
      if (current === circle.id) a.classList.add('is-current');
      links.appendChild(a);
    });

    if (me.role === 'admin') {
      const manageLink = document.createElement('a');
      manageLink.href = '/admin/manage-users.html';
      manageLink.textContent = '成員管理';
      if (current === 'admin-manage-users') manageLink.classList.add('is-current');
      links.appendChild(manageLink);

      const progressLink = document.createElement('a');
      progressLink.href = '/admin/team-progress.html';
      progressLink.textContent = '團隊進度';
      if (current === 'admin-team-progress') progressLink.classList.add('is-current');
      links.appendChild(progressLink);
    }

    inner.appendChild(links);

    const spacer = document.createElement('div');
    spacer.className = 'site-header-spacer';
    inner.appendChild(spacer);

    const themeSlot = document.createElement('div');
    inner.appendChild(themeSlot);
    if (window.ISO26262Theme) window.ISO26262Theme.mountToggle(themeSlot);

    const userBox = document.createElement('div');
    userBox.className = 'site-user';
    const roleBadge = me.role === 'admin' ? '<span class="role-badge">ADMIN</span>' : '';
    userBox.innerHTML = '<b>' + escapeHtml(me.name) + '</b> ' + roleBadge;
    inner.appendChild(userBox);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn ghost';
    logoutBtn.type = 'button';
    logoutBtn.textContent = '登出';
    logoutBtn.addEventListener('click', async function () {
      await window.ISO26262Api.post('/api/auth/logout', {});
      window.location.href = '/login.html';
    });
    inner.appendChild(logoutBtn);

    header.innerHTML = '';
    header.appendChild(inner);

    if (me.mustChangePassword && current !== 'change-password') {
      window.location.href = '/login.html?forceChange=1';
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', mount);
})();
