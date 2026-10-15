import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { getAccounts } from '../../data/mockRepository';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Users, Shield, ShieldCheck, UserRound, Wrench, Scale, Eye, UserCheck } from 'lucide-react';

const SENSITIVE_KEY_PATTERNS = [
  'password',
  'credential',
  'credentials',
  'token',
  'secret',
  'auth',
  'hash',
  'passcode',
  'apikey'
];

function isSensitiveKey(key) {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some(p => lower.includes(p));
}

function sanitizeData(data) {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (typeof data === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (isSensitiveKey(k)) continue;
      clean[k] = sanitizeData(v);
    }
    return clean;
  }
  return data;
}

export function AdminAccountsPage() {
  const { currentUser, isSuperUser, isSuperUserDemoMode, switchRole } = useApp();
  const navigate = useNavigate();

  const { data: accounts, loading, error, refresh } = useRepositoryQuery(getAccounts);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState(null);

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="400px" borderRadius="12px" />;

  const roleOptions = [
    { value: 'all', label: 'All Actors' },
    { value: 'customer', label: 'Customers' },
    { value: 'provider', label: 'Service Providers' },
    { value: 'arbitrator', label: 'Arbitrators' },
    { value: 'admin', label: 'Admin' },
    { value: 'superuser', label: 'SuperUser' },
    { value: 'other', label: 'Other Actors' }
  ];

  const filteredAccounts = (accounts || []).filter(acc => {
    const matchesSearch = !search.trim() ||
      acc.name?.toLowerCase().includes(search.toLowerCase()) ||
      acc.email?.toLowerCase().includes(search.toLowerCase()) ||
      acc.phone?.includes(search) ||
      (acc.location && acc.location.toLowerCase().includes(search.toLowerCase())) ||
      (acc.city && acc.city.toLowerCase().includes(search.toLowerCase()));

    const isAccSuper = acc.role === 'admin' && (acc.isSuperUser === true || acc.id === 'user-admin-1' || acc.email?.toLowerCase() === 'admin@gmail.com');
    const matchesRole = selectedRole === 'all' ||
      (selectedRole === 'superuser' ? isAccSuper :
       selectedRole === 'admin' ? (acc.role === 'admin' && !isAccSuper) :
       acc.role === selectedRole);
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (row) => {
    if (row?.role === 'admin') {
      const isRowSuper = row.isSuperUser === true || row.email?.toLowerCase() === 'admin@gmail.com' || row.id === 'user-admin-1';
      if (isRowSuper) {
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontSize: '12px', fontWeight: '700' }}>
            <ShieldCheck size={13} />
            SuperUser
          </span>
        );
      }
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontSize: '12px', fontWeight: '700' }}>
          <Shield size={13} />
          Admin
        </span>
      );
    }
    const styles = {
      customer: { bg: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)', label: 'Customer', icon: UserRound },
      provider: { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', label: 'Provider', icon: Wrench },
      arbitrator: { bg: 'rgba(217, 119, 6, 0.1)', color: '#d97706', label: 'Arbitrator', icon: Scale }
    };
    const style = styles[row?.role] || { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', label: row?.role || 'User', icon: Users };
    const Icon = style.icon;

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '12px', backgroundColor: style.bg, color: style.color, fontSize: '12px', fontWeight: '700' }}>
        <Icon size={13} />
        {style.label}
      </span>
    );
  };

  const columns = [
    {
      header: 'Actor',
      accessor: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={row.avatar || DEFAULT_BLANK_AVATAR}
            alt={row.name}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }}
          />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--color-ink)', display: 'block' }}>{row.name}</strong>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>ID: {row.id}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => getRoleBadge(row)
    },
    {
      header: 'Email Address',
      accessor: 'email',
      render: (row) => <span style={{ fontSize: '13px', color: 'var(--color-ink)' }}>{row.email}</span>
    },
    {
      header: 'Phone Number',
      accessor: 'phone',
      render: (row) => <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{row.phone || 'N/A'}</span>
    },
    {
      header: 'Registered Location',
      accessor: 'location',
      render: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--color-ink)' }}>
          {row.location || row.city || row.country || row.serviceArea || 'Bengaluru'}
        </span>
      )
    },
    {
      header: 'Account Status',
      accessor: 'status',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', color: '#16a34a' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
          Active
        </span>
      )
    },
    {
      header: 'Action',
      accessor: 'id',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          icon={Eye}
          onClick={() => setSelectedAccount(row)}
        >
          View Details
        </Button>
      )
    }
  ];

  const cleanSelectedAccount = selectedAccount ? sanitizeData(selectedAccount) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">All Platform Actor Accounts</h1>
          <p className="page-subtitle">Directory of all registered actors filtered across customer, provider, arbitrator, and admin accounts</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Users size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>
            Total Registered: {accounts?.length || 0}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', padding: '16px' }}>
        <TextField
          label="Search by Name, Email, Phone, Location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter accounts..."
        />
        <Select
          label="Filter by Actor Role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          options={roleOptions}
        />
      </div>

      <div className="card">
        <DataTable columns={columns} data={filteredAccounts} keyField="id" />
      </div>

      {/* Account Details Modal (Credentials & Password strictly excluded) */}
      {cleanSelectedAccount && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAccount(null)}
          title={`Actor Account Details: ${cleanSelectedAccount.name || cleanSelectedAccount.id}`}
          maxWidth="560px"
          footer={(
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px', flexWrap: 'wrap' }}>
              {cleanSelectedAccount.role && ['customer', 'provider', 'arbitrator', 'admin'].includes(cleanSelectedAccount.role) && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={UserCheck}
                  onClick={async () => {
                    const isAccountSuper = cleanSelectedAccount.isSuperUser || cleanSelectedAccount.id === 'user-admin-1' || cleanSelectedAccount.email?.toLowerCase() === 'admin@gmail.com';
                    const roleTarget = isAccountSuper ? 'superuser' : (cleanSelectedAccount.role === 'admin' ? 'admin' : cleanSelectedAccount.role);
                    setSelectedAccount(null);
                    const res = await switchRole(roleTarget);
                    if (res?.path) navigate(res.path);
                  }}
                >
                  Switch Demo to this Actor
                </Button>
              )}
              <Button variant="secondary" onClick={() => setSelectedAccount(null)}>
                Close
              </Button>
            </div>
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Profile Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
              <img
                src={cleanSelectedAccount.avatar || DEFAULT_BLANK_AVATAR}
                alt={cleanSelectedAccount.name}
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '16px', color: 'var(--color-ink)' }}>{cleanSelectedAccount.name}</strong>
                  {getRoleBadge(cleanSelectedAccount)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>
                  Account ID: <code style={{ backgroundColor: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px' }}>{cleanSelectedAccount.id}</code>
                </div>
              </div>
            </div>

            {/* Core Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>EMAIL ADDRESS</span>
                <strong style={{ color: 'var(--color-ink)' }}>{cleanSelectedAccount.email || 'N/A'}</strong>
              </div>
              <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>PHONE NUMBER</span>
                <strong style={{ color: 'var(--color-ink)' }}>{cleanSelectedAccount.phone || 'N/A'}</strong>
              </div>
              <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>LOCATION / AREA</span>
                <strong style={{ color: 'var(--color-ink)' }}>{cleanSelectedAccount.location || cleanSelectedAccount.city || cleanSelectedAccount.serviceArea || 'Bengaluru'}</strong>
              </div>
              <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>ACCOUNT CREATED</span>
                <strong style={{ color: 'var(--color-ink)' }}>
                  {cleanSelectedAccount.createdAt ? new Date(cleanSelectedAccount.createdAt).toLocaleDateString() : 'Active Demo Actor'}
                </strong>
              </div>
            </div>

            {/* Role-Specific Details */}
            {cleanSelectedAccount.role === 'provider' && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-ink)' }}>Provider Profile & Verification</strong>
                <div><strong>Business Name:</strong> {cleanSelectedAccount.businessName || cleanSelectedAccount.name}</div>
                <div><strong>Verification Status:</strong> {cleanSelectedAccount.verificationStatus || 'approved'}</div>
                {cleanSelectedAccount.serviceArea && <div><strong>Service Area:</strong> {cleanSelectedAccount.serviceArea}</div>}
                {cleanSelectedAccount.skills && cleanSelectedAccount.skills.length > 0 && (
                  <div>
                    <strong>Skills:</strong>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {cleanSelectedAccount.skills.map((skill, i) => (
                        <span key={i} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {cleanSelectedAccount.role === 'customer' && cleanSelectedAccount.addresses && cleanSelectedAccount.addresses.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-ink)' }}>Saved Delivery Addresses</strong>
                {cleanSelectedAccount.addresses.map((addr, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', backgroundColor: 'var(--color-page-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                    <strong>{addr.label}:</strong> {addr.addressLine}, {addr.city} - {addr.pincode}
                  </div>
                ))}
              </div>
            )}

            {cleanSelectedAccount.role === 'arbitrator' && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-ink)' }}>Arbitrator Profile</strong>
                <div><strong>Designation:</strong> {cleanSelectedAccount.title || 'Senior Independent Arbitrator'}</div>
              </div>
            )}

            {cleanSelectedAccount.role === 'admin' && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-ink)' }}>Access Role Privileges</strong>
                <div><strong>Role Type:</strong> {cleanSelectedAccount.isSuperUser ? 'SuperUser (Full Platform & Demo Controller)' : 'Admin (Platform Operations)'}</div>
                {cleanSelectedAccount.department && <div><strong>Department:</strong> {cleanSelectedAccount.department}</div>}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
