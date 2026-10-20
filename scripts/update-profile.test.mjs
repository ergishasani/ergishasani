import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLiveData, replaceLiveData } from './update-profile.mjs';
import { renderDashboard } from './profile-visuals.mjs';

test('graphical dashboard counts original public stars and escapes repository text', () => {
  const repo = { owner: { login: 'ergishasani' }, name: '<script>&', stargazers_count: 7, pushed_at: '2026-10-20T00:00:00Z' };
  const output = renderDashboard({ public_repos: 4, followers: 2 }, [
    repo, { ...repo, name: 'fork', fork: true, stargazers_count: 100 },
    { ...repo, name: 'private', private: true, stargazers_count: 1000 },
  ], new Date('2026-10-20T00:00:00Z'));
  assert.ok(output.includes('>7</text>'));
  assert.ok(output.includes('&lt;script&gt;&amp;'));
  assert.ok(!output.includes('<script>'));
  assert.ok(!output.includes('>100</text>'));
  assert.ok(!output.includes('>1000</text>'));
});

test('only public owned original projects appear, ordered by push date', () => {
  const repo = { owner: { login: 'ergishasani' }, name: 'older', pushed_at: '2026-01-01T00:00:00Z' };
  const output = renderLiveData({ public_repos: 57, followers: 29, following: 1 }, [
    repo,
    { ...repo, name: 'private-project', private: true },
    { ...repo, name: 'forked-project', fork: true },
    { ...repo, name: 'archived-project', archived: true },
    { ...repo, name: 'other-owner', owner: { login: 'someone-else' } },
    { ...repo, name: 'ergishasani' },
    { ...repo, name: 'newer', pushed_at: '2026-10-20T00:00:00Z', description: '<b>data</b> | [link]' },
  ], new Date('2026-10-20T00:00:00Z'));
  assert.ok(output.indexOf('[newer]') < output.indexOf('[older]'));
  for (const excluded of ['private-project', 'forked-project', 'archived-project', 'other-owner', '[ergishasani]']) assert.ok(!output.includes(excluded));
  assert.ok(output.includes('&lt;b&gt;data&lt;/b&gt; \\| \\[link\\]'));
  assert.ok(output.includes('57 public repositories'));
});

test('refresh preserves authored sections and rejects missing or duplicate markers', () => {
  const before = 'Intro\n<!-- LIVE-DATA:START -->\nold\n<!-- LIVE-DATA:END -->\nFooter';
  assert.equal(replaceLiveData(before, 'fresh'), 'Intro\n<!-- LIVE-DATA:START -->\n\nfresh\n\n<!-- LIVE-DATA:END -->\nFooter');
  assert.throws(() => replaceLiveData('no markers', 'fresh'));
  assert.throws(() => replaceLiveData(before + '<!-- LIVE-DATA:START -->', 'fresh'));
});
