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
  return siteUrl(`content/${fileName}`);
}
