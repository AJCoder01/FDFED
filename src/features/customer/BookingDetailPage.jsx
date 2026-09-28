import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, Star, Shield, HelpCircle, Scale } from 'lucide-react';
import { getBookingById, updateBookingStatus } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { ConfirmDialog } from '../../design-system/primitives/ConfirmDialog';
import { TextField } from '../../design-system/primitives/TextField';

export function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getBookingById(bookingId);
      setBooking(data);
      setLoading(false);
    }
    loadData();
  }, [bookingId]);

  const handleCancelConfirm = async () => {
    const updated = await updateBookingStatus(booking.id, 'cancelled', 'Cancelled by Customer. 100% mock refund issued to original payment method.');
    setBooking({ ...updated });
    showToast('Booking cancelled. 100% mock refund issued.', 'info');
  };

  const handleReviewSubmit = () => {
    if (!reviewText) {
      showToast('Please enter a review comment.', 'warning');
      return;
    }
    setBooking({
      ...booking,
      reviewSubmitted: true,
      reviewRating: rating,
      reviewComment: reviewText
    });
    setReviewModalOpen(false);
    showToast('Thank you! Your review has been published.', 'success');
  };

  if (loading) return <Skeleton height="400px" borderRadius="12px" />;
  if (!booking) return <div>Booking not found</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontWeight: '600', fontSize: '14px', width: 'fit-content' }}>
        <ArrowLeft size={16} /> Back to My Bookings
      </button>

      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-ink)' }}>Booking #{booking.id}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>{booking.serviceTitle}</p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(booking.status === 'active' || booking.status === 'in_progress') && (
            <Button variant="danger" size="sm" onClick={() => setCancelModalOpen(true)}>
              Cancel Booking
            </Button>
          )}

          {booking.status === 'completed' && !booking.reviewSubmitted && (
            <Button variant="primary" size="sm" icon={Star} onClick={() => setReviewModalOpen(true)}>
              Leave a Review
            </Button>
          )}

          <Button variant="secondary" size="sm" icon={HelpCircle} onClick={() => navigate(`/customer/support/new?bookingId=${booking.id}`)}>
            Need Help / Report Issue
          </Button>

          <Button variant="outline" size="sm" icon={Scale} onClick={() => navigate(`/customer/dispute/new?bookingId=${booking.id}`)}>
            File Formal Dispute
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }} className="grid-cols-2">
        {/* Left: Timeline & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Booking Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '16px' }}>Status Timeline & Audit Trail</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid var(--color-primary)', paddingLeft: '16px' }}>
              {booking.timeline?.map((evt, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>{evt.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>{evt.desc}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginTop: '4px' }}>{evt.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Review Display if submitted */}
          {booking.reviewSubmitted && (
            <div className="card" style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid #C8E6C9' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-success)', marginBottom: '8px' }}>Your Published Review</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                {[...Array(booking.reviewRating)].map((_, i) => (
                  <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
                ))}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-ink)' }}>"{booking.reviewComment}"</p>
            </div>
          )}
        </div>

        {/* Right Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Booking Details</h3>
            <div><strong>Scheduled Date:</strong> {booking.scheduledDate}</div>
            <div><strong>Time Slot:</strong> {booking.scheduledSlot}</div>
            <div><strong>Service Address:</strong> {booking.address}</div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
            <div><strong>Provider:</strong> {booking.providerName}</div>
            <div><strong>Provider Phone:</strong> {booking.providerPhone}</div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800' }}>
              <span>Total Paid:</span>
              <span>₹{booking.amount}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Payment Method: {booking.paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Confirm Booking Cancellation"
        message={`Are you sure you want to cancel booking #${booking.id}? Free cancellation applies. A 100% mock refund of ₹${booking.amount} will be processed instantly.`}
        confirmLabel="Yes, Cancel Booking"
        variant="danger"
      />

      {/* Leave Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Leave a Service Review"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleReviewSubmit}>Submit Review</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Select Rating:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}
                >
                  <Star size={28} fill={star <= rating ? '#F59E0B' : 'none'} color={star <= rating ? '#F59E0B' : '#CBD5E1'} />
                </button>
              ))}
            </div>
          </div>
          <TextField
            label="Your Review Comment"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="How was the service quality, punctuality, and behavior?"
            multiline
            rows={3}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
