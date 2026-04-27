const bcrypt = require('bcryptjs');

async function seedAdmin(prisma) {
  const email = process.env.ADMIN_EMAIL || 'admin@villageapi.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      businessName: 'Platform Admin',
      passwordHash,
      planType: 'UNLIMITED',
      status: 'ACTIVE',
      isAdmin: true,
    },
  });
  console.log(`Admin user created: ${email}`);
}

module.exports = { seedAdmin };
