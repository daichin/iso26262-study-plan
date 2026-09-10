// 內文出處引用：把 sources.js 的 key 機制從測驗延伸到章節內文。
//
// 用法（章節 HTML 只寫 key，不寫網址）：
//   行內引用： ……單元驗證的覆蓋率要求依 ASIL 而不同<a class="cite" data-src="iso26262_part6"></a>。
//   本章出處： <div id="chapterSources"></div>  ← 自動收集全頁用到的 key，去重後列出
//
// 這樣做的原因：八個章節頁是手工維護的重複檔案，沒有樣板機制。網址硬寫進 HTML
// 等於同一個連結散在多處，日後失效要改八個檔案。sources.js 檔頭已宣告自己是
// 「所有原始出處連結的單一維護點」，內文沿用同一套 key 才守得住這個承諾。
(function () {
  function lookup(key) {
    return (window.ISO26262_SOURCES || {})[key] || null;
  }

  // 行內引用渲染成「📎 標籤」小晶片。label 取 sources.js 的完整標籤太長，
  // 破折號前的標準編號才是讀者在內文掃視時需要的資訊。
  function shortLabel(src) {
    return src.label.split('—')[0].trim();
  }

  // 晶片是 inline-block（atomic inline），瀏覽器允許在它後面斷行，於是緊跟其後的
  // 「。」會被單獨甩到下一行。實測 60 個起始位移中有 3 個會發生。
  // 標準的 CJK 斷行規則本來就禁止在收尾標點前斷行，但 atomic inline 的邊界不受該規則保護，
  // 所以把晶片和後面那個收尾標點包進一個 nowrap 容器，讓它們永遠一起換行。
  var CLOSING_PUNCT = /^[。、，）」』！？；：,.)\]]/;

  function keepPunctuationAttached(node) {
    var next = node.nextSibling;
    if (!next || next.nodeType !== 3 || !CLOSING_PUNCT.test(next.nodeValue)) return;

    var wrapper = document.createElement('span');
    wrapper.className = 'cite-nb';
    node.parentNode.insertBefore(wrapper, node);
    wrapper.appendChild(node);

    next.splitText(1);          // next 現在只剩那一個標點，其餘留在後面的新節點
    wrapper.appendChild(next);
  }

  function renderInline() {
    var nodes = document.querySelectorAll('a.cite[data-src]');
    var missing = [];

    Array.prototype.forEach.call(nodes, function (node) {
      var key = node.getAttribute('data-src');
      var src = lookup(key);
      if (!src) {
        missing.push(key);
        return;
      }
      node.href = src.url;
      node.target = '_blank';
      node.rel = 'noreferrer noopener';
      node.title = src.label;
      if (!node.textContent.trim()) {
        node.textContent = '📎 ' + shortLabel(src);
      }
      keepPunctuationAttached(node);
    });

    return missing;
  }

  // 依文件順序收集本頁用過的 key（含測驗題庫），去重後產生「本章出處」清單。
  function collectKeys() {
    var keys = [];
    var seen = {};

    Array.prototype.forEach.call(document.querySelectorAll('[data-src]'), function (node) {
      var key = node.getAttribute('data-src');
      if (key && !seen[key]) { seen[key] = true; keys.push(key); }
    });

    Object.keys(window).forEach(function (globalName) {
      if (globalName.indexOf('ISO26262_QUIZ_CIRCLE_') !== 0) return;
      var bank = window[globalName];
      if (!Array.isArray(bank)) return;
      bank.forEach(function (q) {
        if (q.sourceKey && !seen[q.sourceKey]) { seen[q.sourceKey] = true; keys.push(q.sourceKey); }
      });
    });

    return keys;
  }

  function renderSourceList() {
    var container = document.getElementById('chapterSources');
    if (!container) return;

    var keys = collectKeys();
    if (keys.length === 0) return;

    var list = document.createElement('ul');
    list.className = 'source-list';

    keys.forEach(function (key) {
      var src = lookup(key);
      if (!src) return;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = src.url;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      a.textContent = src.label;
      li.appendChild(a);
      list.appendChild(li);
    });

    container.appendChild(list);
  }

  function init() {
    var missing = renderInline();
    renderSourceList();
    if (missing.length) {
      console.warn('[citations] sources.js 缺少這些 key：', missing.join(', '));
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
