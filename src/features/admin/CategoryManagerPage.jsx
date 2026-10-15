import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { getCategories, getServices } from '../../data/mockRepository';
import { DataTable } from '../../design-system/primitives/DataTable';

export function CategoryManagerPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [list, services] = await Promise.all([
        getCategories(),
        getServices({ role: 'admin' })
      ]);
      const servicesList = services || [];
      const updated = (list || []).map(cat => ({
        ...cat,
        serviceCount: servicesList.filter(s => s.categoryId === cat.id || s.categoryName?.toLowerCase() === cat.name?.toLowerCase()).length
      }));
      setCategories(updated);
    }
    loadData();
  }, []);

  const columns = [
    { header: 'Category Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Slug', accessor: 'slug' },
    { header: 'Description', accessor: 'description' },
    { header: 'Active Services', accessor: 'serviceCount', render: (row) => <span>{row.serviceCount} listed</span> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Service Category Manager</h1>
          <p className="page-subtitle">Configure marketplace categories and tax/commission structures</p>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={categories} keyField="id" />
      </div>
    </div>
  );
}
