// Publishes dist/ to the gh-pages branch of the origin remote, exactly as built.
// (The gh-pages npm package skips folders named node_modules, which is where Expo puts the icon
// fonts, so the icons went missing on the live site.)
//
// Usage: node scripts/deploy-pages.mjs [dist]
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error(`${dist} has no index.html; build first`);

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const remote = git(['remote', 'get-url', 'origin']);
const source = git(['rev-parse', '--short', 'HEAD']);
const name = git(['config', 'user.name']);
const email = git(['config', 'user.email']);

const work = mkdtempSync(join(tmpdir(), 'sous-pages-'));
try {
  cpSync(dist, work, { recursive: true });
  writeFileSync(join(work, '.nojekyll'), ''); // serve _expo/ and other underscore folders as-is
  git(['init', '-q', '-b', 'gh-pages'], work);
  git(['add', '-A'], work);
  git(['-c', `user.name=${name}`, '-c', `user.email=${email}`, 'commit', '-q', '-m', `Deploy ${source}`], work);
  git(['push', '-q', '--force', remote, 'gh-pages'], work);
  const files = git(['ls-files'], work).split('\n').length;
  console.log(`Published ${files} files from ${source} to gh-pages`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
