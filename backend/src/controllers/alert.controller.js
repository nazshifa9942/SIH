const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { prisma } = require('../config/database');

const listAlerts = asyncHandler(async (req, res) => {
  const alerts = await prisma.alert.findMany({
    orderBy: { triggeredAt: 'desc' },
    take: 50,
    include: { cargoRequest: { select: { cargoType: true, status: true } } }
  });
  return sendSuccess(res, alerts, 'Alerts retrieved');
});

module.exports = { listAlerts };
