import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Calendar, Award, Scale } from 'lucide-react';
import { getDisputeById } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';

export function DisputeCaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getDisputeById(caseId);
      setDispute(data);
      setLoading(false);
    }
    loadData();
  }, [caseId]);

  const handleDownloadEvidence = (filename) => {
    showToast(`Simulated download for evidence document: ${filename}`, 'info');
  };

  if (loading) return <Skeleton height="400px" borderRadius="12px" />;
  if (!dispute) return <div>Dispute case record not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <button onClick={() => navigate('/arbitrator')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontWeight: '600', fontSize: '14px', width: 'fit-content' }}>
        <ArrowLeft size={16} /> Back to Arbitrator Desk
      </button>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-ink)' }}>Dispute Case #{dispute.id}</h1>
            <StatusBadge status={dispute.status} />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>{dispute.serviceTitle} (Booking #{dispute.bookingId})</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" icon={Calendar} onClick={() => navigate(`/arbitrator/hearings?caseId=${dispute.id}`)}>
            Schedule Virtual Hearing
          </Button>
          <Button variant="primary" icon={Award} onClick={() => navigate(`/arbitrator/rulings?caseId=${dispute.id}`)}>
            Issue Binding Ruling / Award
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }} className="grid-cols-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Party Statements */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Submitted Party Statements</h3>
            
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-control)', borderLeft: '4px solid var(--color-primary)' }}>
              <strong style={{ fontSize: '13px', color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                Customer Statement ({dispute.customerName}):
              </strong>
              <p style={{ fontSize: '13px', color: 'var(--color-ink)' }}>"{dispute.customerStatement}"</p>
            </div>

            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-control)', borderLeft: '4px solid var(--color-success)' }}>
              <strong style={{ fontSize: '13px', color: 'var(--color-success)', display: 'block', marginBottom: '4px' }}>
                Provider Statement ({dispute.providerName}):
              </strong>
              <p style={{ fontSize: '13px', color: 'var(--color-ink)' }}>"{dispute.providerStatement}"</p>
            </div>
          </div>

          {/* Uploaded Evidence Files */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '16px' }}>Evidence Documents & Attachments</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dispute.evidences?.map((ev) => (
                <div key={ev.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>{ev.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>Uploaded by: {ev.uploader} on {ev.uploadedAt}</div>
                  </div>
                  <Button variant="secondary" size="sm" icon={Download} onClick={() => handleDownloadEvidence(ev.filename)}>
                    View Document
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info Box */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Dispute Claim Details</h3>
          <div><strong>Amount in Dispute:</strong> ₹{dispute.amountInDispute}</div>
          <div><strong>Claimed Compensation:</strong> <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>₹{dispute.claimAmount}</span></div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
          <div><strong>Assigned Arbitrator:</strong> {dispute.arbitratorName || 'Unassigned'}</div>
          {dispute.hearingSchedule && (
            <div style={{ backgroundColor: 'var(--color-info-bg)', padding: '10px', borderRadius: 'var(--radius-control)', color: 'var(--color-info)', fontWeight: '600' }}>
              📅 Virtual Hearing: {dispute.hearingSchedule.scheduledDate} at {dispute.hearingSchedule.scheduledTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
