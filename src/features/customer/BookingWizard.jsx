import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Shield, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { createBooking } from '../../data/mockRepository';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';

export function BookingWizard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, savedIntent, setSavedIntent, showToast } = useApp();

  const bookingData = location.state?.intent || savedIntent || {
    serviceId: 'srv-1',
    serviceTitle: 'Split AC Servicing & Deep Foam Clean',
    price: 799,
    slot: '11:30 AM',
    date: '2026-08-20',
    providerId: 'user-prov-1',
    providerName: 'Apex Fix Services & Repairs'
  };

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(currentUser?.addresses?.[0]?.addressLine || 'Flat 402, Green Glen Layout, Bellandur, Bengaluru');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI (Mock Pay)');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirmOrder = async () => {
    setLoading(true);
    const newBooking = await createBooking({
      serviceId: bookingData.serviceId,
      serviceTitle: bookingData.serviceTitle,
      categoryName: 'Home Services',
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      address: address,
      providerId: bookingData.providerId,
      providerName: bookingData.providerName,
      scheduledDate: bookingData.date,
      scheduledSlot: bookingData.slot,
      amount: bookingData.price,
      paymentMethod: paymentMethod,
      notes: notes
    });

    setSavedIntent(null);
    setConfirmedBooking(newBooking);
    setLoading(false);
    showToast(`Booking #${newBooking.id} created successfully!`, 'success');
  };

  if (confirmedBooking) {
    return (
      <div className="app-container" style={{ padding: '48px 16px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
            <CheckCircle2 size={36} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>Booking Confirmed!</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Your Booking ID is <strong style={{ color: 'var(--color-primary)' }}>#{confirmedBooking.id}</strong>.
          </p>

          <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-control)', width: '100%', textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><strong>Service:</strong> {confirmedBooking.serviceTitle}</div>
            <div><strong>Scheduled Slot:</strong> {confirmedBooking.scheduledDate} ({confirmedBooking.scheduledSlot})</div>
            <div><strong>Address:</strong> {confirmedBooking.address}</div>
            <div><strong>Provider:</strong> {confirmedBooking.providerName}</div>
            <div><strong>Total Paid:</strong> ₹{confirmedBooking.amount} ({confirmedBooking.paymentMethod})</div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button variant="primary" onClick={() => navigate(`/customer/bookings/${confirmedBooking.id}`)}>
              Track Booking Timeline
            </Button>
            <Button variant="outline" onClick={() => navigate('/customer')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ padding: '32px 16px', maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Service Checkout Wizard</h1>
        <p className="page-subtitle">Step {step} of 3: {step === 1 ? 'Slot & Address' : step === 2 ? 'Price Review' : 'Demo Payment'}</p>
      </div>

      {/* Stepper Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        {['1. Schedule & Address', '2. Review & Price', '3. Demo Checkout'].map((title, idx) => (
          <div key={idx} style={{ flex: 1, textAlign: 'center', padding: '8px', borderBottom: `3px solid ${step === idx + 1 ? 'var(--color-primary)' : 'var(--color-border)'}`, fontWeight: step === idx + 1 ? '700' : '500', fontSize: '13px', color: step === idx + 1 ? 'var(--color-primary)' : 'var(--color-muted)' }}>
            {title}
          </div>
        ))}
      </div>

      {/* Step 1: Schedule & Address */}
      {step === 1 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Booking Summary</h3>
          <div style={{ padding: '12px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', fontSize: '13px' }}>
            <div><strong>Selected Service:</strong> {bookingData.serviceTitle}</div>
            <div><strong>Schedule:</strong> {bookingData.date} at {bookingData.slot}</div>
            <div><strong>Provider:</strong> {bookingData.providerName}</div>
          </div>

          <TextField
            label="Service Delivery Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            multiline
            rows={2}
            required
          />

          <TextField
            label="Special Instructions / Access Notes for Technician"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Please ring doorbell 402, gate code 1234"
          />

          <Button variant="primary" size="lg" onClick={() => setStep(2)}>
            Continue to Price Review →
          </Button>
        </div>
      )}

      {/* Step 2: Price Review */}
      {step === 2 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Price Review & Breakdown</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Base Service Fee:</span>
              <span>₹{bookingData.price}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
              <span>ServiceHub Safety & Buyer Protection:</span>
              <span>INCLUDED (₹0)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
              <span>Taxes (GST 18%):</span>
              <span>INCLUDED</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800' }}>
              <span>Final Total Amount:</span>
              <span>₹{bookingData.price}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button variant="primary" style={{ flex: 1 }} size="lg" onClick={() => setStep(3)}>
              Proceed to Demo Payment →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Demo Payment */}
      {step === 3 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Select Demo Payment Method</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>This is a mock checkout demonstration. No real transaction occurs.</p>

          <Select
            label="Payment Option"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'UPI (Mock Pay)', label: 'UPI Instant Pay (GPay / PhonePe)' },
              { value: 'Card (Mock Pay)', label: 'Credit / Debit Card (Mock)' },
              { value: 'Cash After Service', label: 'Cash / Pay After Service' }
            ]}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button variant="primary" style={{ flex: 1 }} size="lg" disabled={loading} onClick={handleConfirmOrder}>
              {loading ? 'Processing...' : `Confirm & Pay ₹${bookingData.price}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
