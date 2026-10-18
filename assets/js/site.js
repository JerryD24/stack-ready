/** Base path helpers for local dev and GitHub Pages */
function getBasePath() {
  return (window.SITE_CONFIG && window.SITE_CONFIG.basePath) || '';
}

function siteUrl(relativePath) {
  const base = getBasePath().replace(/\/$/, '');
  const path = relativePath.replace(/^\//, '');
  return base ? `${base}/${path}` : `/${path}`;
}

/** Append deploy buildId so browsers never reuse stale JS/CSS/markdown. */
function assetUrl(relativePath) {
  const buildId = (window.SITE_CONFIG && window.SITE_CONFIG.buildId) || '';
  const url = siteUrl(relativePath);
  if (!buildId || url.includes('?v=')) return url;
  return `${url}?v=${buildId}`;
}

function contentUrl(fileName) {
  return assetUrl(`content/${fileName}`);
}

/* ---- PWA: service worker — network-first, no auto-reload loop ---- */
(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = assetUrl('sw.js');
    navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' })
      .then((reg) => { reg.update(); })
      .catch(() => { /* offline support unavailable */ });
  });
})();

/* ---- PWA install prompt ---- */
(function () {
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
