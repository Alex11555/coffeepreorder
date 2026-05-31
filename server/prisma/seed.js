// Seed: menu items, the 4-compartment locker cabinet, and a staff account.
// Re-running is safe: products upsert by name, lockers by number.
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

// ONE physical cabinet, FOUR compartments. Each `number` maps to a GPIO pin
// on the Raspberry Pi (see pi/locker_hub.py: 1→GPIO17, 2→GPIO27, 3→GPIO22, 4→GPIO23).
const LOCATION = 'Coffee Counter';
const COMPARTMENTS = [1, 2, 3, 4];

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

  console.log('Seeding the 4 locker compartments…');
  for (const number of COMPARTMENTS) {
    await prisma.locker.upsert({
      where: { number },
      update: { location: LOCATION, unlockPending: false },
      create: { number, location: LOCATION },
    });
  }

  // Retire any legacy lockers from older seeds (numbers > 4): mark OFFLINE so
  // they're never auto-assigned. We can't delete them if past orders point at
  // them (FK), so OFFLINE is the safe move.
  const retired = await prisma.locker.updateMany({
    where: { number: { gt: 4 } },
    data: { status: 'OFFLINE' },
  });
  if (retired.count) console.log(`  retired ${retired.count} legacy locker(s) → OFFLINE`);

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
