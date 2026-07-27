const PROJECTS = require('../data/projects.json');

const SITE_URL = 'https://adewoye.works';
const FALLBACK_IMAGE = `${SITE_URL}/og-image.jpg`;

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function stripHtml(str) {
  return String(str).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(str, len) {
  if (str.length <= len) return str;
  return str.slice(0, len - 1).trimEnd() + '…';
}

module.exports = (req, res) => {
  // slug comes in as a query param via the vercel.json rewrite (?slug=...)
  const slug = (req.query && req.query.slug) || '';
  const project = PROJECTS.find((p) => slugify(p.title) === slug);

  if (!project) {
    res.writeHead(302, { Location: '/' });
    return res.end();
  }

  const title = `${project.title} — Daniel Adewoye`;
  const description = truncate(stripHtml(project.overview || ''), 200);
  const image = project.youtube
    ? `https://i.ytimg.com/vi/${project.youtube}/maxresdefault.jpg`
    : FALLBACK_IMAGE;
  const pageUrl = `${SITE_URL}/project/${slug}`;
  const redirectTarget = `/#project/${slug}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">

<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="720">
<meta property="og:type" content="website">
<meta property="og:url" content="${pageUrl}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${image}">

<meta http-equiv="refresh" content="0; url=${redirectTarget}">
<script>location.replace(${JSON.stringify(redirectTarget)});</script>
</head>
<body>
<p>Redirecting to <a href="${redirectTarget}">${escapeHtml(title)}</a>…</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache at the edge so repeat crawler hits (WhatsApp/Twitter re-scrape) are cheap,
  // but keep it short enough that editing a project's overview shows up quickly.
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  res.status(200).send(html);
};
