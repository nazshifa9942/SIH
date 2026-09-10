import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getMe } from '../api/auth';
import api from '../api/client';

export const ROLES = {
  ADMIN: 'ADMIN',
  PROCUREMENT_MANAGER: 'PROCUREMENT_MANAGER',
  LOGISTICS_MANAGER: 'LOGISTICS_MANAGER',
  VIEWER: 'VIEWER',
};

const ROLE_PERMISSIONS = {
  ADMIN: {
    canCreateCargo: true,
    canEditCargo: true,
    canDeleteCargo: true,
    canCreateVessel: true,
    canEditVessel: true,
    canCreatePort: true,
    canEditPort: true,
    canManageUsers: true,
    canRunAnalysis: true,
    canExportReports: true,
    canAcknowledgeAlerts: true,
  },
  PROCUREMENT_MANAGER: {
    canCreateCargo: true,
    canEditCargo: true,
    canDeleteCargo: true,
    canCreateVessel: false,
    canEditVessel: false,
    canCreatePort: false,
    canEditPort: false,
    canManageUsers: false,
    canRunAnalysis: true,
    canExportReports: true,
    canAcknowledgeAlerts: true,
  },
  LOGISTICS_MANAGER: {
    canCreateCargo: false,
    canEditCargo: false,
    canDeleteCargo: false,
    canCreateVessel: true,
    canEditVessel: true,
    canCreatePort: true,
    canEditPort: true,
    canManageUsers: false,
    canRunAnalysis: true,
    canExportReports: true,
    canAcknowledgeAlerts: true,
  },
  VIEWER: {
    canCreateCargo: false,
    canEditCargo: false,
    canDeleteCargo: false,
    canCreateVessel: false,
    canEditVessel: false,
    canCreatePort: false,
    canEditPort: false,
    canManageUsers: false,
    canRunAnalysis: false,
    canExportReports: true,
    canAcknowledgeAlerts: false,
  },
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const loginAction = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logoutAction = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  // ── Role Simulation / Switcher ──
  const switchRole = (newRole) => {
    setUser((prev) => {
      const updated = {
        ...(prev || { email: 'user@sih2026.gov.in', name: 'Maritime User' }),
        role: newRole,
      };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // ── Role & Permission Helpers ──
  const currentRole = (user?.role || 'VIEWER').toUpperCase();
  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.VIEWER;
  }, [currentRole]);

  const hasRole = (roles) => {
    if (!roles) return true;
    const roleArr = Array.isArray(roles) ? roles : [roles];
    return roleArr.map((r) => r.toUpperCase()).includes(currentRole);
  };

  const isRole = (role) => currentRole === role.toUpperCase();

  const isViewer = currentRole === 'VIEWER';
  const isAdmin = currentRole === 'ADMIN';
  const isProcurementManager = currentRole === 'PROCUREMENT_MANAGER';
  const isLogisticsManager = currentRole === 'LOGISTICS_MANAGER';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: currentRole,
        permissions,
        hasRole,
        isRole,
        isViewer,
        isAdmin,
        isProcurementManager,
        isLogisticsManager,
        switchRole,
        login: loginAction,
        logout: logoutAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
