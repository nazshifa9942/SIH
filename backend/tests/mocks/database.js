let users = [];
let ports = [];
let cargoRequests = [];
let freightRates = [];
let fuelPrices = [];
let commodityPrices = [];
let economicIndicators = [];
let forecastRecords = [];
let portCongestions = [];
let weatherObservations = [];
let alerts = [];
let recommendations = [];
let costBreakdowns = [];
let vessels = [];
let vesselAvailabilities = [];
let voyagePlans = [];

let idCounter = 0;
let portIdCounter = 0;
let cargoIdCounter = 0;
let forecastIdCounter = 0;
let freightIdCounter = 0;
let fuelIdCounter = 0;
let commodityIdCounter = 0;
let economicIdCounter = 0;
let congestionIdCounter = 0;
let weatherIdCounter = 0;
let alertIdCounter = 0;
let recommendationIdCounter = 0;
let costBreakdownIdCounter = 0;
let vesselIdCounter = 0;
let vesselAvailabilityIdCounter = 0;
let voyagePlanIdCounter = 0;

function resetUsers() {
  users = [];
  idCounter = 0;
}

function resetPorts() {
  ports = [];
  portIdCounter = 0;
}

function resetCargo() {
  cargoRequests = [];
  cargoIdCounter = 0;
}

function resetMarket() {
  freightRates = [];
  fuelPrices = [];
  commodityPrices = [];
  economicIndicators = [];
  forecastRecords = [];
  portCongestions = [];
  weatherObservations = [];
  alerts = [];
  recommendations = [];
  costBreakdowns = [];
  forecastIdCounter = 0;
  freightIdCounter = 0;
  fuelIdCounter = 0;
  commodityIdCounter = 0;
  economicIdCounter = 0;
  congestionIdCounter = 0;
  weatherIdCounter = 0;
  alertIdCounter = 0;
  recommendationIdCounter = 0;
  costBreakdownIdCounter = 0;
}

function resetVessels() {
  vessels = [];
  vesselAvailabilities = [];
  vesselIdCounter = 0;
  vesselAvailabilityIdCounter = 0;
}

function resetVoyagePlans() {
  voyagePlans = [];
  voyagePlanIdCounter = 0;
}

function buildDateFilter(observedAtFilter) {
  if (!observedAtFilter) return () => true;
  return (item) => {
    const itemDate = new Date(item.observedAt);
    if (observedAtFilter.gte && itemDate < new Date(observedAtFilter.gte)) {
      return false;
    }
    if (observedAtFilter.lte && itemDate > new Date(observedAtFilter.lte)) {
      return false;
    }
    return true;
  };
}

