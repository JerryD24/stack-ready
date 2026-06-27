/**
 * Markdown Reader — TOC navigation + unified topic progress (syncs with Master Roadmap)
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  const fileName = params.get('file') || '01_Java_Core_to_Advanced.md';
  const contentArea = document.getElementById('contentArea');
  const tocList = document.getElementById('tocList');
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  const docTitle = document.getElementById('docTitle');
  const readerToolbar = document.getElementById('readerToolbar');

  let currentTopic = getAllTopics().find(t => t.file === fileName);
  let headingRegistry = [];

  function githubSlug(text) {
    return text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
    return h;
  }

  function renderHeading(src, level) {
    let depth, plain, html;
    if (typeof src === 'object' && src !== null && 'depth' in src) {
      const token = src;
      depth = token.depth;
      plain = token.text || '';
      const inline = token.tokens || [];
      html = this.parser.parseInline(inline);
    } else {
      depth = level;
      plain = String(src).replace(/<[^>]*>/g, '');
      html = String(src);
    }
    const id = githubSlug(plain) || `section-${hashCode(plain)}`;
    return `<h${depth} id="${id}">${html}</h${depth}>\n`;
  }

  function renderCode(src, infostring) {
    let code, lang;
    if (typeof src === 'object' && src !== null && 'text' in src) {
      code = src.text;
      lang = (src.lang || '').trim();
    } else {
      code = String(src);
      lang = (infostring || '').trim();
    }
    let highlighted = code;
    if (lang && hljs.getLanguage(lang)) {
      try { highlighted = hljs.highlight(code, { language: lang }).value; }
      catch (_) { /* fallback */ }
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }
    return `<pre class="hljs"><code class="language-${lang}">${highlighted}</code></pre>`;
  }

  marked.use({
    renderer: {
      heading: renderHeading,
      code: renderCode
    }
  });

  function getChecklist() {
    return StackReadyCookies.getChecklistMap();
  }

  function setChecklistItem(id, checked) {
    StackReadyCookies.setChecklistItem(id, checked);
    updateGuideProgressBadge();
    refreshTocChecks();
    syncRoadmapCheckboxes();
  }

  function preprocessMarkdown(raw, isTxt) {
    if (isTxt) return '```\n' + raw + '\n```';
    return raw.replace(/^(\s*)- \[([ xX])\] (.+)$/gm, (match, indent, check, text) => {
      const id = ProgressMap.checklistId(text);
      const checked = check.toLowerCase() === 'x';
      return `${indent}- <label class="checklist-item" data-check-id="${id}"><input type="checkbox" ${checked ? 'checked' : ''}><span>${text}</span></label>`;
    });
  }

  function resolveAnchor(anchor) {
    if (!anchor) return null;
    if (document.getElementById(anchor)) return anchor;
    const norm = (s) => s.replace(/-+/g, '-').replace(/^-|-$/g, '');
    const match = headingRegistry.find(h => h.id === anchor || norm(h.id) === norm(anchor));
    if (match) return match.id;
    const num = anchor.match(/^(\d+)/);
    if (num) {
      const byNum = headingRegistry.find(h =>
        h.level === 2 && h.plain.trim().match(new RegExp(`^${num[1]}\\.`))
      );
      if (byNum) return byNum.id;
    }
    return null;
  }

  function scrollToSection(id) {
    const resolved = resolveAnchor(id) || id;
    const el = document.getElementById(resolved);
    if (!el) return false;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', `#${resolved}`);
    return true;
  }

  function fixInternalAnchorLinks() {
    document.querySelectorAll('.markdown-body a[href^="#"]').forEach(a => {
      const anchor = decodeURIComponent(a.getAttribute('href').slice(1));
      const resolved = resolveAnchor(anchor);
      if (resolved) a.setAttribute('href', `#${resolved}`);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection(decodeURIComponent(a.getAttribute('href').slice(1)));
      });
    });
  }

  function buildHeadingRegistry() {
    headingRegistry = [];
    document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3').forEach(h => {
      if (!h.id) h.id = githubSlug(h.textContent);
      headingRegistry.push({
        id: h.id,
        plain: h.textContent,
        level: parseInt(h.tagName[1], 10),
        el: h
      });
    });
  }

  function buildToc() {
    const items = headingRegistry.filter(h => h.level === 2 || h.level === 3);
    if (!items.length) {
      tocList.innerHTML = '<li class="toc-item"><span style="color:var(--gray-400);font-size:0.85rem;">No sections</span></li>';
      return;
    }
    tocList.innerHTML = items.map(item => {
      const done = ProgressMap.isSectionComplete(fileName, item.id);
      const check = item.level === 2 && done ? ' <span class="toc-done">✓</span>' : '';
      return `
      <li class="toc-item toc-h${item.level}${done ? ' toc-completed' : ''}">
        <a href="#${item.id}" data-target="${item.id}">${item.plain}${check}</a>
      </li>`;
    }).join('');
    setupTocScrollSpy();
  }

  function setupTocScrollSpy() {
    const links = tocList.querySelectorAll('a');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const active = tocList.querySelector(`a[data-target="${entry.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-90px 0px -70% 0px', threshold: 0 });

    document.querySelectorAll('.markdown-body h2, .markdown-body h3').forEach(h => observer.observe(h));
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection(link.getAttribute('data-target'));
        document.getElementById('readerSidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('open');
      });
    });
  }

  function refreshTocChecks() {
    tocList.querySelectorAll('a[data-target]').forEach(a => {
      const id = a.getAttribute('data-target');
      const li = a.closest('.toc-item');
      if (li.classList.contains('toc-h3')) return;
      const done = ProgressMap.isSectionComplete(fileName, id);
      li.classList.toggle('toc-completed', done);
      const existing = a.querySelector('.toc-done');
      if (done && !existing) a.insertAdjacentHTML('beforeend', ' <span class="toc-done">✓</span>');
      else if (!done && existing) existing.remove();
    });
  }

  /** Sync roadmap page checkboxes when topics marked in guide */
  function syncRoadmapCheckboxes() {
    document.querySelectorAll('.checklist-item').forEach(label => {
      const id = label.dataset.checkId;
      const cb = label.querySelector('input');
      const checked = !!getChecklist()[id];
      cb.checked = checked;
      label.classList.toggle('done', checked);
    });
  }

  function updateGuideProgressBadge() {
    const badge = document.getElementById('guideProgressBadge');
    if (!badge) return;
    const p = ProgressMap.getGuideProgress(fileName);
    if (p.total === 0) {
      badge.textContent = '';
      return;
    }
    badge.textContent = `${p.done}/${p.total} topics done`;
    badge.style.color = p.percent === 100 ? '#059669' : 'var(--blue-600)';
  }

  function injectTopicTrackers() {
    const body = document.querySelector('.markdown-body');
    const h2s = [...body.querySelectorAll('h2')].filter(h => {
      const t = h.textContent.trim().toUpperCase();
      return t !== 'TABLE OF CONTENTS';
    });

    h2s.forEach((h2, index) => {
      const sectionId = h2.id;
      const topics = ProgressMap.getTopicsForSection(fileName, sectionId);
      if (!topics.length) return;

      const nextH2 = h2s[index + 1];
      const tracker = document.createElement('div');
      tracker.className = 'section-complete-bar';
      tracker.dataset.sectionId = sectionId;

      const header = document.createElement('div');
      header.className = 'section-topics-header';
      header.innerHTML = `<strong>Track progress</strong> <span class="section-sync-note">— syncs with Master Roadmap</span>`;

      const list = document.createElement('ul');
      list.className = 'section-topic-list';

      topics.forEach(topicText => {
        const id = ProgressMap.checklistId(topicText);
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'section-topic-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!getChecklist()[id];
        const span = document.createElement('span');
        span.textContent = topicText;
        label.appendChild(cb);
        label.appendChild(span);
        if (cb.checked) label.classList.add('done');
        cb.addEventListener('change', () => {
          setChecklistItem(id, cb.checked);
          label.classList.toggle('done', cb.checked);
          tracker.classList.toggle('section-is-done', ProgressMap.isSectionComplete(fileName, sectionId));
        });
        li.appendChild(label);
        list.appendChild(li);
      });

      const actions = document.createElement('div');
      actions.className = 'section-topic-actions';
      const markAllBtn = document.createElement('button');
      markAllBtn.type = 'button';
      markAllBtn.className = 'btn btn-outline section-mark-all-btn';
      const refreshMarkAll = () => {
        const allDone = ProgressMap.isSectionComplete(fileName, sectionId);
        markAllBtn.textContent = allDone ? 'Uncheck all in section' : 'Mark all in section done';
        tracker.classList.toggle('section-is-done', allDone);
      };
      refreshMarkAll();
      markAllBtn.addEventListener('click', () => {
        const markDone = !ProgressMap.isSectionComplete(fileName, sectionId);
        topics.forEach(topicText => {
          setChecklistItem(ProgressMap.checklistId(topicText), markDone);
        });
        list.querySelectorAll('input').forEach((cb, i) => {
          cb.checked = markDone;
          cb.closest('.section-topic-item').classList.toggle('done', markDone);
        });
        refreshMarkAll();
      });

      actions.appendChild(markAllBtn);
      tracker.appendChild(header);
      tracker.appendChild(list);
      tracker.appendChild(actions);

      if (ProgressMap.isSectionComplete(fileName, sectionId)) {
        tracker.classList.add('section-is-done');
      }

      if (nextH2) nextH2.parentNode.insertBefore(tracker, nextH2);
      else body.appendChild(tracker);
    });
  }

  function setupChecklists() {
    document.querySelectorAll('.checklist-item').forEach(label => {
      const id = label.dataset.checkId;
      const cb = label.querySelector('input');
      const checked = !!getChecklist()[id];
      cb.checked = checked;
      label.classList.toggle('done', checked);
      cb.addEventListener('change', () => {
        setChecklistItem(id, cb.checked);
        label.classList.toggle('done', cb.checked);
      });
    });
  }

  function setupFontSize() {
    const saved = StackReadyCookies.getFontSize();
    const body = document.querySelector('.markdown-body');
    if (body) body.classList.add('font-' + saved);
    document.querySelectorAll('.font-size-btn').forEach(btn => {
      if (btn.dataset.size === saved) btn.classList.add('active');
      btn.addEventListener('click', () => {
        document.querySelectorAll('.font-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (body) {
          body.classList.remove('font-sm', 'font-md', 'font-lg');
          body.classList.add('font-' + btn.dataset.size);
        }
        StackReadyCookies.setFontSize(btn.dataset.size);
      });
    });
  }

  function setupMobileToc() {
    document.getElementById('tocToggle').addEventListener('click', () => {
      document.getElementById('readerSidebar').classList.toggle('open');
      document.getElementById('sidebarOverlay').classList.toggle('open');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
      document.getElementById('readerSidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('open');
    });
  }

  async function loadContent() {
    const isTxt = fileName.endsWith('.txt');
    const url = contentUrl(fileName);

    breadcrumbTitle.textContent = currentTopic?.title || fileName;
    document.title = (currentTopic?.title || fileName) + ' — StackReady';

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let raw = await res.text();
      raw = preprocessMarkdown(raw, isTxt);
      const html = marked.parse(raw);

      contentArea.innerHTML = `<article class="markdown-body font-md">${html}</article>`;
      readerToolbar.style.display = 'flex';
      docTitle.textContent = currentTopic?.title || fileName.replace(/\.(md|txt)$/, '');

      buildHeadingRegistry();
      fixInternalAnchorLinks();
      buildToc();
      injectTopicTrackers();
      setupChecklists();
      setupFontSize();
      updateGuideProgressBadge();
      setupMobileToc();

      if (window.location.hash) {
        setTimeout(() => scrollToSection(decodeURIComponent(window.location.hash.slice(1))), 300);
      }
    } catch (err) {
      contentArea.innerHTML = `
        <div class="error-state">
          <h2>Could not load content</h2>
          <p>Error: ${err.message}</p>
          <a href="index.html" class="btn btn-primary" style="margin-top:1.5rem;">← Back to Dashboard</a>
        </div>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', loadContent);
})();
