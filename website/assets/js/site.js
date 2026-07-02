/** Base path helpers for local dev and GitHub Pages */
function getBasePath() {
  return (window.SITE_CONFIG && window.SITE_CONFIG.basePath) || '';
}

function siteUrl(relativePath) {
  const base = getBasePath().replace(/\/$/, '');
  const path = relativePath.replace(/^\//, '');
  return base ? `${base}/${path}` : `/${path}`;
}

function contentUrl(fileName) {
  const base = siteUrl(`content/${fileName}`);
  const buildId = (window.SITE_CONFIG && window.SITE_CONFIG.buildId) || '';
  return buildId ? `${base}?v=${buildId}` : base;
}

/* ---- PWA: service worker registration + install prompt ---- */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
    });
  }

  let deferredPrompt = null;

  function showInstallButton() {
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'inline-flex';
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#installBtn');
    if (!btn || !deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => { deferredPrompt = null; btn.style.display = 'none'; });
  });
})();
