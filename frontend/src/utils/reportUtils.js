/**
 * reportUtils.js
 * Pure-frontend PDF and Excel export utilities.
 * All data is sourced from props passed by Reports.jsx — no backend calls made here.
 */

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// ─── helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (v) => {
  if (v === null || v === undefined || v === '') return 'N/A';
  const n = Number(v);
  return isNaN(n) ? 'N/A' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPct = (v) => {
  if (v === null || v === undefined) return 'N/A';
  const n = Number(v);
  return isNaN(n) ? 'N/A' : `${(n * 100).toFixed(1)}%`;
};

const safeStr = (v) => (v === null || v === undefined ? 'N/A' : String(v));

const getCargoReportFields = (cargo) => {
  const origin = cargo?.origin || cargo?.originPort?.name || cargo?.originPortId;
  const destination = cargo?.destination || cargo?.destinationPort?.name || cargo?.destinationPortId;
  return {
    route: cargo?.route || (origin && destination ? `${origin} -> ${destination}` : null),
    origin,
    destination,
    requiredDate: cargo?.requiredDeliveryDate || cargo?.requiredDate,
  };
};

const getRiskLevel = (factor) => {
  if (!factor) return 'N/A';
  if (typeof factor === 'string') return factor;
  if (typeof factor === 'number') return String(factor);
  if (typeof factor === 'object') {
    return factor.level || factor.riskLevel || factor.overallLevel || factor.status || factor.risk || 'N/A';
  }
  return 'N/A';
};

// ─── PDF helpers ───────────────────────────────────────────────────────────────

const DARK_BG   = [248, 250, 252];
const CARD_BG   = [226, 232, 240];
const ACCENT    = [194, 65, 12]; // readable orange brand accent
const WHITE     = [15, 23, 42];
const SECONDARY = [71, 85, 105];
const SUCCESS   = [5, 106, 54];
const WARNING   = [180, 83, 9];
const ERROR     = [185, 28, 28];
const INFO      = [29, 78, 216];

function pdfCover(doc, cargo, generatedAt) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, W, H, 'F');

  // accent bar
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, 6, H, 'F');

  // title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text('CARGO INTELLIGENCE', 16, 40);

  doc.setFontSize(18);
  doc.setTextColor(...ACCENT);
  doc.text('FULL REPORT', 16, 54);

  // divider
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(16, 60, W - 16, 60);

  // cargo details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...SECONDARY);

  const cargoFields = getCargoReportFields(cargo);
  const details = [
    ['Route',       cargoFields.route || 'N/A'],
    ['Cargo Type',  cargo?.cargoType || cargo?.cargo_type || 'N/A'],
    ['Quantity',    cargo?.quantityMt ? `${cargo.quantityMt} MT` : 'N/A'],
    ['Origin',      cargoFields.origin || 'N/A'],
    ['Destination', cargoFields.destination || 'N/A'],
    ['Required By', cargoFields.requiredDate ? new Date(cargoFields.requiredDate).toLocaleDateString() : 'N/A'],
    ['Status',      cargo?.status || 'N/A'],
  ];

  let y = 76;
  details.forEach(([label, value]) => {
    doc.setTextColor(...SECONDARY);
    doc.text(label, 16, y);
    doc.setTextColor(...WHITE);
    doc.text(safeStr(value), 90, y);
    y += 10;
  });

  // generated at
  doc.setFontSize(9);
  doc.setTextColor(...SECONDARY);
  doc.text(`Generated: ${generatedAt}`, 16, H - 14);
  doc.text('SIH 2026 · Cargo Intelligence Platform', W - 16, H - 14, { align: 'right' });
}

function pdfSectionHeader(doc, title, y) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...CARD_BG);
  doc.rect(10, y - 6, W - 20, 12, 'F');

  doc.setFillColor(...ACCENT);
  doc.rect(10, y - 6, 3, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text(title.toUpperCase(), 18, y + 2);

  return y + 14;
}

function pdfKV(doc, label, value, x, y, valueColor) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SECONDARY);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(valueColor || WHITE));
  doc.text(safeStr(value), x + 52, y);
  return y + 7;
}

