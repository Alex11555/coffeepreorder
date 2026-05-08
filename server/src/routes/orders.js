// /api/orders — create, list, fetch, update status, plus SSE feeds.
//
// Creating an order is the moneymaker:
//  1. validate items + locker
//  2. (mock) capture payment
//  3. transactionally:
//       reserve the locker, create the order + items, mint a QR
//  4. return the raw QR token to the phone (only time it's exposed)
//  5. broadcast on the staff SSE channel so the dashboard lights up

const express = require('express');
const { z } = require('zod');

const prisma = require('../prisma');
const {
  requireAuth,
  requireAuthOrQuery,
  requireStaff,
} = require('../middleware/auth');
const { generateRawToken, hashToken } = require('../utils/qr');
const { publishOrderEvent, subscribe } = require('../utils/eventBus');
const { openSseStream } = require('../utils/sse');

const router = express.Router();

const CreateOrderBody = z.object({
  lockerId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    notes: z.string().max(200).optional(),
  })).min(1).max(20),
  // mock payment block — pretend the phone tokenized a card
  payment: z.object({
    method: z.enum(['mock_card', 'mock_apple_pay', 'mock_credits']),
  }),
});

router.post('/', requireAuth, async (req, res, next) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) return next({ status: 400, message: 'Invalid order payload' });
  const { lockerId, items } = parsed.data;

  const [locker, products] = await Promise.all([
    prisma.locker.findUnique({ where: { id: lockerId } }),
    prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } }),
  ]);
  if (!locker) return next({ status: 404, message: 'Locker not found' });
  if (locker.status !== 'AVAILABLE') {
    return next({ status: 409, message: 'Locker not available' });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const i of items) {
    const p = productMap.get(i.productId);
    if (!p || !p.available) return next({ status: 400, message: `Product unavailable: ${i.productId}` });
  }

  const totalCents = items.reduce(
    (sum, i) => sum + productMap.get(i.productId).priceCents * i.quantity,
    0
  );

  // Mock payment "capture". Swap for Stripe and only proceed on success.
  const paymentOk = true;
  if (!paymentOk) return next({ status: 402, message: 'Payment declined' });

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  const order = await prisma.$transaction(async (tx) => {
    const fresh = await tx.locker.findUnique({ where: { id: lockerId } });
    if (!fresh || fresh.status !== 'AVAILABLE') {
      throw Object.assign(new Error('Locker not available'), { status: 409 });
    }
    await tx.locker.update({ where: { id: lockerId }, data: { status: 'RESERVED' } });

    return tx.order.create({
      data: {
        userId: req.user.id,
        lockerId,
        status: 'PAID',
        totalCents,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            priceCents: productMap.get(i.productId).priceCents,
            notes: i.notes ?? null,
          })),
        },
        qrCode: { create: { tokenHash } },
      },
      include: {
        items: { include: { product: true } },
        locker: true,
        qrCode: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  });

  const serialized = serializeOrder(order, { includeUser: true });
  publishOrderEvent('order.created', serialized);

  res.status(201).json({
    order: serializeOrder(order),
    qrToken: rawToken,
  });
});

router.get('/', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } }, locker: true },
  });
  res.json(orders.map((o) => serializeOrder(o)));
});

// Staff-only firehose of orders that still need attention.
router.get('/active', requireAuth, requireStaff, async (_req, res) => {
  const orders = await prisma.order.findMany({
    where: { status: { in: ['PAID', 'PREPARING', 'READY'] } },
    orderBy: { createdAt: 'asc' },
    include: {
      items: { include: { product: true } },
      locker: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  res.json(orders.map((o) => serializeOrder(o, { includeUser: true })));
});

// Staff SSE — every order create / status change.
router.get(
  '/stream',
  requireAuthOrQuery,
  requireStaff,
  (req, res) => {
    const send = openSseStream(req, res);
    send({ type: 'hello' });
    const off = subscribe('staff', (evt) => send(evt));
    req.on('close', off);
  }
);

router.get('/:id', requireAuth, async (req, res, next) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } }, locker: true },
  });
  if (!order) return next({ status: 404, message: 'Order not found' });
  if (order.userId !== req.user.id && req.user.role !== 'STAFF') {
    return next({ status: 403, message: 'Not yours' });
  }
  res.json(serializeOrder(order));
});

// Customer SSE — live status for one of their orders.
router.get(
  '/:id/stream',
  requireAuthOrQuery,
  async (req, res, next) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return next({ status: 404, message: 'Order not found' });
    if (order.userId !== req.user.id && req.user.role !== 'STAFF') {
      return next({ status: 403, message: 'Not yours' });
    }

    const send = openSseStream(req, res);
    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { product: true } }, locker: true },
    });
    send({ type: 'order.snapshot', order: serializeOrder(full) });

    const off = subscribe(`order:${order.id}`, (evt) => send(evt));
    req.on('close', off);
  }
);

// Barista bumps status: PAID -> PREPARING -> READY
const StatusBody = z.object({ status: z.enum(['PREPARING', 'READY', 'CANCELLED']) });
router.patch('/:id/status', requireAuth, requireStaff, async (req, res, next) => {
  const parsed = StatusBody.safeParse(req.body);
  if (!parsed.success) return next({ status: 400, message: 'Invalid status' });

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return next({ status: 404, message: 'Order not found' });

  const next$ = parsed.data.status;
  const allowed = {
    PAID: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['CANCELLED'],
  };
  if (!allowed[order.status]?.includes(next$)) {
    return next({ status: 409, message: `Cannot move ${order.status} → ${next$}` });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.order.update({
      where: { id: order.id },
      data: { status: next$ },
      include: {
        items: { include: { product: true } },
        locker: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (next$ === 'READY') {
      await tx.locker.update({ where: { id: u.lockerId }, data: { status: 'OCCUPIED' } });
    } else if (next$ === 'CANCELLED') {
      await tx.locker.update({ where: { id: u.lockerId }, data: { status: 'AVAILABLE' } });
    }
    return u;
  });

  const serialized = serializeOrder(updated, { includeUser: true });
  publishOrderEvent('order.updated', serialized);
  res.json(serializeOrder(updated));
});

function serializeOrder(o, { includeUser = false } = {}) {
  const out = {
    id: o.id,
    status: o.status,
    totalCents: o.totalCents,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    locker: o.locker
      ? {
          id: o.locker.id,
          number: o.locker.number,
          location: o.locker.location,
          status: o.locker.status,
        }
      : null,
    items: (o.items || []).map((i) => ({
      id: i.id,
      quantity: i.quantity,
      priceCents: i.priceCents,
      notes: i.notes,
      product: i.product
        ? {
            id: i.product.id,
            name: i.product.name,
            description: i.product.description,
            emoji: i.product.emoji,
            category: i.product.category,
          }
        : null,
    })),
  };
  if (includeUser && o.user) {
    out.user = { id: o.user.id, name: o.user.name, email: o.user.email };
  }
  return out;
}

module.exports = router;
