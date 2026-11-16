import { useState } from "react";
import { useApp } from "../../app/context/AppContext";
import { saveAvailability } from "../../data/apiRepository";
import { DEFAULT_SCHEDULE, DAYS } from "../../data/scheduling";
import { Button } from "../../design-system/primitives/Button";
import { TextField } from "../../design-system/primitives/TextField";
export function AvailabilityPage() {
  const { currentUser, showToast } = useApp();
  const [form, setForm] = useState(() => ({
    ...DEFAULT_SCHEDULE,
    ...currentUser.weeklyAvailability,
  }));
  const [busy, setBusy] = useState(false);
  const [blackoutDates, setBlackoutDates] = useState(
    form.blackoutDates.join(", "),
  );
  const change = (e) =>
    setForm((v) => ({
      ...v,
      [e.target.name]: ["leadMinutes", "bufferMinutes"].includes(e.target.name)
        ? Number(e.target.value)
        : e.target.value,
    }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveAvailability(currentUser.id, {
        ...form,
        blackoutDates: blackoutDates
          .split(",")
          .map((date) => date.trim())
          .filter(Boolean),
      });
      showToast("Weekly availability saved.");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="card provider-stack" onSubmit={save}>
      <h1>Working Availability</h1>
      <p>
        Appointments use Asia/Kolkata time. Changes apply to new booking
        requests.
      </p>
      <div className="provider-row">
        {DAYS.map((day) => (
          <label key={day}>
            <input
              type="checkbox"
              checked={form.days.includes(day)}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  days: e.target.checked
                    ? [...v.days, day]
                    : v.days.filter((x) => x !== day),
                }))
              }
            />
            {day}
          </label>
        ))}
      </div>
      <TextField
        label="Daily Start Time"
        name="startTime"
        type="time"
        value={form.startTime}
        onChange={change}
      />
      <TextField
        label="Daily End Time"
        name="endTime"
        type="time"
        value={form.endTime}
        onChange={change}
      />
      <TextField
        label="Minimum Lead Time (minutes)"
        name="leadMinutes"
        type="number"
        min="0"
        max="1440"
        value={form.leadMinutes}
        onChange={change}
      />
      <TextField
        label="Buffer Between Bookings (minutes)"
        name="bufferMinutes"
        type="number"
        min="0"
        max="1440"
        value={form.bufferMinutes}
        onChange={change}
      />
      <TextField
        label="Blackout Dates (comma separated YYYY-MM-DD)"
        value={blackoutDates}
        onChange={(e) => setBlackoutDates(e.target.value)}
      />
      <Button type="submit" disabled={busy}>
        Save Schedule Settings
      </Button>
    </form>
  );
}
