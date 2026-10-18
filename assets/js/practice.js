/**
 * Practice page — flashcards, timed mock interview, and bookmarks.
 * Pulls Q&A from window.STUDY_DATA (generated at deploy time).
 */
(function () {
  const STUDY = window.STUDY_DATA || {};

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderMarkdown(md) {
    let html;
    try { html = marked.parse(md); } catch (_) { html = md; }
    return html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // Plain-text version of a markdown answer, for use as an MCQ option label
  function plainText(md) {
    return md
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/\|/g, ' ')
      .replace(/[*_>#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Build 4 MCQ options: the correct answer + up to 3 distractors (same track first)
  function makeOptions(card, pool) {
    const sameTrack = pool.filter(c => c.trackTitle === card.trackTitle && c.a !== card.a);
    const source = sameTrack.length >= 3 ? sameTrack : pool.filter(c => c.a !== card.a);
    const used = new Set([plainText(card.a)]);
    const distractors = [];
    for (const c of shuffle(source)) {
      if (distractors.length >= 3) break;
      const p = plainText(c.a);
      if (!p || used.has(p)) continue;
      used.add(p);
      distractors.push(c);
    }
    const opts = [{ full: card.a, correct: true }].concat(distractors.map(c => ({ full: c.a, correct: false })));
    return shuffle(opts).map(o => {
      const txt = plainText(o.full);
      return { text: txt.length > 180 ? txt.slice(0, 180) + '…' : txt, full: o.full, correct: o.correct };
    });
  }

  // Render an MCQ option list into a container; calls onPick(index, option) on first choice
  function renderOptions(container, card, onPick) {
    container.innerHTML = '';
    card._opts.forEach((o, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mcq-option';
      btn.innerHTML = `<span class="mcq-letter">${String.fromCharCode(65 + i)}</span><span class="mcq-text">${escapeHtml(o.text)}</span>`;
      if (card._answered) {
        btn.disabled = true;
        if (o.correct) btn.classList.add('correct');
        if (card._picked === i && !o.correct) btn.classList.add('wrong');
        if (card._picked === i) btn.classList.add('picked');
      }
      btn.addEventListener('click', () => {
        if (card._answered) return;
        card._answered = true;
        card._picked = i;
        card._correct = o.correct;
        onPick(i, o);
      });
      container.appendChild(btn);
    });
  }

  function highlightWithin(el) {
    el.querySelectorAll('pre code').forEach(b => { try { hljs.highlightElement(b); } catch (_) {} });
  }

  // Find the Q&A section anchor for a guide so "open in guide" jumps to it
  function qaAnchorFor(file) {
    const g = STUDY[file];
    if (!g) return '';
    const sec = g.sections.find(s => /interview q.?&.?a|q&a bank|interview questions/i.test(s.heading));
    return sec ? '#' + sec.id : '';
  }

  // Tracks that actually contain flashcards
  function availableTracks() {
    const counts = {};
    Object.keys(STUDY).forEach(file => {
      const g = STUDY[file];
      if (!g.qa || !g.qa.length) return;
      counts[g.trackId] = counts[g.trackId] || { id: g.trackId, title: g.trackTitle, count: 0 };
      counts[g.trackId].count += g.qa.length;
    });
    const order = (typeof INTERVIEW_TRACKS !== 'undefined') ? INTERVIEW_TRACKS.map(t => t.id) : [];
    return Object.values(counts).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }

  function buildPool(selectedIds) {
    const all = !selectedIds || !selectedIds.size;
    const pool = [];
    Object.keys(STUDY).forEach(file => {
      const g = STUDY[file];
      if (!g.qa || !g.qa.length) return;
      if (!all && !selectedIds.has(g.trackId)) return;
      const anchor = qaAnchorFor(file);
      g.qa.forEach(card => {
        pool.push({ q: card.q, a: card.a, file, guideTitle: g.title, trackTitle: g.trackTitle, anchor });
      });
    });
    return pool;
  }

  // --- Track chip selector (shared by flashcards & mock) ---
  function renderTrackChips(container, onChange) {
    const tracks = availableTracks();
    const selected = new Set();
    container.innerHTML =
      `<button class="track-chip active" data-all="1">All tracks</button>` +
      tracks.map(t => `<button class="track-chip" data-id="${t.id}">${t.title} <span class="chip-count">${t.count}</span></button>`).join('');

    function refresh() {
      const allBtn = container.querySelector('[data-all]');
      allBtn.classList.toggle('active', selected.size === 0);
      container.querySelectorAll('[data-id]').forEach(b => b.classList.toggle('active', selected.has(b.dataset.id)));
      onChange(selected);
    }

    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.all) { selected.clear(); }
        else {
          const id = btn.dataset.id;
          if (selected.has(id)) selected.delete(id); else selected.add(id);
        }
        refresh();
      });
    });
    refresh();
    return { getSelected: () => selected };
  }

  // ============ FLASHCARDS ============
  function initFlashcards() {
    let pool = [], idx = 0, selectedIds = new Set();
    const setup = document.getElementById('flashSetup');
    const stage = document.getElementById('flashStage');
    const hint = document.getElementById('flashHint');

    const sel = renderTrackChips(document.getElementById('flashTracks'), (s) => {
      selectedIds = s;
      const n = buildPool(s).length;
      hint.textContent = `${n} question${n === 1 ? '' : 's'} ready`;
    });

    function render() {
      const card = pool[idx];
      if (!card) return;
      if (!card._opts) card._opts = makeOptions(card, pool);
      document.getElementById('flashCardTrack').textContent = `${card.trackTitle} · ${card.guideTitle}`;
      document.getElementById('flashCardQ').textContent = card.q;

      const ans = document.getElementById('flashCardA');
      renderOptions(document.getElementById('flashOptions'), card, () => render());

      if (card._answered) {
        ans.innerHTML = `<div class="mcq-verdict ${card._correct ? 'ok' : 'no'}">${card._correct ? '✓ Correct' : '✗ Not quite'}</div>` + renderMarkdown(card.a);
        highlightWithin(ans);
        ans.style.display = 'block';
      } else {
        ans.style.display = 'none';
      }

      document.getElementById('flashCounter').textContent = `${idx + 1} / ${pool.length}`;
      document.getElementById('flashSource').href = siteUrl('reader.html?file=' + encodeURIComponent(card.file) + card.anchor);
    }

    function start() {
      pool = shuffle(buildPool(selectedIds));
      if (!pool.length) { hint.textContent = 'No questions found for that selection.'; return; }
      idx = 0;
      setup.style.display = 'none';
      stage.style.display = 'block';
      render();
    }

    document.getElementById('flashStart').addEventListener('click', start);
    document.getElementById('flashShuffle').addEventListener('click', () => {
      pool.forEach(c => { c._opts = null; c._answered = false; c._picked = undefined; });
      pool = shuffle(pool); idx = 0; render();
    });
    document.getElementById('flashExit').addEventListener('click', () => { stage.style.display = 'none'; setup.style.display = 'block'; });
    document.getElementById('flashNext').addEventListener('click', () => { idx = (idx + 1) % pool.length; render(); });
    document.getElementById('flashPrev').addEventListener('click', () => { idx = (idx - 1 + pool.length) % pool.length; render(); });
  }

  // ============ MOCK INTERVIEW ============
  function initMock() {
    let pool = [], idx = 0, selectedIds = new Set();
    let timerId = null, seconds = 0;
    const setup = document.getElementById('mockSetup');
    const stage = document.getElementById('mockStage');
    const summary = document.getElementById('mockSummary');
    const hint = document.getElementById('mockHint');

    renderTrackChips(document.getElementById('mockTracks'), (s) => {
      selectedIds = s;
      const n = buildPool(s).length;
      hint.textContent = `${n} question${n === 1 ? '' : 's'} in the pool`;
    });

    function fmt(s) {
      const m = Math.floor(s / 60), sec = s % 60;
      return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    function tick() { seconds++; document.getElementById('mockTimer').textContent = fmt(seconds); }

    function render() {
      const card = pool[idx];
      if (!card._opts) card._opts = makeOptions(card, pool);
      document.getElementById('mockCardTrack').textContent = `${card.trackTitle} · ${card.guideTitle}`;
      document.getElementById('mockCardQ').textContent = `Q${idx + 1}. ${card.q}`;

      const ans = document.getElementById('mockCardA');
      renderOptions(document.getElementById('mockOptions'), card, () => render());

      if (card._answered) {
        ans.innerHTML = `<div class="mcq-verdict ${card._correct ? 'ok' : 'no'}">${card._correct ? '✓ Correct' : '✗ Not quite'}</div>` + renderMarkdown(card.a);
        highlightWithin(ans);
        ans.style.display = 'block';
      } else {
        ans.style.display = 'none';
      }

      document.getElementById('mockCounter').textContent = `${idx + 1} / ${pool.length}`;
      document.getElementById('mockNext').textContent = idx === pool.length - 1 ? 'Finish ✓' : 'Next →';
      document.getElementById('mockSource').href = siteUrl('reader.html?file=' + encodeURIComponent(card.file) + card.anchor);
    }

    function start() {
      const count = parseInt(document.getElementById('mockCount').value, 10);
      pool = shuffle(buildPool(selectedIds)).slice(0, count);
      if (!pool.length) { hint.textContent = 'No questions found for that selection.'; return; }
      idx = 0; seconds = 0;
      setup.style.display = 'none';
      summary.style.display = 'none';
      stage.style.display = 'block';
      document.getElementById('mockTimer').textContent = '00:00';
      clearInterval(timerId);
      timerId = setInterval(tick, 1000);
      render();
    }

    function finish() {
      clearInterval(timerId);
      stage.style.display = 'none';
      summary.style.display = 'block';
      const correct = pool.filter(c => c._correct).length;
      const answered = pool.filter(c => c._answered).length;
      const pct = pool.length ? Math.round((correct / pool.length) * 100) : 0;
      summary.innerHTML = `
        <div class="summary-card">
          <h2>${pct >= 70 ? '🎉' : '📊'} Mock complete</h2>
          <div class="summary-score">${correct} / ${pool.length} correct · ${pct}%</div>
          <div class="summary-stats">
            <div><span class="summary-num">${answered}</span><span>answered</span></div>
            <div><span class="summary-num">${fmt(seconds)}</span><span>time taken</span></div>
            <div><span class="summary-num">${pool.length ? Math.round(seconds / pool.length) : 0}s</span><span>avg / question</span></div>
          </div>
          <button class="btn btn-primary" id="mockRestart">Run another →</button>
        </div>`;
      document.getElementById('mockRestart').addEventListener('click', () => {
        summary.style.display = 'none'; setup.style.display = 'block';
      });
    }

    document.getElementById('mockStart').addEventListener('click', start);
    document.getElementById('mockNext').addEventListener('click', () => {
      if (idx === pool.length - 1) { finish(); return; }
      idx++; render();
    });
    document.getElementById('mockExit').addEventListener('click', () => {
      clearInterval(timerId); stage.style.display = 'none'; setup.style.display = 'block';
    });
  }

  // ============ BOOKMARKS ============
  function renderBookmarks() {
    const host = document.getElementById('bookmarksList');
    const list = StackReadyCookies.getBookmarks();
    if (!list.length) {
      host.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <h3>No bookmarks yet</h3>
          <p>Open any guide and tap the ☆ star next to a section heading to save it here for quick revision before your interview.</p>
          <a href="index.html" class="btn btn-primary">Browse guides →</a>
        </div>`;
      return;
    }
    const byGuide = {};
    list.forEach(b => {
      const key = b.guideTitle || b.file;
      (byGuide[key] = byGuide[key] || []).push(b);
    });
    host.innerHTML = Object.keys(byGuide).map(guide => `
      <div class="bookmark-group">
        <h3>${guide}</h3>
        <ul class="bookmark-items">
          ${byGuide[guide].map(b => `
            <li class="bookmark-row" data-file="${b.file}" data-id="${b.id}">
              <a href="${siteUrl('reader.html?file=' + encodeURIComponent(b.file) + '#' + b.id)}">${b.heading || b.id}</a>
              <button class="bookmark-remove" title="Remove">✕</button>
            </li>`).join('')}
        </ul>
      </div>`).join('');

    host.querySelectorAll('.bookmark-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.bookmark-row');
        StackReadyCookies.removeBookmark(row.dataset.file, row.dataset.id);
        renderBookmarks();
      });
    });
  }

  // ============ TABS ============
  function setupTabs() {
    const tabs = document.querySelectorAll('.practice-tab');
    function activate(name) {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
      ['flashcards', 'mock', 'bookmarks'].forEach(p => {
        document.getElementById('panel-' + p).style.display = p === name ? 'block' : 'none';
      });
      if (name === 'bookmarks') renderBookmarks();
      history.replaceState(null, '', '#' + name);
    }
    tabs.forEach(t => t.addEventListener('click', () => activate(t.dataset.tab)));
    const hash = (location.hash || '').replace('#', '');
    if (['flashcards', 'mock', 'bookmarks'].includes(hash)) activate(hash);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!Object.keys(STUDY).length) {
      document.querySelector('.practice-page').insertAdjacentHTML('beforeend',
        '<p style="color:var(--gray-400);margin-top:1rem;">Study data not loaded. Run the deploy script to generate flashcards.</p>');
    }
    initFlashcards();
    initMock();
    setupTabs();
  });
})();
