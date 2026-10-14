import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Shield, Star, Wrench, Sparkles, Zap, Tv, Wind, ArrowRight, X } from 'lucide-react';
import { getCategories, getServices } from '../../data/mockRepository';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';
import { useApp } from '../../app/context/AppContext';

export function LandingPage() {
  const { currentRole, logout } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // When on the landing page, ensure any stale session is cleared so user is guest and must log in / sign up
    if (currentRole && currentRole !== 'guest') {
      logout();
    }
  }, [currentRole, logout]);

  const load = useCallback(async () => {
    const [categories, services] = await Promise.all([getCategories(), getServices()]);
    return { categories, services };
  }, []);
  const { data, loading, error, refresh } = useRepositoryQuery(load);
  const categories = data?.categories || [];
  const allServices = data?.services || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const isFiltering = Boolean(searchQuery.trim() || selectedCategory);

  const displayedServices = isFiltering
    ? allServices.filter((s) => {
        const matchesCategory = selectedCategory ? s.categoryId === selectedCategory : true;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q || (
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.categoryName?.toLowerCase().includes(q)
        );
        return matchesCategory && matchesQuery;
      })
    : allServices.slice(0, 4);

  const scrollToServices = () => {
    const target = document.getElementById('landing-services-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    scrollToServices();
  };

  const handlePopularKeyword = (keyword) => {
    setSearchQuery(keyword);
    scrollToServices();
  };

  const handleCategorySelect = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory('');
    } else {
      setSelectedCategory(categoryId);
      scrollToServices();
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;

  const getCategoryIcon = (iconName, isSelected = false) => {
    const color = isSelected ? '#FFFFFF' : 'var(--color-primary)';
    switch (iconName) {
      case 'Sparkles': return <Sparkles size={24} color={color} />;
      case 'Wrench': return <Wrench size={24} color={color} />;
      case 'Zap': return <Zap size={24} color={color} />;
      case 'Tv': return <Tv size={24} color={color} />;
      case 'Wind': return <Wind size={24} color={color} />;
      default: return <Wrench size={24} color={color} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '56px', paddingBottom: '64px' }}>
      
      {/* 1. HERO SECTION (Dark Navy matching UI Reference 1 & 2) */}
      <section style={{ backgroundColor: '#0B132B', color: '#FFFFFF', padding: '72px 0 80px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
        
        <div className="app-container" style={{ textAlign: 'center', maxWidth: '880px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(96, 165, 250, 0.3)', color: '#93C5FD', fontSize: '13px', fontWeight: '700', marginBottom: '24px' }}>
            <Shield size={16} color="#60A5FA" /> 100% Verified Background-Checked Pros Across India
          </div>
          
          <h1 style={{ fontSize: '3.25rem', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.15', letterSpacing: '-0.03em', marginBottom: '20px' }}>
            Find trusted experts.<br />
            <span style={{ background: 'linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Get work done right.
            </span>
          </h1>
          
          <p style={{ fontSize: '1.2rem', color: '#94A3B8', marginBottom: '40px', lineHeight: '1.6', maxWidth: '720px', margin: '0 auto 40px auto' }}>
            ServiceHub connects you with verified professionals for home services. Fixed INR prices, 256-bit escrow payment protection, and total peace of mind.
          </p>

          {/* Integrated Search Bar Box - Filters directly on landing page */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', maxWidth: '760px', margin: '0 auto', padding: '8px', borderRadius: '16px', backgroundColor: 'var(--color-surface)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 2, paddingLeft: '14px', minWidth: '220px' }}>
              <Search size={20} color="#64748B" />
              <input
                type="text"
                placeholder="What service do you need? (e.g. AC Repair, Cleaning...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: 'var(--color-ink)', fontWeight: '500', backgroundColor: 'transparent' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--color-muted)' }}
                  title="Clear search text"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div style={{ width: '1px', height: '32px', backgroundColor: '#E2E8F0' }} className="desktop-nav" />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '14px', color: 'var(--color-ink-secondary)', fontWeight: '600', backgroundColor: 'transparent', cursor: 'pointer', padding: '0 12px', minWidth: '150px' }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <Button type="submit" variant="primary" size="lg" style={{ borderRadius: '12px' }}>
              Search Services
            </Button>
          </form>

          {/* Quick Popular Keywords */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '20px', fontSize: '13px', color: '#94A3B8', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', color: '#CBD5E1' }}>Popular:</span>
            <button type="button" onClick={() => handlePopularKeyword('cleaning')} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>Deep House Cleaning</button>
            <span>•</span>
            <button type="button" onClick={() => handlePopularKeyword('ac')} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>AC Servicing</button>
            <span>•</span>
            <button type="button" onClick={() => handlePopularKeyword('plumb')} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>Plumbing</button>
            <span>•</span>
            <button type="button" onClick={() => handlePopularKeyword('electric')} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>Electrical Repairs</button>
          </div>
        </div>
      </section>

      {/* 2. TRUST STATS BAR (Dark Ribbon matching UI Reference 1 & 2) */}
      <section style={{ marginTop: '-56px', zIndex: 10 }}>
        <div className="app-container">
          <div style={{ backgroundColor: '#1E293B', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px', boxShadow: 'var(--shadow-lg)', color: '#FFFFFF', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', textAlign: 'center' }} className="grid-cols-5">
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#60A5FA' }}>100%</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', marginTop: '2px' }}>Verified Providers</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#60A5FA' }}>100,000+</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', marginTop: '2px' }}>Happy Clients</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#60A5FA' }}>250,000+</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', marginTop: '2px' }}>Projects Completed</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#60A5FA' }}>₹50Cr+</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', marginTop: '2px' }}>Escrow Protected</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#F59E0B' }}>4.9 / 5</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', marginTop: '2px' }}>Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES GRID */}
      <section className="app-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Browse Categories</span>
            <h2 className="section-title" style={{ marginTop: '2px' }}>Explore Popular Service Categories</h2>
            <p className="section-subtitle">Select a category to filter services right here, or view the complete catalog</p>
          </div>
          <Link to="/services" style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            View all categories <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid-cols-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height="130px" borderRadius="14px" />)}
          </div>
        ) : (
          <div className="grid-cols-5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="card card-hover"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    padding: '20px',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'rgba(37,99,235,0.06)' : 'var(--color-surface)',
                    boxShadow: isSelected ? '0 0 0 1px var(--color-primary)' : undefined,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#FFF' : undefined }}>
                    {getCategoryIcon(cat.icon, isSelected)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: isSelected ? 'var(--color-primary)' : 'var(--color-ink)' }}>{cat.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px', lineHeight: '1.4' }}>{cat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. POPULAR OR SEARCHED SERVICES GRID */}
      <section className="app-container" id="landing-services-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isFiltering ? 'Search Results' : 'Top Rated'}
            </span>
            <h2 className="section-title" style={{ marginTop: '2px' }}>
              {isFiltering ? `Matching Services (${displayedServices.length})` : 'Featured Verified Services'}
            </h2>
            <p className="section-subtitle">
              {isFiltering
                ? `Showing services matching ${[searchQuery ? `"${searchQuery}"` : null, selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : null].filter(Boolean).join(' in ')}`
                : 'Transparent fixed-price services in Bengaluru, Mumbai, and Delhi'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {isFiltering && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filter
              </Button>
            )}
            <Link to="/services" style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isFiltering ? 'Open in Find Services' : 'Explore all services'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height="320px" borderRadius="14px" />)}
          </div>
        ) : displayedServices.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Search size={40} color="var(--color-muted)" />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>No services found</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', maxWidth: '440px' }}>
              We couldn't find any services matching your search. Try different keywords, select another category, or reset the filter.
            </p>
            <Button variant="primary" size="sm" onClick={handleClearFilters} style={{ marginTop: '8px' }}>
              Reset Search
            </Button>
          </div>
        ) : (
          <div className="grid-cols-4">
            {displayedServices.map((srv) => (
              <div key={srv.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-card)' }}>
                <div style={{ position: 'relative', height: '170px' }}>
                  <img src={srv.image} alt={srv.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#FFFFFF', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase' }}>
                    {srv.categoryName}
                  </span>
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>
                      <Star size={15} fill="#F59E0B" color="#F59E0B" />
                      <span>{srv.reviewCount ? Number(srv.rating).toFixed(1) : 'No reviews yet'}</span>
                      <span style={{ color: 'var(--color-muted)', fontWeight: '500' }}>({srv.reviewCount} reviews)</span>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '8px', lineHeight: '1.3' }}>
                      {srv.title}
                    </h3>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600', textTransform: 'uppercase', display: 'block' }}>Fixed Price</span>
                      <strong style={{ fontSize: '20px', color: 'var(--color-ink)', fontWeight: '800' }}>₹{srv.price}</strong>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => navigate(`/services/${srv.id}`)}>
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. ESCROW PAYMENT PROTECTION (Matching UI Reference 1 & 2 & 3) */}
      <section className="app-container">
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-panel)', padding: '40px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Escrow Guarantee</span>
            <h2 className="section-title" style={{ marginTop: '4px' }}>Secure Payments with Escrow Protection</h2>
            <p className="section-subtitle">Your funds are held safely in escrow and only released when you approve the completed work.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--color-page-bg)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontWeight: '800', fontSize: '18px' }}>
                1
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Book & Pay to Escrow</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>Funds are safely held in ServiceHub escrow account before work starts.</p>
            </div>

            <ArrowRight size={24} color="var(--color-muted)" className="desktop-nav" />

            <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--color-page-bg)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontWeight: '800', fontSize: '18px' }}>
                2
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Work Delivered</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>Verified provider completes your requested service at your address.</p>
            </div>

            <ArrowRight size={24} color="var(--color-muted)" className="desktop-nav" />

            <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--color-page-bg)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontWeight: '800', fontSize: '18px' }}>
                3
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Approve & Release</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>Review the job result and release the funds to provider seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CTA SECTION (Matching UI Reference 2) */}
      <section className="app-container">
        <div style={{ backgroundColor: '#0B132B', color: '#FFFFFF', borderRadius: 'var(--radius-panel)', padding: '56px 40px', textAlign: 'center', boxShadow: 'var(--shadow-xl)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Ready to get started?
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#94A3B8', marginBottom: '32px' }}>
              Join thousands of satisfied clients and verified professionals on ServiceHub today.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Button variant="primary" size="lg" style={{ borderRadius: '12px' }} onClick={() => navigate('/services')}>
                Find a Service
              </Button>
              <Button variant="secondary" size="lg" style={{ borderRadius: '12px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#FFFFFF' }} onClick={() => navigate('/signup?role=provider')}>
                Become a Provider
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
