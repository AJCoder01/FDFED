import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Shield, Star, Wrench, Sparkles, Zap, Tv, Wind, ArrowRight, CheckCircle2, Lock, Users, Award, Bot, MessageSquare } from 'lucide-react';
import { getCategories, getServices } from '../../data/mockRepository';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';

export function LandingPage() {
  const [categories, setCategories] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const cats = await getCategories();
      const srvs = await getServices();
      setCategories(cats);
      setPopularServices(srvs.slice(0, 4));
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    let query = `/services?`;
    const params = [];
    if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
    if (selectedCategory) params.push(`category=${encodeURIComponent(selectedCategory)}`);
    navigate(params.length > 0 ? `/services?${params.join('&')}` : '/services');
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles size={24} color="var(--color-primary)" />;
      case 'Wrench': return <Wrench size={24} color="var(--color-primary)" />;
      case 'Zap': return <Zap size={24} color="var(--color-primary)" />;
      case 'Tv': return <Tv size={24} color="var(--color-primary)" />;
      case 'Wind': return <Wind size={24} color="var(--color-primary)" />;
      default: return <Wrench size={24} color="var(--color-primary)" />;
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

          {/* Integrated Search Bar Box */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', maxWidth: '760px', margin: '0 auto', padding: '8px', borderRadius: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 2, paddingLeft: '14px', minWidth: '220px' }}>
              <Search size={20} color="#64748B" />
              <input
                type="text"
                placeholder="What service do you need? (e.g. AC Repair, Cleaning...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#0F172A', fontWeight: '500' }}
              />
            </div>
            
            <div style={{ width: '1px', height: '32px', backgroundColor: '#E2E8F0' }} className="desktop-nav" />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '14px', color: '#334155', fontWeight: '600', backgroundColor: 'transparent', cursor: 'pointer', padding: '0 12px', minWidth: '150px' }}
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
            <button type="button" onClick={() => navigate('/services?search=cleaning')} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>Deep House Cleaning</button>
            <span>•</span>
            <button type="button" onClick={() => navigate('/services?search=ac')} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>AC Servicing</button>
            <span>•</span>
            <button type="button" onClick={() => navigate('/services?search=plumb')} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>Plumbing</button>
            <span>•</span>
            <button type="button" onClick={() => navigate('/services?search=electric')} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>Electrical Repairs</button>
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
            <p className="section-subtitle">Select a category to browse qualified local specialists</p>
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
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigate(`/services?category=${cat.id}`)}
                className="card card-hover"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getCategoryIcon(cat.icon)}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>{cat.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px', lineHeight: '1.4' }}>{cat.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. POPULAR SERVICES GRID */}
      <section className="app-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Rated</span>
            <h2 className="section-title" style={{ marginTop: '2px' }}>Featured Verified Services</h2>
            <p className="section-subtitle">Transparent fixed-price services in Bengaluru, Mumbai, and Delhi</p>
          </div>
          <Link to="/services" style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Explore all services <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height="320px" borderRadius="14px" />)}
          </div>
        ) : (
          <div className="grid-cols-4">
            {popularServices.map((srv) => (
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
                      <span>{srv.rating}</span>
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
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-panel)', padding: '40px', boxShadow: 'var(--shadow-sm)' }}>
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

      {/* 6. AI ASSISTANT BANNER (Matching UI Reference 1 & 3) */}
      <section className="app-container">
        <div style={{ backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', borderRadius: 'var(--radius-panel)', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
              <Bot size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)' }}>Meet Ember, your ServiceHub AI Assistant</h3>
                <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: 'var(--color-primary)', color: '#FFF', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>AI SMART MATCH</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px' }}>
                Not sure what service you need? Ember helps you describe issues, get pricing estimates, and match with the top rated expert.
              </p>
            </div>
          </div>

          <Button variant="primary" size="md" icon={MessageSquare} onClick={() => navigate('/services')}>
            Chat with Assistant
          </Button>
        </div>
      </section>

      {/* 7. BOTTOM CTA SECTION (Matching UI Reference 2) */}
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
              <Button variant="secondary" size="lg" style={{ borderRadius: '12px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#FFFFFF' }} onClick={() => navigate('/signup')}>
                Become a Provider
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

