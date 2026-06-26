/**
 * Markdown Reader — loads .md/.txt from parent Interview_Prep folder
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

  // Configure marked
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false
  });

  marked.use({
    renderer: {
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

  function slugify(text) {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function preprocessMarkdown(raw, isTxt) {
    if (isTxt) {
      // Wrap plain text study plan in preformatted block sections
      return '```\n' + raw + '\n```';
    }

    // Convert markdown checkboxes to interactive HTML placeholders
    return raw.replace(/^(\s*)- \[([ xX])\] (.+)$/gm, (match, indent, check, text) => {
      const id = slugify(text).slice(0, 80) + '-' + Math.abs(hashCode(text));
      const checked = check.toLowerCase() === 'x';
      return `${indent}- <label class="checklist-item" data-check-id="${id}"><input type="checkbox" ${checked ? 'checked' : ''}><span>${text}</span></label>`;
    });
  }

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
    return h;
  }

  function buildToc(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const headings = temp.querySelectorAll('h2, h3');
    const items = [];

    headings.forEach((h, i) => {
      if (!h.id) h.id = slugify(h.textContent) + '-' + i;
      const level = h.tagName.toLowerCase();
      items.push({ id: h.id, text: h.textContent, level });
    });

    // Update actual content with ids
    const contentEl = document.querySelector('.markdown-body');
    if (contentEl) {
      const realHeadings = contentEl.querySelectorAll('h2, h3');
      realHeadings.forEach((h, i) => {
        if (items[i]) h.id = items[i].id;
      });
    }

    if (!items.length) {
      tocList.innerHTML = '<li class="toc-item"><span style="color:var(--gray-400);font-size:0.85rem;">No sections</span></li>';
      return;
    }

    tocList.innerHTML = items.map(item => `
      <li class="toc-item toc-${item.level}">
        <a href="#${item.id}" data-target="${item.id}">${item.text}</a>
      </li>
    `).join('');

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
    }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });

    document.querySelectorAll('.markdown-body h2, .markdown-body h3').forEach(h => observer.observe(h));

    links.forEach(link => {
      link.addEventListener('click', () => {
        document.getElementById('readerSidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('open');
      });
    });
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
    const progress = getProgress();
    const isRead = !!progress[fileName];

    btn.textContent = isRead ? '✓ Marked as Read' : 'Mark as Read';
    if (isRead) btn.style.borderColor = '#10b981';

    btn.addEventListener('click', () => {
      const nowRead = !getProgress()[fileName];
      setProgress(fileName, nowRead);
      btn.textContent = nowRead ? '✓ Marked as Read' : 'Mark as Read';
      btn.style.borderColor = nowRead ? '#10b981' : '';
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

      buildToc(html);
      setupChecklists();
      setupFontSize();
      setupMarkComplete();
      setupMobileToc();

      // Mark as recently viewed
      setProgress(fileName + '_viewed', Date.now());

    } catch (err) {
      contentArea.innerHTML = `
        <div class="error-state">
          <h2>Could not load content</h2>
          <p>Make sure you're running the local server: <code>python server.py</code></p>
          <p style="margin-top:0.5rem;color:var(--gray-400);font-size:0.85rem;">Error: ${err.message}</p>
          <a href="index.html" class="btn btn-primary" style="margin-top:1.5rem;">← Back to Dashboard</a>
        </div>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', loadContent);
})();