function pdfCheckPage(doc, y, margin = 20) {
  if (y > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    doc.setFillColor(...DARK_BG);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, 6, doc.internal.pageSize.getHeight(), 'F');
    return 20;
  }
  return y;
}

// ─── build sections ────────────────────────────────────────────────────────────

function buildCargoSection(doc, cargo, yStart) {
  let y = yStart;
  y = pdfSectionHeader(doc, '01 · Cargo Information', y);

  if (!cargo) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...SECONDARY);
    doc.text('No cargo data available.', 16, y);
    return y + 10;
  }

  const cargoFields = getCargoReportFields(cargo);
  y = pdfKV(doc, 'Route',      cargoFields.route, 16, y);
  y = pdfKV(doc, 'Cargo Type', cargo.cargoType || cargo.cargo_type, 16, y);
  y = pdfKV(doc, 'Quantity',   cargo.quantityMt ? `${cargo.quantityMt} MT` : null, 16, y);
  y = pdfKV(doc, 'Origin',     cargoFields.origin, 16, y);
  y = pdfKV(doc, 'Destination',cargoFields.destination, 16, y);
  y = pdfKV(doc, 'Required By',cargoFields.requiredDate ? new Date(cargoFields.requiredDate).toLocaleDateString() : null, 16, y);
  y = pdfKV(doc, 'Status',     cargo.status, 16, y);
  return y + 6;
}

function buildForecastSection(doc, forecast, yStart) {
  let y = yStart;
  y = pdfCheckPage(doc, y);
  y = pdfSectionHeader(doc, '02 · Freight Forecast', y);

  if (!forecast) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...SECONDARY);
    doc.text('No forecast data available.', 16, y);
    return y + 10;
  }

  y = pdfKV(doc, 'Confidence',    formatPct(forecast.confidence), 16, y, SUCCESS);
  y = pdfKV(doc, 'Model Version', forecast.modelVersion, 16, y);
  y = pdfKV(doc, 'Horizon',       forecast.forecastJson?.length ? `${forecast.forecastJson.length} Days` : null, 16, y);

  const points = Array.isArray(forecast.forecastJson) ? forecast.forecastJson.slice(0, 5) : [];
  if (points.length) {
    y = pdfCheckPage(doc, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY);
    doc.text('Sample Forecast Data (first 5 days)', 16, y);
    y += 5;
    points.forEach((p) => {
      y = pdfCheckPage(doc, y);
      const d = p.date ? new Date(p.date).toLocaleDateString() : 'N/A';
      const r = p.predictedRate !== undefined ? Number(p.predictedRate).toLocaleString() : 'N/A';
      y = pdfKV(doc, d, r, 20, y);
    });
  }
  return y + 6;
}

function buildRiskSection(doc, risk, yStart) {
  let y = yStart;
  y = pdfCheckPage(doc, y);
  y = pdfSectionHeader(doc, '03 · Risk Analysis', y);

  if (!risk) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...SECONDARY);
    doc.text('No risk data available.', 16, y);
    return y + 10;
  }

  const overallRisk  = risk.overallLevel || risk.overallRisk || 'N/A';
  const riskColMap   = { HIGH: ERROR, MEDIUM: WARNING, LOW: SUCCESS };
  const overallColor = riskColMap[String(overallRisk).toUpperCase()] || WHITE;

  y = pdfKV(doc, 'Overall Risk',        overallRisk, 16, y, overallColor);
  y = pdfKV(doc, 'Review Required',     risk.reviewRequired ? 'YES' : 'NO', 16, y, risk.reviewRequired ? ERROR : SUCCESS);
  y = pdfKV(doc, 'Congestion',          getRiskLevel(risk.factors?.congestion), 16, y);
  y = pdfKV(doc, 'Weather',             getRiskLevel(risk.factors?.weather), 16, y);
  y = pdfKV(doc, 'Freight Volatility',  getRiskLevel(risk.factors?.freightVolatility), 16, y);
  y = pdfKV(doc, 'Vessel Availability', getRiskLevel(risk.factors?.vesselAvailability), 16, y);
  return y + 6;
}

