// /api/auth — signup, signin, me
const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const prisma = require('../prisma');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const { loyaltySummary } = require('../utils/loyalty');

const router = express.Router();

const SignupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80).optional(),
});

const SigninBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/signup', async (req, res, next) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) return next({ status: 400, message: 'Invalid signup payload' });

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return next({ status: 409, message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name ?? null },
  });

  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.post('/signin', async (req, res, next) => {
  const parsed = SigninBody.safeParse(req.body);
  if (!parsed.success) return next({ status: 400, message: 'Invalid signin payload' });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return next({ status: 401, message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return next({ status: 401, message: 'Invalid credentials' });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.get('/me', requireAuth, async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return next({ status: 404, message: 'User not found' });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    loyalty: loyaltySummary(user),
  });
});

// Standalone loyalty endpoint for the Rewards screen.
router.get('/loyalty', requireAuth, async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return next({ status: 404, message: 'User not found' });
  res.json(loyaltySummary(user));
});

module.exports = router;
