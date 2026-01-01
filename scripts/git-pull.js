const { execSync } = require('child_process');

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    process.exitCode = 1;
  }
}

function runCapture(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch {
    return '';
  }
}

function main() {
  const branch = runCapture('git rev-parse --abbrev-ref HEAD') || 'main';
  console.log(`Fazendo pull de origin/${branch}...`);
  run(`git pull origin ${branch}`);
}

main();
