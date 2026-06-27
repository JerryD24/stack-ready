/**
 * Markdown Reader — loads guides, TOC navigation, per-section progress
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

  /** GitHub-compatible slug for heading anchors */
  function githubSlug(text) {
    return text
      .toLowerCase()
      .trim()
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

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const plain = tokens.map(t => t.text || '').join('');
        const id = githubSlug(plain) || `section-${hashCode(plain)}`;
        const html = marked.parser.parseInline(tokens);
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      code(code, infostring) {
        const lang = (infostring || '').trim();
        let highlighted = code;
        if (lang && hljs.getLanguage(lang)) {
          try {
            highlighted = hljs.highlight(code, { language: lang }).value;
          } catch (_) { /* fallback */ }
        } else {
          highlighted = hljs.highlightAuto(code).value;
        }
        return `<pre class="hljs"><code class="language-${lang}">${highlighted}</code></pre>`;
      }
    }
  });

  function getProgress() {
    return StackReadyCookies.getProgress();
  }

  function setProgress(file, value) {
    StackReadyCookies.setProgress(file, value);
  }

  function getChecklist() {
    return StackReadyCookies.getChecklistMap();
  }

  function setChecklistItem(id, checked) {
    StackReadyCookies.setChecklistItem(id, checked);
  }

  function isSectionDone(sectionId) {
    const key = StackReadyCookies.sectionKey(fileName, sectionId);
    return !!StackReadyCookies.getSections()[key];
  }

  function setSectionDone(sectionId, done) {
    const key = StackReadyCookies.sectionKey(fileName, sectionId);
    StackReadyCookies.setSectionDone(key, done);
    updateDocProgressFromSections();
  }

  function preprocessMarkdown(raw, isTxt) {
    if (isTxt) return '```\n' + raw + '\n```';
    return raw.replace(/^(\s*)- \[([ xX])\] (.+)$/gm, (match, indent, check, text) => {
      const id = githubSlug(text).slice(0, 80) + '-' + Math.abs(hashCode(text));
      const checked = check.toLowerCase() === 'x';
      return `${indent}- <label class="checklist-item" data-check-id="${id}"><input type="checkbox" ${checked ? 'checked' : ''}><span>${text}</span></label>`;
    });
  }

  /** Resolve markdown TOC href to actual heading id on page */
  function resolveAnchor(anchor) {
    if (!anchor) return null;
    if (document.getElementById(anchor)) return anchor;

    const norm = (s) => s.replace(/-+/g, '-').replace(/^-|-$/g, '');
    const match = headingRegistry.find(h =>
      h.id === anchor ||
      norm(h.id) === norm(anchor)
    );
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
        const target = decodeURIComponent(a.getAttribute('href').slice(1));
        scrollToSection(target);
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
      const done = isSectionDone(item.id);
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

  function injectSectionTrackers() {
    const body = document.querySelector('.markdown-body');
    const h2s = [...body.querySelectorAll('h2')].filter(h => {
      const t = h.textContent.trim().toUpperCase();
      return t !== 'TABLE OF CONTENTS';
    });

    h2s.forEach((h2, index) => {
      const sectionId = h2.id;
      const nextH2 = h2s[index + 1];
      const tracker = document.createElement('div');
      tracker.className = 'section-complete-bar';
      tracker.dataset.sectionId = sectionId;

      const label = document.createElement('span');
      label.className = 'section-complete-label';
      label.textContent = `Finished: ${h2.textContent.trim()}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-outline section-done-btn';
      updateSectionBtn(btn, isSectionDone(sectionId));

      btn.addEventListener('click', () => {
        const nowDone = !isSectionDone(sectionId);
        setSectionDone(sectionId, nowDone);
        updateSectionBtn(btn, nowDone);
        tracker.classList.toggle('section-is-done', nowDone);
        refreshTocChecks();
      });

      if (isSectionDone(sectionId)) tracker.classList.add('section-is-done');

      tracker.appendChild(label);
      tracker.appendChild(btn);

      if (nextH2) {
        nextH2.parentNode.insertBefore(tracker, nextH2);
      } else {
        body.appendChild(tracker);
      }
    });
  }

  function updateSectionBtn(btn, done) {
    btn.textContent = done ? '✓ Section Complete' : 'Mark Section Done';
    btn.style.borderColor = done ? '#10b981' : '';
    btn.style.color = done ? '#059669' : '';
  }

  function refreshTocChecks() {
    tocList.querySelectorAll('a[data-target]').forEach(a => {
      const id = a.getAttribute('data-target');
      const li = a.closest('.toc-item');
      const done = isSectionDone(id);
      li.classList.toggle('toc-completed', done);
      const existing = a.querySelector('.toc-done');
      if (done && !existing) {
        a.insertAdjacentHTML('beforeend', ' <span class="toc-done">✓</span>');
      } else if (!done && existing) {
        existing.remove();
      }
    });
  }

  function updateDocProgressFromSections() {
    const h2s = [...document.querySelectorAll('.markdown-body h2')].filter(h =>
      h.textContent.trim().toUpperCase() !== 'TABLE OF CONTENTS'
    );
    if (!h2s.length) return;
    const doneCount = h2s.filter(h => isSectionDone(h.id)).length;
    const allDone = doneCount === h2s.length;
    setProgress(fileName, allDone);

    const btn = document.getElementById('markCompleteBtn');
    if (btn) {
      btn.textContent = allDone ? '✓ All Sections Complete' : `Mark as Read (${doneCount}/${h2s.length} sections)`;
      btn.style.borderColor = allDone ? '#10b981' : '';
    }
  }

  function setupChecklists() {
    const checklist = getChecklist();
    document.querySelectorAll('.checklist-item').forEach(label => {
      const id = label.dataset.checkId;
      const cb = label.querySelector('input');
      if (checklist[id]) {
        cb.checked = true;
        label.classList.add('done');
      }
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

  function setupMarkComplete() {
    const btn = document.getElementById('markCompleteBtn');
    updateDocProgressFromSections();

    btn.addEventListener('click', () => {
      const h2s = [...document.querySelectorAll('.markdown-body h2')].filter(h =>
        h.textContent.trim().toUpperCase() !== 'TABLE OF CONTENTS'
      );
      const allDone = h2s.length > 0 && h2s.every(h => isSectionDone(h.id));
      const markAll = !allDone;

      h2s.forEach(h => setSectionDone(h.id, markAll));
      document.querySelectorAll('.section-done-btn').forEach(b => updateSectionBtn(b, markAll));
      document.querySelectorAll('.section-complete-bar').forEach(bar => {
        bar.classList.toggle('section-is-done', markAll);
      });
      refreshTocChecks();
      updateDocProgressFromSections();
    });
  }

  function setupMobileToc() {
    const toggle = document.getElementById('tocToggle');
    const sidebar = document.getElementById('readerSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
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
      injectSectionTrackers();
      setupChecklists();
      setupFontSize();
      setupMarkComplete();
      setupMobileToc();

      setProgress(fileName + '_viewed', Date.now());

      if (window.location.hash) {
        setTimeout(() => scrollToSection(decodeURIComponent(window.location.hash.slice(1))), 300);
      }

    } catch (err) {
      contentArea.innerHTML = `
        <div class="error-state">
          <h2>Could not load content</h2>
          <p>Make sure you're running the local server: <code>node server.js</code></p>
          <p style="margin-top:0.5rem;color:var(--gray-400);font-size:0.85rem;">Error: ${err.message}</p>
          <a href="index.html" class="btn btn-primary" style="margin-top:1.5rem;">← Back to Dashboard</a>
        </div>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', loadContent);
})();
