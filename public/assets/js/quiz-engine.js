// 測驗引擎：給一個容器 id、circleId、題庫陣列，渲染單選題測驗。
// 題目格式：{ id, question, options: [string...], correctIndex, explanation, sourceKey }
// sourceKey 對應 window.ISO26262_SOURCES 裡的 key，用來顯示可點擊的出處連結。
(function () {
  function sourceLink(sourceKey) {
    const src = (window.ISO26262_SOURCES || {})[sourceKey];
    if (!src) return '';
    return '<a href="' + src.url + '" target="_blank" rel="noreferrer noopener">📎 出處：' + escapeHtml(src.label) + '</a>';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function loadLastAttempt(circleId) {
    try {
      const attempts = await window.ISO26262Api.get('/api/quiz-attempts?circleId=' + encodeURIComponent(circleId));
      return attempts && attempts[0];
    } catch (e) {
      return null;
    }
  }

  function renderQuestion(q, index) {
    const el = document.createElement('div');
    el.className = 'quiz-question';
    el.dataset.qid = q.id;
    el.dataset.correctIndex = q.correctIndex;

    const qText = document.createElement('p');
    qText.className = 'q-text';
    qText.textContent = (index + 1) + '. ' + q.question;
    el.appendChild(qText);

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'quiz-options';
    q.options.forEach(function (optionText, i) {
      const label = document.createElement('label');
      label.className = 'quiz-option';
      label.dataset.optionIndex = i;
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'q-' + q.id;
      input.value = i;
      label.appendChild(input);
      const span = document.createElement('span');
      span.textContent = optionText;
      label.appendChild(span);
      optionsWrap.appendChild(label);
    });
    el.appendChild(optionsWrap);

    const feedback = document.createElement('div');
    feedback.className = 'quiz-feedback';
    feedback.innerHTML =
      '<div class="feedback-verdict"></div>' +
      '<p style="margin:.5rem 0 0">' + escapeHtml(q.explanation) + '</p>' +
      '<p style="margin:.4rem 0 0">' + sourceLink(q.sourceKey) + '</p>';
    el.appendChild(feedback);

    return el;
  }

  // 就地把測驗還原成未作答狀態。每一項都對應提交時設定的某個狀態，
  // 少清一項就會留下「上一輪的痕跡」，例如選項還亮著紅框卻可以重新點選。
  function resetQuiz(list, submitBtn, summary) {
    Array.prototype.forEach.call(list.querySelectorAll('.quiz-question'), function (qEl) {
      qEl.classList.remove('answered', 'correct', 'incorrect');
      Array.prototype.forEach.call(qEl.querySelectorAll('.quiz-option'), function (opt) {
        opt.classList.remove('is-correct', 'is-selected');
      });
      Array.prototype.forEach.call(qEl.querySelectorAll('input[type="radio"]'), function (input) {
        input.checked = false;
      });
      const verdict = qEl.querySelector('.feedback-verdict');
      if (verdict) verdict.textContent = '';
    });

    submitBtn.disabled = false;
    submitBtn.textContent = '提交答案';

    summary.style.display = 'none';
    summary.innerHTML = '';

    list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function mount(containerId, circleId, questions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const list = document.createElement('div');
    questions.forEach(function (q, i) {
      list.appendChild(renderQuestion(q, i));
    });
    container.appendChild(list);

    const lastAttemptNote = document.createElement('p');
    lastAttemptNote.className = 'lede';
    lastAttemptNote.style.marginTop = '.6rem';
    container.insertBefore(lastAttemptNote, list);
    loadLastAttempt(circleId).then(function (last) {
      if (last) {
        lastAttemptNote.textContent = '你上次作答成績：' + last.percentage + '%（' + new Date(last.created_at).toLocaleString('zh-TW') + '）';
      }
    });

    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'btn primary';
    submitBtn.textContent = '提交答案';
    container.appendChild(submitBtn);

    const summary = document.createElement('div');
    summary.className = 'quiz-summary';
    summary.style.display = 'none';
    container.appendChild(summary);

    submitBtn.addEventListener('click', async function () {
      const questionEls = Array.prototype.slice.call(list.querySelectorAll('.quiz-question'));
      let unanswered = 0;
      let correctCount = 0;
      const answers = [];

      questionEls.forEach(function (qEl) {
        const correctIndex = Number(qEl.dataset.correctIndex);
        const selected = qEl.querySelector('input[type="radio"]:checked');
        const options = Array.prototype.slice.call(qEl.querySelectorAll('.quiz-option'));

        options.forEach(function (opt) { opt.classList.remove('is-correct', 'is-selected'); });

        if (!selected) {
          unanswered += 1;
          return;
        }
        const selectedIndex = Number(selected.value);
        const isCorrect = selectedIndex === correctIndex;
        if (isCorrect) correctCount += 1;

        qEl.classList.add('answered', isCorrect ? 'correct' : 'incorrect');
        options[correctIndex].classList.add('is-correct');
        options[selectedIndex].classList.add('is-selected');
        qEl.querySelector('.feedback-verdict').textContent = isCorrect ? '✅ 答對了' : '❌ 答錯了，正確答案是：' + qEl.querySelectorAll('.quiz-option span')[correctIndex].textContent;

        answers.push({ questionId: qEl.dataset.qid, selectedIndex: selectedIndex, correct: isCorrect });
      });

      if (unanswered > 0) {
        alert('還有 ' + unanswered + ' 題尚未作答，請全部作答完再提交。');
        return;
      }

      const total = questionEls.length;
      const percentage = Math.round((correctCount / total) * 10000) / 100;

      summary.style.display = 'block';
      summary.innerHTML =
        '<p class="score-big">' + percentage + '%</p>' +
        '<p>答對 ' + correctCount + ' / ' + total + ' 題</p>';

      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = 'btn';
      retryBtn.style.marginTop = '.9rem';
      retryBtn.textContent = '再測一次';
      retryBtn.addEventListener('click', function () { resetQuiz(list, submitBtn, summary); });
      summary.appendChild(retryBtn);

      const retryHint = document.createElement('p');
      retryHint.style.fontSize = '.82rem';
      retryHint.style.margin = '.5rem 0 0';
      retryHint.textContent = '重測會另外存一筆紀錄，首頁進度取的是最佳成績，不會蓋掉這次的分數。';
      summary.appendChild(retryHint);

      summary.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 這行原本停在更早那次的成績，重測後會跟眼前的結果互相矛盾，所以一併更新。
      lastAttemptNote.textContent = '你剛才的成績：' + percentage + '%（' + new Date().toLocaleString('zh-TW') + '）';

      submitBtn.disabled = true;
      submitBtn.textContent = '已提交';

      try {
        await window.ISO26262Api.post('/api/quiz-attempts', {
          circleId: circleId,
          score: correctCount,
          totalQuestions: total,
          answers: answers,
        });
      } catch (e) {
        const warn = document.createElement('p');
        warn.style.color = 'var(--danger)';
        warn.textContent = '本次分數暫時無法存檔（網路或伺服器問題），但上面的作答結果仍然有效，可以稍後重新整理再試一次。';
        summary.appendChild(warn);
      }
    });
  }

  window.ISO26262Quiz = { mount: mount };
})();
