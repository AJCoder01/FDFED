import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAvailableSlots,
  fetchAvailableSlotsThunk,
} from "../../store/slices/marketplaceSlice";
import { proposeBookingTimeThunk } from "../../store/slices/bookingsSlice";
import { useApp } from "../../app/context/AppContext";
import { TextField } from "../../design-system/primitives/TextField";
import { Select } from "../../design-system/primitives/Select";
import { Button } from "../../design-system/primitives/Button";

export function TimeProposalForm({ job }) {
  const dispatch = useDispatch();
  const slots = useSelector(selectAvailableSlots);
  const { showToast } = useApp();
  const [date, setDate] = useState(job.scheduledDate);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshSlots = useCallback(() => {
    if (job.serviceId && date) {
      dispatch(
        fetchAvailableSlotsThunk({
          id: job.serviceId,
          date,
          excludeId: job.id,
        })
      );
    }
  }, [job.serviceId, job.id, date, dispatch]);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await dispatch(
        proposeBookingTimeThunk({
          id: job.id,
          date,
          slot,
        })
      ).unwrap();
      showToast(
        "Time proposal sent. The original appointment remains reserved."
      );
    } catch (e) {
      setError(e.message);
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
        {busy ? "Sending…" : "Send Time Proposal"}
      </Button>
    </form>
  );
}
