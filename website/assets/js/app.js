/**
 * Dashboard — renders tracks, search, stats, progress (cookie-backed)
 */
(function () {
  function getProgress() {
    return StackReadyCookies.getProgress();
  }

  function getChecklistProgress() {
    try {
      const data = StackReadyCookies.getChecklistMap();
      const keys = Object.keys(data);
      if (!keys.length) return 0;
      const done = keys.filter(k => data[k]).length;
      return Math.round((done / keys.length) * 100);
    } catch {
      return 0;
    }
  }

  function calcOverallProgress() {
    const checklist = StackReadyCookies.getChecklistMap();
    let totalMapped = 0;
    let doneMapped = 0;
    getAllTopics().filter(t => !t.isUtility).forEach(t => {
      const p = ProgressMap.getGuideProgress(t.file);
      if (p.total > 0) {
        totalMapped += p.total;
        doneMapped += p.done;
      }
    });
    if (totalMapped > 0) {
      return Math.round((doneMapped / totalMapped) * 100);
    }
    const keys = Object.keys(checklist);
    if (!keys.length) return 0;
    return Math.round((keys.filter(k => checklist[k]).length / keys.length) * 100);
  }

  function getProgressDisplay(file) {
    const p = ProgressMap.getGuideProgress(file);
    if (p.total > 0) {
      return { pct: p.percent, done: p.done, total: p.total };
    }
    const legacyDone = StackReadyCookies.getProgress()[file];
    return { pct: legacyDone ? 100 : 0, done: legacyDone ? 1 : 0, total: legacyDone ? 1 : 0 };
  }

  function renderProgressBlock(file, variant) {
    const { pct, done, total } = getProgressDisplay(file);
    const countLabel = total > 0 ? `${done}/${total}` : '';
    if (variant === 'utility') {
      return `
        <div class="utility-progress">
          <div class="utility-progress-top">
            <span>Progress</span>
            <span>${pct}%${countLabel ? ` · ${countLabel}` : ''}</span>
          </div>
          <div class="utility-progress-wrap">
            <div class="utility-progress-bar" style="width:${pct}%"></div>
          </div>
        </div>`;
    }
    return `
      <div class="card-progress">
        <div class="card-progress-top">
          <span>Progress</span>
          <span class="card-progress-pct">${pct}%${countLabel ? ` <span class="card-progress-count">(${countLabel})</span>` : ''}</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
      </div>`;
  }

  function getTopicCardProgress(file) {
    return getProgressDisplay(file).pct;
  }

  function readTimeLabel(file) {
    const meta = (window.CONTENT_META || {})[file];
    if (!meta || !meta.minutes) return '';
    return `~${meta.minutes} min read`;
  }

  function getTrackProgress(track) {
    let total = 0, done = 0;
    track.topics.forEach(t => {
      const p = ProgressMap.getGuideProgress(t.file);
      if (p.total > 0) { total += p.total; done += p.done; }
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function renderResumeBanner() {
    const host = document.getElementById('resumeBanner');
    if (!host) return;
    const last = StackReadyCookies.getLastVisited();
    if (!last || !last.file) return;
    const topic = getAllTopics().find(t => t.file === last.file);
    const title = (topic && topic.title) || last.title || last.file;
    const track = topic ? topic.trackTitle : '';
    host.innerHTML = `
      <div class="resume-banner">
        <div class="resume-info">
          <span class="resume-label">Continue where you left off</span>
          <span class="resume-title">${title}</span>
          ${track ? `<span class="resume-sub">${track}</span>` : ''}
        </div>
        <a class="btn-resume" href="${siteUrl('reader.html?file=' + encodeURIComponent(last.file))}">Resume →</a>
      </div>`;
  }

  function renderUtilityStrip() {
    const strip = document.getElementById('utilityStrip');
    strip.innerHTML = UTILITY_DOCS.map(doc => `
      <a href="${siteUrl('reader.html?file=' + encodeURIComponent(doc.file))}" class="utility-card" data-file="${doc.file}">
        <span class="utility-card-icon">${doc.icon}</span>
        <div class="utility-card-body">
          <h3>${doc.title}</h3>
          <p>${doc.description}</p>
          ${renderProgressBlock(doc.file, 'utility')}
        </div>
      </a>
    `).join('');
  }

  function renderTopicCard(topic, trackColor) {
    const pct = getTopicCardProgress(topic.file);
    const diff = StackReadyCookies.getDifficulty(topic.file);
    const levels = ['easy', 'medium', 'hard'];
    const diffBtns = levels.map(l =>
      `<button type="button" class="diff-btn diff-${l}${diff === l ? ' active' : ''}" data-level="${l}" title="Mark ${l}">${l[0].toUpperCase()}</button>`
    ).join('');

    return `
      <a href="${siteUrl('reader.html?file=' + encodeURIComponent(topic.file))}" class="topic-card" data-file="${topic.file}" data-diff="${diff}" data-pct="${pct}">
        <div class="topic-card-header">
          <h3>${topic.title}</h3>
          <span class="priority-badge priority-${topic.priority || 'medium'}">${topic.priority || 'medium'}</span>
        </div>
        <p>${topic.description}</p>
        <div class="topic-meta">
          ${(topic.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
          <span class="topic-level">${topic.level || ''}</span>
        </div>
        <div class="card-footer">
          ${readTimeLabel(topic.file) ? `<span class="read-time">⏱ ${readTimeLabel(topic.file)}</span>` : '<span></span>'}
          <span class="diff-controls" data-file="${topic.file}">${diffBtns}</span>
        </div>
        ${renderProgressBlock(topic.file, 'topic')}
      </a>
    `;
  }

  function renderTracks() {
    const grid = document.getElementById('tracksGrid');
    grid.innerHTML = INTERVIEW_TRACKS.map(track => {
      const tp = getTrackProgress(track);
      const badge = tp === 100 ? '<span class="track-complete-badge">✅ Complete</span>' : '';
      return `
      <div class="track-column" data-track="${track.id}">
        <div class="track-header" style="background:${track.gradient}">
          ${badge}
          <div class="track-icon">${track.icon}</div>
          <h2>${track.title}</h2>
          <p>${track.subtitle}</p>
          <div class="track-progress">
            <div class="track-progress-top"><span>Progress</span><span>${tp}%</span></div>
            <div class="track-progress-wrap"><div class="track-progress-bar" style="width:${tp}%"></div></div>
          </div>
        </div>
        <div class="track-body">
          ${track.topics.map(t => renderTopicCard(t, track.color)).join('')}
        </div>
      </div>`;
    }).join('');
  }

  function setupCardInteractions() {
    document.querySelectorAll('.diff-controls').forEach(group => {
      const file = group.dataset.file;
      group.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const level = btn.dataset.level;
          const current = StackReadyCookies.getDifficulty(file);
          const next = current === level ? '' : level;
          StackReadyCookies.setDifficulty(file, next);
          group.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.level === next));
          const card = group.closest('.topic-card');
          if (card) card.dataset.diff = next;
          applyFilter(currentFilter);
        });
      });
    });
  }

  let currentFilter = 'all';

  function bookmarkedFiles() {
    const set = new Set();
    StackReadyCookies.getBookmarks().forEach(b => set.add(b.file));
    return set;
  }

  function applyFilter(filter) {
    currentFilter = filter;
    const bm = bookmarkedFiles();
    let shown = 0;
    document.querySelectorAll('.track-column').forEach(col => {
      let visibleInTrack = 0;
      col.querySelectorAll('.topic-card').forEach(card => {
        const pct = parseInt(card.dataset.pct || '0', 10);
        const diff = card.dataset.diff || '';
        const file = card.dataset.file;
        let match = true;
        if (filter === 'unchecked') match = pct < 100;
        else if (filter === 'hard') match = diff === 'hard';
        else if (filter === 'bookmarked') match = bm.has(file);
        card.style.display = match ? '' : 'none';
        if (match) { visibleInTrack++; shown++; }
      });
      col.style.display = visibleInTrack ? '' : 'none';
    });
    const hint = document.getElementById('filterHint');
    if (hint) {
      hint.textContent = filter === 'all' ? '' : `${shown} guide${shown === 1 ? '' : 's'}`;
    }
  }

  function setupFilterBar() {
    const bar = document.getElementById('filterBar');
    if (!bar) return;
    bar.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilter(chip.dataset.filter);
      });
    });
  }

  function renderStats() {
    const allTopics = getAllTopics().filter(t => !t.isUtility);
    document.getElementById('statTopics').textContent = allTopics.length;
    document.getElementById('statTracks').textContent = INTERVIEW_TRACKS.length;
    const totalSections = allTopics.reduce((sum, t) => sum + (t.sections || 0), 0);
    document.getElementById('statSections').textContent = totalSections + '+';
    document.getElementById('statProgress').textContent = calcOverallProgress() + '%';
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function highlightMatch(text, q) {
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return escapeHtml(text);
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + q.length + 80);
    const prefix = start > 0 ? '…' : '';
    const suffix = end < text.length ? '…' : '';
    const before = escapeHtml(text.slice(start, idx));
    const hit = escapeHtml(text.slice(idx, idx + q.length));
    const after = escapeHtml(text.slice(idx + q.length, end));
    return `${prefix}${before}<mark>${hit}</mark>${after}${suffix}`;
  }

  function fullTextResults(q, limit) {
    const data = window.STUDY_DATA;
    if (!data) return [];
    const out = [];
    for (const file of Object.keys(data)) {
      const guide = data[file];
      for (const sec of guide.sections) {
        if (!sec.text) continue;
        if (sec.text.toLowerCase().includes(q) || sec.heading.toLowerCase().includes(q)) {
          out.push({ file, guideTitle: guide.title, trackTitle: guide.trackTitle, heading: sec.heading, id: sec.id, text: sec.text });
          if (out.length >= limit) return out;
        }
      }
    }
    return out;
  }

  function setupSearch() {
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('searchResults');
    const allTopics = getAllTopics();

    function doSearch(query) {
      const q = query.trim().toLowerCase();
      if (!q) {
        results.classList.remove('open');
        return;
      }

      const titleMatches = allTopics.filter(t => {
        const hay = [t.title, t.description, t.trackTitle, ...(t.tags || [])].join(' ').toLowerCase();
        return hay.includes(q);
      }).slice(0, 6);

      const contentMatches = q.length >= 2 ? fullTextResults(q, 12) : [];

      let html = '';
      if (titleMatches.length) {
        html += '<div class="search-group-label">Guides</div>';
        html += titleMatches.map(t => `
          <a href="${siteUrl('reader.html?file=' + encodeURIComponent(t.file))}" class="search-result-item">
            <div class="search-result-title">${escapeHtml(t.title)}</div>
            <div class="search-result-meta">${escapeHtml(t.trackTitle)} · ${escapeHtml((t.description || '').slice(0, 60))}…</div>
          </a>
        `).join('');
      }
      if (contentMatches.length) {
        html += '<div class="search-group-label">In content</div>';
        html += contentMatches.map(m => `
          <a href="${siteUrl('reader.html?file=' + encodeURIComponent(m.file) + '#' + m.id)}" class="search-result-item">
            <div class="search-result-title">${escapeHtml(m.heading)}</div>
            <div class="search-result-snippet">${highlightMatch(m.text, q)}</div>
            <div class="search-result-meta">${escapeHtml(m.guideTitle)} · ${escapeHtml(m.trackTitle)}</div>
          </a>
        `).join('');
      }
      if (!html) {
        html = '<div class="search-result-item"><span class="search-result-meta">No results found</span></div>';
      }
      results.innerHTML = html;
      results.classList.add('open');
    }

    input.addEventListener('input', e => doSearch(e.target.value));
    input.addEventListener('focus', () => { if (input.value) doSearch(input.value); });

    document.addEventListener('click', e => {
      if (!document.getElementById('searchWrap').contains(e.target)) {
        results.classList.remove('open');
      }
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') results.classList.remove('open');
    });
  }

  function renderStreak() {
    const chip = document.getElementById('streakChip');
    if (!chip) return;
    const s = StackReadyCookies.recordActivity();
    if (s.count > 0) {
      chip.style.display = 'inline-flex';
      const best = s.best && s.best > s.count ? ` · best ${s.best}` : '';
      chip.innerHTML = `🔥 <strong>${s.count}-day streak</strong>${best}`;
    }
  }

  function celebrateIfComplete() {
    if (calcOverallProgress() === 100 && window.Confetti) {
      const seen = sessionStorage.getItem('sr_celebrated_all');
      if (!seen) { sessionStorage.setItem('sr_celebrated_all', '1'); setTimeout(() => Confetti.burst(), 400); }
    }
  }

  function setupDataActions() {
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    if (exportBtn) exportBtn.addEventListener('click', () => {
      const data = StackReadyCookies.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stackready-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', () => {
        const file = importFile.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            if (data._app && data._app !== 'StackReady') {
              if (!confirm('This file was not exported from StackReady. Import anyway?')) return;
            }
            StackReadyCookies.importAll(data);
            alert('Progress imported! Reloading…');
            location.reload();
          } catch (e) {
            alert('Could not read that file — make sure it is a StackReady export.');
          }
        };
        reader.readAsText(file);
      });
    }
  }

  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        const input = document.getElementById('globalSearch');
        if (input) input.focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderStreak();
    renderResumeBanner();
    renderUtilityStrip();
    renderTracks();
    setupCardInteractions();
    setupFilterBar();
    renderStats();
    setupSearch();
    setupDataActions();
    setupKeyboard();
    celebrateIfComplete();
  });
})();

