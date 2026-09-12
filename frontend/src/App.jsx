import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { InstitutionalHome } from './pages/Home/InstitutionalHome';
import { Login } from './pages/Login';
import { CommandDashboard } from './pages/Overview/CommandDashboard';
import { CargoList } from './pages/Cargo/CargoList';
import { CargoWorkspace } from './pages/Cargo/Workspace/CargoWorkspace';
import { VesselList } from './pages/Vessels/VesselList';
import { PortList } from './pages/Ports/PortList';
import { MaritimeMapPage } from './pages/Map/MaritimeMapPage';
import { MarketDashboard } from './pages/Market/MarketDashboard';
import { AlertsFeed } from './pages/Alerts/AlertsFeed';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { WhatIfSimulator } from './pages/WhatIf/WhatIfSimulator';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<InstitutionalHome />} />
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/overview" element={<CommandDashboard />} />
            <Route path="/cargo" element={<CargoList />} />
            <Route path="/cargo/:cargoRequestId/*" element={<CargoWorkspace />} />
            <Route path="/vessels" element={<VesselList />} />
            <Route path="/ports" element={<PortList />} />
            <Route path="/map" element={<MaritimeMapPage />} />
            <Route path="/market" element={<MarketDashboard />} />
            <Route path="/alerts" element={<AlertsFeed />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/what-if" element={<WhatIfSimulator />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
