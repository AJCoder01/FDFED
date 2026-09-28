import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Video, CheckCircle2 } from 'lucide-react';
import { scheduleHearing } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Button } from '../../design-system/primitives/Button';

export function HearingSchedulerPage() {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId') || 'DISP-101';
  const { showToast } = useApp();

  const [date, setDate] = useState('2026-08-22');
  const [time, setTime] = useState('11:00 AM');
  const [meetUrl, setMeetUrl] = useState('https://meet.servicehub.in/dispute-101-hearing');
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  // Simple basic calendar representation for Arbitrator
  const calendarDays = [
    { day: 'Mon 17', slots: 0, active: false },
    { day: 'Tue 18', slots: 1, active: false },
    { day: 'Wed 19', slots: 2, active: false },
    { day: 'Thu 20', slots: 0, active: false },
    { day: 'Fri 21', slots: 1, active: false },
    { day: 'Sat 22', slots: 1, active: true }, // Selected date
    { day: 'Sun 23', slots: 0, active: false },
  ];

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    await scheduleHearing(caseIdParam, {
      scheduledDate: date,
      scheduledTime: time,
      meetUrl: meetUrl
    });
    setScheduledSuccess(true);
    showToast(`Virtual hearing scheduled for Case #${caseIdParam} on ${date} at ${time}. Both parties notified!`, 'success');
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
            <CalendarIcon size={20} color="var(--color-primary)" /> Weekly Arbitrator Schedule (Aug 2026)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarDays.map((d, i) => (
              <div
                key={i}
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
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-control)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ color: 'var(--color-ink)' }}>Scheduled Hearings Today:</strong>
            <div style={{ padding: '8px', backgroundColor: '#FFF', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              <strong>11:00 AM - Case #DISP-101:</strong> Aarav Sharma vs Apex Fix Services (Flooring Damage Claim)
            </div>
          </div>
        </div>

        {/* Schedule Form */}
        <form onSubmit={handleScheduleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Set Hearing Slot for Case #{caseIdParam}</h2>

          <TextField
            label="Hearing Date"
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
            value={meetUrl}
            onChange={(e) => setMeetUrl(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="lg" icon={Video}>
            Confirm Hearing & Notify Parties
          </Button>

          {scheduledSuccess && (
            <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px', borderRadius: 'var(--radius-control)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span>Hearing locked! Automated notifications dispatched to Customer & Provider.</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
