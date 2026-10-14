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

      {/* Official ServiceHub Contact Credentials */}
      <div className="card" style={{ padding: '28px', border: '1px solid var(--color-primary-light)', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
            <PhoneCall size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)', margin: 0 }}>ServiceHub Official Contact Credentials</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0 0' }}>Get in touch with customer care, technician dispatch, or grievance desk</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}>
            <strong style={{ fontSize: '13px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Helpline & Dispatch</strong>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', margin: '6px 0 2px 0' }}>1800-123-SERVICE (Toll-Free)</p>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>+91 80 4567 8900 (Direct Desk)</p>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}>
            <strong style={{ fontSize: '13px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Support</strong>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', margin: '6px 0 2px 0' }}>support@servicehub.in</p>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>Average response: Under 30 mins</p>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}>
            <strong style={{ fontSize: '13px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Grievance Officer</strong>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', margin: '6px 0 2px 0' }}>grievance@servicehub.in</p>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>Officer: Smt. Neha Sundaram</p>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}>
            <strong style={{ fontSize: '13px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Support Timings</strong>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', margin: '6px 0 2px 0' }}>Mon – Sun: 7:00 AM – 10:00 PM</p>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>Emergency technician dispatch 24/7</p>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-page-bg)', fontSize: '12px', color: 'var(--color-muted)' }}>
          <strong>Corporate Headquarters:</strong> ServiceHub Technologies India Pvt. Ltd., 5th Floor, Salarpuria Cyber Park, Electronic City Phase 1, Bengaluru, Karnataka – 560100
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
