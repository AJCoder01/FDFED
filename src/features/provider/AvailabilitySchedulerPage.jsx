import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/context/AppContext';
import { getAvailableSlots, getBookings, getServices, saveService, saveAvailability } from '../../data/mockRepository';
import { addDays, getTodayDateInputValue } from '../../utils/date';
import { DEFAULT_SCHEDULE, TIME_ZONE } from '../../data/scheduling';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { SlotEditor } from './SlotEditor';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { formatDate, validateSlots } from './providerUtils';

export function AvailabilitySchedulerPage() {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const [serviceId, setServiceId] = useState('');
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(getTodayDateInputValue);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [schedule, setSchedule] = useState({ ...DEFAULT_SCHEDULE, ...currentUser.weeklyAvailability });
  const [blackout, setBlackout] = useState('');
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const savedSchedule = JSON.stringify(currentUser.weeklyAvailability);
  useEffect(() => { setSchedule({ ...DEFAULT_SCHEDULE, ...JSON.parse(savedSchedule) }); }, [savedSchedule]);
  const saveSchedule = async event => {
    event.preventDefault();
    if (scheduleBusy) return;
    setScheduleBusy(true);
    setScheduleError('');
    try { await saveAvailability(currentUser.id, schedule); showToast('Weekly availability saved.'); }
    catch (error) { setScheduleError(error.message); }
    finally { setScheduleBusy(false); }
  };
  const changeSchedule = event => setSchedule(value => ({ ...value, [event.target.name]: event.target.type === 'number' ? Number(event.target.value) : event.target.value }));
  const load = useCallback(async () => {
    const [services, jobs] = await Promise.all([getServices({ role: 'provider', userId: currentUser.id }), getBookings('provider', currentUser.id)]);
    return { services, jobs };
  }, [currentUser.id]);
  const { data, error, loading, refresh } = useRepositoryQuery(load);
  const service = data?.services.find(service => service.id === serviceId);
  const savedSlots = service?.availableSlots?.join('|') || '';
  const loadSlots = useCallback(() => serviceId && date ? getAvailableSlots(serviceId, date) : Promise.resolve([]), [serviceId, date]);
  const { data: available, error: slotError } = useRepositoryQuery(loadSlots);

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
      await saveService({ id: service.id, availableSlots: slots }, { role: 'provider', userId: currentUser.id });
      showToast('Service time slots saved. Existing bookings keep their scheduled times.');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const moveDate = offset => setDate(addDays(date, offset));

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="400px" borderRadius="12px" />;
  const jobs = data.jobs.filter(job => job.scheduledDate === date);

  return (
    <div className="provider-page provider-narrow">
      <div className="page-header"><h1 className="page-title">Weekly Availability Scheduler</h1><p className="page-subtitle">Manage service time slots and inspect scheduled bookings</p></div>
      <form className="card provider-stack" onSubmit={saveSchedule}>
        <h2>Weekly Schedule</h2>
        <div className="provider-row">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <button key={day} type="button" className="provider-slot" aria-pressed={schedule.days.includes(day)} disabled={scheduleBusy} onClick={() => setSchedule(value => ({ ...value, days: value.days.includes(day) ? value.days.filter(item => item !== day) : [...value.days, day] }))}>{day}</button>)}
        </div>
        <div className="grid-cols-2">
          <TextField name="startTime" label="Daily Start Time" type="time" value={schedule.startTime} onChange={changeSchedule} disabled={scheduleBusy} required />
          <TextField name="endTime" label="Daily End Time" type="time" value={schedule.endTime} onChange={changeSchedule} disabled={scheduleBusy} required />
        </div>
        <div className="grid-cols-2">
          <TextField name="leadMinutes" label="Booking Lead Time (Minutes)" type="number" min="0" value={schedule.leadMinutes} onChange={changeSchedule} disabled={scheduleBusy} />
          <TextField name="bufferMinutes" label="Buffer Between Jobs (Minutes)" type="number" min="0" value={schedule.bufferMinutes} onChange={changeSchedule} disabled={scheduleBusy} />
        </div>
        <TextField name="blackout-date" label="Blackout / Vacation Date" type="date" value={blackout} onChange={event => setBlackout(event.target.value)} disabled={scheduleBusy} />
        <Button variant="outline" disabled={scheduleBusy || !blackout || schedule.blackoutDates.includes(blackout)} onClick={() => { setSchedule(value => ({ ...value, blackoutDates: [...value.blackoutDates, blackout] })); setBlackout(''); }}>Add Blackout Date</Button>
        <div className="provider-row">
          {schedule.blackoutDates.map(date => <button key={date} type="button" className="provider-slot" disabled={scheduleBusy} aria-label={`Remove blackout ${date}`} onClick={() => setSchedule(value => ({ ...value, blackoutDates: value.blackoutDates.filter(item => item !== date) }))}>{formatDate(date)} ×</button>)}
        </div>
        <p className="provider-hint">Times use {TIME_ZONE}. Existing bookings keep their confirmed schedule; changes apply to new bookings.</p>
        {scheduleError && <p role="alert" className="provider-error">{scheduleError}</p>}
        <Button type="submit" disabled={scheduleBusy}>{scheduleBusy ? 'Saving…' : 'Save Schedule Settings'}</Button>
      </form>
      {data.services.length === 0 ? <div className="card provider-stack"><p>Create a listing before configuring its time slots.</p><Button onClick={() => navigate('/provider/services/new')}>Create Listing</Button></div> : (
        <form onSubmit={save} className="card provider-stack">
          <h2>Bookable Service Time Slots</h2>
          <Select name="schedule-service" label="Service Listing" value={serviceId} onChange={event => setServiceId(event.target.value)} disabled={busy} options={data.services.map(service => ({ value: service.id, label: service.title }))} />
          <p className="provider-hint">These start times are offered within your saved working days and hours. Allow the full service duration between slots.</p>
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
        {slotError ? <p role="alert" className="provider-error">{slotError}</p> : <p className="provider-hint">Available slots for this service: {available === null ? 'Checking slots…' : available.length ? available.join(', ') : 'None available'}</p>}
        <p className="provider-hint">Booked jobs and buffers are checked across all your services. Cancelled bookings release their times.</p>
        {jobs.length === 0 && <p className="provider-hint">No provider bookings on this date.</p>}
        {jobs.map(job => <div key={job.id} className="provider-record provider-stack"><div className="provider-row provider-between"><strong>{job.scheduledSlot} · {job.serviceTitle}</strong><StatusBadge status={job.status} /></div><span>{job.customerName}</span><Button variant="secondary" size="sm" onClick={() => navigate(`/provider/jobs/${job.id}`)}>View Job #{job.id}</Button></div>)}
      </section>
    </div>
  );
}
