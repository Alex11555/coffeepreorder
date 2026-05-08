// Tiny in-process event bus for SSE fan-out.
//
// Two channels:
//   - "staff"        — every order create / status change goes here so
//                      the barista dashboard sees live updates.
//   - `order:${id}`  — per-order channel so a customer's QR/tracking screen
//                      flips to "Ready!" the moment staff bumps the status.
//
// This is single-process only; if you ever scale the API to multiple
// instances behind a load balancer, swap the EventEmitter for Redis pub/sub.

const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(0); // we may have many SSE subscribers

function publishOrderEvent(eventName, order) {
  // Staff dashboard sees the firehose.
  bus.emit('staff', { type: eventName, order });
  // Per-order channel for that one customer.
  bus.emit(`order:${order.id}`, { type: eventName, order });
}

function subscribe(channel, handler) {
  bus.on(channel, handler);
  return () => bus.off(channel, handler);
}

module.exports = { publishOrderEvent, subscribe };
