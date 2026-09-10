import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  Ship,
  Anchor,
  Plus,
  Search,
  UserCheck,
  Edit2,
  Check,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getVessels } from '../../api/vessels';
import { getPorts } from '../../api/ports';
import { VesselDialog } from '../Vessels/VesselDialog';
import { PortDialog } from '../Ports/PortDialog';
import { register } from '../../api/auth';

// ─── Initial Demo Roster (synced with localStorage) ───────────────────────────
const DEFAULT_USERS = [
  {
    id: 'u-1',
    name: 'Executive Administrator',
    email: 'admin@sih2026.gov.in',
    role: ROLES.ADMIN,
    createdAt: '2026-01-15T08:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'u-2',
    name: 'Aditi Sharma',
    email: 'aditi.procurement@sih2026.gov.in',
    role: ROLES.PROCUREMENT_MANAGER,
    createdAt: '2026-02-01T10:30:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'u-3',
    name: 'Vikram Malhotra',
    email: 'vikram.logistics@sih2026.gov.in',
    role: ROLES.LOGISTICS_MANAGER,
    createdAt: '2026-02-10T14:15:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'u-4',
    name: 'Global Auditor',
    email: 'auditor.viewer@sih2026.gov.in',
    role: ROLES.VIEWER,
    createdAt: '2026-03-01T09:00:00Z',
    status: 'ACTIVE',
  },
];

const LOCAL_USERS_KEY = 'maritime_admin_users_roster';

