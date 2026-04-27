const { app, prisma } = require('./app');
const { seedAdmin } = require('./seed');

const PORT = process.env.PORT || 3000;

async function start() {
  await prisma.$connect();
  console.log('Database connected');
  await seedAdmin(prisma);
  app.listen(PORT, () => {
    console.log(`Capstone Project API running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});
