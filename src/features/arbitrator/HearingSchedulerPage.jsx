import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Video, CheckCircle2 } from 'lucide-react';
import { getTodayDateInputValue, addDays } from '../../utils/date';
import { getDisputes, scheduleHearing } from '../../data/mockRepository';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Button } from '../../design-system/primitives/Button';

export function HearingSchedulerPage() {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId') || 'DISP-101';
  const { currentUser, showToast } = useApp();

  const { data: disputes } = useRepositoryQuery(getDisputes);
  const caseDispute = (disputes || []).find(d => d.id === caseIdParam);

  const [date, setDate] = useState(() => addDays(getTodayDateInputValue(), 1));
  const [time, setTime] = useState('11:00 AM');
  const [meetUrl, setMeetUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  useEffect(() => {
    if (caseDispute?.hearingSchedule) {
      if (caseDispute.hearingSchedule.scheduledDate) setDate(caseDispute.hearingSchedule.scheduledDate);
      if (caseDispute.hearingSchedule.scheduledTime) setTime(caseDispute.hearingSchedule.scheduledTime);
      if (caseDispute.hearingSchedule.meetUrl) setMeetUrl(caseDispute.hearingSchedule.meetUrl);
    }
  }, [caseDispute]);

  const selected = date || getTodayDateInputValue();
  const monday = new Date(`${selected}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const hearings = (disputes || []).filter(dispute => (dispute.arbitratorId === currentUser?.id || dispute.arbitratorId === 'user-arbit-1') && dispute.hearingSchedule);
  const calendarDays = Array.from({ length: 7 }, (_, index) => {
    const value = addDays(monday.toISOString().slice(0, 10), index);
    return { date: value, day: new Date(`${value}T12:00:00Z`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric' }), slots: hearings.filter(dispute => dispute.hearingSchedule.scheduledDate === value).length, active: value === date };
  });

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await scheduleHearing(caseIdParam, { scheduledDate: date, scheduledTime: time, meetUrl });
      setScheduledSuccess(true);
      showToast(`Hearing scheduled for Case #${caseIdParam} on ${date} at ${time}. Both parties notified.`, 'success');
    } catch (error) { showToast(error.message, 'warning'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Virtual Hearing Schedule Calendar</h1>
        <p className="page-subtitle">Schedule video hearings for dispute resolution & issue summons notifications</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-cols-2">
        {/* Simple Arbitrator Calendar View */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={20} color="var(--color-primary)" /> Weekly Arbitrator Schedule
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarDays.map((d, i) => (
              <button
                type="button"
                onClick={() => setDate(d.date)}
                key={d.date}
                style={{
                  border: `1px solid ${d.active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: d.active ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  borderRadius: 'var(--radius-control)',
                  padding: '10px 4px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700', color: d.active ? 'var(--color-primary)' : 'var(--color-ink)' }}>{d.day}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginTop: '4px' }}>
                  {d.slots > 0 ? `${d.slots} Hearing` : 'Free'}
                </div>
              </button>
            ))}
          </div>

          <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-control)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ color: 'var(--color-ink)' }}>Hearings for {selected}:</strong>
            {hearings.filter(dispute => dispute.hearingSchedule.scheduledDate === selected).map(dispute => <div key={dispute.id}>{dispute.hearingSchedule.scheduledTime} — Case #{dispute.id}</div>)}
            {!hearings.some(dispute => dispute.hearingSchedule.scheduledDate === selected) && <p>No hearings on this date.</p>}
          </div>
        </div>

        {/* Schedule Form */}
        <form onSubmit={handleScheduleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Set Hearing Slot for Case #{caseIdParam}</h2>

          <TextField
            name="hearing-date"
            label="Hearing Date"
            min={getTodayDateInputValue()}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <TextField
            label="Hearing Time Slot"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="e.g. 11:00 AM"
            required
          />

          <TextField
            label="Virtual Video Meeting Link"
            type="url"
            value={meetUrl}
            onChange={(e) => setMeetUrl(e.target.value)}
            required
          />

          <Button type="submit" disabled={busy} variant="primary" size="lg" icon={Video}>
            Confirm Hearing & Notify Parties
          </Button>

          {scheduledSuccess && (
            <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px', borderRadius: 'var(--radius-control)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span>Hearing saved. Customer and Provider have been notified.</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
