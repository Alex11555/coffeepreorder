// Entry point — wires Express + middleware + routers.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const lockerRoutes = require('./routes/lockers');
const orderRoutes = require('./routes/orders');
const pickupRoutes = require('./routes/pickup');
const lockerHubRoutes = require('./routes/lockerHub');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/lockers', lockerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/locker-hub', lockerHubRoutes);

// 404 + error fallback
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.status) return res.status(err.status).json({ error: err.message });
  res.status(500).json({ error: 'Server error' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`☕  CoffeePreorderQR API listening on http://localhost:${port}`);
});
