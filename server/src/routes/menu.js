// /api/menu — list available products
const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { available: true },
    orderBy: { priceCents: 'asc' },
  });
  res.json(products);
});

module.exports = router;
