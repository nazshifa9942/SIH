import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  TrendingUp,
  ShieldAlert,
  Ship,
  DollarSign,
  Star,
  FileStack,
} from 'lucide-react';

import { Button } from '../../../../components/ui/Button';

// API imports
import { getCargo } from '../../../../api/cargo';
import { getForecastByCargoRequestId } from '../../../../api/forecast';
import { getRiskByCargoRequestId } from '../../../../api/risk';
import { getCostByCargoRequestId } from '../../../../api/cost';
import { getRecommendationHistory } from '../../../../api/recommendation';
import { getContractByCargoRequestId } from '../../../../api/contract';

// Report utils
import {
  generateFullPDF,
  generateSectionPDF,
  generateFullExcel,
  generateSectionExcel,
} from '../../../../utils/reportUtils';

// ─── Section config ────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key: 'cargo',
    label: 'Cargo Report',
    description: 'Cargo request details, route, quantity and status.',
    icon: Package,
    color: 'var(--color-status-info)',
  },
  {
    key: 'forecast',
    label: 'Forecast Report',
    description:
      'Freight rate forecast data, trend and confidence metrics.',
    icon: TrendingUp,
    color: '#86efac',
  },
  {
    key: 'risk',
    label: 'Risk Report',
    description:
      'Risk analysis factors: weather, congestion, volatility and vessel availability.',
    icon: ShieldAlert,
    color: 'var(--color-status-warning)',
  },
  {
    key: 'optimization',
    label: 'Optimization Report',
    description:
      'Optimized vessel plan, trip allocation and feasibility assessment.',
    icon: Ship,
    color: 'var(--color-status-info)',
  },
  {
    key: 'cost',
    label: 'Cost Report',
    description:
      'Full cost breakdown: freight, fuel, port, handling, demurrage, repositioning.',
    icon: DollarSign,
    color: '#86efac',
  },
  {
    key: 'recommendation',
    label: 'Recommendation Report',
    description:
      'AI procurement recommendation with confidence score and explanation.',
    icon: Star,
    color: 'var(--color-brand-accent, #f97316)',
  },
  {
    key: 'contract',
    label: 'Contract Report',
    description:
      'Contract strategy comparison: SPOT, SHORT-TERM, MULTIPLE VOYAGE, LONG-TERM.',
    icon: FileStack,
    color: 'var(--color-status-info)',
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const StatusDot = ({ available }) =>
  available ? (
    <CheckCircle2 className="w-4 h-4 text-[var(--color-status-success)] flex-shrink-0" />
  ) : (
    <AlertCircle className="w-4 h-4 text-[var(--color-brand-text-secondary)] flex-shrink-0" />
  );

const DataBadge = ({ available }) => (
  <span
    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
      available
        ? 'bg-emerald-600 text-[var(--color-brand-text-primary)]'
        : 'bg-slate-100 text-[var(--color-brand-text-secondary)]'
    }`}
  >
    {available ? 'DATA READY' : 'NO DATA'}
  </span>
);

// ─── Component ─────────────────────────────────────────────────────────────────

export const Reports = ({
  cargoId,
  cargo: propCargo,
  optimization: propOpt,
}) => {
  // ── data state ──
  const [data, setData] = useState({
    cargo: null,
    forecast: null,
    risk: null,
    optimization: null,
    cost: null,
    recommendation: null,
    contract: null,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState('');

  // ── fetch all data ──
  const fetchAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const results = {};

      // ─────────────────────────────────────────────────────────────
      // Cargo
      // ─────────────────────────────────────────────────────────────
      try {
        results.cargo =
          propCargo || (await getCargo(cargoId));
      } catch {
        results.cargo = propCargo || null;
      }

      // ─────────────────────────────────────────────────────────────
      // Forecast
      // ─────────────────────────────────────────────────────────────
      try {
        const f =
          await getForecastByCargoRequestId(cargoId);

        results.forecast =
          f?.forecastJson
            ? f
            : null;
      } catch {
        results.forecast = null;
      }

      // ─────────────────────────────────────────────────────────────
      // Risk
      // ─────────────────────────────────────────────────────────────
      try {
        const r =
          await getRiskByCargoRequestId(cargoId);

        results.risk =
          r?.overallRisk || r?.overallLevel
            ? r
            : null;
      } catch {
        results.risk = null;
      }

      // ─────────────────────────────────────────────────────────────
      // Optimization
      // ─────────────────────────────────────────────────────────────
      let optData = propOpt || null;

      if (!optData && cargoId) {
        try {
          const savedOpt =
            sessionStorage.getItem(
              `maritime_opt_${cargoId}`
            );

          if (savedOpt) {
            optData = JSON.parse(savedOpt);
          }
        } catch {
          optData = null;
        }
      }

      results.optimization = optData;

      // ─────────────────────────────────────────────────────────────
      // Cost
      // ─────────────────────────────────────────────────────────────
      try {
        const c =
          await getCostByCargoRequestId(cargoId);

        const latest = Array.isArray(c)
          ? c[0]
          : c?.costBreakdown || c;

        results.cost =
          latest?.totalCost !== null &&
          latest?.totalCost !== undefined
            ? latest
            : null;
      } catch {
        results.cost = null;
      }

      // ─────────────────────────────────────────────────────────────
      // Recommendation
      // ─────────────────────────────────────────────────────────────
      try {
        const history =
          await getRecommendationHistory(cargoId);

        results.recommendation =
          Array.isArray(history) &&
          history.length > 0
            ? history[0]
            : null;
      } catch {
        results.recommendation = null;
      }

      // ─────────────────────────────────────────────────────────────
      // Contract
      // ─────────────────────────────────────────────────────────────
      try {
        const ct =
          await getContractByCargoRequestId(cargoId);

        results.contract = ct || null;
      } catch {
        results.contract = null;
      }

      setData((prev) => ({
        ...prev,
        ...results,
      }));

      setLoading(false);
      setRefreshing(false);
    },
    [cargoId, propCargo]
  );

  useEffect(() => {
    if (cargoId) {
      fetchAll();
    }
  }, [cargoId, fetchAll]);

  // ── export handlers ──

  const handleFullPDF = async () => {
    setExporting('pdf');
    setExportError('');

    try {
      await generateFullPDF(data);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportError(
        'PDF export failed. Please try again.'
      );
    } finally {
      setExporting(null);
    }
  };

  const handleFullExcel = async () => {
    setExporting('excel');
    setExportError('');

    try {
      await generateFullExcel(data);
    } catch (err) {
      console.error('Excel export failed:', err);
      setExportError(
        'Excel export failed. Please try again.'
      );
    } finally {
      setExporting(null);
    }
  };

  const handleSectionPDF = async (
    sectionKey,
    sectionData
  ) => {
    setExporting(`pdf-${sectionKey}`);
    setExportError('');

    try {
      await generateSectionPDF(
        sectionKey,
        sectionData,
        data.cargo
      );
    } catch (err) {
      console.error(
        `Section PDF export failed for ${sectionKey}:`,
        err
      );

      setExportError(
        `${sectionKey} PDF export failed. Please try again.`
      );
    } finally {
      setExporting(null);
    }
  };

  const handleSectionExcel = async (
    sectionKey,
    sectionData
  ) => {
    setExporting(`excel-${sectionKey}`);
    setExportError('');

    try {
      await generateSectionExcel(
        sectionKey,
        sectionData,
        data.cargo
      );
    } catch (err) {
      console.error(
        `Section Excel export failed for ${sectionKey}:`,
        err
      );

      setExportError(
        `${sectionKey} Excel export failed. Please try again.`
      );
    } finally {
      setExporting(null);
    }
  };

  // ── resolve section data ──

  const getSectionData = (key) => {
    const map = {
      cargo: data.cargo,
      forecast: data.forecast,
      risk: data.risk,
      optimization: data.optimization,
      cost: data.cost,
      recommendation: data.recommendation,
      contract: data.contract,
    };

    return map[key] ?? null;
  };

  const availableCount =
    Object.values(data).filter(Boolean).length;

  const totalSections = SECTIONS.length;

  // ── loading state ──

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-4 text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-brand-border)]/30" />

        <span className="text-sm text-[var(--color-brand-text-primary)] uppercase tracking-wider">
          Collecting report data...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">

      {/* ─────────────────────────────────────────────────────────── */}
      {/* PAGE HEADER */}
      {/* ─────────────────────────────────────────────────────────── */}

      <div className="border-b border-[var(--color-brand-border-strong)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gov-saffron)]">
          Stage 08 · Record & Export
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-brand-text-primary)]">
          Cargo Intelligence Reports
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-brand-text-primary)]">
          Review the completed cargo assessment and export the available sections for official review, procurement records, and follow-up action.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* HEADER */}
      {/* ─────────────────────────────────────────────────────────── */}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-sm uppercase font-bold tracking-wider text-[var(--color-brand-text-primary)] mb-1">
            REPORTS & EXPORT
          </div>

          <div className="text-2xl font-black text-[var(--color-brand-text-primary)] tracking-wider">
            {data.cargo?.route || 'CARGO REPORT'}
          </div>

          <div className="text-sm text-[var(--color-brand-text-primary)] mt-1">
            {availableCount} of {totalSections} sections have data available
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />

            {refreshing
              ? 'REFRESHING...'
              : 'REFRESH DATA'}
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* EXPORT ERROR */}
      {/* ─────────────────────────────────────────────────────────── */}

      {exportError && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
          {exportError}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* DATA AVAILABILITY */}
      {/* ─────────────────────────────────────────────────────────── */}

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {SECTIONS.map((section) => {
          const available = Boolean(
            getSectionData(section.key)
          );

          const Icon = section.icon;

          return (
            <div
              key={section.key}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
              style={{
                borderColor: available
                  ? `${section.color}40`
                  : 'var(--color-brand-border)',

                backgroundColor: available
                  ? `color-mix(in srgb, ${section.color} 5%, transparent)`
                  : 'transparent',
              }}
            >
              <Icon
                className="w-5 h-5"
                style={{
                  color: available
                    ? section.color
                    : 'var(--color-brand-text-secondary)',
                }}
              />

              <div className="text-xs uppercase font-bold text-center text-[var(--color-brand-text-primary)] leading-tight">
                {section.key}
              </div>

              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: available
                    ? section.color
                    : 'rgba(255,255,255,0.1)',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* FULL EXPORT */}
      {/* ─────────────────────────────────────────────────────────── */}

      <div className="p-5 rounded-2xl border border-[var(--color-brand-border)]/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent">
        <div className="text-sm uppercase font-bold tracking-wider text-[var(--color-brand-text-primary)] mb-3">
          FULL REPORT EXPORT
        </div>

        <p className="text-sm text-[var(--color-brand-text-primary)] mb-5 leading-6">
          Export the complete cargo intelligence report covering all{' '}
          <span className="text-[var(--color-brand-text-primary)] font-bold">
            {totalSections} sections
          </span>{' '}
          in a single file. Sections without data will be noted as unavailable.
        </p>

        <div className="flex flex-wrap gap-3">

          {/* PDF */}

          <button
            onClick={handleFullPDF}
            disabled={exporting === 'pdf'}
            className="
              flex items-center gap-2 px-5 py-3 rounded-xl
              font-bold text-xs uppercase tracking-widest
              transition-all
              bg-[#ef4444]/15
              border border-[#ef4444]/30
              text-[#ef4444]
              hover:bg-[#ef4444]/25
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <FileText className="w-4 h-4" />

            {exporting === 'pdf'
              ? 'GENERATING PDF...'
              : 'EXPORT FULL PDF'}
          </button>

          {/* Excel */}

          <button
            onClick={handleFullExcel}
            disabled={exporting === 'excel'}
            className="
              flex items-center gap-2 px-5 py-3 rounded-xl
              font-bold text-xs uppercase tracking-widest
              transition-all
              bg-[var(--color-status-success-bg)]
              border-[#abefc6]
              text-[var(--color-status-success)]
              hover:bg-emerald-100
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <FileSpreadsheet className="w-4 h-4" />

            {exporting === 'excel'
              ? 'GENERATING EXCEL...'
              : 'EXPORT FULL EXCEL'}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SECTION REPORTS */}
      {/* ─────────────────────────────────────────────────────────── */}

      <div>
        <div className="text-sm uppercase font-bold tracking-wider text-[var(--color-brand-text-primary)] mb-4">
          SECTION REPORTS
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((section) => {
            const sectionData =
              getSectionData(section.key);

            const available = Boolean(sectionData);

            const Icon = section.icon;

            const isPDFBusy =
              exporting === `pdf-${section.key}`;

            const isXLBusy =
              exporting === `excel-${section.key}`;

            return (
              <div
                key={section.key}
                className="p-4 rounded-xl border transition-all"
                style={{
                  borderColor: available
                    ? `${section.color}30`
                    : 'var(--color-brand-border)',

                  backgroundColor: available
                    ? `color-mix(in srgb, ${section.color} 4%, transparent)`
                    : 'transparent',
                }}
              >
                {/* section header */}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">

                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: available
                          ? `color-mix(in srgb, ${section.color} 15%, transparent)`
                          : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{
                          color: available
                            ? section.color
                            : 'var(--color-brand-text-secondary)',
                        }}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-bold text-[var(--color-brand-text-primary)]">
                        {section.label}
                      </div>

                      <div className="text-xs text-[var(--color-brand-text-primary)] mt-1 leading-5">
                        {section.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 ml-2">
                    <StatusDot
                      available={available}
                    />

                    <DataBadge
                      available={available}
                    />
                  </div>
                </div>

                {/* section preview */}

                {available && (
                  <SectionPreview
                    sectionKey={section.key}
                    sectionData={sectionData}
                    color={section.color}
                  />
                )}

                {/* export buttons */}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() =>
                      handleSectionPDF(
                        section.key,
                        sectionData
                      )
                    }
                    disabled={
                      !available || isPDFBusy
                    }
                    className="
                      flex items-center gap-1.5
                      px-3 py-1.5 rounded-lg
                      text-[11px] font-bold uppercase
                      tracking-wider transition-all
                      bg-[#ef4444]/10
                      border border-[#ef4444]/20
                      text-[#ef4444]
                      hover:bg-[#ef4444]/20
                      disabled:opacity-30
                      disabled:cursor-not-allowed
                    "
                  >
                    <FileText className="w-3 h-3" />

                    {isPDFBusy
                      ? 'PDF...'
                      : 'PDF'}
                  </button>

                  <button
                    onClick={() =>
                      handleSectionExcel(
                        section.key,
                        sectionData
                      )
                    }
                    disabled={
                      !available || isXLBusy
                    }
                    className="
                      flex items-center gap-1.5
                      px-3 py-1.5 rounded-lg
                      text-[11px] font-bold uppercase
                      tracking-wider transition-all
                      bg-[var(--color-status-success-bg)]
                      border-[#d1fadf]
                      text-[var(--color-status-success)]
                      hover:bg-emerald-100
                      disabled:opacity-30
                      disabled:cursor-not-allowed
                    "
                  >
                    <FileSpreadsheet className="w-3 h-3" />

                    {isXLBusy
                      ? 'EXCEL...'
                      : 'EXCEL'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* FOOTER */}
      {/* ─────────────────────────────────────────────────────────── */}

      <div className="text-sm text-[var(--color-brand-text-primary)] border-t border-slate-500/50 pt-4 leading-6">
        All reports are generated client-side using the latest data fetched from the backend.
        PDF exports are formatted for A4 print. Excel exports include one sheet per section.
        Reports are named with cargo ID and timestamp for traceability.
      </div>
    </div>
  );
};

// ─── Section preview ───────────────────────────────────────────────────────────

function SectionPreview({
  sectionKey,
  sectionData,
  color,
}) {
  const Kv = ({ label, value }) => (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)]">
        {label}
      </span>

      <span className="text-[11px] font-bold text-[var(--color-brand-text-primary)] truncate max-w-[55%] text-right">
        {value !== null &&
        value !== undefined &&
        value !== ''
          ? value
          : 'N/A'}
      </span>
    </div>
  );

  // ───────────────────────────────────────────────────────────────
  // Currency formatter
  // ───────────────────────────────────────────────────────────────

  const fmt = (v) => {
    if (
      v === null ||
      v === undefined ||
      v === ''
    ) {
      return 'N/A';
    }

    const n = Number(v);

    if (Number.isNaN(n)) {
      return String(v);
    }

    return `$${n.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // ───────────────────────────────────────────────────────────────
  // Risk formatter
  // ───────────────────────────────────────────────────────────────

  const getRisk = (factor) => {
    if (!factor) {
      return 'N/A';
    }

    if (typeof factor === 'string') {
      return factor;
    }

    return (
      factor.level ||
      factor.riskLevel ||
      factor.status ||
      'N/A'
    );
  };

  // ───────────────────────────────────────────────────────────────
  // Cargo route resolver
  // ───────────────────────────────────────────────────────────────

  const getCargoRoute = () => {
    if (!sectionData) {
      return null;
    }

    // Direct route field
    if (
      typeof sectionData.route === 'string' &&
      sectionData.route.trim()
    ) {
      return sectionData.route;
    }

    // Possible origin fields
    const origin =
      sectionData.originPort?.name ||
      sectionData.originPort?.portName ||
      sectionData.originPort?.port_name ||
      sectionData.originPortName ||
      sectionData.origin ||
      sectionData.originPortCode;

    // Possible destination fields
    const destination =
      sectionData.destinationPort?.name ||
      sectionData.destinationPort?.portName ||
      sectionData.destinationPort?.port_name ||
      sectionData.destinationPortName ||
      sectionData.destination ||
      sectionData.destinationPortCode;

    if (origin && destination) {
      return `${origin} → ${destination}`;
    }

    return null;
  };

  // ───────────────────────────────────────────────────────────────
  // Forecast resolver
  // ───────────────────────────────────────────────────────────────

  const getForecastDetails = () => {
    const forecastJson =
      sectionData?.forecastJson;

    let forecastRate = null;
    let dataPoints = 0;
    let forecastDate = null;

    // REAL XGBoost object format
    //
    // {
    //   predictedFreightRate: 11.0463,
    //   forecastDate: "2026-09-20"
    // }

    if (
      forecastJson &&
      !Array.isArray(forecastJson) &&
      Number.isFinite(
        Number(
          forecastJson.predictedFreightRate
        )
      )
    ) {
      forecastRate =
        Number(
          forecastJson.predictedFreightRate
        );

      forecastDate =
        forecastJson.forecastDate ||
        null;

      dataPoints = 1;
    }

    // Legacy / multi-point forecast format

    else if (
      Array.isArray(forecastJson) &&
      forecastJson.length > 0
    ) {
      dataPoints =
        forecastJson.length;

      const validRates =
        forecastJson
          .map((point) => {
            if (!point) {
              return NaN;
            }

            const rate =
              point.predictedRate ??
              point.predictedFreightRate;

            return Number(rate);
          })
          .filter((rate) =>
            Number.isFinite(rate)
          );

      if (validRates.length > 0) {
        forecastRate =
          validRates.reduce(
            (sum, rate) =>
              sum + rate,
            0
          ) / validRates.length;
      }

      const lastPoint =
        forecastJson[
          forecastJson.length - 1
        ];

      forecastDate =
        lastPoint?.forecastDate ||
        lastPoint?.date ||
        null;
    }

    return {
      forecastRate,
      dataPoints,
      forecastDate,
    };
  };

  // ───────────────────────────────────────────────────────────────
  // Confidence formatter
  // ───────────────────────────────────────────────────────────────

  const formatConfidence = (confidence) => {
    if (
      confidence === null ||
      confidence === undefined ||
      confidence === ''
    ) {
      return null;
    }

    const numericConfidence =
      Number(confidence);

    if (
      !Number.isFinite(
        numericConfidence
      )
    ) {
      return null;
    }

    return `${(
      numericConfidence * 100
    ).toFixed(1)}%`;
  };

  // ───────────────────────────────────────────────────────────────
  // Section previews
  // ───────────────────────────────────────────────────────────────

  const previews = {

    // ─────────────────────────────────────────────
    // CARGO
    // ─────────────────────────────────────────────

    cargo: () => (
      <div className="space-y-0.5 px-1 py-1 rounded bg-white/[0.03] border border-[var(--color-brand-border)]/[0.04]">

        <Kv
          label="Route"
          value={getCargoRoute()}
        />

        <Kv
          label="Quantity"
          value={
            sectionData.quantityMt
              ? `${Number(
                  sectionData.quantityMt
                ).toLocaleString()} MT`
              : null
          }
        />

        <Kv
          label="Status"
          value={sectionData.status}
        />

      </div>
    ),

    // ─────────────────────────────────────────────
    // FORECAST
    // ─────────────────────────────────────────────

    forecast: () => {
      const {
        forecastRate,
        dataPoints,
        forecastDate,
      } =
        getForecastDetails();

      return (
        <div className="space-y-0.5 px-1 py-1 rounded bg-white/[0.03] border border-[var(--color-brand-border)]/[0.04]">

          <Kv
            label="Confidence"
            value={formatConfidence(
              sectionData.confidence
            )}
          />

          <Kv
            label="Data Points"
            value={
              dataPoints > 0
                ? `${dataPoints} ${
                    dataPoints === 1
                      ? 'day'
                      : 'days'
                  }`
                : null
            }
          />

          <Kv
            label="Last Rate"
            value={
              forecastRate !== null
                ? `$${forecastRate.toFixed(
                    2
                  )} / MT`
                : null
            }
          />

          {forecastDate && (
            <Kv
              label="Forecast Date"
              value={new Date(
                forecastDate
              ).toLocaleDateString(
                'en-US'
              )}
            />
          )}

        </div>
      );
    },

    // ─────────────────────────────────────────────
    // RISK
    // ─────────────────────────────────────────────

    risk: () => (
      <div className="space-y-0.5 px-1 py-1 rounded bg-white/[0.03] border border-[var(--color-brand-border)]/[0.04]">

        <Kv
          label="Overall"
          value={
            sectionData.overallLevel ||
            sectionData.overallRisk
          }
        />

        <Kv
          label="Weather"
          value={getRisk(
            sectionData.factors?.weather
          )}
        />

        <Kv
          label="Congestion"
          value={getRisk(
            sectionData.factors?.congestion
          )}
        />

      </div>
    ),

    // ─────────────────────────────────────────────
    // OPTIMIZATION
    // ─────────────────────────────────────────────

    optimization: () => {
      const first =
        sectionData.voyagePlans?.[0];

      const trips =
        sectionData.numberOfTrips ??
        sectionData.recommendedPlan?.length ??
        sectionData.voyagePlans?.length ??
        0;

      const feasible =
        sectionData.feasible;

      return (
        <div className="space-y-0.5 px-1 py-1 rounded bg-white/[0.03] border border-[var(--color-brand-border)]/[0.04]">

          <Kv
            label="Vessel"
            value={
              first?.vessel?.name ||
              sectionData
                .recommendedPlan?.[0]
                ?.vesselName
            }
          />

          <Kv
            label="Feasible"
            value={
              feasible === true
                ? 'YES'
                : feasible === false
                  ? 'NO'
                  : null
            }
          />

          <Kv
            label="Trips"
            value={trips}
          />

        </div>
      );
    },

    // ─────────────────────────────────────────────
    // COST
    // ─────────────────────────────────────────────

    cost: () => (
      <div className="space-y-0.5 px-1 py-1 rounded bg-white/[0.03] border border-[var(--color-brand-border)]/[0.04]">

        <Kv
          label="Total"
          value={fmt(
            sectionData.totalCost
          )}
        />

        <Kv
          label="Freight"
          value={fmt(
            sectionData.freightCost
          )}
        />

        <Kv
          label="Fuel"
          value={fmt(
            sectionData.fuelCost
          )}
        />

      </div>
    ),

    // ─────────────────────────────────────────────
    // RECOMMENDATION
    // ─────────────────────────────────────────────

    recommendation: () => (
      <div className="space-y-0.5 px-1 py-1 rounded bg-white/[0.03] border border-[var(--color-brand-border)]/[0.04]">

        <Kv
          label="Action"
          value={
            sectionData.recommendedAction
          }
        />

        <Kv
          label="Confidence"
          value={formatConfidence(
            sectionData.confidence
          )}
        />

        <Kv
          label="Risk Level"
          value={
            sectionData.riskLevel
          }
        />

      </div>
    ),

    // ─────────────────────────────────────────────
    // CONTRACT
    // ─────────────────────────────────────────────

    contract: () => {
      const strats =
        Array.isArray(
          sectionData.strategies
        )
          ? sectionData.strategies
          : [];

      const fav =
        strats.filter(
          (s) =>
            String(
              s.status || ''
            ).toUpperCase() ===
            'FAVORABLE'
        );

      return (
        <div className="space-y-0.5 px-1 py-1 rounded bg-white/[0.03] border border-[var(--color-brand-border)]/[0.04]">

          <Kv
            label="Strategies"
            value={strats.length}
          />

          <Kv
            label="Favorable"
            value={fav.length}
          />

          <Kv
            label="Est. Cost"
            value={fmt(
              sectionData
                .referenceMetrics
                ?.latestEstimatedTotalCost
            )}
          />

        </div>
      );
    },
  };

  const preview =
    previews[sectionKey];

  return preview
    ? preview()
    : null;
}