import { useCallback, useEffect, useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getAvailableSlots, proposeBookingTime } from '../../data/mockRepository';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { getTodayDateInputValue } from '../../utils/date';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { isPending, updateJob } from './providerUtils';

export function JobRequestActions({ job, onUpdate, onRefresh }) {
  const { currentUser, showToast } = useApp();
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(job.scheduledDate >= getTodayDateInputValue() ? job.scheduledDate : getTodayDateInputValue());
  const [slot, setSlot] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => action === 'propose' && date ? getAvailableSlots(job.serviceId, date, job.id) : Promise.resolve([]), [action, date, job.id, job.serviceId]);
  const { data: slots, error: slotError } = useRepositoryQuery(load);
  useEffect(() => { if (slots) setSlot(value => slots.includes(value) ? value : (slots[0] || '')); }, [slots]);

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
      let updated;
      if (action === 'propose') updated = await proposeBookingTime(job.id, date, slot, currentUser.id);
      else {
        const note = action === 'accept' ? 'Provider accepted the booking request.' : `Provider declined the booking request. Reason: ${reason.trim()}`;
        updated = await updateJob(job.id, currentUser.id, action, note);
      }
      onUpdate(updated);
      setAction('');
      setReason('');
      const messages = { accept: 'Booking accepted.', decline: updated.paymentStatus === 'Refunded' ? 'Booking declined and mock payment refunded.' : 'Booking declined.', propose: 'Time proposal sent. The customer must agree before the schedule changes.' };
      showToast(messages[action]);
    } catch (error) { setError(error.message); onRefresh(); }
    finally { setBusy(false); }
  };
  if (job.status !== 'active' && !action) return null;

  return (
    <>
      {job.status === 'active' && <div className="provider-row">
        {isPending(job) && <><Button size="sm" icon={Check} onClick={() => setAction('accept')}>Accept Job</Button><Button variant="danger" size="sm" icon={X} onClick={() => setAction('decline')}>Decline</Button></>}
        <Button variant="outline" size="sm" icon={Clock} onClick={() => setAction('propose')}>Propose Time</Button>
      </div>}
      <form onSubmit={confirm}>
        <Modal isOpen={Boolean(action)} onClose={close}
          title={{ accept: 'Accept Booking Request', decline: 'Decline Booking Request', propose: 'Propose Alternative Time' }[action]}
          footer={<><Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" variant={action === 'decline' ? 'danger' : 'primary'} disabled={busy || (action === 'propose' && (!slot || !slots))}>{busy ? 'Saving…' : 'Confirm'}</Button></>}>
          <div className="provider-stack">
            <p>{job.serviceTitle} — {job.scheduledDate} at {job.scheduledSlot}</p>
            {action === 'decline' && <TextField name={`reason-${job.id}`} label="Reason for Declining" value={reason} onChange={event => setReason(event.target.value)} multiline required disabled={busy} />}
            {action === 'propose' && <>
              <TextField name={`date-${job.id}`} label="Proposed Date" type="date" min={getTodayDateInputValue()} value={date} onChange={event => setDate(event.target.value)} required disabled={busy} />
              <Select name={`slot-${job.id}`} label="Proposed Time" value={slot} onChange={event => setSlot(event.target.value)} required disabled={busy || !slots} options={(slots || []).map(slot => ({ value: slot, label: slot }))} />
              <p className="provider-hint">The original booking stays reserved until the customer accepts. All your services are checked for conflicts.</p>
              {slots?.length === 0 && <p className="provider-hint">No available slots on this date. Choose another date.</p>}
            </>}
            {(error || slotError) && <p role="alert" className="provider-error">{error || slotError}</p>}
          </div>
        </Modal>
      </form>
    </>
  );
}
