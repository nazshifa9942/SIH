import React, { useEffect, useState } from 'react';
import { getCargoList, getCargo, deleteCargo } from '../../api/cargo';
import { getPorts } from '../../api/ports';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { NewCargoDialog } from './Workspace/NewCargoDialog';
import { PageHeader, EmptyState, ErrorBanner, Skeleton, StatusBadge, Modal } from '../../components/ui/Primitives';
import { Box, ChevronRight, Pencil, Trash2, Search, Lock, TrendingUp, Globe, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDateSafely } from '../../utils/dateUtils';

export const CargoList = () => {
  const { permissions, role } = useAuth();
  const [cargos, setCargos] = useState([]);
  const [ports, setPorts] = useState([]);
  const [portsError, setPortsError] = useState('');
  const [cargoError, setCargoError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingCargo, setDeletingCargo] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cargoTypeFilter, setCargoTypeFilter] = useState('ALL');

  const navigate = useNavigate();

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setLoading(true);
    const [cargoResult, portsResult] = await Promise.allSettled([
      getCargoList(),
      getPorts({ active: true }),
    ]);

    if (cargoResult.status === 'fulfilled') {
      setCargos(Array.isArray(cargoResult.value) ? cargoResult.value : []);
      setCargoError('');
    } else {
      console.error('Failed to load cargo data:', cargoResult.reason);
      setCargoError(cargoResult.reason?.response
        ? 'The server could not return cargo requests. Try again shortly.'
        : 'Could not reach the server. Check your connection and try again.');
    }

    if (portsResult.status === 'fulfilled') {
      setPorts(Array.isArray(portsResult.value) ? portsResult.value : []);
      setPortsError('');
    } else {
      console.error('Failed to load ports for cargo form:', portsResult.reason);
      setPorts([]);
      setPortsError('Port list could not be loaded. Refresh and try again.');
    }

    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRowClick = (id) => {
    navigate(`/cargo/${id}`);
  };

  const handleDelete = (id) => {
    setDeleteError('');
    setDeletingCargo(cargos.find((c) => c.id === id) || null);
  };

  const confirmDelete = async () => {
    if (!deletingCargo) return;
    try {
      await deleteCargo(deletingCargo.id);
      setCargos((prev) => prev.filter((cargo) => cargo.id !== deletingCargo.id));
      setDeletingCargo(null);
    } catch (error) {
      console.error('Failed to delete cargo:', error);
      setDeleteError('The cargo request could not be deleted. Please try again.');
    }
  };

  const handleEdit = async (id) => {
    try {
      const cargo = await getCargo(id);

      setEditingCargo(cargo);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch cargo:', error);
      setDeleteError('The cargo request could not be loaded for editing.');
    }
  };

  const handleCargoSaved = async (id) => {
    setIsDialogOpen(false);
    setEditingCargo(null);

    await loadData();

    navigate(`/cargo/${id}`);
  };

  const getStatusColor = (status) => {
    const map = {
      DRAFT: 'var(--color-brand-text-secondary)',
      ACTIVE: 'var(--color-status-success)',
      PENDING: 'var(--color-status-warning)',
      COMPLETED: 'var(--color-status-info)'
    };

    return map[status] || 'var(--color-brand-text-secondary)';
  };

  // Get unique cargo types from existing cargo requests
  const cargoTypes = [
    ...new Set(
      cargos
        .map((cargo) => cargo.cargoType)
        .filter(Boolean)
    )
  ];

  // Apply search and filters
  const filteredCargos = cargos.filter((cargo) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      cargo.cargoType?.toLowerCase().includes(search) ||
      cargo.originPort?.name?.toLowerCase().includes(search) ||
      cargo.destinationPort?.name?.toLowerCase().includes(search) ||
      cargo.originPortId?.toLowerCase().includes(search) ||
      cargo.destinationPortId?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === 'ALL' ||
      cargo.status === statusFilter;

    const matchesCargoType =
      cargoTypeFilter === 'ALL' ||
      cargo.cargoType === cargoTypeFilter;

    return matchesSearch && matchesStatus && matchesCargoType;
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      <PageHeader
        title="Cargo requests"
        description={`${filteredCargos.length} of ${cargos.length} requests`}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Refresh cargo requests"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {permissions.canCreateCargo ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditingCargo(null);
                  setIsDialogOpen(true);
                }}
              >
                New cargo
              </Button>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Read only ({role.replace('_', ' ').toLowerCase()})
              </Badge>
            )}
          </>
        }
      />

      {cargoError && <ErrorBanner message={cargoError} onRetry={() => loadData()} />}
      {deleteError && <ErrorBanner message={deleteError} />}

      {/* Search & filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-brand-text-muted)]" />
          <input
            type="text"
            placeholder="Search cargo, origin or destination…"
            aria-label="Search cargo requests"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ui-input !pl-8.5"
            style={{ paddingLeft: '2.125rem' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="ui-select !w-40"
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={cargoTypeFilter}
          onChange={(e) => setCargoTypeFilter(e.target.value)}
          aria-label="Filter by cargo type"
          className="ui-select !w-44"
        >
          <option value="ALL">All cargo types</option>
          {cargoTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Cargo table */}
      {loading ? (
        <Card className="p-4">
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </Card>
      ) : filteredCargos.length === 0 ? (
        <Card>
          <EmptyState
            icon={Box}
            title={cargoError ? 'Cargo requests unavailable' : cargos.length === 0 ? 'No cargo requests yet' : 'No matching cargo requests'}
            description={
              cargoError
                ? 'Retry once the connection is restored.'
                : cargos.length === 0
                ? 'Create your first cargo request to start the chartering workflow.'
                : 'Try adjusting your search or filters.'
            }
            action={
              !cargoError && cargos.length === 0 && permissions.canCreateCargo ? (
                <Button onClick={() => setIsDialogOpen(true)}>New cargo</Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Cargo</th>
                  <th>Quantity</th>
                  <th>Route</th>
                  <th>Required</th>
                  <th>Contract</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCargos.map((cargo) => (
                  <tr
                    key={cargo.id}
                    onClick={() => handleRowClick(cargo.id)}
                    className="cursor-pointer"
                  >
                    <td><StatusBadge status={cargo.status} /></td>
                    <td className="font-medium">{cargo.cargoType || '—'}</td>
                    <td>{Number(cargo.quantityMt).toLocaleString()} MT</td>
                    <td>
                      <span className="whitespace-nowrap">
                        {cargo.originPort?.name || cargo.originPortId} → {cargo.destinationPort?.name || cargo.destinationPortId}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{formatDateSafely(cargo.requiredDate || cargo.requiredDeliveryDate)}</td>
                    <td>{cargo.contractDuration ? `${cargo.contractDuration} days` : '—'}</td>
                    <td>
                      <div
                        className="flex items-center justify-end gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="View market trends for cargo"
                          aria-label={`View market trends for ${cargo.cargoType || 'cargo'}`}
                          onClick={() => navigate(`/market?cargoId=${cargo.id}`)}
                          className="rounded-md p-1.5 text-[var(--color-status-info)] hover:bg-slate-100"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </button>
                        <button
                          title="View maritime map route"
                          aria-label={`View map route for ${cargo.cargoType || 'cargo'}`}
                          onClick={() => navigate(`/map?cargoId=${cargo.id}`)}
                          className="rounded-md p-1.5 text-[var(--color-status-success)] hover:bg-slate-100"
                        >
                          <Globe className="h-4 w-4" />
                        </button>
                        {permissions.canEditCargo && (
                          <button
                            title="Edit cargo"
                            aria-label={`Edit ${cargo.cargoType || 'cargo'}`}
                            onClick={() => handleEdit(cargo.id)}
                            className="rounded-md p-1.5 text-[var(--color-brand-text-secondary)] hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {permissions.canDeleteCargo && (
                          <button
                            title="Delete cargo"
                            aria-label={`Delete ${cargo.cargoType || 'cargo'}`}
                            onClick={() => handleDelete(cargo.id)}
                            className="rounded-md p-1.5 text-[var(--color-status-error)] hover:bg-slate-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <ChevronRight className="ml-1 h-4 w-4 text-[var(--color-brand-text-muted)]" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete confirmation */}
      <Modal
        open={!!deletingCargo}
        onClose={() => setDeletingCargo(null)}
        title="Delete cargo request"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingCargo(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-[var(--color-brand-text-secondary)]">
          Are you sure you want to delete{' '}
          <strong className="text-[var(--color-brand-text-primary)]">
            {deletingCargo?.cargoType || 'this cargo request'}
          </strong>{' '}
          ({deletingCargo ? Number(deletingCargo.quantityMt).toLocaleString() : 0} MT)? This action cannot be undone.
        </p>
      </Modal>

      {/* Create / Edit dialog */}
      <NewCargoDialog
        isOpen={isDialogOpen}
        ports={ports}
        portsError={portsError}
        onRetryPorts={loadData}
        cargo={editingCargo}
        onSuccess={handleCargoSaved}
        onClose={() => {
          setEditingCargo(null);
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
};
