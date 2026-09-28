import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';

export function AvailabilitySchedulerPage() {
  const { currentUser, showToast } = useApp();

  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:00');
  const [blackoutDate, setBlackoutDate] = useState('2026-08-25');

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Weekly availability & blackout schedule updated!', 'success');
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="app-container" style={{ padding: '24px 0', maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Weekly Availability Scheduler</h1>
        <p className="page-subtitle">Set your operating hours, weekly work days, and blackout dates</p>
      </div>

      <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)', display: 'block', marginBottom: '8px' }}>
            Active Working Days:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {daysOfWeek.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-control)',
                  border: `1px solid ${workingDays.includes(day) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: workingDays.includes(day) ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  color: workingDays.includes(day) ? 'var(--color-primary)' : 'var(--color-ink)',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-2">
          <TextField
            label="Daily Start Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <TextField
            label="Daily End Time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <TextField
          label="Blackout / Vacation Date"
          type="date"
          value={blackoutDate}
          onChange={(e) => setBlackoutDate(e.target.value)}
          helperText="No customer bookings will be permitted on this date."
        />

        <Button type="submit" variant="primary" size="lg">
          Save Schedule Settings
        </Button>
      </form>
    </div>
  );
}
