const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { requireJwt } = require('../../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Email and password required' } });
  }

  const prisma = req.app.get('prisma');
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
  }

  if (user.status === 'PENDING_APPROVAL') {
    return res.status(403).json({ success: false, error: { code: 'PENDING_APPROVAL', message: 'Account awaiting admin approval' } });
  }

  if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
    return res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'Account suspended or rejected' } });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.isAdmin, planType: user.planType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        planType: user.planType,
        isAdmin: user.isAdmin,
        status: user.status,
      },
    },
  });
});

router.post('/register', async (req, res) => {
  const { email, password, businessName, phone, gstNumber } = req.body;

  if (!email || !password || !businessName) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Email, password, and business name required' } });
  }

  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com'];
  const domain = email.split('@')[1] || '';
  if (freeProviders.includes(domain.toLowerCase())) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Please use a business email address' } });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Password must be at least 8 characters' } });
  }

  const prisma = req.app.get('prisma');
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Email already registered' } });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      businessName,
      phone: phone || null,
      gstNumber: gstNumber || null,
      planType: 'FREE',
      status: 'PENDING_APPROVAL',
    },
  });

  res.status(201).json({
    success: true,
    data: {
      message: 'Registration successful. Your account is pending admin approval.',
      userId: user.id,
    },
  });
});

router.get('/me', requireJwt(), async (req, res) => {
  const prisma = req.app.get('prisma');
  const user = await prisma.user.findUnique({
    where: { id: req.jwtUser.userId },
    select: {
      id: true,
      email: true,
      businessName: true,
      planType: true,
      status: true,
      isAdmin: true,
      phone: true,
      gstNumber: true,
      createdAt: true,
    },
  });
  res.json({ success: true, data: user });
});

module.exports = router;
