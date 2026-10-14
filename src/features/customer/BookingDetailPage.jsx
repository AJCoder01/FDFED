import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, HelpCircle, Scale } from 'lucide-react';
import { getBookingById, getDisputes, updateBookingStatus, submitReview, respondToTimeProposal } from '../../data/mockRepository';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
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
  const { currentUser, showToast } = useApp();

  const load = useCallback(async () => {
    const job = await getBookingById(bookingId);
    if (!job || job.customerId !== currentUser.id) return null;
    const disputes = await getDisputes();
    const dispute = disputes.find(d => d.bookingId === job.id) || null;
    return { ...job, dispute };
  }, [bookingId, currentUser.id]);
  const { data: booking, setData: setBooking, loading, error, refresh } = useRepositoryQuery(load);
  const [busy, setBusy] = useState(false);

  // Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const handleCancelConfirm = async () => {
    const updated = await updateBookingStatus(booking.id, 'cancelled', 'Cancelled by customer.', { role: 'customer', userId: currentUser.id });
    setBooking(prev => ({ ...prev, ...updated }));
    showToast(updated.paymentStatus === 'Refunded' ? 'Booking cancelled and mock payment refunded.' : 'Booking cancelled.', 'info');
  };
  const handleReviewSubmit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await submitReview(booking.id, rating, reviewText, currentUser.id);
      setBooking(prev => ({ ...prev, ...updated }));
      setReviewModalOpen(false);
      showToast('Your review has been saved.');
    } catch (error) { showToast(error.message, 'warning'); }
    finally { setBusy(false); }
  };
  const respond = async accept => {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await respondToTimeProposal(booking.id, accept, currentUser.id);
      setBooking(prev => ({ ...prev, ...updated }));
      showToast(accept ? 'New appointment confirmed.' : 'Proposal declined. Original appointment retained.');
    } catch (error) { showToast(error.message, 'warning'); }
    finally { setBusy(false); }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="400px" borderRadius="12px" />;
  if (!booking) return <div>Booking not found</div>;

  const isEligibleForDispute = ['completed', 'in_progress'].includes(booking.status);

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
          {(['active', 'in_progress', 'reschedule_proposed'].includes(booking.status)) && (
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

          {isEligibleForDispute && (
            <Button disabled={booking.hasDispute} variant="outline" size="sm" icon={Scale} onClick={() => navigate(`/customer/dispute/new?bookingId=${booking.id}`)}>
              File Formal Dispute
            </Button>
          )}
        </div>
      </div>

      {/* Dispute, Hearing & Ruling Information Section */}
      {booking.dispute && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--color-conflict)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={20} color="var(--color-conflict)" />
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)', margin: 0 }}>
                Formal Dispute Case #{booking.dispute.id}
              </h2>
            </div>
            <StatusBadge status={booking.dispute.status} />
          </div>

          <p style={{ fontSize: '13px', color: 'var(--color-ink)', margin: 0 }}>
            <strong>Your Filed Claim:</strong> ₹{booking.dispute.claimAmount} · "{booking.dispute.customerStatement}"
          </p>

          <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
            <strong>Assigned Arbitrator:</strong> {booking.dispute.arbitratorName || 'Awaiting platform assignment'}
          </p>

          {/* Hearing Details */}
          {booking.dispute.hearingSchedule && (
            <div style={{ backgroundColor: 'var(--color-info-bg)', padding: '14px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-info)' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-ink)', marginBottom: '4px' }}>
                📅 Scheduled Dispute Hearing
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-ink)' }}>
                <strong>Date & Time:</strong> {booking.dispute.hearingSchedule.scheduledDate} at {booking.dispute.hearingSchedule.scheduledTime}
              </div>
              {booking.dispute.hearingSchedule.meetUrl && (
                <div style={{ marginTop: '8px' }}>
                  <a
                    href={booking.dispute.hearingSchedule.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'underline' }}
                  >
                    Join Virtual Hearing Video Room →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Ruling / Final Outcome */}
          {booking.dispute.ruling && (
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--color-ink)', marginBottom: '6px' }}>
                ⚖️ Final Arbitration Ruling Outcome
              </div>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Verdict:</strong> <span style={{ fontWeight: '700', color: booking.dispute.ruling.verdict.toLowerCase().includes('customer') ? 'var(--color-success)' : 'var(--color-ink)' }}>{booking.dispute.ruling.verdict}</span></div>
                <div><strong>Compensation Award:</strong> ₹{booking.dispute.ruling.awardAmount}</div>
                <div><strong>Arbitrator Rationale:</strong> {booking.dispute.ruling.reason}</div>
                {booking.dispute.ruling.issuedAt && <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Issued: {booking.dispute.ruling.issuedAt}</div>}
              </div>
            </div>
          )}

          {/* Customer Evidence Files ONLY (Privacy: Customer never sees provider evidence) */}
          {booking.dispute.evidences?.filter(e => e.uploaderRole === 'customer' || (e.uploader && e.uploader.includes('Customer'))).length > 0 && (
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--color-ink)' }}>Your Uploaded Evidence Files:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12px' }}>
                {booking.dispute.evidences
                  .filter(e => e.uploaderRole === 'customer' || (e.uploader && e.uploader.includes('Customer')))
                  .map(ev => (
                    <li key={ev.id}>{ev.filename || ev.title} <span style={{ color: 'var(--color-muted)' }}>({ev.uploadedAt})</span></li>
                  ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {booking.status === 'reschedule_proposed' && booking.timeProposal && <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2>Provider Time Proposal</h2>
        <p>Original appointment: {booking.scheduledDate} at {booking.scheduledSlot}</p>
        <p>Proposed appointment: {booking.timeProposal.date} at {booking.timeProposal.slot}</p>
        <div style={{ display: 'flex', gap: '8px' }}><Button disabled={busy} onClick={() => respond(true)}>Accept Proposed Time</Button><Button variant="secondary" disabled={busy} onClick={() => respond(false)}>Keep Original Time</Button></div>
      </section>}

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
              {booking.reviewReply && <p><strong>Provider Reply:</strong> {booking.reviewReply}</p>}
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
            <p>Payment Status: {booking.paymentStatus} · Refunded: ₹{booking.refundedAmount || 0}</p>
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
        message={`Cancel booking #${booking.id}? Any recorded payment will be refunded in this demo.`}
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
            <Button variant="primary" disabled={busy} onClick={handleReviewSubmit}>{busy ? 'Saving…' : 'Submit Review'}</Button>
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
                  type="button"
                  aria-label={`Rate ${star} out of 5`}
                  aria-pressed={rating === star}
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
            disabled={busy}
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
