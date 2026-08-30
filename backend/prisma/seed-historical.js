const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEWCASTLE_ID = '9c1289fe-ca2d-49ed-b51e-628a62f46657';
const PARADIP_ID = 'fd3e8d38-5fda-4c84-8e98-efc91a6cc4d2';

async function main() {
  console.log('Generating historical market data...');
  const now = new Date();
  
  for(let i=19; i>=0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    await prisma.freightRate.create({
      data: {
        id: `hist-freight-${i}`,
        observedAt: d,
        originPortId: NEWCASTLE_ID,
        destinationPortId: PARADIP_ID,
        vesselType: 'CAPESIZE',
        rateValue: 25 + (Math.random() - 0.5) * 4,
        currency: 'USD',
        rateUnit: 'USD/MT'
      }
    });

    await prisma.fuelPrice.create({
      data: {
        id: `hist-fuel-${i}`,
        observedAt: d,
        fuelType: 'VLSFO',
        region: 'Singapore',
        price: 680 + (Math.random() - 0.5) * 20,
        currency: 'USD'
      }
    });

    await prisma.commodityPrice.create({
      data: {
        id: `hist-comm-${i}`,
        observedAt: d,
        commodity: 'IRON ORE',
        market: 'Qingdao',
        price: 115 + (Math.random() - 0.5) * 10,
        currency: 'USD'
      }
    });

    await prisma.economicIndicator.create({
      data: {
        id: `hist-econ-${i}`,
        observedAt: d,
        indicatorName: 'PMI',
        value: 52 + (Math.random() - 0.5) * 2,
        unit: 'Index'
      }
    });
  }
  console.log('Done!');
}
main();
