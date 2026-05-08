// /api/lockers — list lockers (with status so the UI can show which are free)
const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  const lockers = await prisma.locker.findMany({
    orderBy: { number: 'asc' },
  });
  res.json(lockers);
});

module.exports = router;
