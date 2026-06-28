/**
 * StackReady — browser cookie storage for progress & preferences.
 * Persists per-browser; survives refresh; 1-year expiry.
 */
const StackReadyCookies = (function () {
  const PREFIX = 'sr_';
  const MAX_CHUNK = 3500;
  const DAYS = 365;

  function cookiePath() {
    const base = typeof getBasePath === 'function' ? getBasePath() : '';
    return base || '/';
  }

  function setRaw(name, value, days) {
    const maxAge = (days || DAYS) * 24 * 60 * 60;
    const encoded = encodeURIComponent(value);
    document.cookie = `${name}=${encoded};path=${cookiePath()};max-age=${maxAge};SameSite=Lax`;
  }

  function getRaw(name) {
    const prefix = name + '=';
    const parts = document.cookie.split(';');
    for (let part of parts) {
      part = part.trim();
      if (part.startsWith(prefix)) {
        return decodeURIComponent(part.slice(prefix.length));
      }
    }
    return null;
  }

  function deleteRaw(name) {
    document.cookie = `${name}=;path=${cookiePath()};max-age=0`;
  }

  function clearChunks(baseName) {
    let i = 0;
    while (getRaw(`${baseName}_${i}`) !== null) {
      deleteRaw(`${baseName}_${i}`);
      i++;
    }
    deleteRaw(baseName);
  }

  function setJSON(key, data) {
    const name = PREFIX + key;
    const str = JSON.stringify(data);
    clearChunks(name);

    if (str.length <= MAX_CHUNK) {
      setRaw(name, str);
      return;
    }

    let offset = 0;
    let chunk = 0;
    while (offset < str.length) {
      setRaw(`${name}_${chunk}`, str.slice(offset, offset + MAX_CHUNK));
      offset += MAX_CHUNK;
      chunk++;
    }
    setRaw(name, `chunks:${chunk}`);
  }

  function getJSON(key, fallback) {
    const name = PREFIX + key;
    const raw = getRaw(name);
    if (raw === null) return fallback;

    if (raw.startsWith('chunks:')) {
      const count = parseInt(raw.split(':')[1], 10);
      let str = '';
      for (let i = 0; i < count; i++) {
        const part = getRaw(`${name}_${i}`);
        if (part === null) return fallback;
        str += part;
      }
      try { return JSON.parse(str); } catch { return fallback; }
    }

    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function setString(key, value) {
    setRaw(PREFIX + key, value);
  }

  function getString(key, fallback) {
    const v = getRaw(PREFIX + key);
    return v !== null ? v : fallback;
  }

  /** Migrate legacy localStorage data into cookies (one-time) */
  function migrateFromLocalStorage() {
    const legacyMap = {
      interview_prep_progress: 'progress',
      interview_prep_checklist: 'checklist',
      interview_prep_font_size: 'font'
    };

    if (getRaw(PREFIX + 'progress') !== null) return;

    try {
      const oldProgress = localStorage.getItem('interview_prep_progress');
      if (oldProgress) {
        const p = JSON.parse(oldProgress);
        const compact = {};
        Object.keys(p).forEach(k => { if (p[k]) compact[k] = 1; });
        setJSON('progress', compact);
      }

      const oldChecklist = localStorage.getItem('interview_prep_checklist');
      if (oldChecklist) {
        const c = JSON.parse(oldChecklist);
        const done = Object.keys(c).filter(k => c[k]);
        setJSON('checklist', done);
      }

      const oldFont = localStorage.getItem('interview_prep_font_size');
      if (oldFont) setString('font', oldFont);
    } catch (_) { /* ignore */ }
  }

  // --- Public API ---

  function getProgress() {
    migrateFromLocalStorage();
    return getJSON('progress', {});
  }

  function setProgress(file, value) {
    const p = getProgress();
    if (value) p[file] = 1;
    else delete p[file];
    setJSON('progress', p);
  }

  function getChecklistMap() {
    migrateFromLocalStorage();
    const done = getJSON('checklist', []);
    const map = {};
    if (Array.isArray(done)) done.forEach(id => { map[id] = true; });
    return map;
  }

  function setChecklistItem(id, checked) {
    const done = getJSON('checklist', []);
    const set = new Set(Array.isArray(done) ? done : []);
    if (checked) set.add(id);
    else set.delete(id);
    setJSON('checklist', [...set]);
  }

  function getChecklistPercent() {
    const done = getJSON('checklist', []);
    if (!Array.isArray(done) || !done.length) return 0;
    return null; // percent needs total count from caller
  }

  function getFontSize() {
    migrateFromLocalStorage();
    return getString('font', 'md');
  }

  function setFontSize(size) {
    setString('font', size);
  }

  function getSections() {
    migrateFromLocalStorage();
    return getJSON('sections', {});
  }

  function setSectionDone(sectionKey, value) {
    const s = getSections();
    if (value) s[sectionKey] = 1;
    else delete s[sectionKey];
    setJSON('sections', s);
  }

  function sectionKey(fileName, sectionId) {
    return `${fileName}::${sectionId}`;
  }

  function getTheme() {
    return getString('theme', 'light');
  }

  function setTheme(theme) {
    setString('theme', theme);
  }

  function getLastVisited() {
    return getJSON('last', null);
  }

  function setLastVisited(file, title, scrollY) {
    setJSON('last', { file, title, scrollY: Math.round(scrollY || 0), at: Date.now() });
  }

  // --- Bookmarks (starred sections / Q&As) ---
  function getBookmarks() {
    const list = getJSON('bookmarks', []);
    return Array.isArray(list) ? list : [];
  }

  function bookmarkKey(file, id) {
    return `${file}::${id}`;
  }

  function isBookmarked(file, id) {
    const key = bookmarkKey(file, id);
    return getBookmarks().some(b => bookmarkKey(b.file, b.id) === key);
  }

  function toggleBookmark(item) {
    const key = bookmarkKey(item.file, item.id);
    const list = getBookmarks().filter(b => bookmarkKey(b.file, b.id) !== key);
    const wasThere = list.length !== getBookmarks().length;
    if (!wasThere) list.push({ ...item, at: Date.now() });
    setJSON('bookmarks', list);
    return !wasThere;
  }

  function removeBookmark(file, id) {
    const key = bookmarkKey(file, id);
    setJSON('bookmarks', getBookmarks().filter(b => bookmarkKey(b.file, b.id) !== key));
  }

  // --- Per-guide difficulty (easy / medium / hard) ---
  function getDifficultyMap() {
    return getJSON('difficulty', {});
  }

  function getDifficulty(file) {
    return getDifficultyMap()[file] || '';
  }

  function setDifficulty(file, level) {
    const m = getDifficultyMap();
    if (level) m[file] = level;
    else delete m[file];
    setJSON('difficulty', m);
  }

  migrateFromLocalStorage();

  return {
    getProgress,
    setProgress,
    getChecklistMap,
    setChecklistItem,
    getFontSize,
    setFontSize,
    getSections,
    setSectionDone,
    sectionKey,
    getTheme,
    setTheme,
    getLastVisited,
    setLastVisited,
    getBookmarks,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    getDifficulty,
    getDifficultyMap,
    setDifficulty
  };
})();
