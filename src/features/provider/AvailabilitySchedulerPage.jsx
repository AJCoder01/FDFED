import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/context/AppContext';
import { getAvailableSlots, getBookings, getServiceById, getServices, saveService } from '../../data/mockRepository';
import { getTodayDateInputValue } from '../../utils/date';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { SlotEditor } from './SlotEditor';
import { useProviderQuery } from './useProviderQuery';
import { formatDate, validateSlots } from './providerUtils';

export function AvailabilitySchedulerPage() {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const [serviceId, setServiceId] = useState('');
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(getTodayDateInputValue);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const schedule = currentUser.weeklyAvailability;
  const load = useCallback(async () => {
    const [services, jobs] = await Promise.all([getServices(), getBookings('provider', currentUser.id)]);
    return { services: services.filter(service => service.providerId === currentUser.id), jobs };
  }, [currentUser.id]);
  const { data, error, loading, refresh } = useProviderQuery(load);
  const service = data?.services.find(service => service.id === serviceId);
  const savedSlots = service?.availableSlots?.join('|') || '';
  const loadSlots = useCallback(() => serviceId && date ? getAvailableSlots(serviceId, date) : Promise.resolve([]), [serviceId, date]);
  const { data: available, error: slotError, refresh: refreshSlots } = useProviderQuery(loadSlots);

  useEffect(() => {
    if (data && !serviceId && data.services.length) setServiceId(data.services[0].id);
  }, [data, serviceId]);

  useEffect(() => {
    setSlots(savedSlots ? savedSlots.split('|') : []);
    setSaveError('');
  }, [serviceId, savedSlots]);

  const save = async event => {
    event.preventDefault();
    if (busy || !service) return;
    const validation = validateSlots(slots, Number.parseInt(service.duration, 10));
    if (validation) { setSaveError(validation); return; }
    setBusy(true);
    setSaveError('');
    try {
      const existing = await getServiceById(service.id);
      if (!existing || existing.providerId !== currentUser.id) throw new Error('This listing is unavailable.');
      const result = await saveService({ id: service.id, availableSlots: slots });
      if (!result.success) throw new Error('The time slots could not be saved.');
      refresh();
      refreshSlots();
      showToast('Service time slots saved. Existing bookings keep their scheduled times.');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const moveDate = offset => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + offset);
    setDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`);
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="400px" borderRadius="12px" />;
  const jobs = data.jobs.filter(job => job.scheduledDate === date);

  return (
    <div className="provider-page provider-narrow">
      <div className="page-header"><h1 className="page-title">Weekly Availability Scheduler</h1><p className="page-subtitle">Manage service time slots and inspect scheduled bookings</p></div>
      <section className="card provider-stack">
        <h2>Weekly Schedule</h2>
        <div className="provider-row">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <button key={day} type="button" className="provider-slot" aria-pressed={Boolean(schedule?.days.includes(day))} disabled>{day}</button>)}
        </div>
        <div className="grid-cols-2">
          <TextField name="weekly-start" label="Daily Start Time" type="time" value={schedule?.startTime || ''} disabled />
          <TextField name="weekly-end" label="Daily End Time" type="time" value={schedule?.endTime || ''} disabled />
        </div>
        <p className="provider-hint">Profile blackout dates: {schedule?.blackoutDates.length ? schedule.blackoutDates.map(formatDate).join(', ') : 'None recorded'}</p>
        <p className="provider-hint">Weekly hours and blackout dates are display only. They cannot currently be changed or restrict customer bookings. Service time slots below can be saved and are used when customers book.</p>
      </section>
      {data.services.length === 0 ? <div className="card provider-stack"><p>Create a listing before configuring its time slots.</p><Button onClick={() => navigate('/provider/services/new')}>Create Listing</Button></div> : (
        <form onSubmit={save} className="card provider-stack">
          <h2>Bookable Service Time Slots</h2>
          <Select name="schedule-service" label="Service Listing" value={serviceId} onChange={event => setServiceId(event.target.value)} disabled={busy} options={data.services.map(service => ({ value: service.id, label: service.title }))} />
          <p className="provider-hint">These start times repeat every day. Allow the full service duration between slots. Times use your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
          <SlotEditor slots={slots} onChange={setSlots} disabled={busy} />
          {saveError && <p role="alert" className="provider-error">{saveError}</p>}
          <Button type="submit" disabled={busy || !service || currentUser.verificationStatus !== 'approved'}>{busy ? 'Saving…' : 'Save Service Time Slots'}</Button>
        </form>
      )}
      <section className="card provider-stack">
        <h2>Daily Booking Schedule</h2>
        <TextField name="schedule-date" label="Schedule Date" type="date" value={date} onChange={event => setDate(event.target.value)} />
        <div className="provider-row">
          <Button variant="secondary" size="sm" disabled={!date} onClick={() => moveDate(-1)}>Previous Day</Button>
          <Button variant="outline" size="sm" onClick={() => setDate(getTodayDateInputValue())}>Today</Button>
          <Button variant="secondary" size="sm" disabled={!date} onClick={() => moveDate(1)}>Next Day</Button>
        </div>
        {date && <strong>{formatDate(date)}</strong>}
        {slotError ? <p role="alert" className="provider-error">{slotError}</p> : <p className="provider-hint">Saved customer slots for this service: {available === null ? 'Checking slots…' : available.length ? available.join(', ') : 'None available'}</p>}
        <p className="provider-hint">Identical slots on the same service are blocked after booking. Overlapping jobs across different services are not yet blocked.</p>
        {jobs.length === 0 && <p className="provider-hint">No provider bookings on this date.</p>}
        {jobs.map(job => <div key={job.id} className="provider-record provider-stack"><div className="provider-row provider-between"><strong>{job.scheduledSlot} · {job.serviceTitle}</strong><StatusBadge status={job.status} /></div><span>{job.customerName}</span><Button variant="secondary" size="sm" onClick={() => navigate(`/provider/jobs/${job.id}`)}>View Job #{job.id}</Button></div>)}
      </section>
    </div>
  );
}
