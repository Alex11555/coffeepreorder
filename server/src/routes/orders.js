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

// Only compartments 1..4 are real solenoids. (Legacy lockers are OFFLINE.)
const MAX_COMPARTMENT = 4;

const CreateOrderBody = z.object({
  // Optional now — server auto-assigns the first free compartment if omitted.
  lockerId: z.string().min(1).optional(),
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

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const i of items) {
    const p = productMap.get(i.productId);
    if (!p || !p.available) return next({ status: 400, message: `Product unavailable: ${i.productId}` });
  }

  const totalCents = items.reduce(
    (sum, i) => sum + productMap.get(i.productId).priceCents * i.quantity,
    0
  );

  const paymentOk = true;
  if (!paymentOk) return next({ status: 402, message: 'Payment declined' });

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Pick the compartment: explicit lockerId if given + free, else the
      // lowest-numbered AVAILABLE compartment (1..4).
      let chosen;
      if (lockerId) {
        chosen = await tx.locker.findUnique({ where: { id: lockerId } });
        if (!chosen || chosen.status !== 'AVAILABLE') {
          throw Object.assign(new Error('That compartment is not available'), { status: 409 });
        }
      } else {
        chosen = await tx.locker.findFirst({
          where: { status: 'AVAILABLE', number: { lte: MAX_COMPARTMENT } },
          orderBy: { number: 'asc' },
        });
        if (!chosen) {
          throw Object.assign(new Error('All compartments are full right now — please try again shortly.'), { status: 409 });
        }
      }

      await tx.locker.update({ where: { id: chosen.id }, data: { status: 'RESERVED' } });

      return tx.order.create({
        data: {
          userId: req.user.id,
          lockerId: chosen.id,
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
  } catch (e) {
    return next(e.status ? e : { status: 500, message: 'Could not place order' });
  }

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

// Staff-only: recently picked-up orders, newest first. Shown on the
// dashboard as a "Picked Up" section that the barista can clear out.
router.get('/picked-up', requireAuth, requireStaff, async (_req, res) => {
  const orders = await prisma.order.findMany({
    where: { status: 'PICKED_UP' },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      items: { include: { product: true } },
      locker: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  res.json(orders.map((o) => serializeOrder(o, { includeUser: true })));
});

// Staff-only bulk delete: nuke all picked-up orders in one click.
// Must come BEFORE the `/:id` routes so the path doesn't match :id="picked-up".
router.delete('/picked-up', requireAuth, requireStaff, async (_req, res, next) => {
  try {
    const targets = await prisma.order.findMany({
      where: { status: 'PICKED_UP' },
      select: { id: true },
    });
    if (targets.length === 0) return res.json({ deleted: 0, ids: [] });
    const ids = targets.map((t) => t.id);
    // OrderItem + QrCode cascade-delete via FK onDelete: Cascade.
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
    // Tell every connected dashboard so they drop the cards in real-time.
    ids.forEach((id) => publishOrderEvent('order.deleted', { id }));
    res.json({ deleted: ids.length, ids });
  } catch (e) {
    next(e);
  }
});

// Staff SSE — every order create / status change / deletion.
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

// Open the compartment door (button path). Owner or staff. Order must be READY.
// Sets unlockPending=true so the Pi pops the solenoid, marks the order
// PICKED_UP, frees the compartment, and burns the QR.
router.post('/:id/open', requireAuth, async (req, res, next) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { qrCode: true, locker: true },
  });
  if (!order) return next({ status: 404, message: 'Order not found' });
  if (order.userId !== req.user.id && req.user.role !== 'STAFF') {
    return next({ status: 403, message: 'Not yours' });
  }
  if (order.status !== 'READY') {
    return next({ status: 409, message: `Order not ready (status: ${order.status})` });
  }

  await prisma.$transaction([
    prisma.locker.update({
      where: { id: order.lockerId },
      data: { status: 'AVAILABLE', unlockPending: true },
    }),
    prisma.order.update({ where: { id: order.id }, data: { status: 'PICKED_UP' } }),
    ...(order.qrCode && !order.qrCode.usedAt
      ? [prisma.qrCode.update({ where: { id: order.qrCode.id }, data: { usedAt: new Date() } })]
      : []),
  ]);

  const updatedOpen = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: { include: { product: true } },
      locker: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  publishOrderEvent('order.updated', serializeOrder(updatedOpen, { includeUser: true }));
  res.json({ ...serializeOrder(updatedOpen), opening: { compartment: order.locker?.number } });
});

// Backwards-compatible: confirm pickup WITHOUT opening the door.
// Only allowed when status === 'READY'. Marks the order PICKED_UP, frees the
// locker, and burns the QR token so it can't be reused.
router.post('/:id/picked-up', requireAuth, async (req, res, next) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { qrCode: true },
  });
  if (!order) return next({ status: 404, message: 'Order not found' });
  if (order.userId !== req.user.id && req.user.role !== 'STAFF') {
    return next({ status: 403, message: 'Not yours' });
  }
  if (order.status !== 'READY') {
    return next({ status: 409, message: `Order not ready (status: ${order.status})` });
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: 'PICKED_UP' } }),
    prisma.locker.update({ where: { id: order.lockerId }, data: { status: 'AVAILABLE' } }),
    ...(order.qrCode && !order.qrCode.usedAt
      ? [prisma.qrCode.update({ where: { id: order.qrCode.id }, data: { usedAt: new Date() } })]
      : []),
  ]);

  const updated = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: { include: { product: true } },
      locker: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  const serialized = serializeOrder(updated, { includeUser: true });
  publishOrderEvent('order.updated', serialized);
  res.json(serializeOrder(updated));
});

// Staff-only: delete a single order. Only finalised orders (PICKED_UP /
// CANCELLED) can be deleted — we don't want to accidentally nuke an active
// order that's still on the bar.
router.delete('/:id', requireAuth, requireStaff, async (req, res, next) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return next({ status: 404, message: 'Order not found' });
  if (!['PICKED_UP', 'CANCELLED'].includes(order.status)) {
    return next({
      status: 409,
      message: `Cannot delete an active order (status: ${order.status})`,
    });
  }
  await prisma.order.delete({ where: { id: order.id } });
  publishOrderEvent('order.deleted', { id: order.id });
  res.json({ ok: true, id: order.id });
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
