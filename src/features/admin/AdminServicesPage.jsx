import React, { useState, useCallback } from 'react';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { getServices, getCategories, saveService } from '../../data/mockRepository';
import { DEFAULT_SERVICE_IMAGE } from '../../data/mockData';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Eye, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminServicesPage() {
  const { showToast } = useApp();
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const [services, categories] = await Promise.all([
      getServices({ role: 'admin' }),
      getCategories()
    ]);
    return { services: services || [], categories: categories || [] };
  }, []);

  const { data, loading, error, refresh } = useRepositoryQuery(load);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const handleToggleStatus = async (id, currentStatus) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const status = currentStatus === 'published' ? 'paused' : 'published';
      await saveService({ id, status }, { role: 'admin' });
      showToast(`Listing status updated to ${status}.`);
    } catch (err) {
      showToast(err.message || 'Failed to update service status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="400px" borderRadius="12px" />;

  const categoryMap = new Map((data?.categories || []).map(c => [c.id, c.name]));

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...(data?.categories || []).map(c => ({ value: c.id, label: c.name }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'published', label: 'Published' },
    { value: 'paused', label: 'Paused' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' }
  ];

  const filteredServices = (data?.services || []).filter(s => {
    const catName = s.categoryName || categoryMap.get(s.categoryId) || '';
    const matchesSearch = !search.trim() ||
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.providerName?.toLowerCase().includes(search.toLowerCase()) ||
      catName.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || s.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const columns = [
    {
      header: 'Service',
      accessor: 'title',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={row.image || DEFAULT_SERVICE_IMAGE}
            alt={row.title}
            style={{ width: '48px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--color-border)' }}
          />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--color-ink)', display: 'block' }}>{row.title}</strong>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>ID: #{row.id}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'categoryName',
      render: (row) => {
        const catName = row.categoryName || categoryMap.get(row.categoryId) || 'General';
        return (
          <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}>
            {catName}
          </span>
        );
      }
    },
    {
      header: 'Provider',
      accessor: 'providerName',
      render: (row) => <strong style={{ fontSize: '13px', color: 'var(--color-ink)' }}>{row.providerName}</strong>
    },
    {
      header: 'Price',
      accessor: 'price',
      render: (row) => <strong style={{ color: 'var(--color-primary)', fontSize: '13px' }}>₹{row.price}</strong>
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (row) => <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{row.duration}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to={`/services/${row.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-page-bg)',
              border: '1px solid var(--color-border)'
            }}
          >
            <Eye size={13} /> Preview
          </Link>
          <Button
            size="sm"
            variant={row.status === 'published' ? 'secondary' : 'primary'}
            disabled={busyId === row.id}
            onClick={() => handleToggleStatus(row.id, row.status)}
          >
            {row.status === 'published' ? 'Pause' : 'Publish'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">All Marketplace Services</h1>
          <p className="page-subtitle">Platform-wide overview of all services registered by service providers</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Layers size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>
            Total Services: {data?.services?.length || 0}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', padding: '16px' }}>
        <TextField
          label="Search Services / Providers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title, provider or category..."
        />
        <Select
          label="Service Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          options={categoryOptions}
        />
        <Select
          label="Publication Status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={statusOptions}
        />
      </div>

      <div className="card">
        <DataTable columns={columns} data={filteredServices} keyField="id" />
      </div>
    </div>
  );
}
