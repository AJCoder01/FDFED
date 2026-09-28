import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Play, FileText, Phone } from 'lucide-react';
import { getBookingById, updateBookingStatus } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';

export function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    async function loadJob() {
      setLoading(true);
      const data = await getBookingById(jobId);
      setJob(data);
      setLoading(false);
    }
    loadJob();
  }, [jobId]);

  const handleStartJob = async () => {
    const updated = await updateBookingStatus(job.id, 'in_progress', 'Technician arrived at location and started job.');
    setJob({ ...updated });
    showToast('Job status updated to IN PROGRESS!', 'info');
  };

  const handleCompleteJob = async () => {
    if (!completionNotes) {
      showToast('Please enter job completion notes.', 'warning');
      return;
    }
    const updated = await updateBookingStatus(job.id, 'completed', `Job completed. Notes: ${completionNotes}`);
    setJob({ ...updated });
    showToast('Job marked COMPLETED! Mock earnings credited.', 'success');
  };

  if (loading) return <Skeleton height="400px" borderRadius="12px" />;
  if (!job) return <div>Job record not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontWeight: '600', fontSize: '14px', width: 'fit-content' }}>
        <ArrowLeft size={16} /> Back to Job Inbox
      </button>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-ink)' }}>Job Workspace #{job.id}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>{job.serviceTitle}</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {job.status === 'active' && (
            <Button variant="primary" icon={Play} onClick={handleStartJob}>
              Start Work (Mark In Progress)
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }} className="grid-cols-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Fulfillment Form if In Progress */}
          {job.status === 'in_progress' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Job Fulfillment & Completion</h3>
              <TextField
                label="Technician Completion Notes & Work Proof"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="e.g. Foam jet wash completed. Tested AC cooling at 18°C. Gas pressure normal."
                multiline
                rows={3}
                required
              />
              <Button variant="success" size="lg" icon={CheckCircle2} onClick={handleCompleteJob}>
                Mark Job Fully Completed
              </Button>
            </div>
          )}

          {/* Timeline Audit */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '16px' }}>Fulfillment Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid var(--color-primary)', paddingLeft: '16px' }}>
              {job.timeline?.map((evt, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>{evt.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>{evt.desc}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginTop: '4px' }}>{evt.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Customer Details</h3>
          <div><strong>Customer:</strong> {job.customerName}</div>
          <div><strong>Phone:</strong> {job.customerPhone}</div>
          <div><strong>Address:</strong> {job.address}</div>
          <div><strong>Customer Notes:</strong> {job.notes || 'None provided'}</div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
          
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>Payout Breakdown</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
            <span>Gross Service Price:</span>
            <span>₹{job.amount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
            <span>5% ServiceHub Platform Fee:</span>
            <span>-₹{job.platformFee !== undefined ? job.platformFee : Math.round(job.amount * 0.05)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: 'var(--color-success)' }}>
            <span>Net Credited Payout:</span>
            <span>₹{job.netPayout !== undefined ? job.netPayout : (job.amount - Math.round(job.amount * 0.05))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
