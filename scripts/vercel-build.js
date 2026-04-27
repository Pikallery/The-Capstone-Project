const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(cmd, cwd) {
  console.log(`\n> ${cmd}  (in ./${path.relative(root, cwd) || '.'})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

console.log('Node:', process.version);
console.log('npm:', execSync('npm --version').toString().trim());

console.log('\n=== Building frontend ===');
// --include=dev ensures vite/tailwind are installed even with NODE_ENV=production
run('npm install --include=dev --legacy-peer-deps', path.join(root, 'frontend'));
run('npm run build', path.join(root, 'frontend'));

console.log('\n=== Setting up backend ===');
// --include=dev ensures prisma CLI (devDep) is installed so npx uses local v5, not latest v7
run('npm install --include=dev --legacy-peer-deps', path.join(root, 'backend'));
run('npx prisma generate', path.join(root, 'backend'));

console.log('\n=== Build complete ===');
