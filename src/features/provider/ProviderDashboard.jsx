import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, Star, Shield, Plus, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getBookings, getServices } from '../../data/mockRepository';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';

export function ProviderDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (currentUser) {
        const jobList = await getBookings('provider', currentUser.id);
        const srvList = await getServices();
        setJobs(jobList);
        setServices(srvList.filter(s => s.providerId === currentUser.id));
      }
      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  const pendingJobs = jobs.filter(j => j.status === 'active' || j.status === 'in_progress');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Verification Status Banner */}
      <div className="card" style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid #A5D6A7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-success)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>Verification Status: APPROVED</div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Your identity, skills, and business documents are fully verified.</div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/provider/profile')}>
          View Profile & Skills
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>PENDING JOBS</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>{pendingJobs.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>COMPLETED</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>{completedJobs.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>TOTAL EARNINGS</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>₹{totalEarnings}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>RATING</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>4.8 ★</div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Jobs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Recent Job Inbox</h2>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/provider/services/new')}>
            Create New Listing
          </Button>
        </div>

        {loading ? (
          <Skeleton height="140px" borderRadius="12px" />
        ) : jobs.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No jobs assigned yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {jobs.slice(0, 3).map((job) => (
              <div key={job.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>#{job.id}</strong>
                    <StatusBadge status={job.status} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>{job.serviceTitle}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                    Customer: {job.customerName} ({job.customerPhone}) | Scheduled: {job.scheduledDate} ({job.scheduledSlot})
                  </div>
                </div>

                <Button variant="secondary" size="sm" onClick={() => navigate(`/provider/jobs/${job.id}`)}>
                  Open Job Workspace
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
