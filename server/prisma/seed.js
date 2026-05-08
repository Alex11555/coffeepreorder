// Seed: menu items, lockers, and a staff (barista) account.
// Re-running is safe: products are upserted by name, lockers by number.
// Usage: npm run seed
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PRODUCTS = [
  { name: 'Espresso',      description: 'Strong & bold shot.',                    priceCents: 350, emoji: '☕',  category: 'Espresso' },
  { name: 'Americano',     description: 'Espresso topped with hot water.',        priceCents: 380, emoji: '🍶', category: 'Espresso' },
  { name: 'Cappuccino',    description: 'Classic Italian style.',                 priceCents: 450, emoji: '🫗',  category: 'Lattes'   },
  { name: 'Flat White',    description: 'Silky microfoam.',                       priceCents: 480, emoji: '☁️',  category: 'Lattes'   },
  { name: 'Latte',         description: 'Espresso with steamed milk.',            priceCents: 470, emoji: '🥛', category: 'Lattes'   },
  { name: 'Cortado',       description: 'Balanced & smooth.',                     priceCents: 400, emoji: '⚖️',  category: 'Espresso' },
  { name: 'Mocha',         description: 'Espresso, chocolate, steamed milk.',     priceCents: 520, emoji: '🍫', category: 'Lattes'   },
  { name: 'Cold Brew',     description: '12-hour steeped.',                       priceCents: 500, emoji: '🧊', category: 'Cold Brew' },
  { name: 'Iced Latte',    description: 'Espresso over ice with cold milk.',      priceCents: 470, emoji: '🥤', category: 'Cold Brew' },
  { name: 'Matcha Latte',  description: 'Ceremonial grade.',                      priceCents: 550, emoji: '🍵', category: 'Tea'      },
  { name: 'Hot Chocolate', description: 'Belgian dark chocolate, no coffee.',     priceCents: 425, emoji: '🍫', category: 'Tea'      },
  { name: 'Chai Latte',    description: 'Spiced black tea + milk.',               priceCents: 475, emoji: '🫖', category: 'Tea'      },
];

const LOCKERS = [
  { number: 1,  location: 'Main Lobby' },
  { number: 2,  location: 'Floor 3' },
  { number: 3,  location: 'Rooftop' },
  { number: 4,  location: 'Cafeteria' },
  { number: 5,  location: 'East Wing' },
  { number: 6,  location: 'West Exit' },
  { number: 7,  location: 'Lobby — bay A7' },
  { number: 8,  location: 'Lobby — bay A8' },
  { number: 9,  location: 'Lobby — bay B1' },
  { number: 10, location: 'Lobby — bay B2' },
  { number: 11, location: 'Lobby — bay B3' },
  { number: 12, location: 'Lobby — bay B4' },
];

async function main() {
  console.log('Seeding products…');
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { description: p.description, priceCents: p.priceCents, emoji: p.emoji, category: p.category },
      });
    } else {
      await prisma.product.create({ data: p });
    }
  }

  console.log('Seeding lockers…');
  for (const l of LOCKERS) {
    await prisma.locker.upsert({
      where: { number: l.number },
      update: { location: l.location },
      create: l,
    });
  }

  console.log('Seeding staff account…');
  const staffEmail = 'barista@coffee.app';
  const existing = await prisma.user.findUnique({ where: { email: staffEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('barista1234', 12);
    await prisma.user.create({
      data: { email: staffEmail, passwordHash, name: 'Barista', role: 'STAFF' },
    });
    console.log('  staff: barista@coffee.app / barista1234');
  }

  console.log('Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
