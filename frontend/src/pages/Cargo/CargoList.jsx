import React, { useEffect, useState } from 'react';
import { getCargoList } from '../../api/cargo';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getPorts } from '../../api/ports';
import { NewCargoDialog } from './Workspace/NewCargoDialog';
import { Box, ChevronRight } from 'lucide-react';

export const CargoList = () => {
  const [cargos, setCargos] = useState([]);
  const [ports, setPorts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCargoList().then(setCargos).catch(console.error);
    getPorts().then(setPorts).catch(console.error);
  }, []);

  const handleRowClick = (id) => {
    navigate(`/cargo/${id}`);
  };

  const handleCargoCreated = (id) => {
    setIsDialogOpen(false);
    navigate(`/cargo/${id}`);
  };

  const getStatusColor = (status) => {
    const map = {
      'DRAFT': 'var(--color-brand-text-secondary)',
      'ACTIVE': 'var(--color-status-success)',
      'PENDING': 'var(--color-status-warning)',
      'COMPLETED': 'var(--color-status-info)',
    };
    return map[status] || 'var(--color-brand-text-secondary)';
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Box className="h-5 w-5 text-white/70" />
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-widest text-white">Cargo Requests</h1>
            <p className="text-[10px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest">{cargos.length} Active Requests</p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>+ New Cargo</Button>
      </div>

      {cargos.length === 0 ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Box className="h-8 w-8 text-white/30" />
            </div>
            <div className="text-sm text-[var(--color-brand-text-secondary)] mb-1">No cargo requests found</div>
            <div className="text-[10px] text-[var(--color-brand-text-secondary)]/60 tracking-widest uppercase">Create a new cargo request to begin</div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto">
          {cargos.map((cargo) => (
            <div
              key={cargo.id}
              className="bg-[var(--color-brand-elevated)] rounded-2xl border border-[var(--color-brand-border)] p-4 hover:bg-white/[0.06] cursor-pointer transition-all group"
              onClick={() => handleRowClick(cargo.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-base font-bold text-white">{cargo.cargoType}</div>
                    <div className="text-[10px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest mt-0.5">
                      {cargo.originPort?.name || cargo.originPortId} &rarr; {cargo.destinationPort?.name || cargo.destinationPortId}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6">
                    <div>
                      <div className="text-[10px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest">Quantity</div>
                      <div className="text-sm font-bold text-white font-mono">{Number(cargo.quantityMt).toLocaleString()} MT</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest">Required</div>
                      <div className="text-sm font-bold text-white font-mono">{new Date(cargo.requiredDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(cargo.status) }}></div>
                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: getStatusColor(cargo.status) }}>
                      {cargo.status || 'PENDING'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-brand-text-secondary)] group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewCargoDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        ports={ports}
        onSuccess={handleCargoCreated}
      />
    </div>
  );
};
