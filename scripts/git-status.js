const { execSync } = require('child_process');

function runCapture(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch {
    return '';
  }
}

function main() {
  const branch = runCapture('git rev-parse --abbrev-ref HEAD') || 'unknown';
  const remote = runCapture('git remote -v');
  const status = runCapture('git status -s');

  console.log(`Branch atual: ${branch}`);
  console.log('Remotes:\n' + (remote || '(nenhum remoto configurado)'));
  console.log('Mudanças não commitadas:\n' + (status || '(sem mudanças)'));
}

main();
