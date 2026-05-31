// /api/locker-hub — the channel the Raspberry Pi talks to.
//
// The Pi lives behind a home router; the API lives on Render. Render can't dial
// into the Pi, so the Pi POLLS us instead:
//
//   1. GET  /api/locker-hub/pending?key=SECRET
//        → { compartments: [1, 3] }   // doors that should open right now
//   2. (Pi pulses those solenoids)
//   3. POST /api/locker-hub/ack?key=SECRET   body: { compartments: [1, 3] }
//        → clears unlockPending so they don't re-open on the next poll
//
// Auth is a shared secret (LOCKER_HUB_KEY) instead of a user JWT, because the
// Pi isn't a user. Set it in the server env AND in pi/.env.
const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

function checkKey(req, res, next) {
  const expected = process.env.LOCKER_HUB_KEY;
  if (!expected) {
    return res.status(500).json({ error: 'LOCKER_HUB_KEY not configured on server' });
  }
  const given = req.query.key || req.get('x-hub-key');
  if (given !== expected) {
    return res.status(401).json({ error: 'Bad hub key' });
  }
  next();
}

// Which compartments need opening?
router.get('/pending', checkKey, async (_req, res) => {
  const lockers = await prisma.locker.findMany({
    where: { unlockPending: true },
    select: { number: true },
    orderBy: { number: 'asc' },
  });
  res.json({ compartments: lockers.map((l) => l.number) });
});

// Pi confirms it opened them — clear the flags.
const AckBody = z.object({
  compartments: z.array(z.number().int()).min(1),
});
router.post('/ack', checkKey, async (req, res, next) => {
  const parsed = AckBody.safeParse(req.body);
  if (!parsed.success) return next({ status: 400, message: 'Expected { compartments: number[] }' });
  const { compartments } = parsed.data;
  const result = await prisma.locker.updateMany({
    where: { number: { in: compartments } },
    data: { unlockPending: false },
  });
  res.json({ cleared: result.count });
});

// Lightweight health/identity check the Pi can hit on boot.
router.get('/ping', checkKey, (_req, res) => res.json({ ok: true }));

module.exports = router;
