import React, { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Fuel, BarChart3, Globe, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { getFreightMarketData, getFuelMarketData, getCommodityMarketData, getEconomicMarketData } from '../../api/market';

const MarketCard = ({ title, icon: Icon, value, unit, change, changeType, data, color, gradientId, stats }) => (
  <Card className="flex flex-col h-full bg-[var(--color-brand-elevated)] border border-white/[0.04]">
    <CardHeader className="pb-2">
      <CardTitle className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col flex-grow gap-4">
      <div className="flex justify-between items-end">
        <div>
          <span className="font-mono text-3xl font-bold text-white">{value}</span>
          <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] ml-2">{unit}</span>
        </div>
        <div className={`flex items-center gap-1 font-mono text-sm ${changeType === 'up' ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'}`}>
          {changeType === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          {change}
        </div>
      </div>
      
      <div className="flex-grow min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-brand-surface)', borderColor: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem' }}
              itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
              labelStyle={{ display: 'none' }}
            />
            <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#${gradientId})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-auto">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-black/20 rounded-xl border border-white/5 p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mb-1">{stat.label}</span>
            <span className="font-mono text-sm font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const mapToChartData = (records, valueKey) => {
  return records
    .sort((a, b) => new Date(a.observedAt) - new Date(b.observedAt))
    .slice(-20)
    .map((r, i) => ({
      x: i,
      value: Number(r[valueKey]).toFixed(2)
    }));
};

const calcChange = (data) => {
  if (data.length < 2) return { val: '0.0%', type: 'up' };
  const last = data[data.length - 1].value;
  const prev = data[data.length - 2].value;
  const change = ((last - prev) / prev) * 100;
  return {
    val: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    type: change >= 0 ? 'up' : 'down'
  };
};

export function MarketDashboard() {
  const [dataFreight, setDataFreight] = useState([]);
  const [dataFuel, setDataFuel] = useState([]);
  const [dataCommodity, setDataCommodity] = useState([]);
  const [dataEconomic, setDataEconomic] = useState([]);

  useEffect(() => {
    getFreightMarketData().then(res => setDataFreight(mapToChartData(res, 'rateValue'))).catch(console.error);
    getFuelMarketData().then(res => setDataFuel(mapToChartData(res, 'price'))).catch(console.error);
    getCommodityMarketData().then(res => setDataCommodity(mapToChartData(res, 'price'))).catch(console.error);
    getEconomicMarketData().then(res => setDataEconomic(mapToChartData(res, 'value'))).catch(console.error);
  }, []);

  const fRate = dataFreight.length ? dataFreight[dataFreight.length - 1].value : '0.00';
  const fChange = calcChange(dataFreight);

  const fuelRate = dataFuel.length ? dataFuel[dataFuel.length - 1].value : '0.00';
  const fuelChange = calcChange(dataFuel);

  const commRate = dataCommodity.length ? dataCommodity[dataCommodity.length - 1].value : '0.00';
  const commChange = calcChange(dataCommodity);

  const ecoRate = dataEconomic.length ? dataEconomic[dataEconomic.length - 1].value : '0.00';
  const ecoChange = calcChange(dataEconomic);

  return (
    <div className="flex flex-col h-full bg-[var(--color-brand-background)] text-[var(--color-brand-text-primary)] p-6 gap-6">
      <div className="flex items-center gap-4 border-b border-white/[0.04] pb-4">
        <TrendingUp className="w-8 h-8 text-[#f97316]" />
        <div>
          <h1 className="text-xl font-bold tracking-wider">MARKET INTELLIGENCE</h1>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)]">Live market data feeds</p>
        </div>
      </div>

      <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-grow">
        <MarketCard 
          title="FREIGHT MARKET"
          icon={TrendingUp}
          value={fRate}
          unit="USD/MT"
          change={fChange.val}
          changeType={fChange.type}
          data={dataFreight}
          color="#3b82f6"
          gradientId="colorFreight"
          stats={[
            { label: '7D AVG', value: '$26.40' },
            { label: '30D AVG', value: '$27.80' },
            { label: 'VOLATILITY', value: '12.4%' }
          ]}
        />
        <MarketCard 
          title="FUEL MARKET"
          icon={Fuel}
          value={fuelRate}
          unit="USD/MT VLSFO"
          change={fuelChange.val}
          changeType={fuelChange.type}
          data={dataFuel}
          color="#f59e0b"
          gradientId="colorFuel"
          stats={[
            { label: 'VLSFO', value: '$682' },
            { label: 'HSFO', value: '$520' },
            { label: 'MGO', value: '$890' }
          ]}
        />
        <MarketCard 
          title="COMMODITY MARKET"
          icon={BarChart3}
          value={commRate}
          unit="USD/MT"
          change={commChange.val}
          changeType={commChange.type}
          data={dataCommodity}
          color="#10b981"
          gradientId="colorCommodity"
          stats={[
            { label: 'IRON ORE', value: '$118.75' },
            { label: 'COAL', value: '$95.20' },
            { label: 'GRAIN', value: '$312.00' }
          ]}
        />
        <MarketCard 
          title="ECONOMIC INDICATORS"
          icon={Globe}
          value={ecoRate}
          unit="PMI"
          change={ecoChange.val}
          changeType={ecoChange.type}
          data={dataEconomic}
          color="#a855f7"
          gradientId="colorEconomic"
          stats={[
            { label: 'BDI', value: '1,842' },
            { label: 'SCFI', value: '1,024' },
            { label: 'PMI', value: '52.4' }
          ]}
        />
      </div>
    </div>
  );
}
