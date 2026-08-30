const { prisma } = require('../../config/database');

function buildDateRangeFilter(filters) {
    const whereDate = {};
    if (filters.startDate) {
        whereDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
        whereDate.lte = new Date(filters.endDate);
    }
    return Object.keys(whereDate).length > 0 ? whereDate : undefined;
}

async function getFreightRates(filters = {}) {
    const where = {};
    const dateRange = buildDateRangeFilter(filters);

    if (dateRange) {
        where.observedAt = dateRange;
    }
    if (filters.originPortId) {
        where.originPortId = filters.originPortId;
    }
    if (filters.destinationPortId) {
        where.destinationPortId = filters.destinationPortId;
    }
    if (filters.vesselType) {
        where.vesselType = filters.vesselType;
    }

    return prisma.freightRate.findMany({
        where,
        orderBy: { observedAt: 'desc' },
    });
}

async function getFuelPrices(filters = {}) {
    const where = {};
    const dateRange = buildDateRangeFilter(filters);

    if (dateRange) {
        where.observedAt = dateRange;
    }
    if (filters.fuelType) {
        where.fuelType = filters.fuelType;
    }
    if (filters.region) {
        where.region = filters.region;
    }

    return prisma.fuelPrice.findMany({
        where,
        orderBy: { observedAt: 'desc' },
    });
}

async function getCommodityPrices(filters = {}) {
    const where = {};
    const dateRange = buildDateRangeFilter(filters);

    if (dateRange) {
        where.observedAt = dateRange;
    }
    if (filters.commodity) {
        where.commodity = filters.commodity;
    }
    if (filters.market) {
        where.market = filters.market;
    }

    return prisma.commodityPrice.findMany({
        where,
        orderBy: { observedAt: 'desc' },
    });
}

async function getEconomicIndicators(filters = {}) {
    const where = {};
    const dateRange = buildDateRangeFilter(filters);

    if (dateRange) {
        where.observedAt = dateRange;
    }
    if (filters.indicatorName) {
        where.indicatorName = filters.indicatorName;
    }

    return prisma.economicIndicator.findMany({
        where,
        orderBy: { observedAt: 'desc' },
    });
}

module.exports = {
    getFreightRates,
    getFuelPrices,
    getCommodityPrices,
    getEconomicIndicators,
};
