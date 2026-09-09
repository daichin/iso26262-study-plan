// 首頁「我的進度」與 admin「團隊進度」共用的圖表渲染邏輯，使用 Chart.js（頁面自行載入 CDN）。
(function () {
  const ACCENT = '#0F6079';
  const ACCENT_SOFT = '#DFEDF1';
  const LINE = '#D3DEE2';

  async function renderPersonalDashboard(chartCanvasId, cardsContainerId) {
    const circles = window.ISO26262_CIRCLES || [];
    let summary = { circles: {} };
    try {
      summary = await window.ISO26262Api.get('/api/quiz-attempts/progress-summary');
    } catch (e) {
      summary = { circles: {} };
    }

    const labels = circles.map(function (c) { return c.tag; });
    const data = circles.map(function (c) {
      const entry = summary.circles[c.id];
      return entry ? entry.bestPercentage : 0;
    });

    const canvas = document.getElementById(chartCanvasId);
    if (canvas && window.Chart) {
      new window.Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ label: '最佳成績 %', data: data, backgroundColor: ACCENT_SOFT, borderColor: ACCENT, borderWidth: 1.5, borderRadius: 6 }],
        },
        options: {
          scales: { y: { beginAtZero: true, max: 100, grid: { color: LINE } }, x: { grid: { display: false } } },
          plugins: { legend: { display: false } },
        },
      });
    }

    const cardsContainer = document.getElementById(cardsContainerId);
    if (cardsContainer) {
      cardsContainer.innerHTML = '';
      circles.forEach(function (c) {
        const entry = summary.circles[c.id];
        const pct = entry ? entry.bestPercentage : null;

        const card = document.createElement('a');
        card.className = 'circle-card';
        card.href = '/circles/' + c.file;

        card.innerHTML =
          '<span class="tag">' + c.tag + '</span>' +
          '<h3>' + c.title + '</h3>' +
          '<p>' + c.summary + '</p>' +
          '<div class="progress-bar"><span style="width:' + (pct || 0) + '%"></span></div>' +
          '<div class="progress-label">' + (pct === null ? '尚未作答' : '最佳成績 ' + pct + '%') + '</div>';

        cardsContainer.appendChild(card);
      });
    }
  }

  async function renderTeamProgress(tableContainerId) {
    const data = await window.ISO26262Api.get('/api/admin/team-progress');
    const circles = window.ISO26262_CIRCLES || [];
    const container = document.getElementById(tableContainerId);
    if (!container) return;

    let html = '<div class="table-wrap"><table><thead><tr><th>成員</th>';
    circles.forEach(function (c) { html += '<th>' + c.tag.replace('・', '<br>') + '</th>'; });
    html += '<th>整體完成率</th></tr></thead><tbody>';

    data.members.forEach(function (member) {
      html += '<tr><td><b>' + member.name + '</b><br><span class="src">' + member.email + '</span></td>';
      circles.forEach(function (c) {
        const cell = member.circles[c.id];
        html += '<td>' + (cell ? cell.percentage + '%' : '<span class="src">—</span>') + '</td>';
      });
      html += '<td><b>' + member.overallPercentage + '%</b></td></tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  window.ISO26262Dashboard = {
    renderPersonalDashboard: renderPersonalDashboard,
    renderTeamProgress: renderTeamProgress,
  };
})();