function buildOptimizationSection(doc, optimization, yStart) {
  let y = yStart;
  y = pdfCheckPage(doc, y);
  y = pdfSectionHeader(doc, '04 · Vessel Optimization', y);

  if (!optimization) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...SECONDARY);
    doc.text('No optimization data available.', 16, y);
    return y + 10;
  }

  const first = optimization.voyagePlans?.[0];
  y = pdfKV(doc, 'Vessel',        first?.vessel?.name || 'N/A', 16, y, INFO);
  y = pdfKV(doc, 'Feasible',      optimization.feasible ? 'YES' : 'NO', 16, y, optimization.feasible ? SUCCESS : ERROR);
  y = pdfKV(doc, 'Trips',         optimization.numberOfTrips, 16, y);
  y = pdfKV(doc, 'Est. Cost',     optimization.totalEstimatedCost ? formatCurrency(optimization.totalEstimatedCost) : null, 16, y);
  y = pdfKV(doc, 'Quantity',      first?.plannedQuantityMt ? `${first.plannedQuantityMt} MT` : null, 16, y);
  return y + 6;
}

function buildCostSection(doc, cost, yStart) {
  let y = yStart;
  y = pdfCheckPage(doc, y);
  y = pdfSectionHeader(doc, '05 · Cost Breakdown', y);

  if (!cost) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...SECONDARY);
    doc.text('No cost data available.', 16, y);
    return y + 10;
  }

  y = pdfKV(doc, 'Total Cost',         formatCurrency(cost.totalCost), 16, y, WHITE);
  y = pdfKV(doc, 'Freight Cost',       formatCurrency(cost.freightCost), 16, y);
  y = pdfKV(doc, 'Fuel Cost',          formatCurrency(cost.fuelCost), 16, y);
  y = pdfKV(doc, 'Port Cost',          formatCurrency(cost.portCost), 16, y);
  y = pdfKV(doc, 'Handling Cost',      formatCurrency(cost.handlingCost), 16, y);
  y = pdfKV(doc, 'Delay Cost',         formatCurrency(cost.delayCost), 16, y);
  y = pdfKV(doc, 'Repositioning Cost', formatCurrency(cost.repositioningCost), 16, y);
  y = pdfKV(doc, 'Other Cost',         formatCurrency(cost.otherCost), 16, y);
  return y + 6;
}

function buildRecommendationSection(doc, recommendation, yStart) {
  let y = yStart;
  y = pdfCheckPage(doc, y);
  y = pdfSectionHeader(doc, '06 · Recommendation', y);

  if (!recommendation) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...SECONDARY);
    doc.text('No recommendation data available.', 16, y);
    return y + 10;
  }

  y = pdfKV(doc, 'Action',           recommendation.recommendedAction, 16, y, SUCCESS);
  y = pdfKV(doc, 'Confidence',       formatPct(recommendation.confidence), 16, y);
  y = pdfKV(doc, 'Expected Freight', recommendation.expectedFreight ? `${formatCurrency(recommendation.expectedFreight)} / MT` : null, 16, y);
  y = pdfKV(doc, 'Estimated Cost',   formatCurrency(recommendation.estimatedTotalCost), 16, y);
  y = pdfKV(doc, 'Risk Level',       recommendation.riskLevel, 16, y);
  y = pdfKV(doc, 'Strategy',         recommendation.contractStrategy, 16, y);

  if (recommendation.explanation) {
    y = pdfCheckPage(doc, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY);
    doc.text('Explanation:', 16, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...WHITE);
    const lines = doc.splitTextToSize(recommendation.explanation, 170);
    lines.forEach((line) => {
      y = pdfCheckPage(doc, y);
      doc.text(line, 16, y);
      y += 5;
    });
  }

  return y + 6;
}