const prisma = {
  user: {
    findUnique: jest.fn(async ({ where, select }) => {
      let user = null;
      if (where.email) {
        user = users.find((item) => item.email === where.email) || null;
      } else if (where.id) {
        user = users.find((item) => item.id === where.id) || null;
      }
      if (!user) {
        return null;
      }
      if (!select) {
        return user;
      }
      const picked = {};
      for (const key of Object.keys(select)) {
        if (select[key]) {
          picked[key] = user[key];
        }
      }
      return picked;
    }),
    create: jest.fn(async ({ data }) => {
      idCounter += 1;
      const user = {
        id: `00000000-0000-4000-8000-00000000000${idCounter}`,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        ...data,
      };
      users.push(user);
      return user;
    }),
  },
  port: {
    findUnique: jest.fn(async ({ where }) => {
      return ports.find((p) => p.id === where.id) || null;
    }),
    findMany: jest.fn(async ({ where }) => {
      let filtered = [...ports];
      if (where) {
        if (where.active !== undefined) {
          filtered = filtered.filter((p) => p.active === where.active);
        }
        if (where.country && where.country.contains) {
          const term = where.country.contains.toLowerCase();
          filtered = filtered.filter((p) => p.country.toLowerCase().includes(term));
        }
        if (where.region && where.region.contains) {
          const term = where.region.contains.toLowerCase();
          filtered = filtered.filter((p) => p.region && p.region.toLowerCase().includes(term));
        }
      }
      return filtered;
    }),
    create: jest.fn(async ({ data }) => {
      portIdCounter += 1;
      const port = {
        id: `00000000-0000-4000-9000-00000000000${portIdCounter}`,
        ...data,
      };
      ports.push(port);
      return port;
    }),
    update: jest.fn(async ({ where, data }) => {
      const index = ports.findIndex((p) => p.id === where.id);
      if (index === -1) return null;
      ports[index] = { ...ports[index], ...data };
      return ports[index];
    }),
  },
  cargoRequest: {
    findUnique: jest.fn(async ({ where, include }) => {
      const cargo = cargoRequests.find((c) => c.id === where.id);
      if (!cargo) return null;
      const result = { ...cargo };
      if (include) {
        if (include.originPort) {
          result.originPort = ports.find((p) => p.id === cargo.originPortId) || null;
        }
        if (include.destinationPort) {
          result.destinationPort = ports.find((p) => p.id === cargo.destinationPortId) || null;
        }
      }
      return result;
    }),
    findMany: jest.fn(async ({ where, include }) => {
      let filtered = [...cargoRequests];
      if (where) {
        if (where.userId) {
          filtered = filtered.filter((c) => c.userId === where.userId);
        }
        if (where.status) {
          filtered = filtered.filter((c) => c.status === where.status);
        }
        if (where.cargoType && where.cargoType.contains) {
          const term = where.cargoType.contains.toLowerCase();
          filtered = filtered.filter((c) => c.cargoType.toLowerCase().includes(term));
        }
      }
      return filtered.map((c) => {
        const result = { ...c };
        if (include) {
          if (include.originPort) {
            result.originPort = ports.find((p) => p.id === c.originPortId) || null;
          }
          if (include.destinationPort) {
            result.destinationPort = ports.find((p) => p.id === c.destinationPortId) || null;
          }
        }
        return result;
      });
    }),
    create: jest.fn(async ({ data, include }) => {
      cargoIdCounter += 1;
      const cargo = {
        id: `00000000-0000-4000-a000-00000000000${cargoIdCounter}`,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        ...data,
      };
      cargoRequests.push(cargo);
      const result = { ...cargo };
      if (include) {
        if (include.originPort) {
          result.originPort = ports.find((p) => p.id === cargo.originPortId) || null;
        }
        if (include.destinationPort) {
          result.destinationPort = ports.find((p) => p.id === cargo.destinationPortId) || null;
        }
      }
      return result;
    }),
    update: jest.fn(async ({ where, data, include }) => {
      const index = cargoRequests.findIndex((c) => c.id === where.id);
      if (index === -1) return null;
      cargoRequests[index] = { ...cargoRequests[index], ...data };
      const cargo = cargoRequests[index];
      const result = { ...cargo };
      if (include) {
        if (include.originPort) {
          result.originPort = ports.find((p) => p.id === cargo.originPortId) || null;
        }
        if (include.destinationPort) {
          result.destinationPort = ports.find((p) => p.id === cargo.destinationPortId) || null;
        }
      }
      return result;
    }),
    delete: jest.fn(async ({ where }) => {
      const index = cargoRequests.findIndex((c) => c.id === where.id);
      if (index === -1) return null;
      const deleted = cargoRequests[index];
      cargoRequests.splice(index, 1);
      return deleted;
    }),
  },
  freightRate: {
    findMany: jest.fn(async ({ where }) => {
      let filtered = [...freightRates];
      if (where) {
        const dateFilter = buildDateFilter(where.observedAt);
        filtered = filtered.filter(dateFilter);
        if (where.originPortId) {
          filtered = filtered.filter((f) => f.originPortId === where.originPortId);
        }
        if (where.destinationPortId) {
          filtered = filtered.filter((f) => f.destinationPortId === where.destinationPortId);
        }
        if (where.vesselType) {
          filtered = filtered.filter((f) => f.vesselType === where.vesselType);
        }
      }
      return filtered.sort((a, b) => b.observedAt - a.observedAt);
    }),
    findFirst: jest.fn(async ({ where }) => {
      let filtered = [...freightRates];
      if (where) {
        if (where.originPortId) {
          filtered = filtered.filter((f) => f.originPortId === where.originPortId);
        }
        if (where.destinationPortId) {
          filtered = filtered.filter((f) => f.destinationPortId === where.destinationPortId);
        }
        if (where.vesselType) {
          filtered = filtered.filter((f) => f.vesselType === where.vesselType);
        }
      }
      const sorted = filtered.sort((a, b) => b.observedAt - a.observedAt);
      return sorted[0] || null;
    }),
    create: jest.fn(async ({ data }) => {
      freightIdCounter += 1;
      const rate = {
        id: `00000000-0000-4000-b999-00000000000${freightIdCounter}`,
        observedAt: new Date(data.observedAt || '2026-08-20T12:00:00.000Z'),
        ...data,
      };
      freightRates.push(rate);
      return rate;
    }),
  },
  fuelPrice: {
    findMany: jest.fn(async ({ where }) => {
      let filtered = [...fuelPrices];
      if (where) {
        const dateFilter = buildDateFilter(where.observedAt);
        filtered = filtered.filter(dateFilter);
        if (where.fuelType) {
          filtered = filtered.filter((f) => f.fuelType === where.fuelType);
        }
        if (where.region) {
          filtered = filtered.filter((f) => f.region === where.region);
        }
      }
      return filtered.sort((a, b) => b.observedAt - a.observedAt);
    }),
    findFirst: jest.fn(async ({ where }) => {
      let filtered = [...fuelPrices];
      if (where) {
        if (where.fuelType) {
          filtered = filtered.filter((f) => f.fuelType === where.fuelType);
        }
        if (where.region) {
          filtered = filtered.filter((f) => f.region === where.region);
        }
      }
      const sorted = filtered.sort((a, b) => b.observedAt - a.observedAt);
      return sorted[0] || null;
    }),
    create: jest.fn(async ({ data }) => {
      fuelIdCounter += 1;
      const f = {
        id: `00000000-0000-4000-c999-00000000000${fuelIdCounter}`,
        observedAt: new Date(data.observedAt || '2026-08-20T12:00:00.000Z'),
        ...data,
      };
      fuelPrices.push(f);
      return f;
    }),
  },
  commodityPrice: {
    findMany: jest.fn(async ({ where }) => {
      let filtered = [...commodityPrices];
      if (where) {
        const dateFilter = buildDateFilter(where.observedAt);
        filtered = filtered.filter(dateFilter);
        if (where.commodity) {
          filtered = filtered.filter((f) => f.commodity === where.commodity);
        }
        if (where.market) {
          filtered = filtered.filter((f) => f.market === where.market);
        }
      }
      return filtered.sort((a, b) => b.observedAt - a.observedAt);
    }),
    findFirst: jest.fn(async ({ where }) => {
      let filtered = [...commodityPrices];
      if (where) {
        if (where.commodity) {
          if (where.commodity.contains) {
            const term = where.commodity.contains.toLowerCase();
            filtered = filtered.filter((f) => f.commodity.toLowerCase().includes(term));
          } else {
            filtered = filtered.filter((f) => f.commodity === where.commodity);
          }
        }
        if (where.market) {
          filtered = filtered.filter((f) => f.market === where.market);
        }
      }
      const sorted = filtered.sort((a, b) => b.observedAt - a.observedAt);
      return sorted[0] || null;
    }),
    create: jest.fn(async ({ data }) => {
      commodityIdCounter += 1;
      const c = {
        id: `00000000-0000-4000-d999-00000000000${commodityIdCounter}`,
        observedAt: new Date(data.observedAt || '2026-08-20T12:00:00.000Z'),
        ...data,
      };
      commodityPrices.push(c);
      return c;
    }),
  },
  economicIndicator: {
    findMany: jest.fn(async ({ where }) => {
      let filtered = [...economicIndicators];
      if (where) {
        const dateFilter = buildDateFilter(where.observedAt);
        filtered = filtered.filter(dateFilter);
        if (where.indicatorName) {
          filtered = filtered.filter((f) => f.indicatorName === where.indicatorName);
        }
      }
      return filtered.sort((a, b) => b.observedAt - a.observedAt);
    }),
    findFirst: jest.fn(async ({ where }) => {
      let filtered = [...economicIndicators];
      if (where) {
        if (where.indicatorName) {
          filtered = filtered.filter((f) => f.indicatorName === where.indicatorName);
        }
      }
      const sorted = filtered.sort((a, b) => b.observedAt - a.observedAt);
      return sorted[0] || null;
    }),
    create: jest.fn(async ({ data }) => {
      economicIdCounter += 1;
      const e = {
        id: `00000000-0000-4000-e999-00000000000${economicIdCounter}`,
        observedAt: new Date(data.observedAt || '2026-08-20T12:00:00.000Z'),
        ...data,
      };
      economicIndicators.push(e);
      return e;
    }),
  },
  portCongestion: {
    findFirst: jest.fn(async ({ where }) => {
      let filtered = [...portCongestions];
      if (where) {
        if (where.portId) {
          filtered = filtered.filter((f) => f.portId === where.portId);
        }
      }
      const sorted = filtered.sort((a, b) => new Date(b.observedAt) - new Date(a.observedAt));
      return sorted[0] || null;
    }),
    findMany: jest.fn(async ({ where } = {}) => {
      let filtered = [...portCongestions];
      if (where && where.portId) {
        filtered = filtered.filter((f) => f.portId === where.portId);
      }
      return filtered.sort((a, b) => new Date(b.observedAt) - new Date(a.observedAt));
    }),
    create: jest.fn(async ({ data }) => {
      congestionIdCounter += 1;
      const c = {
        id: `00000000-0000-4000-f999-00000000000${congestionIdCounter}`,
        observedAt: new Date(data.observedAt || '2026-08-20T12:00:00.000Z'),
        ...data,
      };
      portCongestions.push(c);
      return c;
    }),
  },
  forecastRecord: {
    findFirst: jest.fn(async ({ where }) => {
      let filtered = [...forecastRecords];
      if (where) {
        if (where.cargoRequestId) {
          filtered = filtered.filter((f) => f.cargoRequestId === where.cargoRequestId);
        }
      }
      const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
      return sorted[0] || null;
    }),
    create: jest.fn(async ({ data }) => {
      forecastIdCounter += 1;
      const record = {
        id: `00000000-0000-4000-b000-00000000000${forecastIdCounter}`,
        createdAt: new Date(),
        ...data,
      };
      forecastRecords.push(record);
      return record;
    }),
  },
  recommendation: {
    findUnique: jest.fn(async ({ where }) => {
      return recommendations.find((r) => r.id === where.id) || null;
    }),
    findMany: jest.fn(async ({ where }) => {
      let filtered = [...recommendations];
      if (where) {
        if (where.cargoRequestId) {
          filtered = filtered.filter((r) => r.cargoRequestId === where.cargoRequestId);
        }
      }
      return filtered.sort((a, b) => b.createdAt - a.createdAt);
    }),
    create: jest.fn(async ({ data }) => {
      recommendationIdCounter += 1;
      const record = {
        id: `00000000-0000-4000-f000-00000000000${recommendationIdCounter}`,
        createdAt: new Date(),
        ...data,
      };
      recommendations.push(record);
      return record;
    }),
  },
  costBreakdown: {
    findMany: jest.fn(async ({ where } = {}) => {
      let filtered = [...costBreakdowns];
      if (where && where.cargoRequestId) {
        filtered = filtered.filter((c) => c.cargoRequestId === where.cargoRequestId);
      }
      return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }),
    create: jest.fn(async ({ data }) => {
      costBreakdownIdCounter += 1;
      const record = {
        id: `00000000-0000-4000-e000-00000000000${costBreakdownIdCounter}`,
        createdAt: new Date(),
        ...data,
      };
      costBreakdowns.push(record);
      return record;
    }),
  },
  weatherObservation: {
    findMany: jest.fn(async ({ where } = {}) => {
      let filtered = [...weatherObservations];
      if (where && where.location && where.location.contains) {
        const term = where.location.contains.toLowerCase();
        filtered = filtered.filter((w) => w.location.toLowerCase().includes(term));
      }
      return filtered.sort((a, b) => new Date(b.observedAt) - new Date(a.observedAt));
    }),
    create: jest.fn(async ({ data }) => {
      weatherIdCounter += 1;
      const record = {
        id: `00000000-0000-4000-a999-00000000000${weatherIdCounter}`,
        stormIndicator: false,
        ...data,
      };
      weatherObservations.push(record);
      return record;
    }),
  },
  alert: {
    findUnique: jest.fn(async ({ where }) => {
      return alerts.find((a) => a.id === where.id) || null;
    }),
    findMany: jest.fn(async ({ where } = {}) => {
      let filtered = [...alerts];
      if (where && where.cargoRequestId) {
        filtered = filtered.filter((a) => a.cargoRequestId === where.cargoRequestId);
      }
      return filtered.sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));
    }),
    create: jest.fn(async ({ data }) => {
      alertIdCounter += 1;
      const record = {
        id: `00000000-0000-4000-b888-00000000000${alertIdCounter}`,
        triggeredAt: new Date(),
        ...data,
      };
      alerts.push(record);
      return record;
    }),
  },
  vessel: {
    findUnique: jest.fn(async ({ where }) => {
      return vessels.find((v) => v.id === where.id) || null;
    }),
    findMany: jest.fn(async ({ where } = {}) => {
      let filtered = [...vessels];
      if (where) {
        if (where.vesselType) {
          filtered = filtered.filter((v) => v.vesselType === where.vesselType);
        }
        if (where.availabilityStatus) {
          filtered = filtered.filter((v) => v.availabilityStatus === where.availabilityStatus);
        }
      }
      return filtered;
    }),
    create: jest.fn(async ({ data }) => {
      vesselIdCounter += 1;
      const vessel = {
        id: `00000000-0000-4000-c100-00000000000${vesselIdCounter}`,
        ...data,
      };
      vessels.push(vessel);
      return vessel;
    }),
    update: jest.fn(async ({ where, data }) => {
      const index = vessels.findIndex((v) => v.id === where.id);
      if (index === -1) return null;
      vessels[index] = { ...vessels[index], ...data };
      return vessels[index];
    }),
  },
  vesselAvailability: {
    findMany: jest.fn(async ({ where, orderBy } = {}) => {
      let filtered = [...vesselAvailabilities];
      if (where && where.vesselId) {
        filtered = filtered.filter((a) => a.vesselId === where.vesselId);
      }
      if (orderBy && orderBy.observedAt === 'desc') {
        filtered.sort((a, b) => new Date(b.observedAt) - new Date(a.observedAt));
      }
      return filtered;
    }),
    create: jest.fn(async ({ data }) => {
      vesselAvailabilityIdCounter += 1;
      const record = {
        id: `00000000-0000-4000-c200-00000000000${vesselAvailabilityIdCounter}`,
        ...data,
      };
      vesselAvailabilities.push(record);
      return record;
    }),
  },
  voyagePlan: {
    findUnique: jest.fn(async ({ where } = {}) => {
      return voyagePlans.find((p) => p.id === where.id) || null;
    }),
    findMany: jest.fn(async ({ where } = {}) => {
      let filtered = [...voyagePlans];
      if (where && where.cargoRequestId) {
        filtered = filtered.filter((p) => p.cargoRequestId === where.cargoRequestId);
      }
      return filtered.sort((a, b) => a.tripNumber - b.tripNumber);
    }),
    create: jest.fn(async ({ data }) => {
      voyagePlanIdCounter += 1;
      const record = {
        id: `00000000-0000-4000-c300-00000000000${voyagePlanIdCounter}`,
        ...data,
      };
      voyagePlans.push(record);
      return record;
    }),
    deleteMany: jest.fn(async ({ where } = {}) => {
      const before = voyagePlans.length;
      if (where && where.cargoRequestId) {
        voyagePlans = voyagePlans.filter((p) => p.cargoRequestId !== where.cargoRequestId);
      } else {
        voyagePlans = [];
      }
      return { count: before - voyagePlans.length };
    }),
  },

  $queryRaw: jest.fn(async () => [1]),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

module.exports = {
  prisma,
  checkDatabase: jest.fn(async () => 'connected'),
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
  resetUsers,
  resetPorts,
  resetCargo,
  resetMarket,
  resetVessels,
  resetVoyagePlans,
};
