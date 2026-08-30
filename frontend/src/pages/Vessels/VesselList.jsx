import React, { useEffect, useState } from 'react';
import { getVessels } from '../../api/vessels';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Ship, Anchor } from 'lucide-react';

export const VesselList = () => {
  const [vessels, setVessels] = useState([]);

  useEffect(() => {
    getVessels().then(setVessels).catch(console.error);
  }, []);

  const getStatusColor = (status) => {
    const map = {
      'AVAILABLE': 'var(--color-status-success)',
      'IN_TRANSIT': 'var(--color-status-info)',
      'MAINTENANCE': 'var(--color-status-warning)',
    };
    return map[status] || 'var(--color-status-success)';
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Ship className="h-5 w-5 text-white/70" />
        </div>
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-white">Fleet Overview</h1>
          <p className="text-[10px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest">{vessels.length} Vessels Registered</p>
        </div>
      </div>

      {vessels.length === 0 ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Ship className="h-8 w-8 text-white/30" />
            </div>
            <div className="text-sm text-[var(--color-brand-text-secondary)]">No vessels found</div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto content-start">
          {vessels.map((v) => (
            <Card key={v.id} className="hover:bg-white/[0.06] transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-base font-bold text-white">{v.name}</div>
                    <div className="text-[10px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest mt-0.5">{v.type || 'BULK CARRIER'}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(v.status) }}></div>
                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: getStatusColor(v.status) }}>
                      {v.status || 'AVAILABLE'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
                    <div className="text-[10px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest">Capacity</div>
                    <div className="text-sm font-bold font-mono mt-0.5">{Number(v.capacityMt).toLocaleString()} MT</div>
                  </div>
                  <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
                    <div className="text-[10px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest">Speed</div>
                    <div className="text-sm font-bold font-mono mt-0.5">{v.speedKnots} kn</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
