import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Plus, Trash2, RefreshCw, GitCompare } from 'lucide-react';
import { getCargo, getCargoList } from '../../api/cargo';
import { getPorts } from '../../api/ports';
import {
  createWhatIfScenario,
  getWhatIfScenarios,
  deleteWhatIfScenario,
  runWhatIfScenario,
} from '../../api/whatIf';
import { Button } from '../../components/ui/Button';

export const WhatIfSimulator = () => {
  const [searchParams] = useSearchParams();
  const [cargoList, setCargoList] = useState([]);
  const [cargo, setCargo] = useState(null);
  const [ports, setPorts] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', quantityMt: '', requiredDate: '', originPortId: '', destinationPortId: '' });
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCargo = async (id) => {
    const selected = id ? await getCargo(id) : cargoList[0];
    if (!selected) return;
    setCargo(selected);
    setForm((previous) => ({
      ...previous,
      quantityMt: previous.quantityMt || selected.quantityMt,
      requiredDate: previous.requiredDate || String(selected.requiredDate || '').slice(0, 10),
      originPortId: previous.originPortId || selected.originPortId,
      destinationPortId: previous.destinationPortId || selected.destinationPortId,
    }));
    setScenarios(await getWhatIfScenarios(selected.id));
  };

  useEffect(() => {
    Promise.all([getCargoList(), getPorts({ active: true })])
      .then(async ([cargoData, portData]) => {
        setCargoList(Array.isArray(cargoData) ? cargoData : []);
        setPorts(Array.isArray(portData) ? portData : []);
        const requestedId = searchParams.get('cargoId');
        const selected = requestedId ? await getCargo(requestedId) : cargoData?.[0];
        if (selected) {
          setCargo(selected);
          setForm((previous) => ({ ...previous, quantityMt: selected.quantityMt, requiredDate: String(selected.requiredDate || '').slice(0, 10), originPortId: selected.originPortId, destinationPortId: selected.destinationPortId }));
          setScenarios(await getWhatIfScenarios(selected.id));
        }
      })
      .catch((loadError) => setError(loadError?.response?.data?.message || 'Scenario data could not be loaded.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleCargoChange = async (event) => {
    setLoading(true);
    try { await loadCargo(event.target.value); } catch (loadError) { setError(loadError?.response?.data?.message || 'Cargo scenarios could not be loaded.'); } finally { setLoading(false); }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const created = await createWhatIfScenario({ ...form, cargoRequestId: cargo.id, quantityMt: Number(form.quantityMt) });
      setScenarios((previous) => [created, ...previous]);
      setSelectedId(created.id);
    } catch (createError) { setError(createError?.response?.data?.message || 'Scenario could not be created.'); }
  };

  const handleRun = async (id) => {
    setError('');
    try {
      const result = await runWhatIfScenario(id);
      setScenarios((previous) => previous.map((scenario) => scenario.id === id ? result : scenario));
      setSelectedId(id);
    } catch (runError) { setError(runError?.response?.data?.message || 'Scenario could not be analyzed.'); }
  };

  const handleDelete = async (id) => {
    try { await deleteWhatIfScenario(id); setScenarios((previous) => previous.filter((scenario) => scenario.id !== id)); if (selectedId === id) setSelectedId(''); } catch (deleteError) { setError(deleteError?.response?.data?.message || 'Scenario could not be deleted.'); }
  };

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedId);
  const result = selectedScenario?.analysisJson;
  const originalQuantity = Number(cargo?.quantityMt || 0);
  const scenarioQuantity = Number(selectedScenario?.quantityMt || 0);

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading scenario simulator...</div>;

  return (
    <div className="what-if-dashboard space-y-6 text-slate-900">
      <div className="border-b border-slate-300 pb-5">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-gov-navy)]">Government of India | Maritime Decision Support</div>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-gov-navy)]">Scenario laboratory</h1>
        <p className="mt-1 text-sm text-slate-600">Evaluate alternate cargo assumptions against the original request.</p>
      </div>
      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Cargo request</label>
        <select value={cargo?.id || ''} onChange={handleCargoChange} className="border border-slate-300 bg-white px-3 py-2 text-sm">
          {cargoList.map((item) => <option key={item.id} value={item.id}>{item.cargoType} | {item.originPort?.name || item.originPortId} to {item.destinationPort?.name || item.destinationPortId}</option>)}
        </select>
      </div>
      <form onSubmit={handleCreate} className="grid gap-4 rounded-lg border border-[var(--color-brand-border)] bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2 text-sm font-bold text-[var(--color-gov-navy)]">Alternative scenario assumptions — compared against the base cargo request</div>
        <input required placeholder="Scenario name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="border border-slate-300 px-3 py-2 text-sm" />
        <input placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="border border-slate-300 px-3 py-2 text-sm" />
        <input required type="number" min="1" placeholder="Quantity MT" value={form.quantityMt} onChange={(event) => setForm({ ...form, quantityMt: event.target.value })} className="border border-slate-300 px-3 py-2 text-sm" />
        <input required type="date" value={form.requiredDate} onChange={(event) => setForm({ ...form, requiredDate: event.target.value })} className="border border-slate-300 px-3 py-2 text-sm" />
        <select value={form.originPortId} onChange={(event) => setForm({ ...form, originPortId: event.target.value })} className="border border-slate-300 px-3 py-2 text-sm">{ports.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}</select>
        <select value={form.destinationPortId} onChange={(event) => setForm({ ...form, destinationPortId: event.target.value })} className="border border-slate-300 px-3 py-2 text-sm">{ports.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}</select>
        <Button type="submit" className="flex items-center justify-center gap-2 md:col-span-2"><Plus className="h-4 w-4" /> Create scenario</Button>
      </form>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Saved scenarios</div>
          {scenarios.length === 0 && <div className="border border-dashed border-slate-300 p-5 text-sm text-slate-500">No scenarios created for this cargo.</div>}
          {scenarios.map((scenario) => <div key={scenario.id} className={`border bg-white p-4 ${selectedId === scenario.id ? 'border-[var(--color-gov-saffron)]' : 'border-slate-300'}`}><button type="button" onClick={() => setSelectedId(scenario.id)} className="w-full text-left"><div className="font-bold text-[var(--color-gov-navy)]">{scenario.name}</div><div className="mt-1 text-xs text-slate-500">{scenario.status} | {Number(scenario.quantityMt).toLocaleString()} MT</div></button><div className="mt-3 flex gap-2"><Button type="button" size="sm" onClick={() => handleRun(scenario.id)} className="flex items-center gap-1"><Play className="h-3 w-3" /> Run analysis</Button><button type="button" onClick={() => handleDelete(scenario.id)} className="border border-red-200 px-3 text-xs text-red-700"><Trash2 className="inline h-3 w-3" /> Delete</button></div></div>)}
        </div>
        <div className="border border-slate-300 bg-white p-5"><div className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--color-gov-navy)]"><GitCompare className="h-4 w-4" /> Base scenario versus alternative scenario</div>{result ? <div className="grid gap-3 sm:grid-cols-2"><div className="border border-slate-200 p-4"><div className="text-xs font-bold uppercase text-slate-500">Original</div><div className="mt-2 text-sm">Quantity: {originalQuantity.toLocaleString()} MT</div><div className="text-sm">Route: {cargo?.originPort?.name || cargo?.originPortId} to {cargo?.destinationPort?.name || cargo?.destinationPortId}</div></div><div className="border border-orange-200 bg-orange-50 p-4"><div className="text-xs font-bold uppercase text-orange-700">Scenario</div><div className="mt-2 text-sm">Quantity: {scenarioQuantity.toLocaleString()} MT</div><div className="text-sm">Freight: ${Number(result.recommendation?.expectedFreight || 0).toFixed(2)} / MT</div><div className="text-sm">Risk: {result.risk?.overallLevel || 'N/A'}</div><div className="text-sm font-bold">Decision: {result.recommendation?.recommendedAction || 'N/A'}</div><div className="text-sm">Estimated cost: ${Number(result.cost?.totalCost || 0).toLocaleString()}</div></div></div> : <div className="p-8 text-sm text-slate-500">Select a scenario and run its analysis to compare results.</div>}</div>
      </div>
    </div>
  );
};
