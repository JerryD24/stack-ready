/**
 * Dark/light theme toggle — shared across dashboard & reader.
 * The initial theme is applied by an inline script in <head> (no flash).
 */
(function () {
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d1b2e' : '#2563eb');
  }

  function toggle() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { StackReadyCookies.setTheme(next); } catch (_) { /* ignore */ }
  }

  function init() {
    let saved = 'light';
    try { saved = StackReadyCookies.getTheme(); } catch (_) { /* ignore */ }
    applyTheme(saved);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.StackReadyTheme = { toggle, applyTheme };
})();
