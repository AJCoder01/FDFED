import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Check, X } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { updateBookingStatus } from '../../store/slices/bookingsSlice';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { TextField } from '../../design-system/primitives/TextField';
import { ACTION_TO_STATUS, isPending } from './providerUtils';

export function JobRequestActions({ job, onUpdate, onRefresh }) {
  const dispatch = useDispatch();
  const { showToast } = useApp();
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (!busy) { setAction(''); setReason(''); setError(''); }
  };
  const confirm = async event => {
    event.preventDefault();
    if (busy) return;
    if (action === 'decline' && !reason.trim()) { setError('Enter a reason for declining this request.'); return; }
    setBusy(true);
    setError('');
    try {
      const note = action === 'accept' ? 'Provider accepted the booking request.' : `Provider declined the booking request. Reason: ${reason.trim()}`;
      const status = ACTION_TO_STATUS[action];
      const updated = await dispatch(updateBookingStatus({ bookingId: job.id, status, note })).unwrap();
      if (onUpdate) onUpdate(updated);
      setAction('');
      setReason('');
      const messages = { accept: 'Booking accepted.', decline: updated.paymentStatus === 'Refunded' ? 'Booking declined and mock payment refunded.' : 'Booking declined.' };
      showToast(messages[action]);
    } catch (err) { setError(typeof err === 'string' ? err : err?.message); if (onRefresh) onRefresh(); }
    finally { setBusy(false); }
  };
  if (job.status !== 'active' && !action) return null;

  return (
    <>
      {job.status === 'active' && isPending(job) && (
        <div className="provider-row">
          <Button size="sm" icon={Check} onClick={() => setAction('accept')}>Accept Job</Button>
          <Button variant="danger" size="sm" icon={X} onClick={() => setAction('decline')}>Decline</Button>
        </div>
      )}
      <form onSubmit={confirm}>
        <Modal isOpen={Boolean(action)} onClose={close}
          title={{ accept: 'Accept Booking Request', decline: 'Decline Booking Request' }[action]}
          footer={<><Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" variant={action === 'decline' ? 'danger' : 'primary'} disabled={busy}>{busy ? 'Saving…' : 'Confirm'}</Button></>}>
          <div className="provider-stack">
            <p>{job.serviceTitle} — {job.scheduledDate} at {job.scheduledSlot}</p>
            {action === 'decline' && <TextField name={`reason-${job.id}`} label="Reason for Declining" value={reason} onChange={event => setReason(event.target.value)} multiline required disabled={busy} />}
            {error && <p role="alert" className="provider-error">{error}</p>}
          </div>
        </Modal>
      </form>
    </>
  );
}
