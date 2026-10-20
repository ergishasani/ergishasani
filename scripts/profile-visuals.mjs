const ink = '#f0f6fc', muted = '#9bafc4', teal = '#2dd4bf', blue = '#38bdf8';
const xml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const text = (x, y, value, size = 16, color = muted, weight = 400) => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${xml(value)}</text>`;
const panel = (x, y, width, height) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="16" fill="#101d2b" stroke="#23374b"/>`;
function svg(title, width, height, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${xml(title)}</title><rect width="${width}" height="${height}" rx="20" fill="#0d1117"/><g font-family="Segoe UI, Arial, sans-serif">${content}</g></svg>\n`;
}

export function renderDashboard(profile, repositories, now = new Date()) {
  const owned = repositories.filter(repo => repo.owner?.login === 'ergishasani' && !repo.private && !repo.fork);
  const recent = owned.filter(repo => !repo.archived && repo.name !== 'ergishasani')
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)).slice(0, 3);
  const stars = owned.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
  const stats = [
    ['PUBLIC REPOSITORIES', profile.public_repos], ['FOLLOWERS', profile.followers],
    ['STARS ON ORIGINAL REPOS', stars], ['ORIGINAL PUBLIC REPOS', owned.length],
  ];
  return svg('Public GitHub dashboard: repository counts, followers, stars, and recent repository pushes', 1200, 400,
    text(36, 43, 'GITHUB / LIVE SNAPSHOT', 17, teal, 600) +
    text(1164, 43, `UPDATED ${now.toISOString().slice(0, 10)} UTC`, 13, muted).replace('<text ', '<text text-anchor="end" ') +
    stats.map(([label, value], index) => {
      const x = 36 + index * 286;
      return panel(x, 68, 270, 116) + text(x + 20, 101, label, 12, muted, 600) + text(x + 20, 155, value, 42, index % 2 ? blue : teal, 700);
    }).join('') +
    text(36, 225, 'RECENT REPOSITORY PUSHES', 13, muted, 600) +
    recent.map((repo, index) => {
      const y = 263 + index * 43;
      return `<circle cx="43" cy="${y - 5}" r="4" fill="${index ? blue : teal}"/>` +
        text(60, y, repo.name.slice(0, 36), 18, ink, 600) + text(660, y, repo.language || '—', 15, muted) +
        text(1138, y, repo.pushed_at.slice(0, 10), 15, muted).replace('<text ', '<text text-anchor="end" ');
    }).join('') + text(36, 382, 'PUBLIC DATA ONLY  /  STARS EXCLUDE FORKS  /  PUSHES ARE REPOSITORY ACTIVITY', 11, muted));
}

export const featured = [
  { name: 'freshclone', file: 'freshclone.svg', title: 'FreshClone', tag: 'DEVELOPER TOOLING', color: teal,
    lines: ['Test README setup instructions', 'in disposable Docker environments.'], stack: 'TypeScript / Node.js / Docker', cta: 'EXPLORE SOURCE →' },
  { name: 'MyVision', file: 'myvision.svg', title: 'MyVision', tag: 'SAAS / BUSINESS SOFTWARE', color: blue,
    lines: ['Invoicing and project billing for', 'construction and service businesses.'], stack: 'Next.js / Spring Boot / PostgreSQL', cta: 'EXPLORE SOURCE →' },
  { name: 'gymos-desktop-releases', file: 'gymos.svg', title: 'GymOS Desktop', tag: 'DESKTOP / RELEASES', color: '#a78bfa',
    lines: ['Desktop application installers', 'and public update manifests.'], stack: 'Installers / Update distribution', cta: 'BROWSE RELEASES →' },
];

export function renderProjectCard(project, repository) {
  return svg(`${project.title}: ${project.lines.join(' ')}`, 580, 270,
    `<rect x="1" y="1" width="578" height="268" rx="19" fill="none" stroke="#23374b"/>` +
    `<rect x="28" y="29" width="32" height="4" rx="2" fill="${project.color}"/>` +
    text(28, 63, project.tag, 12, project.color, 600) + text(26, 108, project.title, 34, ink, 700) +
    project.lines.map((line, index) => text(28, 145 + index * 23, line, 18)).join('') +
    text(28, 205, project.stack, 14, muted) + text(28, 245, project.cta, 13, project.color, 600) +
    text(551, 245, `PUSHED ${repository.pushed_at.slice(0, 10)}`, 11, muted).replace('<text ', '<text text-anchor="end" '));
}
