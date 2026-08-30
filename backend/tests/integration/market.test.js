jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const { prisma, resetMarket, resetUsers } = require('../mocks/database');
const createApp = require('../../src/app');

const app = createApp();

describe('Market API', () => {
    let token;

    beforeEach(async () => {
        resetMarket();
        resetUsers();

        // Register user for JWT
        const res = await request(app).post('/api/auth/register').send({
            name: 'Test Analyst',
            email: 'analyst@example.com',
            password: 'password123',
            role: 'VIEWER',
        });
        token = res.body.data.token;

        // Seed Freight Rates
        await prisma.freightRate.create({
            data: {
                observedAt: new Date('2026-08-20T12:00:00.000Z'),
                originPortId: '00000000-0000-4000-9000-000000000001',
                destinationPortId: '00000000-0000-4000-9000-000000000002',
                vesselType: 'Capesize',
                rateValue: 24.5,
                currency: 'USD',
                rateUnit: 'MT',
                source: 'Mock Broker',
            },
        });

        await prisma.freightRate.create({
            data: {
                observedAt: new Date('2026-08-25T12:00:00.000Z'),
                originPortId: '00000000-0000-4000-9000-000000000001',
                destinationPortId: '00000000-0000-4000-9000-000000000002',
                vesselType: 'Capesize',
                rateValue: 26.0,
                currency: 'USD',
                rateUnit: 'MT',
                source: 'Mock Broker',
            },
        });

        // Seed Fuel Prices
        await prisma.fuelPrice.create({
            data: {
                observedAt: new Date('2026-08-20T12:00:00.000Z'),
                fuelType: 'VLSFO',
                region: 'Singapore',
                price: 640.5,
                currency: 'USD',
                source: 'BunkerWorld',
            },
        });

        // Seed Commodity Prices
        await prisma.commodityPrice.create({
            data: {
                observedAt: new Date('2026-08-20T12:00:00.000Z'),
                commodity: 'coking coal',
                market: 'Rotterdam',
                price: 185.0,
                currency: 'USD',
                source: 'Commodity Index',
            },
        });

        // Seed Economic Indicators
        await prisma.economicIndicator.create({
            data: {
                observedAt: new Date('2026-08-20T12:00:00.000Z'),
                indicatorName: 'Manufacturing PMI',
                value: 51.4,
                unit: 'index',
                source: 'Fed',
            },
        });
    });

    describe('GET /api/market/freight', () => {
        it('returns list of freight rates', async () => {
            const res = await request(app)
                .get('/api/market/freight')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);
            // Sorted desc by date
            expect(res.body.data[0].rateValue).toBe(26.0);
        });

        it('filters freight rates by dates and properties', async () => {
            const res = await request(app)
                .get('/api/market/freight')
                .query({
                    startDate: '2026-08-22T00:00:00.000Z',
                    vesselType: 'Capesize',
                })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].rateValue).toBe(26.0);
        });
    });

    describe('GET /api/market/fuel', () => {
        it('returns list of fuel prices', async () => {
            const res = await request(app)
                .get('/api/market/fuel')
                .query({ fuelType: 'VLSFO' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].price).toBe(640.5);
        });
    });

    describe('GET /api/market/commodity', () => {
        it('returns list of commodity prices', async () => {
            const res = await request(app)
                .get('/api/market/commodity')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].commodity).toBe('coking coal');
        });
    });

    describe('GET /api/market/economic', () => {
        it('returns economic indicators list', async () => {
            const res = await request(app)
                .get('/api/market/economic')
                .query({ indicatorName: 'Manufacturing PMI' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].value).toBe(51.4);
        });
    });

    describe('Unauthorized request checks', () => {
        it('rejects access if token is missing', async () => {
            const res = await request(app).get('/api/market/freight');
            expect(res.status).toBe(401);
        });
    });
});
