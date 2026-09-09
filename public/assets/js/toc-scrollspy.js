// 側邊目錄的手機版展開/收合 + 桌機版捲動高亮（scrollspy）。
// 章節內容頁與部署手冊共用同一套行為：只要頁面裡有 .index-toc + #tocToggle + #tocList 就會自動生效。
(function () {
  function init() {
    const toggle = document.getElementById('tocToggle');
    const index = document.getElementById('index');
    if (toggle && index) {
      toggle.addEventListener('click', function () {
        const open = index.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    const links = Array.prototype.slice.call(document.querySelectorAll('.index-toc a'));
    const map = {};
    links.forEach(function (a) {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) map[id] = a;
    });
    if (!('IntersectionObserver' in window) || links.length === 0) return;

    const obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            links.forEach(function (a) { a.classList.remove('is-current'); });
            const a = map[e.target.id];
            if (a) a.classList.add('is-current');
          }
        });
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    );
    Object.keys(map).forEach(function (id) { obs.observe(document.getElementById(id)); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
