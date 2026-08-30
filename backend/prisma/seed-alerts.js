const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CARGO_ID = '1e72f99f-c656-4b94-885f-65cea1c12d94';

async function main() {
  const alerts = [
    { id: 'alert-1', cargoRequestId: CARGO_ID, alertType: 'WEATHER', severity: 'error',   message: 'Paradip congestion increased — expected delay of 3 days.',            triggeredAt: new Date(Date.now() - 2 * 3600000) },
    { id: 'alert-2', cargoRequestId: CARGO_ID, alertType: 'WEATHER', severity: 'warning', message: 'Cyclone forming in Bay of Bengal — weather disruption 65%.',           triggeredAt: new Date(Date.now() - 3 * 3600000) },
    { id: 'alert-3', cargoRequestId: CARGO_ID, alertType: 'MARKET',  severity: 'info',    message: 'Forecast generation complete for Cargo Request IRON ORE.',             triggeredAt: new Date(Date.now() - 4 * 3600000) },
    { id: 'alert-4', cargoRequestId: CARGO_ID, alertType: 'MARKET',  severity: 'warning', message: 'Freight rate volatility increased 15% on Newcastle route.',            triggeredAt: new Date(Date.now() - 5 * 3600000) },
    { id: 'alert-5', cargoRequestId: CARGO_ID, alertType: 'VESSEL',  severity: 'info',    message: 'MV DEMO CARRIER availability confirmed for October window.',           triggeredAt: new Date(Date.now() - 6 * 3600000) },
    { id: 'alert-6', cargoRequestId: CARGO_ID, alertType: 'SYSTEM',  severity: 'success', message: 'Optimization engine recalibrated with latest market data.',            triggeredAt: new Date(Date.now() - 7 * 3600000) },
  ];

  for (const a of alerts) {
    await prisma.alert.upsert({ where: { id: a.id }, create: a, update: a });
  }
  console.log('Alerts seeded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
