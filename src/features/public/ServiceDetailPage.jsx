import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Shield, Clock, CheckCircle2, XCircle, Calendar, ArrowLeft } from 'lucide-react';
import { getServiceById } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';

export function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { currentRole, setSavedIntent, showToast } = useApp();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-08-20');

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      const data = await getServiceById(serviceId);
      setService(data);
      if (data && data.availableSlots && data.availableSlots.length > 0) {
        setSelectedSlot(data.availableSlots[0]);
      }
      setLoading(false);
    }
    loadDetail();
  }, [serviceId]);

  const handleBookingStart = () => {
    if (!selectedSlot) {
      showToast('Please select an available time slot.', 'warning');
      return;
    }

    const bookingIntent = {
      serviceId: service.id,
      serviceTitle: service.title,
      price: service.price,
      slot: selectedSlot,
      date: selectedDate,
      providerId: service.providerId,
      providerName: service.providerName
    };

    if (currentRole === 'guest') {
      setSavedIntent(bookingIntent);
      showToast('Please sign in to complete your booking. Your selected slot has been saved.', 'info');
      navigate('/login?redirect=checkout');
    } else {
      navigate('/customer/checkout', { state: { intent: bookingIntent } });
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ padding: '32px 16px' }}>
        <Skeleton height="400px" borderRadius="16px" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="app-container" style={{ padding: '48px 16px' }}>
        <ErrorState
          title="Service Not Found"
          description="The requested service listing could not be found or has been archived."
          onRetry={() => navigate('/services')}
        />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontWeight: '600', fontSize: '14px', width: 'fit-content' }}>
        <ArrowLeft size={16} /> Back to Search Results
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="grid-cols-2">
        {/* Main Left Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={service.image} alt={service.title} style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
            <div style={{ padding: '24px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{service.categoryName}</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '4px' }}>{service.title}</h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--color-ink)', fontWeight: '700' }}>
                  <Star size={16} fill="#F59E0B" color="#F59E0B" /> {service.rating}
                  <span style={{ color: 'var(--color-muted)', fontWeight: 'normal' }}>({service.reviewCount} customer reviews)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--color-muted)' }}>
                  <Clock size={16} /> Duration: <strong>{service.duration}</strong>
                </div>
              </div>

              <p style={{ fontSize: '15px', color: 'var(--color-ink)', marginTop: '16px', lineHeight: '1.6' }}>{service.description}</p>
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '16px' }}>Service Scope & Details</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-cols-2">
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-success)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> What is Included
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-ink)' }}>
                  {service.inclusions?.map((inc, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span> {inc}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-danger)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle size={16} /> What is Excluded
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-ink)' }}>
                  {service.exclusions?.map((exc, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>✕</span> {exc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Policy & Trust */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>Cancellation & Service Policy</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: '1.5' }}>{service.policy}</p>
          </div>
        </div>

        {/* Right Sticky Booking Box */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Fixed Total Price</span>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-ink)' }}>₹{service.price}</div>
              <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '600' }}>Includes taxes & service guarantee</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

            {/* Provider Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <Shield size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>{service.providerName}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '600' }}>Verified Professional</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

            {/* Slot Selector */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', display: 'block', marginBottom: '8px' }}>
                1. Select Preferred Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                min="2026-08-17"
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '13px', marginBottom: '16px' }}
              />

              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', display: 'block', marginBottom: '8px' }}>
                2. Select Available Slot:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {service.availableSlots?.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '8px',
                      borderRadius: 'var(--radius-control)',
                      border: `1px solid ${selectedSlot === slot ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: selectedSlot === slot ? 'var(--color-primary-light)' : 'var(--color-surface)',
                      color: selectedSlot === slot ? 'var(--color-primary)' : 'var(--color-ink)',
                      fontWeight: selectedSlot === slot ? '700' : '500',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={handleBookingStart}>
              Proceed to Booking ({selectedSlot || 'Select Slot'})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
