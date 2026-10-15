import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Scale, AlertTriangle, Upload, FileText, X } from 'lucide-react';
import { createDispute, getBookingById } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Button } from '../../design-system/primitives/Button';

export function DisputeFilingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId') || '';
  const { currentUser, showToast } = useApp();

  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [claimAmount, setClaimAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [statement, setStatement] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [submittedDispute, setSubmittedDispute] = useState(null);

  useEffect(() => {
    if (!bookingIdParam) {
      setLoadingBooking(false);
      return;
    }
    getBookingById(bookingIdParam)
      .then(b => {
        setBooking(b);
      })
      .catch(() => {})
      .finally(() => setLoadingBooking(false));
  }, [bookingIdParam]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(f => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setEvidenceFiles(prev => [
            ...prev,
            {
              name: f.name,
              size: (f.size / 1024).toFixed(1) + ' KB',
              fileData: event.target.result,
              fileType: f.type
            }
          ]);
        };
        reader.readAsDataURL(f);
      });
      e.target.value = '';
    }
  };

  const removeFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!statement.trim()) {
      showToast('Please enter your statement explaining the dispute.', 'warning');
      return;
    }

    if (booking && !['completed', 'in_progress'].includes(booking.status)) {
      showToast('Disputes can only be filed when work is in progress or completed. If the job has not started, you can cancel your booking and leave a review.', 'warning');
      return;
    }

    setBusy(true);
    try {
      const evidences = evidenceFiles.map((file, idx) => ({
        id: `ev-${Date.now()}-${idx}`,
        uploader: `${currentUser.name} (Customer)`,
        uploaderRole: 'customer',
        title: file.name,
        filename: file.name,
        fileData: file.fileData || '',
        fileType: file.fileType || '',
        fileSize: file.size || '',
        uploadedAt: new Date().toISOString()
      }));

      const created = await createDispute({
        bookingId: bookingIdParam,
        customerId: currentUser.id,
        claimAmount: Number(claimAmount),
        customerStatement: statement,
        evidences
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
            {submittedDispute.evidences?.length > 0 && (
              <div>
                <strong>Attached Evidence Files:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {submittedDispute.evidences.map(ev => <li key={ev.id}>{ev.filename}</li>)}
                </ul>
              </div>
            )}
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

  if (!bookingIdParam) {
    return (
      <div className="app-container" style={{ padding: '32px 16px', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <p>Choose a booking before filing a dispute.</p>
          <Button style={{ marginTop: '16px' }} onClick={() => navigate('/customer/bookings')}>View My Bookings</Button>
        </div>
      </div>
    );
  }

  if (!loadingBooking && booking && !['completed', 'in_progress'].includes(booking.status)) {
    return (
      <div className="app-container" style={{ padding: '32px 16px', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: 'var(--color-warning)', display: 'flex', justifyContent: 'center' }}>
            <AlertTriangle size={48} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)' }}>Dispute Filing Unavailable</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Customers can only file a dispute when a job is <strong>In Progress</strong> or has been <strong>Completed</strong> by the provider.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            If the job has not started, your option is to cancel the booking and leave a review.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => navigate(`/customer/bookings/${bookingIdParam}`)}>Back to Booking</Button>
            <Button variant="outline" onClick={() => navigate('/customer/bookings')}>All Bookings</Button>
          </div>
        </div>
      </div>
    );
  }

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

        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
            Target Booking ID (Locked)
          </label>
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-page-bg)',
            color: 'var(--color-ink)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '700',
            cursor: 'not-allowed',
            userSelect: 'none'
          }}>
            #{bookingIdParam}
          </div>
        </div>

        <TextField
          label="Claim Amount / Compensation Requested (INR ₹) *"
          type="number"
          min="1"
          placeholder="e.g. 1500"
          value={claimAmount}
          onChange={(e) => setClaimAmount(e.target.value)}
          required
        />

        <TextField
          label="Customer Statement of Dispute *"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="State clearly what happened, what evidence you have, and why compensation/redo is claimed..."
          multiline
          rows={4}
          required
        />

        {/* Optional Evidence File Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>
            Upload Evidence Documents / Photos <span style={{ fontWeight: '400', color: 'var(--color-muted)' }}>(Optional)</span>
          </label>
          <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-control)', padding: '20px', textAlign: 'center', backgroundColor: 'var(--color-page-bg)' }}>
            <Upload size={24} style={{ color: 'var(--color-muted)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 10px 0' }}>
              Upload photos of incomplete work, receipts, or inspection documents
            </p>
            <input
              type="file"
              id="customerEvidenceInput"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('customerEvidenceInput').click()}
            >
              Select Evidence File(s)
            </Button>
          </div>

          {evidenceFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>Attached Files ({evidenceFiles.length}):</span>
              {evidenceFiles.map((file, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="var(--color-primary)" />
                    <span><strong>{file.name}</strong> <span style={{ color: 'var(--color-muted)', fontSize: '11px' }}>({file.size})</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={busy} variant="danger" size="lg" fullWidth style={{ marginTop: '8px' }}>
          {busy ? 'Submitting Dispute...' : 'Submit Dispute to Arbitration'}
        </Button>
      </form>
    </div>
  );
}
