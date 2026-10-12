import { useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { TextField } from '../../design-system/primitives/TextField';
import { isPending, updateJob } from './providerUtils';

export function JobRequestActions({ job, onUpdate, onRefresh }) {
  const { currentUser, showToast } = useApp();
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (!busy) {
      setAction('');
      setReason('');
      setError('');
    }
  };

  const confirm = async event => {
    event.preventDefault();
    if (busy) return;
    if (action === 'decline' && !reason.trim()) {
      setError('Enter a reason for declining this request.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const note = action === 'accept' ? 'Provider accepted the booking request.' : `Provider declined the booking request. Reason: ${reason.trim()}`;
      const updated = await updateJob(job.id, currentUser.id, action, note);
      onUpdate(updated);
      setAction('');
      setReason('');
      showToast(action === 'accept' ? 'Booking accepted.' : 'Booking declined. Payment status is unchanged.', action === 'accept' ? 'success' : 'info');
    } catch (error) {
      setError(error.message);
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  if (!isPending(job) && !action) return null;

  return (
    <>
      {isPending(job) && (
        <div className="provider-stack">
          <div className="provider-row">
            <Button size="sm" icon={Check} onClick={() => setAction('accept')}>Accept Job</Button>
            <Button variant="danger" size="sm" icon={X} onClick={() => setAction('decline')}>Decline</Button>
            <Button variant="outline" size="sm" icon={Clock} disabled>Propose Time</Button>
          </div>
          <p className="provider-hint">Time proposals are unavailable until customers can review and confirm them.</p>
        </div>
      )}
      <form onSubmit={confirm}>
        <Modal
          isOpen={Boolean(action)}
          onClose={close}
          title={action === 'accept' ? 'Accept Booking Request' : 'Decline Booking Request'}
          footer={(
            <>
              <Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button>
              <Button type="submit" variant={action === 'decline' ? 'danger' : 'primary'} disabled={busy}>
                {busy ? 'Saving…' : 'Confirm'}
              </Button>
            </>
          )}
        >
          <div className="provider-stack">
            <p>{job.serviceTitle} — {job.scheduledDate} at {job.scheduledSlot}</p>
            {action === 'decline' && (
              <TextField name="decline-reason" label="Reason for Declining" value={reason}
                onChange={event => setReason(event.target.value)} multiline required disabled={busy} />
            )}
            {error && <p role="alert" className="provider-error">{error}</p>}
          </div>
        </Modal>
      </form>
    </>
  );
}
