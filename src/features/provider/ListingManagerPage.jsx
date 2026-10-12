import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getCategories, getServiceById, getServices, saveService } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Modal } from '../../design-system/primitives/Modal';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { SlotEditor } from './SlotEditor';
import { useProviderQuery } from './useProviderQuery';
import { money, validateSlots } from './providerUtils';

const emptyForm = {
  id: '', title: '', categoryId: '', price: '', duration: 60, description: '',
  inclusions: '', exclusions: '', policy: '', availableSlots: [],
  image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
};

export function ListingManagerPage() {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(pathname.endsWith('/new'));
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const approved = currentUser.verificationStatus === 'approved';
  const load = useCallback(async () => {
    const [services, categories] = await Promise.all([getServices(), getCategories()]);
    return { services: services.filter(service => service.providerId === currentUser.id), categories };
  }, [currentUser.id]);
  const { data, loading, error, refresh } = useProviderQuery(load);

  useEffect(() => {
    if (pathname.endsWith('/new')) {
      setForm(emptyForm);
      setFormError('');
      setOpen(true);
    }
  }, [pathname]);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setFormError('');
    if (pathname.endsWith('/new')) navigate('/provider/services', { replace: true });
  };
  const edit = service => {
    setForm({ ...service, duration: Number.parseInt(service.duration, 10), inclusions: service.inclusions.join(', '), exclusions: service.exclusions.join(', ') });
    setFormError('');
    setOpen(true);
  };
  const change = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));

  const save = async event => {
    event.preventDefault();
    if (busy) return;
    const category = data.categories.find(category => category.id === form.categoryId);
    const price = Number(form.price);
    const duration = Number(form.duration);
    const slotError = validateSlots(form.availableSlots, duration);
    if (!form.title.trim() || !form.description.trim() || !form.policy.trim() || !category) {
      setFormError('Enter a title, category, description, and cancellation policy.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(duration) || duration <= 0 || duration > 1440) {
      setFormError('Enter a positive price and a duration between 1 and 1440 minutes.');
      return;
    }
    if (slotError) { setFormError(slotError); return; }
    if (!/^https?:\/\//i.test(form.image.trim()) || event.currentTarget.elements.namedItem('image').validity.typeMismatch) {
      setFormError('Enter a valid HTTP or HTTPS image URL.');
      return;
    }
    if (!approved) { setFormError('An approved provider profile is required to manage listings.'); return; }
    setBusy(true);
    setFormError('');
    try {
      if (form.id) {
        const existing = await getServiceById(form.id);
        if (!existing || existing.providerId !== currentUser.id) throw new Error('This listing is unavailable.');
      }
      const result = await saveService({
        ...(form.id ? { id: form.id } : {}),
        title: form.title.trim(), description: form.description.trim(), price, duration: `${duration} mins`,
        categoryId: category.id, categoryName: category.name, policy: form.policy.trim(), image: form.image.trim(),
        inclusions: form.inclusions.split(',').map(item => item.trim()).filter(Boolean),
        exclusions: form.exclusions.split(',').map(item => item.trim()).filter(Boolean),
        providerId: currentUser.id, providerName: currentUser.businessName || currentUser.name,
        availableSlots: form.availableSlots
      });
      if (!result.success) throw new Error('The listing could not be saved.');
      setOpen(false);
      if (pathname.endsWith('/new')) navigate('/provider/services', { replace: true });
      refresh();
      showToast(form.id ? 'Listing changes saved.' : 'Listing published.');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (service, status) => {
    if (busy || !approved) return;
    setBusy(true);
    try {
      const existing = await getServiceById(service.id);
      if (!existing || existing.providerId !== currentUser.id) throw new Error('This listing is unavailable.');
      const result = await saveService({ id: service.id, status });
      if (!result.success) throw new Error('The listing status could not be saved.');
      refresh();
      showToast(`Listing status saved as ${status}.`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="300px" borderRadius="12px" />;

  return (
    <div className="provider-page">
      <div className="page-header provider-row provider-between">
        <div><h1 className="page-title">Service Listing Management</h1><p className="page-subtitle">Publish and manage your marketplace services</p></div>
        <Button icon={Plus} disabled={busy || !approved} onClick={() => navigate('/provider/services/new')}>Create New Listing</Button>
      </div>
      {!approved && <p className="provider-hint">An approved provider profile is required to manage listings.</p>}
      <p className="provider-hint">Paused and archived listings may still appear in customer search until marketplace visibility controls are completed.</p>
      {data.services.length === 0 && <div className="card">No service listings yet.</div>}
      <div className="grid-cols-3">
        {data.services.map(service => (
          <div key={service.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={service.image} alt={service.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            <div className="provider-stack" style={{ padding: '16px' }}>
              <div className="provider-row provider-between"><span className="provider-hint">{service.categoryName}</span><StatusBadge status={service.status} /></div>
              <h3>{service.title}</h3><strong>{money(service.price)} · {service.duration}</strong>
              <div className="provider-row">
                <Button variant="outline" size="sm" onClick={() => navigate(`/services/${service.id}`)}>Preview</Button>
                <Button variant="secondary" size="sm" disabled={busy || !approved} onClick={() => edit(service)}>Edit</Button>
                <Button variant="secondary" size="sm" disabled={busy || !approved} onClick={() => changeStatus(service, service.status === 'published' ? 'paused' : 'published')}>{service.status === 'published' ? 'Pause' : 'Publish'}</Button>
                {service.status !== 'archived' && <Button variant="danger" size="sm" disabled={busy || !approved} onClick={() => changeStatus(service, 'archived')}>Archive</Button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={save} noValidate>
        <Modal
          isOpen={open}
          onClose={close}
          title={form.id ? 'Edit Service Listing' : 'Create Service Listing'}
          footer={(
            <>
              <Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button>
              <Button type="submit" disabled={busy || !approved}>
                {busy ? 'Saving…' : form.id ? 'Save Changes' : 'Save & Publish'}
              </Button>
            </>
          )}
        >
          <div className="provider-stack">
            <TextField name="title" label="Service Title" value={form.title} onChange={change} disabled={busy} required />
            <Select name="categoryId" label="Service Category" value={form.categoryId} onChange={change} disabled={busy} required options={data.categories.map(category => ({ value: category.id, label: category.name }))} />
            <div className="grid-cols-2">
              <TextField name="price" label="Fixed Price (INR)" type="number" min="1" value={form.price} onChange={change} disabled={busy} required />
              <TextField name="duration" label="Duration (Minutes)" type="number" min="1" value={form.duration} onChange={change} disabled={busy} required />
            </div>
            <TextField name="description" label="Detailed Description" value={form.description} onChange={change} disabled={busy} multiline required />
            <TextField name="inclusions" label="Inclusions (Comma separated)" value={form.inclusions} onChange={change} disabled={busy} />
            <TextField name="exclusions" label="Exclusions (Comma separated)" value={form.exclusions} onChange={change} disabled={busy} />
            <TextField name="policy" label="Cancellation & Service Policy" value={form.policy} onChange={change} disabled={busy} required />
            <TextField name="image" label="Image URL" type="url" value={form.image} onChange={change} disabled={busy} required />
            <SlotEditor slots={form.availableSlots} onChange={slots => setForm(value => ({ ...value, availableSlots: slots }))} disabled={busy} />
            {formError && <p role="alert" className="provider-error">{formError}</p>}
          </div>
        </Modal>
      </form>
    </div>
  );
}
