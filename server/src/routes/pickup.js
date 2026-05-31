// /api/pickup/scan — called by the locker hardware when it scans a QR.
//
// Body: { qrToken: "<raw token from the phone screen>" }
//
// Flow:
//  - hash the token, look up the QrCode row
//  - confirm it's not used yet, and that the order is READY
//  - mark order PICKED_UP, locker AVAILABLE, qr usedAt = now()
//  - return the locker number to open
//  - broadcast on the per-order channel so the customer's screen flips
//
// Auth note: in production you'd authenticate the locker hardware itself
// (mTLS, a per-locker API key, IP allowlist, etc). Left open here so you can
// poke at it with curl while developing.

const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { hashToken } = require('../utils/qr');
const { publishOrderEvent } = require('../utils/eventBus');

const router = express.Router();

const ScanBody = z.object({ qrToken: z.string().min(8) });

router.post('/scan', async (req, res, next) => {
  const parsed = ScanBody.safeParse(req.body);
  if (!parsed.success) return next({ status: 400, message: 'Missing qrToken' });

  const tokenHash = hashToken(parsed.data.qrToken);
  const qr = await prisma.qrCode.findUnique({
    where: { tokenHash },
    include: { order: { include: { locker: true } } },
  });
  if (!qr) return next({ status: 404, message: 'Unknown QR' });
  if (qr.usedAt) return next({ status: 409, message: 'QR already used' });

  const order = qr.order;
  if (order.status !== 'READY') {
    return next({ status: 409, message: `Order not ready (status: ${order.status})` });
  }

  await prisma.$transaction([
    prisma.qrCode.update({ where: { id: qr.id }, data: { usedAt: new Date() } }),
    prisma.order.update({ where: { id: order.id }, data: { status: 'PICKED_UP' } }),
    // Free the compartment AND flag it to physically open — the Pi polls for
    // unlockPending and pulses the matching solenoid.
    prisma.locker.update({
      where: { id: order.lockerId },
      data: { status: 'AVAILABLE', unlockPending: true },
    }),
  ]);

  // Refetch the now-picked-up order with its joins, then broadcast.
  const updated = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: { include: { product: true } },
      locker: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  publishOrderEvent('order.updated', serializeOrder(updated));

  res.json({
    ok: true,
    open: { lockerNumber: order.locker.number, location: order.locker.location },
    orderId: order.id,
  });
});

// Same shape as routes/orders.js so SSE listeners receive a consistent payload.
function serializeOrder(o) {
  return {
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
    user: o.user ? { id: o.user.id, name: o.user.name, email: o.user.email } : undefined,
  };
}

module.exports = router;
