const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEWCASTLE_ID = '9c1289fe-ca2d-49ed-b51e-628a62f46657';
const PARADIP_ID = 'fd3e8d38-5fda-4c84-8e98-efc91a6cc4d2';
const CARGO_ID = '1e72f99f-c656-4b94-885f-65cea1c12d94';
const VESSEL_ID = 'e2c26c24-bd60-4227-a36c-be9837ee666b';
const USER_ID = 'd50d75a3-839f-4f67-893c-235b2e65c929';

async function main() {
  await prisma.user.create({
    data: { id: USER_ID, name: 'Demo User', email: 'demo@sih26006.com', passwordHash: 'hash', role: 'PROCUREMENT_MANAGER' }
  }).catch(() => {});

  await prisma.port.create({
    data: { id: NEWCASTLE_ID, name: 'Newcastle', country: 'Australia', region: 'Oceania', maxDraftM: 18, maxLoaM: 300, maxBeamM: 50, handlingCapacityMtDay: 100000, berthCapacity: 5 }
  }).catch(() => {});

  await prisma.port.create({
    data: { id: PARADIP_ID, name: 'Paradip', country: 'India', region: 'South Asia', maxDraftM: 15, maxLoaM: 250, maxBeamM: 40, handlingCapacityMtDay: 50000, berthCapacity: 3 }
  }).catch(() => {});

  await prisma.vessel.create({
    data: { id: VESSEL_ID, name: 'MV DEMO CARRIER', vesselType: 'BULK', capacityMt: 30000, draftM: 10, loaM: 200, beamM: 30, speedKnots: 14, availabilityStatus: 'AVAILABLE' }
  }).catch(() => {});

  await prisma.cargoRequest.create({
    data: { id: CARGO_ID, userId: USER_ID, cargoType: 'IRON ORE', quantityMt: 55000, originPortId: NEWCASTLE_ID, destinationPortId: PARADIP_ID, requiredDate: new Date(), status: 'DRAFT' }
  }).catch(() => {});

  console.log('Base created.');
}
main();
