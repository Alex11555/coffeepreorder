// Expo push notifications — sends via the Expo Push API over plain HTTPS,
// so there's no SDK dependency. Best-effort: failures are logged, never throw.
//
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/
const prisma = require('../prisma');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Expo tokens look like ExponentPushToken[xxxxx] or ExpoPushToken[xxxxx].
function isExpoToken(t) {
  return typeof t === 'string' && /^Expo(nent)?PushToken\[/.test(t);
}

// Send one notification to a single user (looks up their stored token).
async function sendToUser(userId, { title, body, data }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });
    if (!user || !isExpoToken(user.pushToken)) return;

    const message = {
      to: user.pushToken,
      title,
      body,
      sound: 'default',
      priority: 'high',
      data: data || {},
    };

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const json = await res.json().catch(() => null);
    // If Expo says the token is no longer registered, clear it so we stop
    // hammering a dead device.
    const errType = json?.data?.details?.error;
    if (errType === 'DeviceNotRegistered') {
      await prisma.user.update({
        where: { id: userId },
        data: { pushToken: null },
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('[push] send failed:', e.message);
  }
}

// Friendly copy for each status the customer cares about.
function messageForStatus(status, order) {
  const door = order?.locker?.number;
  switch (status) {
    case 'PREPARING':
      return { title: '☕ Your order is being made', body: 'The barista just started preparing your coffee.' };
    case 'READY':
      return {
        title: '🎉 Ready for pickup!',
        body: door ? `Your coffee is in door #${door}. Tap to open it.` : 'Your coffee is ready in the locker.',
      };
    case 'PICKED_UP':
      return { title: '✅ Enjoy your coffee', body: 'Order collected. See you next time!' };
    case 'CANCELLED':
      return { title: 'Order cancelled', body: 'Your order was cancelled. Any points were refunded.' };
    default:
      return null;
  }
}

// Notify the order owner about a status change.
async function notifyOrderStatus(order) {
  const msg = messageForStatus(order.status, order);
  if (!msg) return;
  await sendToUser(order.userId, {
    ...msg,
    data: { orderId: order.id, status: order.status },
  });
}

module.exports = { sendToUser, notifyOrderStatus, isExpoToken };
