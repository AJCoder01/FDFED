import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectBookings,
  selectBookingsLoading,
  selectBookingsError,
  fetchBookingsThunk,
} from '../../store/slices/bookingsSlice';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { formatDate, isPaid, money, netPayout, platformFee } from './providerUtils';

export function EarningsPage() {
  const dispatch = useDispatch();
  const jobs = useSelector(selectBookings);
  const loading = useSelector(selectBookingsLoading);
  const error = useSelector(selectBookingsError);

  const refresh = useCallback(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && jobs.length === 0) return <Skeleton height="300px" borderRadius="12px" />;

  const paidJobs = jobs.filter(isPaid);
  const totalGross = paidJobs.reduce((sum, j) => sum + Number(j.amount || 0), 0);
  const totalFees = paidJobs.reduce((sum, j) => sum + platformFee(j), 0);
  const totalNet = paidJobs.reduce((sum, j) => sum + netPayout(j), 0);

  return (
    <div className="provider-page">
      <div className="page-header">
        <h1 className="page-title">Earnings & Settlement Breakdown</h1>
        <p className="page-subtitle">Track simulated settlements, platform commission deductions, and net payouts</p>
      </div>

      <div className="grid-cols-3">
        <div className="card provider-stack">
          <span className="provider-hint">GROSS COLLECTED</span>
          <strong style={{ fontSize: '24px', color: 'var(--color-ink)' }}>{money(totalGross)}</strong>
        </div>
        <div className="card provider-stack">
          <span className="provider-hint">PLATFORM COMMISSION (5%)</span>
          <strong style={{ fontSize: '24px', color: 'var(--color-danger)' }}>{money(totalFees)}</strong>
        </div>
        <div className="card provider-stack">
          <span className="provider-hint">NET PROVIDER PAYOUT</span>
          <strong style={{ fontSize: '24px', color: 'var(--color-success)' }}>{money(totalNet)}</strong>
        </div>
      </div>

      <div className="card provider-stack">
        <h2>Settlement Records</h2>
        {paidJobs.length === 0 ? (
          <p className="provider-hint">No settlements recorded yet. Completed jobs will show here.</p>
        ) : (
          <table className="provider-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Booking</th>
                <th style={{ padding: '8px' }}>Service</th>
                <th style={{ padding: '8px' }}>Date</th>
                <th style={{ padding: '8px' }}>Payment Method</th>
                <th style={{ padding: '8px' }}>Gross</th>
                <th style={{ padding: '8px' }}>Fee (5%)</th>
                <th style={{ padding: '8px' }}>Net</th>
              </tr>
            </thead>
            <tbody>
              {paidJobs.map(job => (
                <tr key={job.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px' }}>#{job.id}</td>
                  <td style={{ padding: '8px' }}>{job.serviceTitle}</td>
                  <td style={{ padding: '8px' }}>{formatDate(job.scheduledDate)}</td>
                  <td style={{ padding: '8px' }}>{job.paymentMethod}</td>
                  <td style={{ padding: '8px' }}>{money(job.amount)}</td>
                  <td style={{ padding: '8px', color: 'var(--color-danger)' }}>{money(platformFee(job))}</td>
                  <td style={{ padding: '8px', fontWeight: '700', color: 'var(--color-success)' }}>{money(netPayout(job))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
