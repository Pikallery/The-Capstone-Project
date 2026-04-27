// Vercel serverless entry point — delegates to the Express app
const { app, prisma } = require('../backend/src/app');
const { seedAdmin } = require('../backend/src/seed');

// Seed admin once per cold start (idempotent upsert)
let seeded = false;
const ready = (async () => {
  if (!seeded) {
    await prisma.$connect();
    await seedAdmin(prisma);
    seeded = true;
  }
})().catch(console.error);

module.exports = async (req, res) => {
  await ready;
  return app(req, res);
};
