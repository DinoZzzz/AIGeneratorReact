// Runs against a disposable socket-only PostgreSQL cluster, never a configured DB.
// Requires initdb, pg_ctl and psql on PATH. Run from ai-generator-web:
// node scripts/test-profile-security.mjs
import { chmodSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const clusterDir = mkdtempSync(join(tmpdir(), 'aigenerator-profile-security-'));
const dataDir = join(clusterDir, 'data');
// macOS's default TMPDIR is too long for a Unix socket pathname.
const socketDir = mkdtempSync(join(process.platform === 'darwin' ? '/tmp' : tmpdir(), 'aig-profile-socket-'));
const runAdvisors = process.argv.includes('--advisors');
const port = runAdvisors ? await new Promise((resolvePort, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const availablePort = probe.address().port;
    probe.close(() => resolvePort(availablePort));
  });
}) : 55447;
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed: ${result.error?.message ?? result.stderr ?? result.stdout}`);
  }
  return result.stdout + result.stderr;
};

let started = false;
try {
  run('initdb', ['-D', dataDir, '-A', 'trust', '-U', 'postgres', '--no-locale']);
  if (runAdvisors) {
    // The CLI requires TLS even for --db-url pointing at a local fixture.
    run('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-keyout', join(dataDir, 'server.key'), '-out', join(dataDir, 'server.crt'),
      '-days', '1', '-subj', '/CN=localhost']);
    chmodSync(join(dataDir, 'server.key'), 0o600);
  }
  try {
    run('pg_ctl', ['-D', dataDir, '-l', join(clusterDir, 'postgres.log'),
      '-o', `-F -h '${runAdvisors ? '127.0.0.1' : ''}' -k '${socketDir}' -p ${port}${runAdvisors ? ' -c ssl=on' : ''}`, '-w', 'start']);
  } catch (error) {
    throw new Error(`${error.message}\n${readFileSync(join(clusterDir, 'postgres.log'), 'utf8')}`);
  }
  started = true;
  const psqlArgs = ['-X', '-h', socketDir, '-p', String(port), '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'];
  run('psql', [...psqlArgs, '-f', join(appDir, 'tests/database/profilesFixture.sql')]);
  run('psql', [...psqlArgs, '-f', join(appDir, 'supabase/migrations/20261012221354_restrict_profile_writes.sql')]);
  process.stdout.write(run('psql', [...psqlArgs, '-f', join(appDir, 'tests/database/profilesWriteSecurity.sql')]));
  if (runAdvisors) {
    const dbUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;
    process.stdout.write(run(process.env.SUPABASE_TEST_CLI || 'supabase', [
      'db', 'advisors', '--db-url', dbUrl, '--type', 'security', '--level', 'warn',
    ]));
  }
} finally {
  if (started) run('pg_ctl', ['-D', dataDir, '-m', 'fast', '-w', 'stop']);
  rmSync(clusterDir, { recursive: true, force: true });
  rmSync(socketDir, { recursive: true, force: true });
}
