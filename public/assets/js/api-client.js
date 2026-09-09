// 呼叫後端 /api/* 的共用 fetch 封裝。401（未登入）時自動導向登入頁，
// 避免每個頁面各自處理一次 session 過期的情況。
(function () {
  async function request(path, options) {
    const opts = Object.assign({ credentials: 'same-origin' }, options);
    if (opts.body && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
      opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers);
    }

    const res = await fetch(path, opts);

    if (res.status === 401) {
      window.location.href = '/login.html';
      throw new Error('not_authenticated');
    }

    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = text; }
    }

    if (!res.ok) {
      const error = new Error((data && data.error) || 'request_failed');
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  window.ISO26262Api = {
    get: function (path) { return request(path, { method: 'GET' }); },
    post: function (path, body) { return request(path, { method: 'POST', body: body }); },
  };
})();
