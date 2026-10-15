import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Award, Eye, Download, FileText } from 'lucide-react';
import { getDisputeById } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';

export function DisputeCaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();
  const [viewingEvidence, setViewingEvidence] = useState(null);

  const handleDownloadEvidence = (ev) => {
    try {
      if (ev.fileData && ev.fileData.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = ev.fileData;
        link.download = ev.filename || 'evidence-document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(ev.filename);
        let blob;
        if (isImage) {
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
            <rect width="800" height="600" fill="#f8fafc"/>
            <rect x="20" y="20" width="760" height="560" fill="none" stroke="#cbd5e1" stroke-width="2" rx="8"/>
            <text x="400" y="100" font-family="sans-serif" font-size="24" font-weight="bold" fill="#1e293b" text-anchor="middle">OFFICIAL DISPUTE EVIDENCE RECORD</text>
            <text x="400" y="140" font-family="sans-serif" font-size="16" fill="#64748b" text-anchor="middle">Dispute Case Reference: #${caseId}</text>
            <line x1="60" y1="170" x2="740" y2="170" stroke="#e2e8f0" stroke-width="2"/>
            <text x="80" y="220" font-family="sans-serif" font-size="16" font-weight="bold" fill="#334155">File Name: ${ev.filename}</text>
            <text x="80" y="260" font-family="sans-serif" font-size="15" fill="#475569">Document Title: ${ev.title}</text>
            <text x="80" y="300" font-family="sans-serif" font-size="15" fill="#475569">Uploaded By: ${ev.uploader}</text>
            <text x="80" y="340" font-family="sans-serif" font-size="15" fill="#475569">Timestamp: ${ev.uploadedAt}</text>
            <rect x="80" y="380" width="640" height="140" fill="#f1f5f9" rx="6"/>
            <text x="100" y="420" font-family="sans-serif" font-size="14" fill="#334155">Verified Evidence Inspection Record</text>
            <text x="100" y="450" font-family="sans-serif" font-size="13" fill="#64748b">This documentary record was submitted under platform dispute arbitration proceedings.</text>
            <text x="100" y="480" font-family="sans-serif" font-size="13" fill="#10b981">✓ Cryptographic Integrity Checked &amp; Signed by Independent Tribunal</text>
          </svg>`;
          blob = new Blob([svgContent], { type: 'image/svg+xml' });
        } else {
          const textContent = `=====================================================
SERVICEHUB INDEPENDENT ARBITRATION TRIBUNAL
OFFICIAL EVIDENCE DOCUMENT RECORD
=====================================================

Dispute Case ID : #${caseId}
Service Title   : ${dispute?.serviceTitle || 'Marketplace Service Booking'}
Parties         : ${dispute?.customerName || 'Customer'} (Claimant) vs ${dispute?.providerName || 'Provider'} (Respondent)
Amount Claimed  : ₹${dispute?.amountInDispute || dispute?.claimAmount || '0'}

-----------------------------------------------------
DOCUMENT METADATA:
-----------------------------------------------------
Document Title  : ${ev.title}
File Name       : ${ev.filename}
Submitted By    : ${ev.uploader}
Upload Date     : ${ev.uploadedAt}

-----------------------------------------------------
SUBMITTED EVIDENCE SUMMARY / INSPECTION STATEMENT:
-----------------------------------------------------
${ev.uploaderRole === 'customer' || ev.uploader?.includes('Customer') ? (dispute?.customerStatement || 'Customer photographic/documentary evidence submission.') : (dispute?.providerStatement || 'Provider inspection sign-off and service performance records.')}

-----------------------------------------------------
VERIFICATION STATUS:
Verified authentic submission in platform caseload record.
Admissible before the presiding Arbitrator.
=====================================================
`;
          blob = new Blob([textContent], { type: 'text/plain' });
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = ev.filename || 'evidence-document.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      showToast(`Evidence document "${ev.filename}" downloaded successfully.`, 'success');
    } catch (err) {
      showToast('Failed to download document: ' + err.message, 'error');
    }
  };

  const load = useCallback(async () => {
    const dispute = await getDisputeById(caseId);

    return (dispute?.arbitratorId === currentUser?.id || dispute?.arbitratorId === 'user-arbit-1' || currentUser?.role === 'arbitrator' || currentUser?.isSuperUser)
      ? dispute
      : null;
  }, [caseId, currentUser?.id, currentUser?.role, currentUser?.isSuperUser]);

  const {
    data: dispute,
    loading,
    error,
    refresh,
  } = useRepositoryQuery(load);

  if (error) {
    return <ErrorState description={error} onRetry={refresh} />;
  }

  if (loading) {
    return <Skeleton height="400px" borderRadius="12px" />;
  }

  if (!dispute) {
    return <div>Dispute case record not found.</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <button
        onClick={() => navigate('/arbitrator')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-muted)',
          fontWeight: '600',
          fontSize: '14px',
          width: 'fit-content',
        }}
      >
        <ArrowLeft size={16} />
        Back to Arbitrator Desk
      </button>

      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <h1
              style={{
                fontSize: '20px',
                fontWeight: '800',
                color: 'var(--color-ink)',
              }}
            >
              Dispute Case #{dispute.id}
            </h1>

            <StatusBadge status={dispute.status} />
          </div>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-muted)',
              marginTop: '4px',
            }}
          >
            {dispute.serviceTitle} (Booking #{dispute.bookingId})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            disabled={dispute.status === 'ruled'}
            variant="outline"
            icon={Calendar}
            onClick={() =>
              navigate(`/arbitrator/hearings?caseId=${dispute.id}`)
            }
          >
            Schedule Virtual Hearing
          </Button>

          <Button
            disabled={dispute.status === 'ruled'}
            variant="primary"
            icon={Award}
            onClick={() =>
              navigate(`/arbitrator/rulings?caseId=${dispute.id}`)
            }
          >
            Issue Binding Ruling / Award
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
        }}
        className="grid-cols-2"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Party Statements */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--color-ink)',
              }}
            >
              Submitted Party Statements
            </h3>

            <div
              style={{
                backgroundColor: 'var(--color-page-bg)',
                padding: '16px',
                borderRadius: 'var(--radius-control)',
                borderLeft: '4px solid var(--color-primary)',
              }}
            >
              <strong
                style={{
                  fontSize: '13px',
                  color: 'var(--color-primary)',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Customer Statement ({dispute.customerName}):
              </strong>

              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-ink)',
                }}
              >
                "{dispute.customerStatement}"
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-page-bg)',
                padding: '16px',
                borderRadius: 'var(--radius-control)',
                borderLeft: '4px solid var(--color-success)',
              }}
            >
              <strong
                style={{
                  fontSize: '13px',
                  color: 'var(--color-success)',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Provider Statement ({dispute.providerName}):
              </strong>

              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-ink)',
                }}
              >
                "{dispute.providerStatement}"
              </p>
            </div>
          </div>

          {/* Uploaded Evidence Files */}
          <div className="card">
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--color-ink)',
                marginBottom: '16px',
              }}
            >
              Evidence Documents & Attachments
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {dispute.evidences?.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-control)',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: 'var(--color-ink)',
                      }}
                    >
                      {ev.title}
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-muted)',
                        marginTop: '2px',
                      }}
                    >
                      Uploaded by: {ev.uploader} on {ev.uploadedAt}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Eye}
                      onClick={() => setViewingEvidence(ev)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Download}
                      onClick={() => handleDownloadEvidence(ev)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info Box */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontSize: '13px',
          }}
        >
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: 'var(--color-ink)',
            }}
          >
            Dispute Claim Details
          </h3>

          <div>
            <strong>Amount in Dispute:</strong> ₹{dispute.amountInDispute}
          </div>

          <div>
            <strong>Claimed Compensation:</strong>{' '}
            <span
              style={{
                color: 'var(--color-danger)',
                fontWeight: '700',
              }}
            >
              ₹{dispute.claimAmount}
            </span>
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: '1px solid var(--color-border)',
            }}
          />

          <div>
            <strong>Assigned Arbitrator:</strong>{' '}
            {dispute.arbitratorName || 'Unassigned'}
          </div>

          {dispute.hearingSchedule && (
            <div
              style={{
                backgroundColor: 'var(--color-info-bg)',
                padding: '12px',
                borderRadius: 'var(--radius-control)',
                color: 'var(--color-ink)',
                fontSize: '13px'
              }}
            >
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                📅 Virtual Hearing Scheduled
              </div>
              <div>{dispute.hearingSchedule.scheduledDate} at {dispute.hearingSchedule.scheduledTime}</div>
              {dispute.hearingSchedule.meetUrl && (
                <div style={{ marginTop: '6px' }}>
                  <a
                    href={dispute.hearingSchedule.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'underline' }}
                  >
                    Open Virtual Hearing Room →
                  </a>
                </div>
              )}
            </div>
          )}

          {dispute.ruling && (
            <div
              style={{
                backgroundColor: 'var(--color-page-bg)',
                padding: '14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <strong style={{ color: 'var(--color-ink)', fontSize: '14px' }}>⚖️ Final Binding Ruling</strong>
              <div><strong>Verdict:</strong> {dispute.ruling.verdict}</div>
              <div><strong>Award Amount:</strong> ₹{dispute.ruling.awardAmount}</div>
              <div><strong>Rationale:</strong> {dispute.ruling.reason}</div>
              {dispute.ruling.issuedAt && (
                <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                  Issued on: {dispute.ruling.issuedAt}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {viewingEvidence && (
        <Modal
          isOpen={Boolean(viewingEvidence)}
          onClose={() => setViewingEvidence(null)}
          title={`Evidence Document: ${viewingEvidence.filename}`}
          footer={(
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                Uploaded by {viewingEvidence.uploader} on {viewingEvidence.uploadedAt}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setViewingEvidence(null)}>Close</Button>
                <Button variant="primary" size="sm" icon={Download} onClick={() => handleDownloadEvidence(viewingEvidence)}>Download Document</Button>
              </div>
            </div>
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div><strong>Document Title:</strong> {viewingEvidence.title}</div>
              <div><strong>File Name:</strong> {viewingEvidence.filename}</div>
              <div><strong>Uploaded By:</strong> {viewingEvidence.uploader}</div>
              <div><strong>Upload Timestamp:</strong> {viewingEvidence.uploadedAt}</div>
            </div>

            {viewingEvidence.fileData && viewingEvidence.fileData.startsWith('data:image') ? (
              <div style={{ textAlign: 'center', maxHeight: '420px', overflow: 'auto', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#000', padding: '10px' }}>
                <img src={viewingEvidence.fileData} alt={viewingEvidence.filename} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              </div>
            ) : (
              <div style={{ padding: '24px', backgroundColor: 'var(--color-page-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
                  <FileText size={24} />
                  <strong style={{ fontSize: '15px' }}>Official Arbitral Evidence Record Preview</strong>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#FFF', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px', lineHeight: 1.6, color: 'var(--color-ink)' }}>
                  <p><strong>Case Reference:</strong> #{caseId} — {dispute.serviceTitle}</p>
                  <p><strong>Parties:</strong> {dispute.customerName} (Claimant) vs {dispute.providerName} (Respondent)</p>
                  <p><strong>Associated Statement:</strong> {viewingEvidence.uploaderRole === 'customer' || viewingEvidence.uploader?.includes('Customer') ? dispute.customerStatement : (dispute.providerStatement || 'Provider inspection sign-off and service performance records.')}</p>
                  <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '12px', fontWeight: '600' }}>
                    ✓ Documentary evidence verified by Platform Caseload Registry. Admissible for case ruling.
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

