import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getBookings, saveCustomerAddresses } from '../../data/mockRepository';
import { collectedAmount } from '../../data/bookingRules';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';

export function CustomerDashboard() {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const load = useCallback(() => getBookings('customer', currentUser.id), [currentUser.id]);
  const { data, loading, error, refresh } = useRepositoryQuery(load);
  const bookings = data || [];
  const addresses = currentUser?.addresses || [];
  const emptyAddress = { id: '', label: 'Home', addressLine: '', city: '', pincode: '', isDefault: false };
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addressBusy, setAddressBusy] = useState(false);

  const closeAddressForm = () => {
    setAddressFormOpen(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  };
  const handleAddressSubmit = async event => {
    event.preventDefault();
    if (addressBusy) return;
    setAddressBusy(true);
    try {
      const nextAddresses = editingAddressId
        ? addresses.map(address => ({
          ...address,
          ...(address.id === editingAddressId ? { ...addressForm, id: editingAddressId } : {}),
          isDefault: address.id === editingAddressId ? addressForm.isDefault : addressForm.isDefault ? false : address.isDefault
        }))
        : [
          ...addresses.map(address => ({ ...address, isDefault: addressForm.isDefault ? false : address.isDefault })),
          { ...addressForm, id: `addr-${crypto.randomUUID().slice(0, 8)}`, isDefault: addresses.length === 0 || addressForm.isDefault }
        ];
      await saveCustomerAddresses(currentUser.id, nextAddresses);
      showToast(editingAddressId ? 'Address updated.' : 'Address saved.');
      closeAddressForm();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save this address.', 'warning');
    } finally {
      setAddressBusy(false);
    }
  };
  const handleSetDefault = async addressId => {
    try {
      await saveCustomerAddresses(currentUser.id, addresses.map(address => ({ ...address, isDefault: address.id === addressId })));
      showToast('Default address updated.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update the default address.', 'warning');
    }
  };
  const handleDeleteAddress = async addressId => {
    try {
      const removedDefault = addresses.find(address => address.id === addressId)?.isDefault;
      const remaining = addresses
        .filter(address => address.id !== addressId)
        .map((address, index) => ({ ...address, isDefault: removedDefault ? index === 0 : address.isDefault }));
      await saveCustomerAddresses(currentUser.id, remaining);
      showToast('Address removed.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to remove this address.', 'warning');
    }
  };
  const startEditingAddress = address => {
    setEditingAddressId(address.id);
    setAddressForm({ ...address });
    setAddressFormOpen(true);
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;

  const activeBookings = bookings.filter(b => ['active', 'in_progress', 'reschedule_proposed'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalSpent = bookings.reduce((sum, b) => sum + collectedAmount(b), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top KPI Cards */}
      <div className="grid-cols-3">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '600' }}>ACTIVE BOOKINGS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{activeBookings.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '600' }}>COMPLETED JOBS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{completedBookings.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '600' }}>TOTAL SPENT (INR)</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>₹{totalSpent}</div>
          </div>
        </div>
      </div>

      {/* Active Bookings Banner */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Recent Bookings</h2>
          <Link to="/customer/bookings" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)' }}>
            View All History →
          </Link>
        </div>

        {loading ? (
          <Skeleton height="160px" borderRadius="12px" />
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)' }}>
            <p>You haven't made any bookings yet.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/services')} style={{ marginTop: '12px' }}>
              Explore Services
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookings.slice(0, 3).map((bk) => (
              <div key={bk.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>#{bk.id}</strong>
                    <StatusBadge status={bk.status} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>{bk.serviceTitle}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>
                    Scheduled: <strong>{bk.scheduledDate} ({bk.scheduledSlot})</strong> | Provider: {bk.providerName}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', display: 'block' }}>Paid After Refunds</span>
                    <strong style={{ fontSize: '16px', color: 'var(--color-ink)' }}>₹{collectedAmount(bk)}</strong>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/customer/bookings/${bk.id}`)}>
                    View Timeline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Saved Addresses</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>Manage where your services should be delivered.</p>
          </div>
          {!addressFormOpen && <Button size="sm" icon={Plus} onClick={() => { setAddressForm(emptyAddress); setAddressFormOpen(true); }}>Add Address</Button>}
        </div>

        {addresses.length === 0 && !addressFormOpen && (
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>You haven’t saved an address yet.</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-2">
          {addresses.map(address => (
            <div key={address.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '16px', backgroundColor: 'var(--color-page-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{address.label}</strong>
                {address.isDefault && <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '700' }}>DEFAULT</span>}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-ink)', margin: '8px 0 12px' }}>{address.addressLine}, {address.city} - {address.pincode}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!address.isDefault && <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id)}>Set as default</Button>}
                <Button variant="secondary" size="sm" icon={Pencil} onClick={() => startEditingAddress(address)}>Edit</Button>
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDeleteAddress(address.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>

        {addressFormOpen && (
          <form onSubmit={handleAddressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>{editingAddressId ? 'Edit Address' : 'Add a New Address'}</h3>
            <Select
              label="Save as"
              value={addressForm.label}
              onChange={event => setAddressForm(form => ({ ...form, label: event.target.value }))}
              options={[
                { value: 'Home', label: 'Home' },
                { value: 'Work', label: 'Work' },
                { value: 'Other', label: 'Other' }
              ]}
              required
            />
            <TextField
              label="Flat, house no., building, street, area"
              value={addressForm.addressLine}
              onChange={event => setAddressForm(form => ({ ...form, addressLine: event.target.value }))}
              required
            />
            <div className="grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <TextField
                label="City"
                value={addressForm.city}
                onChange={event => setAddressForm(form => ({ ...form, city: event.target.value }))}
                required
              />
              <TextField
                label="PIN Code"
                value={addressForm.pincode}
                onChange={event => setAddressForm(form => ({ ...form, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="6-digit PIN code"
                required
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink)' }}>
              <input
                type="checkbox"
                checked={addressForm.isDefault || addresses.length === 0}
                disabled={addresses.length === 0}
                onChange={event => setAddressForm(form => ({ ...form, isDefault: event.target.checked }))}
              />
              Set as my default address
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="submit" disabled={addressBusy}>{addressBusy ? 'Saving…' : 'Save Address'}</Button>
              <Button variant="secondary" disabled={addressBusy} onClick={closeAddressForm}>Cancel</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
