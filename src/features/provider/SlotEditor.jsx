import { useState } from 'react';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { formatSlot, slotMinutes } from './providerUtils';

export function SlotEditor({ slots, onChange, disabled = false }) {
  const [time, setTime] = useState('');
  const slot = time ? formatSlot(time) : '';

  return (
    <div className="provider-stack">
      <div className="provider-row">
        <TextField name="slot-time" label="Slot Start Time" type="time" value={time} disabled={disabled} onChange={event => setTime(event.target.value)} />
        <Button variant="outline" disabled={disabled || !slot || slots.includes(slot)} onClick={() => onChange([...slots, slot].sort((a, b) => slotMinutes(a) - slotMinutes(b)))}>
          Add Slot
        </Button>
      </div>
      <div className="provider-row" aria-label="Configured time slots">
        {slots.map(slot => (
          <button key={slot} type="button" className="provider-slot" aria-label={`Remove ${slot}`} disabled={disabled} onClick={() => onChange(slots.filter(value => value !== slot))}>
            {slot} ×
          </button>
        ))}
      </div>
    </div>
  );
}
