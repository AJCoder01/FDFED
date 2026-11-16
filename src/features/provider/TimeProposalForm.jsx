import { useCallback, useState } from "react";
import {
  getAvailableSlots,
  proposeBookingTime,
} from "../../data/apiRepository";
import { useRepositoryQuery } from "../../data/useRepositoryQuery";
import { useApp } from "../../app/context/AppContext";
import { TextField } from "../../design-system/primitives/TextField";
import { Select } from "../../design-system/primitives/Select";
import { Button } from "../../design-system/primitives/Button";
export function TimeProposalForm({ job }) {
  const { showToast } = useApp();
  const [date, setDate] = useState(job.scheduledDate);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    () => getAvailableSlots(job.serviceId, date, job.id),
    [job.serviceId, job.id, date],
  );
  const { data: slots, error } = useRepositoryQuery(load);
  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await proposeBookingTime(job.id, date, slot);
      showToast(
        "Time proposal sent. The original appointment remains reserved.",
      );
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="card provider-stack" onSubmit={send}>
      <h2>Propose a Different Time</h2>
      <TextField
        label="Proposed Date"
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          setSlot("");
        }}
        required
      />
      <Select
        label="Proposed Slot"
        value={slot}
        onChange={(e) => setSlot(e.target.value)}
        options={(slots || []).map((s) => ({ value: s, label: s }))}
        required
      />
      {error && <p role="alert">{error}</p>}
      <Button type="submit" disabled={busy || !slot}>
        Send Time Proposal
      </Button>
    </form>
  );
}
