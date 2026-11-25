import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategories,
  fetchServices,
  selectCategories,
  selectServices,
} from '../../store/slices/marketplaceSlice';
import { DataTable } from '../../design-system/primitives/DataTable';

export function CategoryManagerPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchServices({ role: 'admin' }));
  }, [dispatch]);

  const rawCategories = useSelector(selectCategories);
  const servicesList = useSelector(selectServices);
  const categories = rawCategories.map(cat => ({
    ...cat,
    serviceCount: servicesList.filter(s => s.categoryId === cat.id || s.categoryName?.toLowerCase() === cat.name?.toLowerCase()).length
  }));

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
