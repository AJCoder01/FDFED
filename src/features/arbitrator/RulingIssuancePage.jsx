import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';

import { issueRuling } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';

import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';

const MINIMUM_WORDS = 20;

export function RulingIssuancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const caseId = searchParams.get('caseId') || 'DISP-101';

  const [verdict, setVerdict] = useState('In Favor of Customer');
  const [awardAmount, setAwardAmount] = useState('0');
  const [rulingReason, setRulingReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(false);

  // Count words, ignoring extra spaces and empty input.
  const wordCount = rulingReason.trim()
    ? rulingReason.trim().split(/\s+/).length
    : 0;

  const hasEnoughWords = wordCount >= MINIMUM_WORDS;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (busy) return;

    if (!hasEnoughWords) {
      showToast(
        `Please enter at least ${MINIMUM_WORDS} words in the ruling rationale. You have entered ${wordCount}.`,
        'warning'
      );
      return;
    }

    const amount = Number(awardAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      showToast('Please enter a valid, non-negative award amount.', 'warning');
      return;
    }

    setBusy(true);

    try {
      await issueRuling(caseId, {
        verdict,
        awardAmount: amount,
        reason: rulingReason.trim()
      });

      setIssued(true);
      showToast(
        `Ruling issued for Case #${caseId}. Notifications sent to Customer & Provider.`,
        'success'
      );
    } catch (error) {
      showToast(
        error?.message || 'Unable to issue the ruling. Please try again.',
        'warning'
      );
    } finally {
      setBusy(false);
    }
  };

  if (issued) {
    return (
      <div
        className="app-container"
        style={{
          padding: '48px 16px',
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center'
        }}
      >
        <div
          className="card"
          style={{
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-success)'
            }}
          >
            <Award size={36} />
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color: 'var(--color-ink)'
            }}
          >
            Binding Ruling & Award Issued
          </h1>

          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Case ID{' '}
            <strong style={{ color: 'var(--color-primary)' }}>
              #{caseId}
            </strong>{' '}
            has a recorded ruling.
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-page-bg)',
              padding: '16px',
              borderRadius: 'var(--radius-control)',
              width: '100%',
              textAlign: 'left',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div>
              <strong>Verdict:</strong> {verdict}
            </div>
            <div>
              <strong>Awarded Compensation:</strong> ₹{amountForDisplay(awardAmount)}
            </div>
            <div>
              <strong>Ruling Summary:</strong> {rulingReason.trim()}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/arbitrator')}
          >
            Return to Arbitrator Desk
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-container"
      style={{
        padding: '32px 16px',
        maxWidth: '700px',
        margin: '0 auto'
      }}
    >
      <div className="page-header">
        <h1 className="page-title">
          Issue Binding Arbitration Ruling & Award
        </h1>
        <p className="page-subtitle">
          Record the final decision, explain the reasons, and set the award amount.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <TextField
          label="Dispute Case ID"
          value={caseId}
          disabled
        />

        <Select
          label="Verdict Decision"
          value={verdict}
          onChange={(event) => setVerdict(event.target.value)}
          options={[
            {
              value: 'In Favor of Customer',
              label: 'In Favor of Customer (Full/Partial Award granted)'
            },
            {
              value: 'In Favor of Provider',
              label: 'In Favor of Provider (Claim dismissed)'
            },
            {
              value: 'Mutual Settlement / Split',
              label: 'Mutual Settlement / Split Responsibility'
            }
          ]}
        />

        <TextField
          label="Awarded Compensation Amount (INR ₹)"
          type="number"
          value={awardAmount}
          onChange={(event) => setAwardAmount(event.target.value)}
          required
        />

        <div>
          <TextField
            label="Formal Ruling Rationale & Summary"
            value={rulingReason}
            onChange={(event) => setRulingReason(event.target.value)}
            placeholder="Explain the evidence, findings, and reasons for your decision..."
            multiline
            rows={4}
            required
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginTop: '8px',
              fontSize: '13px',
              color: hasEnoughWords
                ? 'var(--color-success)'
                : 'var(--color-muted)'
            }}
          >
            <span>
              {hasEnoughWords
                ? 'Minimum word requirement met.'
                : `Please enter at least ${MINIMUM_WORDS} words.`}
            </span>

            <strong>
              {wordCount} / {MINIMUM_WORDS} words
            </strong>
          </div>
        </div>

        <Button
          type="submit"
          disabled={busy}
          variant="primary"
          size="lg"
          icon={Award}
        >
          {busy
            ? 'Publishing Ruling...'
            : 'Publish Final Ruling & Dispatch Notifications'}
        </Button>
      </form>
    </div>
  );
}

function amountForDisplay(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString('en-IN') : value;
}

