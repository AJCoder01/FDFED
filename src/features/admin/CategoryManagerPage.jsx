import React, { useState, useEffect } from 'react';
import { Layers, Plus } from 'lucide-react';
import { getCategories } from '../../data/mockRepository';
import { DataTable } from '../../design-system/primitives/DataTable';
import { Button } from '../../design-system/primitives/Button';

export function CategoryManagerPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadData() {
      const list = await getCategories();
      setCategories(list);
    }
    loadData();
  }, []);

  const columns = [
    { header: 'Category Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Slug', accessor: 'slug' },
    { header: 'Description', accessor: 'description' },
    { header: 'Active Services', accessor: 'serviceCount' }
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
