import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Award, ShieldAlert } from 'lucide-react';

import {
  fetchDisputeById,
  issueRuling,
  selectSelectedDispute,
} from '../../store/slices/governanceSlice';
import { useApp } from '../../app/context/AppContext';

import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';

const MINIMUM_CHARACTERS = 10;

export function RulingIssuancePage() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const caseId = searchParams.get('caseId') || 'DISP-101';

  useEffect(() => {
    if (caseId) {
      dispatch(fetchDisputeById(caseId));
    }
  }, [dispatch, caseId]);

  const selectedDispute = useSelector(selectSelectedDispute);
  const dispute = selectedDispute?.id === caseId ? selectedDispute : null;
  const maxAllowedAward = dispute ? Number(dispute.amountInDispute || 0) : null;

  const [verdict, setVerdict] = useState('In favour of Customer');
  const [awardAmount, setAwardAmount] = useState('0');
  const [rulingReason, setRulingReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(false);

  const isFavorProvider = verdict.toLowerCase().includes('provider');

  const charCount = rulingReason.trim().length;
  const hasEnoughCharacters = charCount >= MINIMUM_CHARACTERS;

  const handleVerdictChange = (nextVerdict) => {
    setVerdict(nextVerdict);
    if (nextVerdict.toLowerCase().includes('provider')) {
      setAwardAmount('0');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (busy) return;

    if (!hasEnoughCharacters) {
      showToast(
        `Please enter at least ${MINIMUM_CHARACTERS} characters in the ruling rationale. You have entered ${charCount}.`,
        'warning'
      );
      return;
    }

    const amount = Number(awardAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      showToast('Please enter a valid, non-negative award amount.', 'warning');
      return;
    }

    if (isFavorProvider && amount > 0) {
      showToast('A ruling in favour of the Provider cannot award refund compensation.', 'warning');
      return;
    }

    if (maxAllowedAward !== null && amount > maxAllowedAward) {
      showToast(
        `Award amount (₹${amount.toLocaleString('en-IN')}) cannot exceed the escrow booking limit of ₹${maxAllowedAward.toLocaleString('en-IN')}.`,
        'warning'
      );
      return;
    }

    setBusy(true);

    try {
      await dispatch(issueRuling({
        disputeId: caseId,
        values: {
          verdict,
          awardAmount: amount,
          reason: rulingReason.trim()
        }
      })).unwrap();

      setIssued(true);
      showToast(
        `Ruling issued for Case #${caseId}. Notifications sent to Customer & Provider.`,
        'success'
      );
    } catch (error) {
      showToast(
        (typeof error === 'string' ? error : error?.message) || 'Unable to issue the ruling. Please try again.',
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

        {dispute && (
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-control)', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px', color: '#075985' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong>Escrow Refund Cap Policy: Maximum Award ₹{Number(maxAllowedAward || 0).toLocaleString('en-IN')}</strong>
              <span>
                Booking Paid Value: <strong>₹{Number(dispute.amountInDispute || 0).toLocaleString('en-IN')}</strong> · Customer Claimed:{' '}
                <strong>₹{Number(dispute.claimAmount || dispute.amountInDispute || 0).toLocaleString('en-IN')}</strong>. Refunds are capped at 100% of the paid booking escrow.
              </span>
            </div>
          </div>
        )}

        <Select
          label="Verdict Decision"
          value={verdict}
          onChange={(event) => handleVerdictChange(event.target.value)}
          options={[
            {
              value: 'In favour of Customer',
              label: 'In favour of Customer (Claim Granted / Award compensation to Customer)'
            },
            {
              value: 'In favour of Provider',
              label: 'In favour of Provider (Claim Dismissed / Findings favor Provider)'
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
          min="0"
          max={isFavorProvider ? 0 : (maxAllowedAward ?? undefined)}
          value={isFavorProvider ? '0' : awardAmount}
          disabled={isFavorProvider || busy}
          onChange={(event) => setAwardAmount(event.target.value)}
          helperText={
            isFavorProvider
              ? 'Customer compensation is ₹0 when verdict favours the Provider.'
              : maxAllowedAward !== null
                ? `Allowed range: ₹0 to ₹${maxAllowedAward.toLocaleString('en-IN')} (100% of paid booking value)`
                : undefined
          }
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
              color: hasEnoughCharacters
                ? 'var(--color-success)'
                : 'var(--color-muted)'
            }}
          >
            <span>
              {hasEnoughCharacters
                ? 'Minimum character requirement met.'
                : `Please enter at least ${MINIMUM_CHARACTERS} characters.`}
            </span>

            <strong>
              {charCount} / {MINIMUM_CHARACTERS} chars
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

