import React from 'react';
import { Scale, User, Mail, Phone, ShieldCheck, CheckCircle2, Award, FileText, Calendar, Clock, MapPin, Gavel } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';

export function ArbitratorProfilePage() {
  const { currentUser, showToast } = useApp();

  const handleCredentialVerify = () => {
    showToast('Arbitrator bar council credentials & digital signature verified.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Arbitrator Profile & Accreditation</h1>
          <p className="page-subtitle">View official panel credentials, dispute resolution statistics, and judicial standing.</p>
        </div>
        <Button variant="outline" size="sm" icon={ShieldCheck} onClick={handleCredentialVerify}>
          Verify Bar Accreditation
        </Button>
      </div>

      {/* Main Profile Summary Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', padding: '32px' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
            alt={currentUser?.name}
            style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-conflict)' }}
          />
          <div style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#10B981', width: '22px', height: '22px', borderRadius: '50%', border: '3px solid #FFF' }} />
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>{currentUser?.name || 'Justice V. K. Sundaram (Retd.)'}</h2>
            <StatusBadge status="approved" label="Empaneled Arbitrator" />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-conflict)', fontWeight: '700', marginTop: '2px' }}>
            {currentUser?.title || 'Senior Independent Arbitrator'} • Indian Arbitration Panel
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: 'var(--color-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={15} color="var(--color-primary)" /> {currentUser?.email || 'arbitrator.sundaram@servicehub.in'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={15} color="var(--color-primary)" /> {currentUser?.phone || '+91 94444 88888'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={15} color="var(--color-primary)" /> Arbitration Tribunal, Bengaluru</span>
          </div>
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-cols-2">
        
        {/* Left: Judicial & Panel Credentials */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-conflict-bg)', color: 'var(--color-conflict)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)' }}>Judicial Credentials</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Official bar standing & panel registration</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Roster Panel ID</span>
              <strong style={{ color: 'var(--color-ink)', fontFamily: 'monospace' }}>ARB-IND-509</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Bar Council Reg.</span>
              <strong style={{ color: 'var(--color-ink)' }}>KAR/1988/4092</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Specialization</span>
              <strong style={{ color: 'var(--color-ink)' }}>Contractual & Escrow Disputes</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Appointed Date</span>
              <strong style={{ color: 'var(--color-ink)' }}>March 10, 2025</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Jurisdiction</span>
              <strong style={{ color: 'var(--color-primary)' }}>Pan-India Digital Arbitration</strong>
            </div>
          </div>
        </div>

        {/* Right: Dispute Resolution Performance Metrics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gavel size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)' }}>Tribunal Performance</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Dispute case statistics & ruling records</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>18</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Total Cases Resolved</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-warning)' }}>1</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Active Dispute (#DISP-101)</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#10B981' }}>17</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Final Awards Issued</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)' }}>4.2 Days</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Avg. Resolution Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Code of Neutrality & Digital Signature Banner */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(217, 119, 6, 0.1)', color: 'var(--color-conflict)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-ink)' }}>Independent & Neutral Adjudication Protocol</h4>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}>
              Bound by the Indian Arbitration & Conciliation Act • Digital Signature Certificate Verified
            </p>
          </div>
        </div>
        <StatusBadge status="approved" label="Certified Neutral" />
      </div>
    </div>
  );
}
