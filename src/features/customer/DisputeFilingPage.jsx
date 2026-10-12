import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Scale, AlertTriangle } from 'lucide-react';
import { createDispute } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Button } from '../../design-system/primitives/Button';

export function DisputeFilingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId') || '';
  const { currentUser, showToast } = useApp();

  const [claimAmount, setClaimAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [statement, setStatement] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [submittedDispute, setSubmittedDispute] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!statement) {
      showToast('Please enter your statement explaining the dispute.', 'warning');
      return;
    }

    setBusy(true);
    try {
      const created = await createDispute({
        bookingId: bookingIdParam,
        customerId: currentUser.id,
        claimAmount: Number(claimAmount),
        customerStatement: statement,
        evidences: evidenceName.trim() ? [{
          id: `ev-${Date.now()}`, uploader: `${currentUser.name} (Customer)`,
          title: evidenceName.trim(), filename: evidenceName.trim(), uploadedAt: new Date().toISOString()
        }] : []
      });

      setSubmittedDispute(created);
      showToast(`Dispute Case #${created.id} filed. An Arbitrator will be assigned.`, 'success');
    } catch (error) { showToast(error.message, 'warning'); }
    finally { setBusy(false); }
  };

  if (submittedDispute) {
    return (
      <div className="app-container" style={{ padding: '48px 16px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-conflict-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-conflict)' }}>
            <Scale size={36} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>Dispute Case Escalated to Arbitration</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Your dispute case reference is <strong style={{ color: 'var(--color-conflict)' }}>#{submittedDispute.id}</strong>.
          </p>

          <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-control)', width: '100%', textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><strong>Booking:</strong> #{submittedDispute.bookingId}</div>
            <div><strong>Claim Compensation:</strong> ₹{submittedDispute.claimAmount}</div>
            <div><strong>Status:</strong> Pending Arbitrator Assignment</div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Platform operations will assign an independent Arbitrator. Both parties will be notified of hearing dates and evidence requests.
          </p>

          <Button variant="primary" onClick={() => navigate('/customer/bookings')}>
            Return to My Bookings
          </Button>
        </div>
      </div>
    );
  }

  if (!bookingIdParam) return <div className="card"><p>Choose a booking before filing a dispute.</p><Button onClick={() => navigate('/customer/bookings')}>View My Bookings</Button></div>;

  return (
    <div className="app-container" style={{ padding: '32px 16px', maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">File a Formal Dispute Case</h1>
        <p className="page-subtitle">Escalate unresolvable booking conflicts to independent arbitration</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--color-conflict-bg)', color: 'var(--color-conflict)', borderRadius: 'var(--radius-control)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} />
          <span>Dispute proceedings are binding. Please provide truthful statements and evidence files.</span>
        </div>

        <TextField
          label="Target Booking ID"
          value={bookingIdParam}
          disabled
        />

        <TextField
          label="Claim Amount / Compensation Requested (INR ₹)"
          type="number"
          min="0"
          value={claimAmount}
          onChange={(e) => setClaimAmount(e.target.value)}
          required
        />

        <TextField
          label="Customer Statement of Dispute"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="State clearly what happened, what evidence you have, and why compensation/redo is claimed..."
          multiline
          rows={4}
          required
        />

        <TextField
          label="Evidence Filename (Demo Record)"
          value={evidenceName}
          onChange={event => setEvidenceName(event.target.value)}
          helperText="Optional filename record; no file is uploaded."
        />

        <Button type="submit" disabled={busy} variant="danger" size="lg" fullWidth style={{ marginTop: '8px' }}>
          Submit Dispute to Arbitration
        </Button>
      </form>
    </div>
  );
}
