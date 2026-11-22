import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Layers } from 'lucide-react';
import {
  selectCategories,
  selectServices,
  fetchCategoriesThunk,
  fetchServicesThunk
} from '../../store/slices/marketplaceSlice';
import { DataTable } from '../../design-system/primitives/DataTable';

export function CategoryManagerPage() {
  const dispatch = useDispatch();
  const categoriesList = useSelector(selectCategories);
  const servicesList = useSelector(selectServices);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
    dispatch(fetchServicesThunk({ role: 'admin' }));
  }, [dispatch]);

  const categories = useMemo(() => {
    const sList = servicesList || [];
    return (categoriesList || []).map(cat => ({
      ...cat,
      serviceCount: sList.filter(s => s.categoryId === cat.id || s.categoryName?.toLowerCase() === cat.name?.toLowerCase()).length
    }));
  }, [categoriesList, servicesList]);

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
          <p className="page-subtitle">View marketplace categories and listing counts</p>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={categories} keyField="id" />
      </div>
    </div>
  );
}
