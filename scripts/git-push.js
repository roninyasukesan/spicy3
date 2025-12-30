const { execSync } = require('child_process');

function run(cmd, opts = {}) {
  const options = { stdio: 'inherit', ...opts };
  try {
    return execSync(cmd, options);
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    throw err;
  }
}

function runCapture(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch (err) {
    return '';
  }
}

function main() {
  console.log('Checking git repository status...');
  const status = runCapture('git status -s');
  console.log(status || 'No changes to commit.');

  const branch = runCapture('git rev-parse --abbrev-ref HEAD') || 'main';
  console.log(`Current branch: ${branch}`);

  // Stage and commit if there are changes
  if (status) {
    console.log('Staging changes...');
    run('git add -A');

    const msg = `chore: sync updates via node script (${new Date().toISOString()})`;
    console.log(`Committing with message: ${msg}`);
    run(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
  } else {
    console.log('No changes detected, skipping commit.');
  }

  // Push to origin
  console.log(`Pushing to origin ${branch}...`);
  try {
    run(`git push origin ${branch}`);
    console.log('Push completed successfully.');
  } catch (err) {
    console.error('Push failed. Ensure your GitHub credentials or PAT are configured for HTTPS remote.');
    console.error('You can set a credential helper or use a PAT in the remote URL if needed.');
    process.exitCode = 1;
  }
}

main();
