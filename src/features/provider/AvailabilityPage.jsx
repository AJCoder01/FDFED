import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, fetchCurrentUserThunk } from "../../store/slices/authSlice";
import { saveAvailabilityThunk } from "../../store/slices/usersSlice";
import { useApp } from "../../app/context/AppContext";
import { DEFAULT_SCHEDULE, DAYS } from "../../data/scheduling";
import { Button } from "../../design-system/primitives/Button";
import { TextField } from "../../design-system/primitives/TextField";

export function AvailabilityPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { showToast } = useApp();

  const [form, setForm] = useState(() => ({
    ...DEFAULT_SCHEDULE,
    ...currentUser?.weeklyAvailability,
  }));
  const [busy, setBusy] = useState(false);
  const [blackoutDates, setBlackoutDates] = useState(
    (form.blackoutDates || []).join(", ")
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
      await dispatch(
        saveAvailabilityThunk({
          id: currentUser.id,
          schedule: {
            ...form,
            blackoutDates: blackoutDates
              .split(",")
              .map((date) => date.trim())
              .filter(Boolean),
          },
        })
      ).unwrap();
      await dispatch(fetchCurrentUserThunk()).unwrap();
      showToast("Weekly availability saved.");
    } catch (e) {
      showToast(e.message || "Failed to save availability", "error");
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
              checked={(form.days || []).includes(day)}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  days: e.target.checked
                    ? [...v.days, day]
                    : v.days.filter((x) => x !== day),
                }))
              }
            />{" "}
            {day}
          </label>
        ))}
      </div>
      <div className="provider-row">
        <TextField
          name="startTime"
          label="Start Time"
          value={form.startTime}
          onChange={change}
          required
        />
        <TextField
          name="endTime"
          label="End Time"
          value={form.endTime}
          onChange={change}
          required
        />
      </div>
      <div className="provider-row">
        <TextField
          name="leadMinutes"
          label="Lead Time (minutes)"
          type="number"
          min="0"
          value={form.leadMinutes}
          onChange={change}
          required
        />
        <TextField
          name="bufferMinutes"
          label="Buffer Time (minutes)"
          type="number"
          min="0"
          value={form.bufferMinutes}
          onChange={change}
          required
        />
      </div>
      <TextField
        name="blackout"
        label="Blackout Dates (YYYY-MM-DD, comma separated)"
        value={blackoutDates}
        onChange={(e) => setBlackoutDates(e.target.value)}
      />
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save Availability"}
      </Button>
    </form>
  );
}
