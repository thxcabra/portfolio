// Real numbers for the landing page: each project repo's languages (bytes) and dates, from the GitHub
// API (public repos need no token; GITHUB_TOKEN raises the rate limit). Run by hand to refresh:
// node tools/github_stats.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { DATA } from '../data.js';
import { repoOf } from '../logic.js';

const headers = { accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN && { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) };
const api = async (path) => {
  const r = await fetch(`https://api.github.com/${path}`, { headers });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
};
const out = {};
for (const p of DATA.projects) {
  const repo = repoOf(p.links.repo);
  if (!repo) continue;
  const info = await api(`repos/${repo}`);
  out[repo] = {
    languages: await api(`repos/${repo}/languages`),
    created: info.created_at.slice(0, 10),
    pushed: info.pushed_at.slice(0, 10),
  };
}
const dir = new URL('../assets/site/', import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('github.json', dir), JSON.stringify(out, null, 1) + '\n');
console.log(`${Object.keys(out).length} repos`);