function buildContractSection(doc, contract, yStart) {
  let y = yStart;
  y = pdfCheckPage(doc, y);
  y = pdfSectionHeader(doc, '07 · Contract Strategy', y);

  if (!contract) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...SECONDARY);
    doc.text('No contract data available.', 16, y);
    return y + 10;
  }

  const ref   = contract.referenceMetrics || {};
  const strat = Array.isArray(contract.strategies) ? contract.strategies : [];

  y = pdfKV(doc, 'Selection',        contract.selection?.status || 'N/A', 16, y);
  y = pdfKV(doc, 'Freight Unit Rate',contract.sufficiency?.freightUnitRate != null ? `$${Number(contract.sufficiency.freightUnitRate).toFixed(2)}` : null, 16, y);
  y = pdfKV(doc, 'Indicative Outlay',ref.indicativeFreightOutlay ? formatCurrency(ref.indicativeFreightOutlay) : null, 16, y);
  y = pdfKV(doc, 'Planned Trips',    ref.plannedTripCount, 16, y);
  y = pdfKV(doc, 'Est. Total Cost',  formatCurrency(ref.latestEstimatedTotalCost), 16, y);

  if (strat.length) {
    y = pdfCheckPage(doc, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY);
    doc.text('Contract Strategies:', 16, y);
    y += 5;

    strat.forEach((s) => {
      y = pdfCheckPage(doc, y);
      const colMap = { FAVORABLE: SUCCESS, UNFAVORABLE: ERROR };
      const col    = colMap[String(s.status || '').toUpperCase()] || SECONDARY;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...col);
      doc.text(`${String(s.strategy || '').replace(/_/g, ' ')} — ${s.status || 'N/A'}`, 20, y);
      y += 5;

      if (s.reason) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...SECONDARY);
        const lines = doc.splitTextToSize(s.reason, 160);
        lines.forEach((l) => {
          y = pdfCheckPage(doc, y);
          doc.text(l, 22, y);
          y += 4.5;
        });
      }
      y += 2;
    });
  }

  return y + 6;
}

// ─── Public: generate full PDF ─────────────────────────────────────────────────

export function generateFullPDF({ cargo, forecast, risk, optimization, cost, recommendation, contract }) {
  const doc          = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const generatedAt  = new Date().toLocaleString();

  // Page 1 — cover
  pdfCover(doc, cargo, generatedAt);

  // Content pages
  doc.addPage();
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, 6, doc.internal.pageSize.getHeight(), 'F');

  let y = 20;
  y = buildCargoSection(doc, cargo, y);
  y = buildForecastSection(doc, forecast, y);
  y = buildRiskSection(doc, risk, y);
  y = buildOptimizationSection(doc, optimization, y);
  y = buildCostSection(doc, cost, y);
  y = buildRecommendationSection(doc, recommendation, y);
  buildContractSection(doc, contract, y);

  doc.save(`cargo-report-${cargo?.id || 'export'}-${Date.now()}.pdf`);
}

// ─── Public: generate section-specific PDF ────────────────────────────────────

export function generateSectionPDF(sectionKey, data, cargo) {
  const doc         = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const generatedAt = new Date().toLocaleString();

  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, 6, doc.internal.pageSize.getHeight(), 'F');

  // mini header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text('CARGO INTELLIGENCE', 16, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SECONDARY);
  doc.text(getCargoReportFields(cargo).route || '', 16, 23);
  doc.text(`Generated: ${generatedAt}`, 16, 29);

  const builders = {
    cargo:          (y) => buildCargoSection(doc, data, y),
    forecast:       (y) => buildForecastSection(doc, data, y),
    risk:           (y) => buildRiskSection(doc, data, y),
    optimization:   (y) => buildOptimizationSection(doc, data, y),
    cost:           (y) => buildCostSection(doc, data, y),
    recommendation: (y) => buildRecommendationSection(doc, data, y),
    contract:       (y) => buildContractSection(doc, data, y),
  };

  const builder = builders[sectionKey];
  if (builder) builder(38);

  doc.save(`${sectionKey}-report-${cargo?.id || 'export'}-${Date.now()}.pdf`);
}

// ─── Public: generate full Excel workbook ─────────────────────────────────────

