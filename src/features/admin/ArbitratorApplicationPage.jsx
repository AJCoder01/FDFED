import React, { useState } from 'react';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { getArbitratorApplications, approveArbitratorApplication, rejectArbitratorApplication } from '../../data/mockRepository';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useApp } from '../../app/context/AppContext';
import { Scale, CheckCircle2, XCircle, FileText, Eye } from 'lucide-react';

export function ArbitratorApplicationPage() {
  const { showToast } = useApp();
  const { data: applications, loading, error, refresh } = useRepositoryQuery(getArbitratorApplications);
  const [selectedApp, setSelectedApp] = useState(null);
  const [busy, setBusy] = useState(false);

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="400px" borderRadius="12px" />;

  const handleApprove = async (appId) => {
    if (busy) return;
    setBusy(true);
    try {
      await approveArbitratorApplication(appId);
      showToast('Arbitrator application approved. Account created/activated.', 'success');
      setSelectedApp(null);
      refresh();
    } catch (err) {
      showToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (appId) => {
    if (busy) return;
    setBusy(true);
    try {
      await rejectArbitratorApplication(appId);
      showToast('Arbitrator application rejected.', 'info');
      setSelectedApp(null);
      refresh();
    } catch (err) {
      showToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      header: 'Applicant',
      accessor: 'name',
      render: (row) => (
        <div>
          <strong style={{ fontSize: '13px', color: 'var(--color-ink)', display: 'block' }}>{row.name}</strong>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{row.email}</span>
        </div>
      )
    },
    {
      header: 'Title & Org',
      accessor: 'organization',
      render: (row) => (
        <div>
          <span style={{ fontSize: '13px', color: 'var(--color-ink)', fontWeight: '600', display: 'block' }}>{row.title}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{row.organization}</span>
        </div>
      )
    },
    {
      header: 'Experience',
      accessor: 'experience',
      render: (row) => <span style={{ fontSize: '13px' }}><strong>{row.experience}</strong> yrs ({row.expertise})</span>
    },
    {
      header: 'Country',
      accessor: 'country',
      render: (row) => <span style={{ fontSize: '13px' }}>{row.country}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="sm"
            variant="outline"
            icon={Eye}
            onClick={() => setSelectedApp(row)}
          >
            Review Details
          </Button>
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="primary"
                disabled={busy}
                onClick={() => handleApprove(row.id)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={busy}
                onClick={() => handleReject(row.id)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Arbitrator Onboarding Applications</h1>
          <p className="page-subtitle">Review, verify credentials, and approve or reject independent dispute arbitrator registrations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Scale size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>
            Applications: {applications?.length || 0}
          </span>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={applications || []} keyField="id" />
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedApp(null)}
          title={`Arbitrator Application: ${selectedApp.name}`}
          footer={(
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button variant="secondary" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
              {selectedApp.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="danger" icon={XCircle} disabled={busy} onClick={() => handleReject(selectedApp.id)}>
                    Reject Application
                  </Button>
                  <Button variant="primary" icon={CheckCircle2} disabled={busy} onClick={() => handleApprove(selectedApp.id)}>
                    Approve & Create Account
                  </Button>
                </div>
              )}
            </div>
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--color-page-bg)', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>APPLICATION ID</span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-ink)' }}>#{selectedApp.id}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>SUBMITTED AT</span>
                <div style={{ fontSize: '13px', color: 'var(--color-ink)' }}>{selectedApp.submittedAt}</div>
              </div>
              <StatusBadge status={selectedApp.status} />
            </div>

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>Personal Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><strong>Full Name:</strong> {selectedApp.name}</div>
                <div><strong>Email:</strong> {selectedApp.email}</div>
                <div><strong>Phone:</strong> {selectedApp.phone}</div>
                <div><strong>Country:</strong> {selectedApp.country}</div>
                <div><strong>Professional Title:</strong> {selectedApp.title}</div>
                <div><strong>LinkedIn:</strong> {selectedApp.linkedin ? <a href={selectedApp.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>Profile Link</a> : 'Not provided'}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>Professional Background</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><strong>Years Experience:</strong> {selectedApp.experience} years</div>
                <div><strong>Area of Expertise:</strong> {selectedApp.expertise}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Professional Organization:</strong> {selectedApp.organization}</div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '13px' }}>
                <strong>Previous Arbitration Experience:</strong>
                <p style={{ marginTop: '4px', backgroundColor: 'var(--color-page-bg)', padding: '10px', borderRadius: '6px', color: 'var(--color-ink)' }}>
                  {selectedApp.prevExperience || 'No previous experience description provided.'}
                </p>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>Submitted Documents</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'var(--color-surface)', fontSize: '13px' }}>
                  <FileText size={16} color="var(--color-primary)" />
                  <div>
                    <strong>Resume:</strong> {selectedApp.files?.resume || 'Uploaded file record'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'var(--color-surface)', fontSize: '13px' }}>
                  <FileText size={16} color="var(--color-primary)" />
                  <div>
                    <strong>License:</strong> {selectedApp.files?.license || 'Uploaded file record'}
                  </div>
                </div>
                {selectedApp.files?.cert && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'var(--color-surface)', fontSize: '13px' }}>
                    <FileText size={16} color="var(--color-primary)" />
                    <div>
                      <strong>Certification:</strong> {selectedApp.files.cert}
                    </div>
                  </div>
                )}
                {selectedApp.files?.extra && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'var(--color-surface)', fontSize: '13px' }}>
                    <FileText size={16} color="var(--color-primary)" />
                    <div>
                      <strong>Additional Doc:</strong> {selectedApp.files.extra}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
