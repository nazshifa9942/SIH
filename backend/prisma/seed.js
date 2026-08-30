const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NEWCASTLE_ID = '9c1289fe-ca2d-49ed-b51e-628a62f46657';
const PARADIP_ID = 'fd3e8d38-5fda-4c84-8e98-efc91a6cc4d2';
const CARGO_ID = '1e72f99f-c656-4b94-885f-65cea1c12d94';
const VESSEL_ID = 'e2c26c24-bd60-4227-a36c-be9837ee666b';

const OBSERVED_AT = new Date('2026-08-27T00:00:00.000Z');

async function main() {
  console.log('Starting SIH26006 demo seed...');

  // --------------------------------------------------
  // Verify existing base records
  // --------------------------------------------------

  const newcastle = await prisma.port.findUnique({
    where: { id: NEWCASTLE_ID },
  });

  const paradip = await prisma.port.findUnique({
    where: { id: PARADIP_ID },
  });

  const cargo = await prisma.cargoRequest.findUnique({
    where: { id: CARGO_ID },
  });

  const vessel = await prisma.vessel.findUnique({
    where: { id: VESSEL_ID },
  });

  if (!newcastle) {
    throw new Error(`Required port not found: Newcastle (${NEWCASTLE_ID})`);
  }

  if (!paradip) {
    throw new Error(`Required port not found: Paradip (${PARADIP_ID})`);
  }

  if (!cargo) {
    throw new Error(`Required cargo not found: ${CARGO_ID}`);
  }

  if (!vessel) {
    throw new Error(`Required vessel not found: ${VESSEL_ID}`);
  }

  console.log('Base records verified.');

  // --------------------------------------------------
  // Freight Rate
  // --------------------------------------------------

  await prisma.freightRate.upsert({
    where: {
      id: 'demo-freight-newcastle-paradip-20260827',
    },
    update: {
      rateValue: 25,
      currency: 'USD',
      rateUnit: 'USD_PER_MT',
      source: 'DEMO_SEED',
    },
    create: {
      id: 'demo-freight-newcastle-paradip-20260827',
      observedAt: OBSERVED_AT,
      originPortId: NEWCASTLE_ID,
      destinationPortId: PARADIP_ID,
      vesselType: 'BULK_CARRIER',
      rateValue: 25,
      currency: 'USD',
      rateUnit: 'USD_PER_MT',
      source: 'DEMO_SEED',
    },
  });

  console.log('FreightRate: created/updated');

  // --------------------------------------------------
  // Fuel Price
  // --------------------------------------------------

  await prisma.fuelPrice.upsert({
    where: {
      id: 'demo-fuel-vlsfo-singapore-20260827',
    },
    update: {
      price: 620,
      currency: 'USD',
      source: 'DEMO_SEED',
    },
    create: {
      id: 'demo-fuel-vlsfo-singapore-20260827',
      observedAt: OBSERVED_AT,
      fuelType: 'VLSFO',
      region: 'Singapore',
      price: 620,
      currency: 'USD',
      source: 'DEMO_SEED',
    },
  });

  console.log('FuelPrice: created/updated');

  // --------------------------------------------------
  // Commodity Price
  // --------------------------------------------------

  await prisma.commodityPrice.upsert({
    where: {
      id: 'demo-commodity-iron-ore-newcastle-20260827',
    },
    update: {
      price: 110,
      currency: 'USD',
      source: 'DEMO_SEED',
    },
    create: {
      id: 'demo-commodity-iron-ore-newcastle-20260827',
      observedAt: OBSERVED_AT,
      commodity: 'IRON_ORE',
      market: 'Newcastle',
      price: 110,
      currency: 'USD',
      source: 'DEMO_SEED',
    },
  });

  console.log('CommodityPrice: created/updated');

  // --------------------------------------------------
  // Economic Indicator
  // --------------------------------------------------

  await prisma.economicIndicator.upsert({
    where: {
      id: 'demo-economic-bdi-20260827',
    },
    update: {
      value: 1800,
      unit: 'INDEX',
      source: 'DEMO_SEED',
    },
    create: {
      id: 'demo-economic-bdi-20260827',
      observedAt: OBSERVED_AT,
      indicatorName: 'BDI',
      value: 1800,
      unit: 'INDEX',
      source: 'DEMO_SEED',
    },
  });

  console.log('EconomicIndicator: created/updated');

  // --------------------------------------------------
  // Port Congestion - Newcastle
  // --------------------------------------------------

  await prisma.portCongestion.upsert({
    where: {
      id: 'demo-congestion-newcastle-20260827',
    },
    update: {
      vesselsWaiting: 8,
      avgWaitHours: 36,
      congestionIndex: 0.45,
      source: 'DEMO_SEED',
    },
    create: {
      id: 'demo-congestion-newcastle-20260827',
      observedAt: OBSERVED_AT,
      portId: NEWCASTLE_ID,
      vesselsWaiting: 8,
      avgWaitHours: 36,
      congestionIndex: 0.45,
      source: 'DEMO_SEED',
    },
  });

  // --------------------------------------------------
  // Port Congestion - Paradip
  // --------------------------------------------------

  await prisma.portCongestion.upsert({
    where: {
      id: 'demo-congestion-paradip-20260827',
    },
    update: {
      vesselsWaiting: 5,
      avgWaitHours: 24,
      congestionIndex: 0.30,
      source: 'DEMO_SEED',
    },
    create: {
      id: 'demo-congestion-paradip-20260827',
      observedAt: OBSERVED_AT,
      portId: PARADIP_ID,
      vesselsWaiting: 5,
      avgWaitHours: 24,
      congestionIndex: 0.30,
      source: 'DEMO_SEED',
    },
  });

  console.log('PortCongestion: created/updated');

  // --------------------------------------------------
  // Weather - Newcastle
  // --------------------------------------------------

  await prisma.weatherObservation.upsert({
    where: {
      id: 'demo-weather-newcastle-20260827',
    },
    update: {
      windSpeed: 15,
      rainfall: 2,
      stormIndicator: false,
      severity: 'LOW',
      source: 'DEMO_SEED',
    },
    create: {
      id: 'demo-weather-newcastle-20260827',
      observedAt: OBSERVED_AT,
      location: 'Newcastle',
      windSpeed: 15,
      rainfall: 2,
      stormIndicator: false,
      severity: 'LOW',
      source: 'DEMO_SEED',
    },
  });

  // --------------------------------------------------
  // Weather - Paradip
  // --------------------------------------------------

  await prisma.weatherObservation.upsert({
    where: {
      id: 'demo-weather-paradip-20260827',
    },
    update: {
      windSpeed: 18,
      rainfall: 5,
      stormIndicator: false,
      severity: 'MODERATE',
      source: 'DEMO_SEED',
    },
    create: {
      id: 'demo-weather-paradip-20260827',
      observedAt: OBSERVED_AT,
      location: 'Paradip',
      windSpeed: 18,
      rainfall: 5,
      stormIndicator: false,
      severity: 'MODERATE',
      source: 'DEMO_SEED',
    },
  });

  console.log('WeatherObservation: created/updated');

  // --------------------------------------------------
  // Vessel Availability
  // --------------------------------------------------

  await prisma.vesselAvailability.upsert({
    where: {
      id: 'demo-availability-mv-demo-carrier-20260827',
    },
    update: {
      availableFrom: new Date('2026-09-01T00:00:00.000Z'),
      availableUntil: new Date('2026-10-15T00:00:00.000Z'),
      status: 'AVAILABLE',
      currentLocation: 'Newcastle',
      source: 'DEMO_SEED',
      observedAt: OBSERVED_AT,
    },
    create: {
      id: 'demo-availability-mv-demo-carrier-20260827',
      vesselId: VESSEL_ID,
      availableFrom: new Date('2026-09-01T00:00:00.000Z'),
      availableUntil: new Date('2026-10-15T00:00:00.000Z'),
      status: 'AVAILABLE',
      currentLocation: 'Newcastle',
      source: 'DEMO_SEED',
      observedAt: OBSERVED_AT,
    },
  });

  console.log('VesselAvailability: created/updated');

  console.log('');
  console.log('====================================');
  console.log('DEMO SEED COMPLETE');
  console.log('====================================');
  console.log('FreightRate: created/updated');
  console.log('FuelPrice: created/updated');
  console.log('CommodityPrice: created/updated');
  console.log('EconomicIndicator: created/updated');
  console.log('PortCongestion: created/updated');
  console.log('WeatherObservation: created/updated');
  console.log('VesselAvailability: created/updated');
}

main()
  .catch((error) => {
    console.error('DEMO SEED FAILED');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });