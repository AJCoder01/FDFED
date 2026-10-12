import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';
import { issueRuling } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';

export function RulingIssuancePage() {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId') || 'DISP-101';
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [verdict, setVerdict] = useState('In Favor of Customer');
  const [awardAmount, setAwardAmount] = useState('0');
  const [rulingReason, setRulingReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!rulingReason) {
      showToast('Please enter the ruling rationale.', 'warning');
      return;
    }

    setBusy(true);
    try {
      await issueRuling(caseIdParam, { verdict, awardAmount: Number(awardAmount), reason: rulingReason });
      setIssued(true);
      showToast(`Ruling issued for Case #${caseIdParam}. Notifications sent to Customer & Provider.`, 'success');
    } catch (error) { showToast(error.message, 'warning'); }
    finally { setBusy(false); }
  };

  if (issued) {
    return (
      <div className="app-container" style={{ padding: '48px 16px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
            <Award size={36} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>Binding Ruling & Award Issued</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Case ID <strong style={{ color: 'var(--color-primary)' }}>#{caseIdParam}</strong> has a recorded ruling.
          </p>

          <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-control)', width: '100%', textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><strong>Verdict:</strong> {verdict}</div>
            <div><strong>Awarded Compensation:</strong> ₹{awardAmount}</div>
            <div><strong>Ruling Summary:</strong> {rulingReason}</div>
          </div>

          <Button variant="primary" onClick={() => navigate('/arbitrator')}>
            Return to Arbitrator Desk
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ padding: '32px 16px', maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Issue Binding Arbitration Ruling & Award</h1>
        <p className="page-subtitle">Record official verdict, set financial award, and dispatch notifications</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <TextField
          label="Dispute Case ID"
          value={caseIdParam}
          disabled
        />

        <Select
          label="Verdict Decision"
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          options={[
            { value: 'In Favor of Customer', label: 'In Favor of Customer (Full/Partial Award granted)' },
            { value: 'In Favor of Provider', label: 'In Favor of Provider (Claim dismissed)' },
            { value: 'Mutual Settlement / Split', label: 'Mutual Settlement / Split Responsibility' }
          ]}
        />

        <TextField
          label="Awarded Compensation Amount (INR ₹)"
          type="number"
          value={awardAmount}
          onChange={(e) => setAwardAmount(e.target.value)}
          required
        />

        <TextField
          label="Formal Ruling Rationale & Summary"
          value={rulingReason}
          onChange={(e) => setRulingReason(e.target.value)}
          placeholder="State evidence evaluation and reasons for the final ruling..."
          multiline
          rows={4}
          required
        />

        <Button type="submit" disabled={busy} variant="primary" size="lg" icon={Award}>
          Publish Final Ruling & Dispatch Notifications
        </Button>
      </form>
    </div>
  );
}
