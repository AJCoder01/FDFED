import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Check, X, Clock } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getBookings, updateBookingStatus } from '../../data/mockRepository';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { TextField } from '../../design-system/primitives/TextField';

export function JobInboxPage() {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Propose time modal
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [proposedTime, setProposedTime] = useState('04:30 PM');

  const loadData = async () => {
    setLoading(true);
    if (currentUser) {
      const list = await getBookings('provider', currentUser.id);
      setJobs(list);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleAccept = async (jobId) => {
    await updateBookingStatus(jobId, 'active', 'Provider accepted the booking request.');
    await loadData();
    showToast(`Job #${jobId} accepted!`, 'success');
  };

  const handleReject = async (jobId) => {
    await updateBookingStatus(jobId, 'cancelled', 'Provider declined the request due to schedule conflict.');
    await loadData();
    showToast(`Job #${jobId} declined.`, 'info');
  };

  const handleProposeTime = async () => {
    await updateBookingStatus(selectedJobId, 'reschedule_proposed', `Provider proposed new time: ${proposedTime}. Customer agreement required.`);
    setProposeModalOpen(false);
    await loadData();
    showToast(`Proposed new time slot (${proposedTime}) sent to customer for agreement.`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Provider Job Inbox</h1>
        <p className="page-subtitle">Accept, reject, or propose alternative times for customer service requests</p>
      </div>

      {loading ? (
        <Skeleton height="200px" borderRadius="12px" />
      ) : jobs.length === 0 ? (
        <p style={{ color: 'var(--color-muted)' }}>No job requests in your inbox.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {jobs.map((job) => (
            <div key={job.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--color-ink)' }}>#{job.id}</strong>
                  <StatusBadge status={job.status} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>{job.serviceTitle}</h3>
                <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
                  Customer: <strong>{job.customerName}</strong> ({job.customerPhone}) | Address: {job.address}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)', marginTop: '4px' }}>
                  Scheduled Slot: {job.scheduledDate} ({job.scheduledSlot})
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Button variant="success" size="sm" icon={Check} onClick={() => handleAccept(job.id)}>
                  Accept Job
                </Button>
                <Button variant="danger" size="sm" icon={X} onClick={() => handleReject(job.id)}>
                  Decline
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Clock}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setProposeModalOpen(true);
                  }}
                >
                  Propose Time
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/provider/jobs/${job.id}`)}>
                  Workspace
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Propose Time Modal */}
      <Modal
        isOpen={proposeModalOpen}
        onClose={() => setProposeModalOpen(false)}
        title="Propose Alternative Time Slot"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setProposeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleProposeTime}>Send Proposal to Customer</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Proposing a new time slot requires final customer agreement and compliance before confirmation.
          </p>
          <TextField
            label="Proposed Time Slot"
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
            placeholder="e.g. 04:30 PM"
            required
          />
        </div>
      </Modal>
    </div>
  );
}