export function generateFullExcel({ cargo, forecast, risk, optimization, cost, recommendation, contract }) {
  const wb = XLSX.utils.book_new();

  // ── Cargo Sheet ──
  const cargoData = [
    ['Field', 'Value'],
    ['Route',          getCargoReportFields(cargo).route || ''],
    ['Cargo Type',     cargo?.cargoType || cargo?.cargo_type || ''],
    ['Quantity (MT)',  cargo?.quantityMt || ''],
    ['Origin',         getCargoReportFields(cargo).origin || ''],
    ['Destination',    getCargoReportFields(cargo).destination || ''],
    ['Required By',    getCargoReportFields(cargo).requiredDate ? new Date(getCargoReportFields(cargo).requiredDate).toLocaleDateString() : ''],
    ['Status',         cargo?.status || ''],
    ['Created At',     cargo?.createdAt ? new Date(cargo.createdAt).toLocaleDateString() : ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cargoData), 'Cargo');

  // ── Forecast Sheet ──
  const forecastRows = [['Date', 'Predicted Rate', 'Confidence', 'Model Version']];
  if (forecast?.forecastJson?.length) {
    forecast.forecastJson.forEach((p) => {
      forecastRows.push([
        p.date ? new Date(p.date).toLocaleDateString() : '',
        p.predictedRate ?? '',
        formatPct(forecast.confidence),
        forecast.modelVersion || '',
      ]);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(forecastRows), 'Forecast');

  // ── Risk Sheet ──
  const riskData = [
    ['Metric', 'Value'],
    ['Overall Risk',        risk?.overallLevel || risk?.overallRisk || ''],
    ['Review Required',     risk?.reviewRequired ? 'YES' : 'NO'],
    ['Congestion',          getRiskLevel(risk?.factors?.congestion)],
    ['Weather',             getRiskLevel(risk?.factors?.weather)],
    ['Freight Volatility',  getRiskLevel(risk?.factors?.freightVolatility)],
    ['Vessel Availability', getRiskLevel(risk?.factors?.vesselAvailability)],
    ['Disclaimer',          risk?.disclaimer || ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(riskData), 'Risk');

  // ── Optimization Sheet ──
  const first = optimization?.voyagePlans?.[0];
  const optData = [
    ['Metric', 'Value'],
    ['Vessel',       first?.vessel?.name || ''],
    ['Feasible',     optimization?.feasible ? 'YES' : 'NO'],
    ['No. of Trips', optimization?.numberOfTrips || ''],
    ['Est. Cost',    optimization?.totalEstimatedCost || ''],
    ['Quantity (MT)',first?.plannedQuantityMt || ''],
  ];
  if (optimization?.recommendedPlan?.length) {
    optData.push(['', '']);
    optData.push(['Trip #', 'Quantity (MT)']);
    optimization.recommendedPlan.forEach((t, i) => {
      optData.push([`Trip ${t.tripNumber || i + 1}`, t.quantityMT || '']);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(optData), 'Optimization');

  // ── Cost Sheet ──
  const costData = [
    ['Cost Item', 'Amount (USD)'],
    ['Total Cost',         cost?.totalCost || ''],
    ['Freight Cost',       cost?.freightCost || ''],
    ['Fuel Cost',          cost?.fuelCost || ''],
    ['Port Cost',          cost?.portCost || ''],
    ['Handling Cost',      cost?.handlingCost || ''],
    ['Delay Cost',         cost?.delayCost || ''],
    ['Repositioning Cost', cost?.repositioningCost || ''],
    ['Other Cost',         cost?.otherCost || ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(costData), 'Cost');

  // ── Recommendation Sheet ──
  const recData = [
    ['Metric', 'Value'],
    ['Action',           recommendation?.recommendedAction || ''],
    ['Confidence',       recommendation?.confidence != null ? (recommendation.confidence * 100).toFixed(1) + '%' : ''],
    ['Expected Freight', recommendation?.expectedFreight || ''],
    ['Estimated Cost',   recommendation?.estimatedTotalCost || ''],
    ['Risk Level',       recommendation?.riskLevel || ''],
    ['Strategy',         recommendation?.contractStrategy || ''],
    ['Explanation',      recommendation?.explanation || ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(recData), 'Recommendation');

  // ── Contract Sheet ──
  const contractRows = [['Strategy', 'Status', 'Reason']];
  if (contract?.strategies?.length) {
    contract.strategies.forEach((s) => {
      contractRows.push([
        String(s.strategy || '').replace(/_/g, ' '),
        s.status || '',
        s.reason || '',
      ]);
    });
  }
  contractRows.push(['', '', '']);
  contractRows.push(['Reference Metric', 'Value', '']);
  const ref = contract?.referenceMetrics || {};
  contractRows.push(['Freight Unit Rate',         contract?.sufficiency?.freightUnitRate || '', '']);
  contractRows.push(['Indicative Freight Outlay', ref.indicativeFreightOutlay || '', '']);
  contractRows.push(['Planned Trip Count',         ref.plannedTripCount || '', '']);
  contractRows.push(['Est. Total Cost',            ref.latestEstimatedTotalCost || '', '']);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contractRows), 'Contract');

  XLSX.writeFile(wb, `cargo-report-${cargo?.id || 'export'}-${Date.now()}.xlsx`);
}

// ─── Public: single-section Excel ─────────────────────────────────────────────

export function generateSectionExcel(sectionKey, data, cargo) {
  const wb      = XLSX.utils.book_new();
  const cargoId = cargo?.id || 'export';

  const sheetBuilders = {
    cargo: () => {
      const rows = [
        ['Field', 'Value'],
        ['Route',         getCargoReportFields(data).route || ''],
        ['Cargo Type',    data?.cargoType || data?.cargo_type || ''],
        ['Quantity (MT)', data?.quantityMt || ''],
        ['Origin',        getCargoReportFields(data).origin || ''],
        ['Destination',   getCargoReportFields(data).destination || ''],
        ['Required By',   getCargoReportFields(data).requiredDate ? new Date(getCargoReportFields(data).requiredDate).toLocaleDateString() : ''],
        ['Status',        data?.status || ''],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Cargo');
    },
    forecast: () => {
      const rows = [['Date', 'Predicted Rate']];
      if (data?.forecastJson?.length) {
        data.forecastJson.forEach((p) => {
          rows.push([p.date ? new Date(p.date).toLocaleDateString() : '', p.predictedRate ?? '']);
        });
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Forecast');
    },
    risk: () => {
      const rows = [
        ['Metric', 'Value'],
        ['Overall Risk',        data?.overallLevel || data?.overallRisk || ''],
        ['Review Required',     data?.reviewRequired ? 'YES' : 'NO'],
        ['Congestion',          getRiskLevel(data?.factors?.congestion)],
        ['Weather',             getRiskLevel(data?.factors?.weather)],
        ['Freight Volatility',  getRiskLevel(data?.factors?.freightVolatility)],
        ['Vessel Availability', getRiskLevel(data?.factors?.vesselAvailability)],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Risk');
    },
    optimization: () => {
      const first = data?.voyagePlans?.[0];
      const rows  = [
        ['Metric', 'Value'],
        ['Vessel',       first?.vessel?.name || ''],
        ['Feasible',     data?.feasible ? 'YES' : 'NO'],
        ['No. of Trips', data?.numberOfTrips || ''],
        ['Est. Cost',    data?.totalEstimatedCost || ''],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Optimization');
    },
    cost: () => {
      const rows = [
        ['Cost Item', 'Amount (USD)'],
        ['Total Cost',         data?.totalCost || ''],
        ['Freight Cost',       data?.freightCost || ''],
        ['Fuel Cost',          data?.fuelCost || ''],
        ['Port Cost',          data?.portCost || ''],
        ['Handling Cost',      data?.handlingCost || ''],
        ['Delay Cost',         data?.delayCost || ''],
        ['Repositioning Cost', data?.repositioningCost || ''],
        ['Other Cost',         data?.otherCost || ''],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Cost');
    },
    recommendation: () => {
      const rows = [
        ['Metric', 'Value'],
        ['Action',           data?.recommendedAction || ''],
        ['Confidence',       data?.confidence != null ? (data.confidence * 100).toFixed(1) + '%' : ''],
        ['Expected Freight', data?.expectedFreight || ''],
        ['Estimated Cost',   data?.estimatedTotalCost || ''],
        ['Risk Level',       data?.riskLevel || ''],
        ['Strategy',         data?.contractStrategy || ''],
        ['Explanation',      data?.explanation || ''],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Recommendation');
    },
    contract: () => {
      const rows = [['Strategy', 'Status', 'Reason']];
      if (data?.strategies?.length) {
        data.strategies.forEach((s) => rows.push([String(s.strategy || '').replace(/_/g, ' '), s.status || '', s.reason || '']));
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Contract');
    },
  };

  const builder = sheetBuilders[sectionKey];
  if (builder) builder();

  XLSX.writeFile(wb, `${sectionKey}-report-${cargoId}-${Date.now()}.xlsx`);
}
