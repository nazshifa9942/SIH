function toNumber(value) {
  return parseFloat(value);
}

function checkDimension(code, vesselValue, portLimit, vesselId, portId, label) {
  const vesselMetric = toNumber(vesselValue);
  const limit = toNumber(portLimit);
  const passed = vesselMetric <= limit;
  return {
    code,
    vesselId,
    portId,
    passed,
    message: passed
      ? `${label} within port limit`
      : `${label} exceeds port limit (${vesselMetric} > ${limit})`,
  };
}

function evaluateVesselAtPort(vessel, port) {
  if (!vessel || !port) {
    return { passed: false, checks: [] };
  }

  const checks = [
    checkDimension('DRAFT', vessel.draftM, port.maxDraftM, vessel.id, port.id, 'Draft'),
    checkDimension('LOA', vessel.loaM, port.maxLoaM, vessel.id, port.id, 'LOA'),
    checkDimension('BEAM', vessel.beamM, port.maxBeamM, vessel.id, port.id, 'Beam'),
  ];

  return {
    passed: checks.every((check) => check.passed),
    checks,
  };
}

function evaluateVesselForRoute(vessel, originPort, destinationPort) {
  const origin = evaluateVesselAtPort(vessel, originPort);
  const destination = evaluateVesselAtPort(vessel, destinationPort);
  const checks = [...origin.checks, ...destination.checks];
  return {
    vesselId: vessel.id,
    passed: origin.passed && destination.passed,
    checks,
  };
}

function evaluateCandidates(vessels, originPort, destinationPort) {
  const results = (vessels || []).map((vessel) =>
    evaluateVesselForRoute(vessel, originPort, destinationPort)
  );
  const constraintChecks = results.flatMap((result) => result.checks);
  const feasibleVesselIds = new Set(results.filter((result) => result.passed).map((result) => result.vesselId));
  const feasibleVessels = (vessels || []).filter((vessel) => feasibleVesselIds.has(vessel.id));

  return {
    feasibleVessels,
    constraintChecks,
    results,
  };
}

module.exports = {
  evaluateVesselAtPort,
  evaluateVesselForRoute,
  evaluateCandidates,
};
