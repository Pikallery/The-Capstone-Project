const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(cmd, cwd) {
  console.log(`\n> ${cmd}  (in ${path.relative(root, cwd) || '.'})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

console.log('=== Building frontend ===');
run('npm install', path.join(root, 'frontend'));
run('npm run build', path.join(root, 'frontend'));

console.log('\n=== Setting up backend ===');
run('npm install', path.join(root, 'backend'));
run('npx prisma generate', path.join(root, 'backend'));

console.log('\n=== Build complete ===');
