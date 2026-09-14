/*
 * Publishes dist/ to the gh-pages branch.
 *
 * This replaces `gh-pages -d dist`, which kept reintroducing files that were
 * never part of the build. That tool keeps a persistent clone under
 * node_modules/.cache/gh-pages; on the very first deploy the branch did not
 * exist yet, so it created one from a clone with `main` checked out, and its
 * remove step skips dotfiles by default. `.claude/launch.json` and
 * `.gitignore` were baked into that first commit and every later deploy
 * reused the same tree. Neither `--remove "**\/*"` (globs skip dotfiles) nor
 * `--dotfiles --no-history` fixed it — the latter uses `git checkout
 * --orphan`, which keeps the existing working-tree files staged and simply
 * recommits them.
 *
 * So the tree is built directly instead: stage dist/ into a throwaway index,
 * write that tree, and commit it with no parent. Nothing from the working
 * tree, the real index, or any cached clone can leak in, because none of them
 * are consulted. What the tree contains is exactly what dist/ contains.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(REPO, 'dist');
const REMOTE = process.env.DEPLOY_REMOTE || 'origin';
const BRANCH = process.env.DEPLOY_BRANCH || 'gh-pages';

/** Run git in the repo, returning trimmed stdout. `env` adds to the child's. */
function git(args, env = {}) {
  return execFileSync('git', args, {
    cwd: REPO,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('deploy: dist/index.html is missing — run the build first.');
  process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), 'gk-deploy-'));
const indexFile = join(scratch, 'index');

try {
  // A throwaway index, so the repo's real staging area is never touched.
  // --force because dist/ is gitignored, which would otherwise skip every file.
  git(['--work-tree', DIST, 'add', '-A', '--force'], { GIT_INDEX_FILE: indexFile });
  const tree = git(['write-tree'], { GIT_INDEX_FILE: indexFile });

  const files = git(['ls-tree', '-r', '--name-only', tree]).split('\n').filter(Boolean);
  if (files.length === 0) {
    console.error('deploy: refusing to publish an empty tree.');
    process.exit(1);
  }

  // The guard this script exists for. A dotfile here means something outside
  // dist/ has crept in, so stop rather than publish it.
  const dotfiles = files.filter((f) => f.startsWith('.') || f.includes('/.'));
  if (dotfiles.length > 0) {
    console.error('deploy: refusing to publish, dotfiles present in tree:');
    for (const f of dotfiles) console.error('  ' + f);
    process.exit(1);
  }

  const sha = git(['rev-parse', '--short', 'HEAD']);
  const dirty = git(['status', '--porcelain']) !== '';
  const subject = `Publish dist from ${sha}${dirty ? ' (working tree dirty)' : ''}`;

  // No -p, so the commit has no parent: each deploy is a standalone snapshot
  // and nothing from a previous publish can survive into this one.
  const commit = git([
    'commit-tree',
    tree,
    '-m',
    `${subject}\n\nBuild output only. See scripts/deploy.mjs.`,
  ]);

  // Force, because a parentless commit is never a fast-forward. Safe here:
  // the branch holds generated output exclusively, and its history is not a
  // record of anything that cannot be rebuilt.
  git(['push', '--force', REMOTE, `${commit}:refs/heads/${BRANCH}`]);

  console.log(`Published ${files.length} files to ${REMOTE}/${BRANCH} (${commit.slice(0, 7)})`);
  for (const f of files) console.log('  ' + f);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
