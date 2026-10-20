import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { renderDashboard, renderProjectCard, featured } from './profile-visuals.mjs';

const username = 'ergishasani';
const start = '<!-- LIVE-DATA:START -->';
const end = '<!-- LIVE-DATA:END -->';

function escapeMarkdown(value) {
  return String(value).replace(/[\r\n]+/g, ' ').replace(/&/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/([\\`*_[\]{}()|])/g, '\\$1');
}

export function renderLiveData(profile, repositories, now = new Date()) {
  const recent = repositories
    .filter(repo => repo.owner?.login === username && !repo.private && !repo.fork && !repo.archived && repo.name !== username)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 5);
  const rows = recent.map(repo => {
    const url = `https://github.com/${username}/${encodeURIComponent(repo.name)}`;
    return `| [${escapeMarkdown(repo.name)}](${url}) | ${escapeMarkdown(repo.description || 'No repository description provided.')} | ${escapeMarkdown(repo.language || '—')} | ${repo.pushed_at.slice(0, 10)} |`;
  });
  return [
    '<p align="center"><a href="https://github.com/ergishasani"><img src="./assets/github-dashboard.svg" alt="Public GitHub dashboard: repositories, followers, stars, and recent repository pushes" width="100%" /></a></p>',
    '',
    '<details>',
    '<summary>View source data and recent repositories</summary>',
    '',
    `Public GitHub snapshot · **${now.toISOString().slice(0, 10)} (UTC)**`,
    '',
    `**${profile.public_repos} public repositories** · **${profile.followers} followers** · **${profile.following} following**`,
    '',
    '### Recently pushed public projects',
    '',
    '| Repository | GitHub description | Main language | Last push (UTC) |',
    '| :--- | :--- | :--- | :--- |',
    ...rows,
    '',
    'Source: [GitHub profile API](https://api.github.com/users/ergishasani) and [public repository API](https://api.github.com/users/ergishasani/repos?sort=pushed&per_page=100). Forks, archived repositories, and this profile repository are excluded from the table. Push dates describe repository activity, not individual contribution counts.',
    '',
    '</details>',
  ].join('\n');
}

export function replaceLiveData(readme, generated) {
  const first = readme.indexOf(start);
  const last = readme.indexOf(end);
  if (first < 0 || last < first || readme.indexOf(start, first + start.length) !== -1 || readme.indexOf(end, last + end.length) !== -1) {
    throw new Error('README must contain exactly one ordered pair of LIVE-DATA markers.');
  }
  return readme.slice(0, first + start.length) + '\n\n' + generated + '\n\n' + readme.slice(last);
}

async function github(path) {
  // Intentionally unauthenticated: this public profile must never include private repositories.
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ergishasani-profile-refresh' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`GitHub ${path}: ${response.status}`);
  return response.json();
}

async function main() {
  const profile = await github(`/users/${username}`);
  const repositories = [];
  for (let page = 1; ; page++) {
    const batch = await github(`/users/${username}/repos?sort=pushed&per_page=100&page=${page}`);
    repositories.push(...batch);
    if (batch.length < 100) break;
  }
  if (profile.login !== username || !Array.isArray(repositories)) throw new Error('Unexpected GitHub response.');
  const readmePath = new URL('../README.md', import.meta.url);
  const readme = await readFile(readmePath, 'utf8');
  const now = new Date();
  const updated = replaceLiveData(readme, renderLiveData(profile, repositories, now));
  const images = [['github-dashboard.svg', renderDashboard(profile, repositories, now)]];
  for (const project of featured) {
    const repository = repositories.find(repo => repo.name === project.name && !repo.private);
    if (!repository) throw new Error(`Featured public repository not found: ${project.name}`);
    images.push([project.file, renderProjectCard(project, repository)]);
  }
  for (const [name, content] of images) await writeFile(new URL(`../assets/${name}`, import.meta.url), content, 'utf8');
  await writeFile(readmePath, updated, 'utf8');
  console.log('Updated README from public GitHub data.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
