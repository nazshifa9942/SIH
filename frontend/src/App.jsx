import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { CommandDashboard } from './pages/Overview/CommandDashboard';
import { CargoList } from './pages/Cargo/CargoList';
import { CargoWorkspace } from './pages/Cargo/Workspace/CargoWorkspace';
import { VesselList } from './pages/Vessels/VesselList';
import { MarketDashboard } from './pages/Market/MarketDashboard';
import { AlertsFeed } from './pages/Alerts/AlertsFeed';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<CommandDashboard />} />
            <Route path="/cargo" element={<CargoList />} />
            <Route path="/cargo/:cargoRequestId/*" element={<CargoWorkspace />} />
            <Route path="/vessels" element={<VesselList />} />
            <Route path="/market" element={<MarketDashboard />} />
            <Route path="/alerts" element={<AlertsFeed />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
