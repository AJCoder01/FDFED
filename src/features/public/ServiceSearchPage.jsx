import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, X, ArrowUpDown, Shield } from 'lucide-react';
import { getServices, getCategories } from '../../data/mockRepository';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { EmptyState } from '../../design-system/primitives/EmptyState';
import { Button } from '../../design-system/primitives/Button';
import { Select } from '../../design-system/primitives/Select';

export function ServiceSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSort = searchParams.get('sort') || 'rating';
  const currentMaxPrice = searchParams.get('maxPrice') || '';

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const cats = await getCategories();
      setCategories(cats);

      const srvs = await getServices({
        search: currentSearch,
        category: currentCategory,
        sort: currentSort,
        maxPrice: currentMaxPrice
      });
      setServices(srvs);
      setLoading(false);
    }
    fetchData();
  }, [currentSearch, currentCategory, currentSort, currentMaxPrice]);

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const handleSearchFormSubmit = (e) => {
    e.preventDefault();
    updateFilters('search', searchInput);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="app-container" style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Find Local Services</h1>
        <p className="page-subtitle">Browse transparent fixed-price services offered by verified providers</p>
      </div>

      {/* Filter Bar Controls */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <form onSubmit={handleSearchFormSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '0 12px', backgroundColor: '#FFF' }}>
            <Search size={18} color="var(--color-muted)" />
            <input
              type="text"
              placeholder="Search services by keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ width: '100%', height: '40px', border: 'none', outline: 'none', fontSize: '14px' }}
            />
          </div>
          <Button type="submit" variant="primary">Search</Button>
        </form>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
          {/* Category Dropdown */}
          <div style={{ width: '200px' }}>
            <Select
              placeholder="All Categories"
              value={currentCategory}
              onChange={(e) => updateFilters('category', e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ width: '180px' }}>
            <Select
              value={currentSort}
              onChange={(e) => updateFilters('sort', e.target.value)}
              options={[
                { value: 'rating', label: 'Top Rated' },
                { value: 'price_low', label: 'Price: Low to High' },
                { value: 'price_high', label: 'Price: High to Low' },
              ]}
            />
          </div>

          {/* Price Range Filter */}
          <div style={{ width: '180px' }}>
            <Select
              value={currentMaxPrice}
              onChange={(e) => updateFilters('maxPrice', e.target.value)}
              options={[
                { value: '', label: 'Any Price' },
                { value: '500', label: 'Under ₹500' },
                { value: '1000', label: 'Under ₹1,000' },
                { value: '1500', label: 'Under ₹1,500' },
              ]}
            />
          </div>

          {(currentSearch || currentCategory || currentMaxPrice) && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} icon={X}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filter Chips */}
        {(currentSearch || currentCategory || currentMaxPrice) && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-muted)' }}>Active Filters:</span>
            {currentSearch && (
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '16px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Search: "{currentSearch}" <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilters('search', '')} />
              </span>
            )}
            {currentCategory && (
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '16px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Category: {categories.find(c => c.id === currentCategory)?.name || currentCategory} <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilters('category', '')} />
              </span>
            )}
            {currentMaxPrice && (
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '16px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Under ₹{currentMaxPrice} <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilters('maxPrice', '')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: 'var(--color-muted)' }}>
        <span>Showing <strong>{services.length}</strong> available service listings</span>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} height="320px" borderRadius="12px" />)}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          title="No Matching Services Found"
          description="Try adjusting your search criteria or price filters to discover more local service providers."
          actionLabel="Clear All Filters"
          onAction={clearAllFilters}
        />
      ) : (
        <div className="grid-cols-3">
          {services.map((srv) => (
            <div key={srv.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <img src={srv.image} alt={srv.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{srv.categoryName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>⏱ {srv.duration}</span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '6px', lineHeight: '1.3' }}>{srv.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px', height: '36px', overflow: 'hidden' }}>{srv.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--color-ink)', fontWeight: '700' }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" /> {srv.rating}
                    </div>
                    <span style={{ color: 'var(--color-muted)', fontSize: '12px' }}>({srv.reviewCount} reviews)</span>
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={13} color="var(--color-success)" />
                    <span>{srv.providerName}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', display: 'block' }}>Fixed Price</span>
                    <strong style={{ fontSize: '18px', color: 'var(--color-ink)' }}>₹{srv.price}</strong>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => navigate(`/services/${srv.id}`)}>
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