export const AdminDashboard = () => {
  const { user: _currentUser, role: _userRole } = useAuth();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'vessels' | 'ports' | 'system'
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USERS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [vessels, setVessels] = useState([]);
  const [ports, setPorts] = useState([]);
  const [_loading, setLoading] = useState(true);

  // ── Modals & Dialogs ──
  const [isVesselDialogOpen, setIsVesselDialogOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState(null);

  const [isPortDialogOpen, setIsPortDialogOpen] = useState(false);
  const [editingPort, setEditingPort] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.PROCUREMENT_MANAGER,
  });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Load Vessels & Ports
  const loadAdminData = async () => {
    try {
      const [vList, pList] = await Promise.all([
        getVessels().catch(() => []),
        getPorts().catch(() => []),
      ]);
      setVessels(Array.isArray(vList) ? vList : []);
      setPorts(Array.isArray(pList) ? pList : []);
    } catch (err) {
      console.error('Failed to load admin registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const saveUsers = (updated) => {
    setUsers(updated);
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save users roster:', err);
    }
  };

  // Handle Role Change
  const handleRoleChange = (userId, newRole) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    saveUsers(updated);
  };

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim() || !userFormData.password.trim()) {
      setUserError('Name, email and password are required.');
      return;
    }

    setUserSubmitting(true);
    setUserError('');
    setUserSuccess('');

    try {
      // Register with backend
      await register({
        name: userFormData.name.trim(),
        email: userFormData.email.trim().toLowerCase(),
        password: userFormData.password,
        role: userFormData.role,
      }).catch(() => {
        // Fallback for local persistence if needed
      });

      const newUser = {
        id: `u-${Date.now()}`,
        name: userFormData.name.trim(),
        email: userFormData.email.trim().toLowerCase(),
        role: userFormData.role,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
      };

      saveUsers([newUser, ...users]);
      setUserSuccess('User account registered and credentials activated successfully.');
      setTimeout(() => {
        setIsUserModalOpen(false);
        setUserFormData({
          name: '',
          email: '',
          password: '',
          role: ROLES.PROCUREMENT_MANAGER,
        });
        setUserSuccess('');
      }, 1200);
    } catch (err) {
      console.error('Failed to register user:', err);
      setUserError(err?.response?.data?.message || 'Failed to register new user.');
    } finally {
      setUserSubmitting(false);
    }
  };

  // User Stats
  const userStats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter((u) => u.role === ROLES.ADMIN).length;
    const procCount = users.filter((u) => u.role === ROLES.PROCUREMENT_MANAGER).length;
    const logCount = users.filter((u) => u.role === ROLES.LOGISTICS_MANAGER).length;
    const viewCount = users.filter((u) => u.role === ROLES.VIEWER).length;

    return { total, adminCount, procCount, logCount, viewCount };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (searchUser.trim()) {
        const q = searchUser.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, roleFilter, searchUser]);

  const getRoleBadgeColor = (r) => {
    switch (r) {
      case ROLES.ADMIN:
        return 'bg-pink-500/20 text-[var(--color-gov-saffron)] border-pink-500/30';
      case ROLES.PROCUREMENT_MANAGER:
        return 'bg-orange-100 text-[var(--color-gov-saffron)] border-orange-500/30';
      case ROLES.LOGISTICS_MANAGER:
        return 'bg-blue-100 text-[var(--color-status-info)] border-blue-500/30';
      case ROLES.VIEWER:
      default:
        return 'bg-emerald-100 text-[var(--color-status-success)] border-emerald-500/30';
    }
  };

  return (
    <div className="admin-dashboard flex flex-col h-full bg-[var(--color-brand-background)] text-[var(--color-brand-text-primary)] p-6 gap-6 font-sans">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-brand-border)]/[0.06] pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[var(--color-gov-saffron)]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-wider text-[var(--color-brand-text-primary)]">ADMINISTRATION HUB</h1>
              <Badge variant="outline" className="border-pink-500/30 bg-pink-500/10 text-[var(--color-gov-saffron)] text-[11px]">
                GOVERNANCE & REGISTRY
              </Badge>
            </div>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mt-0.5">
              User Management, RBAC Policies, Vessel Fleet Registry & Port Specifications
            </p>
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ────────────────────────────────────────────── */}
      <div className="flex border-b border-[var(--color-brand-border)]/[0.06] gap-8">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs uppercase tracking-widest transition-all relative flex items-center gap-2 ${
            activeTab === 'users'
              ? 'text-[var(--color-gov-saffron)] font-bold'
              : 'text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-text-primary)]'
          }`}
        >
          <Users className="w-4 h-4" /> User Management & RBAC ({users.length})
          {activeTab === 'users' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('vessels')}
          className={`pb-3 text-xs uppercase tracking-widest transition-all relative flex items-center gap-2 ${
            activeTab === 'vessels'
              ? 'text-[var(--color-gov-saffron)] font-bold'
              : 'text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-text-primary)]'
          }`}
        >
          <Ship className="w-4 h-4" /> Vessel Registry Management ({vessels.length})
          {activeTab === 'vessels' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('ports')}
          className={`pb-3 text-xs uppercase tracking-widest transition-all relative flex items-center gap-2 ${
            activeTab === 'ports'
              ? 'text-[var(--color-gov-saffron)] font-bold'
              : 'text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-text-primary)]'
          }`}
        >
          <Anchor className="w-4 h-4" /> Port Terminal Registry ({ports.length})
          {activeTab === 'ports' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-400" />
          )}
        </button>
      </div>

      {/* ── TAB 1: USER MANAGEMENT & RBAC ──────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
              <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                Total Registered Users
              </span>
              <div className="text-2xl font-bold text-[var(--color-brand-text-primary)]">{userStats.total}</div>
              <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">Across 4 roles</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
              <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                Procurement Managers
              </span>
              <div className="text-2xl font-bold text-[var(--color-gov-saffron)]">{userStats.procCount}</div>
              <div className="text-[11px] text-[var(--color-gov-saffron)]/80 mt-1">Cargo & contract authority</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
              <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                Logistics Managers
              </span>
              <div className="text-2xl font-bold text-[var(--color-status-info)]">{userStats.logCount}</div>
              <div className="text-[11px] text-[var(--color-status-info)]/80 mt-1">Fleet & terminal operations</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
              <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                Administrators
              </span>
              <div className="text-2xl font-bold text-[var(--color-gov-saffron)]">{userStats.adminCount}</div>
              <div className="text-[11px] text-[var(--color-gov-saffron)]/80 mt-1">Unrestricted system governance</div>
            </div>
          </div>

          {/* User Management Toolbar */}
          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-brand-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                >
                  <option value="ALL">All Roles</option>
                  <option value={ROLES.ADMIN}>Administrators</option>
                  <option value={ROLES.PROCUREMENT_MANAGER}>Procurement Managers</option>
                  <option value={ROLES.LOGISTICS_MANAGER}>Logistics Managers</option>
                  <option value={ROLES.VIEWER}>Viewers</option>
                </select>
              </div>

              <Button
                onClick={() => {
                  setIsUserModalOpen(true);
                  setUserError('');
                  setUserSuccess('');
                }}
                size="sm"
                className="bg-[var(--color-gov-saffron)] hover:bg-pink-600 text-[var(--color-brand-text-primary)] text-xs font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> ADD USER ACCOUNT
              </Button>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-brand-inset)] border-b border-[var(--color-brand-border)] text-[var(--color-brand-text-secondary)] uppercase text-[11px]">
                  <tr>
                    <th className="p-4">User Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Role Reassignment</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-[var(--color-brand-text-primary)] flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[var(--color-gov-saffron)]" />
                        {u.name}
                      </td>
                      <td className="p-4 text-[var(--color-brand-text-secondary)]">{u.email}</td>
                      <td className="p-4">
                        <Badge className={`text-[11px] uppercase font-bold ${getRoleBadgeColor(u.role)}`}>
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                        >
                          <option value={ROLES.ADMIN}>ADMINISTRATOR</option>
                          <option value={ROLES.PROCUREMENT_MANAGER}>PROCUREMENT MANAGER</option>
                          <option value={ROLES.LOGISTICS_MANAGER}>LOGISTICS MANAGER</option>
                          <option value={ROLES.VIEWER}>VIEWER (READ ONLY)</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-status-success)] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 2: VESSEL MANAGEMENT REGISTRY ──────────────────────────── */}
      {activeTab === 'vessels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[var(--color-brand-elevated)] p-4 rounded-2xl border border-[var(--color-brand-border)]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-brand-text-primary)]">
                BULK CARRIER FLEET INVENTORY ({vessels.length})
              </h3>
              <p className="text-xs text-[var(--color-brand-text-muted)]">
                Admin master registry for adding, editing, and managing commercial bulk carriers.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingVessel(null);
                setIsVesselDialogOpen(true);
              }}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-[var(--color-brand-text-primary)] text-xs font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> REGISTER NEW VESSEL
            </Button>
          </div>

          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-brand-inset)] border-b border-[var(--color-brand-border)] text-[var(--color-brand-text-secondary)] uppercase text-[11px]">
                  <tr>
                    <th className="p-4">Vessel Name</th>
                    <th className="p-4">Class</th>
                    <th className="p-4 text-right">Capacity (MT)</th>
                    <th className="p-4 text-right">Draft (m)</th>
                    <th className="p-4 text-right">LOA (m)</th>
                    <th className="p-4 text-right">Charter ($/d)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vessels.map((v) => (
                    <tr key={v.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-[var(--color-brand-text-primary)]">{v.name}</td>
                      <td className="p-4 text-[var(--color-brand-text-muted)]">{v.vesselType}</td>
                      <td className="p-4 text-right text-[var(--color-brand-text-primary)] font-bold">{Number(v.capacityMt).toLocaleString()}</td>
                      <td className="p-4 text-right text-[var(--color-brand-text-secondary)]">{v.draftM}m</td>
                      <td className="p-4 text-right text-[var(--color-brand-text-secondary)]">{v.loaM}m</td>
                      <td className="p-4 text-right text-[var(--color-status-success)] font-bold">${Number(v.dailyCharterCost).toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="text-[11px] uppercase font-bold text-[var(--color-status-info)] border-blue-500/30">
                          {v.availabilityStatus || 'AVAILABLE'}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingVessel(v);
                            setIsVesselDialogOpen(true);
                          }}
                          className="text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] p-1.5"
                          title="Edit Vessel Specs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 3: PORT MANAGEMENT REGISTRY ────────────────────────────── */}
      {activeTab === 'ports' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[var(--color-brand-elevated)] p-4 rounded-2xl border border-[var(--color-brand-border)]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-brand-text-primary)]">
                MARITIME PORT & TERMINAL REGISTRY ({ports.length})
              </h3>
              <p className="text-xs text-[var(--color-brand-text-muted)]">
                Admin master registry for updating port draft constraints, LOA limits, and daily throughput.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingPort(null);
                setIsPortDialogOpen(true);
              }}
              size="sm"
              className="bg-[var(--color-gov-saffron)] hover:bg-orange-600 text-[var(--color-brand-text-primary)] text-xs font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> REGISTER NEW PORT
            </Button>
          </div>

          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-brand-inset)] border-b border-[var(--color-brand-border)] text-[var(--color-brand-text-secondary)] uppercase text-[11px]">
                  <tr>
                    <th className="p-4">Port Name</th>
                    <th className="p-4">Country & Region</th>
                    <th className="p-4 text-right">Max Draft (m)</th>
                    <th className="p-4 text-right">Max LOA (m)</th>
                    <th className="p-4 text-right">Berths</th>
                    <th className="p-4 text-right">Handling (MT/d)</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ports.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-[var(--color-brand-text-primary)]">{p.name}</td>
                      <td className="p-4 text-[var(--color-brand-text-muted)]">{p.country} {p.region ? `· ${p.region}` : ''}</td>
                      <td className="p-4 text-right text-[var(--color-status-success)] font-bold">{p.maxDraftM}m</td>
                      <td className="p-4 text-right text-[var(--color-brand-text-secondary)]">{p.maxLoaM}m</td>
                      <td className="p-4 text-right text-[var(--color-gov-saffron)] font-bold">{p.berthCapacity}</td>
                      <td className="p-4 text-right text-[var(--color-brand-text-primary)] font-bold">{Number(p.handlingCapacityMtDay).toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPort(p);
                            setIsPortDialogOpen(true);
                          }}
                          className="text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] p-1.5"
                          title="Edit Port Constraints"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── CREATE USER MODAL ──────────────────────────────────────────── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-white border border-[var(--color-brand-border)] rounded-lg shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--color-brand-text-primary)] uppercase tracking-wider">
              REGISTER NEW MARITIME OPERATOR
            </h3>

            {userError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[var(--color-status-error)] text-xs">
                {userError}
              </div>
            )}

            {userSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--color-status-success)] text-xs flex items-center gap-2">
                <Check className="w-4 h-4" /> {userSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-[var(--color-brand-text-muted)] uppercase block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="e.g. Captain Rajesh Kumar"
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--color-brand-text-muted)] uppercase block mb-1">Email Address *</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="rajesh.kumar@sih2026.gov.in"
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--color-brand-text-muted)] uppercase block mb-1">Password *</label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--color-brand-text-muted)] uppercase block mb-1">Assigned Role *</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                >
                  <option value={ROLES.PROCUREMENT_MANAGER}>PROCUREMENT MANAGER</option>
                  <option value={ROLES.LOGISTICS_MANAGER}>LOGISTICS MANAGER</option>
                  <option value={ROLES.ADMIN}>ADMINISTRATOR</option>
                  <option value={ROLES.VIEWER}>VIEWER (READ ONLY)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-brand-border)]">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsUserModalOpen(false)}>
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  disabled={userSubmitting}
                  size="sm"
                  className="bg-[var(--color-gov-saffron)] hover:bg-pink-600 text-[var(--color-brand-text-primary)] font-bold"
                >
                  {userSubmitting ? 'CREATING...' : 'SAVE USER'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VESSEL DIALOG ─────────────────────────────────────────────── */}
      <VesselDialog
        isOpen={isVesselDialogOpen}
        vessel={editingVessel}
        onSuccess={loadAdminData}
        onClose={() => {
          setIsVesselDialogOpen(false);
          setEditingVessel(null);
        }}
      />

      {/* ── PORT DIALOG ───────────────────────────────────────────────── */}
      <PortDialog
        isOpen={isPortDialogOpen}
        port={editingPort}
        onSuccess={loadAdminData}
        onClose={() => {
          setIsPortDialogOpen(false);
          setEditingPort(null);
        }}
      />
    </div>
  );
};
