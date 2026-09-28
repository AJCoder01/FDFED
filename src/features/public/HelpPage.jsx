import React from 'react';
import { HelpCircle, ShieldCheck, Scale, PhoneCall, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HelpPage() {
  const faqs = [
    {
      q: 'How does ServiceHub ensure quality & provider verification?',
      a: 'All individual service professionals undergo government identity verification (Aadhaar/PAN), background checks, and trade skill audits before listings are published.'
    },
    {
      q: 'What happens if I am dissatisfied with the service?',
      a: 'You can open a support ticket from your Customer Bookings timeline. Our platform admin team offers free redo services or mock refunds depending on issue severity.'
    },
    {
      q: 'How does dispute arbitration work on ServiceHub?',
      a: 'If a routine support ticket cannot reach resolution, the case is assigned to an independent Arbitrator who inspects uploaded evidence, schedules virtual hearings, and issues binding rulings.'
    },
    {
      q: 'Are fixed prices in INR guaranteed?',
      a: 'Yes! All prices listed on ServiceHub are fixed inclusive of standard labor. Additional parts or optional add-ons are agreed upon prior to work commencement.'
    }
  ];

  return (
    <div className="app-container" style={{ padding: '32px 16px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">ServiceHub Help & Support Center</h1>
        <p className="page-subtitle">Find answers to common questions about bookings, payments, and dispute resolution</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }} className="grid-cols-3">
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <ShieldCheck size={32} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Customer Protection</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>30-day warranty & verified provider guarantee on all jobs.</p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <HelpCircle size={32} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Support Tickets</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>File a booking ticket directly from your customer dashboard.</p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <Scale size={32} color="var(--color-conflict)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Formal Arbitration</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>Independent hearings & rulings for escalated dispute claims.</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '20px' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: i !== faqs.length - 1 ? '1px solid var(--color-border)' : 'none', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>{faq.q}</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '6px', lineHeight: '1.5' }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
