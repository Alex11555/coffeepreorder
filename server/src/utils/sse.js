// Helper: turn an Express response into a Server-Sent Events stream.
//
// Usage:
//   const send = openSseStream(req, res);
//   send({ hello: 'world' });
//   send({ type: 'order.updated', order });
//
// Closes itself when the client disconnects. Sends a heartbeat every 25s so
// proxies / load balancers don't kill the idle connection.

function openSseStream(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering
  });
  res.flushHeaders?.();
  // Tell the client to retry after 3s if the connection drops.
  res.write('retry: 3000\n\n');

  const send = (data) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const heartbeat = setInterval(() => {
    if (res.writableEnded) return;
    res.write(': hb\n\n');
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    res.end();
  });

  return send;
}

module.exports = { openSseStream };
