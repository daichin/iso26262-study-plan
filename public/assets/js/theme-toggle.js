// 深色/淺色主題：預設跟隨系統設定（theme.css 的 prefers-color-scheme），
// 使用者也可以手動切換，記在 localStorage，下次造訪維持選擇。
(function () {
  const STORAGE_KEY = 'iso26262-theme';

  function applyStoredTheme() {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // 私密瀏覽模式等情況下 localStorage 可能無法使用，安靜地跟隨系統設定即可
    }
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  }

  function currentTheme() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* 忽略無法寫入的情況 */
    }
  }

  function mountToggle(container) {
    if (!container) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle-btn';
    btn.setAttribute('aria-label', '切換深色/淺色主題');
    function render() {
      btn.textContent = currentTheme() === 'dark' ? '🌙' : '☀️';
    }
    render();
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
      render();
    });
    container.appendChild(btn);
  }

  applyStoredTheme();
  window.ISO26262Theme = { mountToggle: mountToggle };
})();
