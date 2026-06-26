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
    const progress = getProgress();
    const allTopics = getAllTopics().filter(t => !t.isUtility);
    if (!allTopics.length) return 0;
    const read = allTopics.filter(t => progress[t.file]).length;
    const readPct = (read / allTopics.length) * 70;
    const checklistPct = getChecklistProgress() * 0.3;
    return Math.round(readPct + checklistPct);
  }

  function renderUtilityStrip() {
    const strip = document.getElementById('utilityStrip');
    strip.innerHTML = UTILITY_DOCS.map(doc => `
      <a href="${siteUrl('reader.html?file=' + encodeURIComponent(doc.file))}" class="utility-card">
        <span class="utility-card-icon">${doc.icon}</span>
        <div>
          <h3>${doc.title}</h3>
          <p>${doc.description}</p>
        </div>
      </a>
    `).join('');
  }

  function renderTopicCard(topic, trackColor) {
    const progress = getProgress();
    const isRead = !!progress[topic.file];
    const pct = isRead ? 100 : 0;

    return `
      <a href="${siteUrl('reader.html?file=' + encodeURIComponent(topic.file))}" class="topic-card" data-file="${topic.file}">
        <div class="topic-card-header">
          <h3>${topic.title}</h3>
          <span class="priority-badge priority-${topic.priority || 'medium'}">${topic.priority || 'medium'}</span>
        </div>
        <p>${topic.description}</p>
        <div class="topic-meta">
          ${(topic.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
          <span class="topic-level">${topic.level || ''}</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
      </a>
    `;
  }

  function renderTracks() {
    const grid = document.getElementById('tracksGrid');
    grid.innerHTML = INTERVIEW_TRACKS.map(track => `
      <div class="track-column" data-track="${track.id}">
        <div class="track-header" style="background:${track.gradient}">
          <div class="track-icon">${track.icon}</div>
          <h2>${track.title}</h2>
          <p>${track.subtitle}</p>
        </div>
        <div class="track-body">
          ${track.topics.map(t => renderTopicCard(t, track.color)).join('')}
        </div>
      </div>
    `).join('');
  }

  function renderStats() {
    const allTopics = getAllTopics().filter(t => !t.isUtility);
    document.getElementById('statTopics').textContent = allTopics.length;
    document.getElementById('statTracks').textContent = INTERVIEW_TRACKS.length;
    const totalSections = allTopics.reduce((sum, t) => sum + (t.sections || 0), 0);
    document.getElementById('statSections').textContent = totalSections + '+';
    document.getElementById('statProgress').textContent = calcOverallProgress() + '%';
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

      const matches = allTopics.filter(t => {
        const hay = [t.title, t.description, t.trackTitle, ...(t.tags || [])].join(' ').toLowerCase();
        return hay.includes(q);
      }).slice(0, 10);

      if (!matches.length) {
        results.innerHTML = '<div class="search-result-item"><span class="search-result-meta">No results found</span></div>';
      } else {
        results.innerHTML = matches.map(t => `
          <a href="${siteUrl('reader.html?file=' + encodeURIComponent(t.file))}" class="search-result-item">
            <div class="search-result-title">${t.title}</div>
            <div class="search-result-meta">${t.trackTitle} · ${t.description?.slice(0, 60)}...</div>
          </a>
        `).join('');
      }
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

  document.addEventListener('DOMContentLoaded', () => {
    renderUtilityStrip();
    renderTracks();
    renderStats();
    setupSearch();
  });
})();
