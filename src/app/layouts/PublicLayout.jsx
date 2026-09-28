import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Search, User, Bell, RotateCcw, Menu, X, HelpCircle, Briefcase, Lock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../../design-system/primitives/Button';
import { Toast } from '../../design-system/primitives/Toast';

export function PublicLayout() {
  const { currentRole, switchRole, handleResetDemoData, toast, clearToast, unreadCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-page-bg)' }}>
      {/* Top Demo Bar for Professor Walkthrough */}
      <div style={{ backgroundColor: '#090F1E', color: '#94A3B8', padding: '8px 24px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontWeight: '700', color: '#60A5FA', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            ServiceHub Demo Switcher:
          </span>
          <span style={{ color: '#E2E8F0' }}>Active Role: <strong style={{ color: '#93C5FD' }}>{currentRole.toUpperCase()}</strong></span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['guest', 'customer', 'provider', 'admin', 'arbitrator'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  switchRole(role);
                  if (role === 'customer') navigate('/customer');
                  else if (role === 'provider') navigate('/provider');
                  else if (role === 'admin') navigate('/admin');
                  else if (role === 'arbitrator') navigate('/arbitrator');
                  else navigate('/');
                }}
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: currentRole === role ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
                  backgroundColor: currentRole === role ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  color: currentRole === role ? '#FFFFFF' : '#CBD5E1',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease'
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleResetDemoData}
          style={{ background: '#EF4444', color: '#FFF', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(239,68,68,0.2)' }}
        >
          <RotateCcw size={12} /> Reset Demo Data
        </button>
      </div>

      {/* Main Navbar */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-xs)' }}>
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
              <Shield size={22} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)', letterSpacing: '-0.03em', lineHeight: '1' }}>ServiceHub</span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-primary)', letterSpacing: '0.08em', marginTop: '2px' }}>PRO MARKETPLACE</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link to="/services" style={{ color: location.pathname === '/services' ? 'var(--color-primary)' : 'var(--color-ink-secondary)', fontWeight: '600', fontSize: '14px', transition: 'color 0.15s ease' }}>
              Find Services
            </Link>
            <Link to="/post-a-job" style={{ color: location.pathname === '/post-a-job' ? 'var(--color-primary)' : 'var(--color-ink-secondary)', fontWeight: '600', fontSize: '14px', transition: 'color 0.15s ease' }}>
              Post a Custom Job
            </Link>
            <Link to="/help" style={{ color: location.pathname === '/help' ? 'var(--color-primary)' : 'var(--color-ink-secondary)', fontWeight: '600', fontSize: '14px', transition: 'color 0.15s ease' }}>
              Help & Support
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentRole === 'guest' ? (
              <>
                <Link to="/login">
                  <Button variant="outline" size="md">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="md">Sign Up</Button>
                </Link>
              </>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (currentRole === 'customer') navigate('/customer');
                  else if (currentRole === 'provider') navigate('/provider');
                  else if (currentRole === 'admin') navigate('/admin');
                  else if (currentRole === 'arbitrator') navigate('/arbitrator');
                }}
              >
                Go to Dashboard ({currentRole})
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer (Dark Navy matching UI references) */}
      <footer style={{ backgroundColor: '#0B132B', color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '56px 0 32px 0' }}>
        <div className="app-container">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', paddingBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <Shield size={18} />
                </div>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.02em' }}>ServiceHub</span>
              </div>
              <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', maxWidth: '360px' }}>
                The trusted non-retail home & local service marketplace with fixed INR pricing, verified background checks, and escrow payment protection across India.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px', fontSize: '13px', color: '#CBD5E1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} color="#3B82F6" /> 256-Bit Escrow Security</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#10B981" /> 100% Verified Pros</span>
              </div>
            </div>

            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Services</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <li><Link to="/services?category=cat-1" style={{ color: '#94A3B8' }}>Cleaning & Housekeeping</Link></li>
                <li><Link to="/services?category=cat-2" style={{ color: '#94A3B8' }}>Plumbing Services</Link></li>
                <li><Link to="/services?category=cat-3" style={{ color: '#94A3B8' }}>Electrical Repairs</Link></li>
                <li><Link to="/services?category=cat-4" style={{ color: '#94A3B8' }}>Appliance Repair</Link></li>
                <li><Link to="/services?category=cat-5" style={{ color: '#94A3B8' }}>AC Servicing & HVAC</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marketplace</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <li><Link to="/services" style={{ color: '#94A3B8' }}>Browse All Services</Link></li>
                <li><Link to="/post-a-job" style={{ color: '#94A3B8' }}>Post Custom Request</Link></li>
                <li><Link to="/signup" style={{ color: '#94A3B8' }}>Become a Provider</Link></li>
                <li><Link to="/help" style={{ color: '#94A3B8' }}>Escrow Guarantee</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cities Covered</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <li>Bengaluru (Koramangala, Indiranagar)</li>
                <li>Mumbai (Andheri, Bandra)</li>
                <li>Delhi NCR (Gurugram, Noida)</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '24px', fontSize: '13px' }}>
            <div>
              © 2026 ServiceHub Technologies Inc. All rights reserved. Academic Demo Version.
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link to="/help" style={{ color: '#94A3B8' }}>Privacy Policy</Link>
              <Link to="/help" style={{ color: '#94A3B8' }}>Terms of Escrow</Link>
              <Link to="/help" style={{ color: '#94A3B8' }}>Dispute Resolution Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container */}
      <Toast message={toast.message} type={toast.type} onClose={clearToast} />
    </div>
  );
}

