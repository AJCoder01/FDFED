import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { getCategories, getServices, saveService, deleteService } from '../../data/mockRepository';
import { DEFAULT_SERVICE_IMAGE } from '../../data/mockData';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Modal } from '../../design-system/primitives/Modal';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { SlotEditor } from './SlotEditor';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { money, validateSlots } from './providerUtils';

const emptyForm = {
  id: '', title: '', categoryId: '', price: '', duration: '', description: '',
  availableSlots: [], image: ''
};

export function ListingManagerPage() {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(pathname.endsWith('/new'));
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(false);
  const [formError, setFormError] = useState('');
  const approved = currentUser.verificationStatus === 'approved';
  const load = useCallback(async () => {
    const [services, categories] = await Promise.all([getServices({ role: 'provider', userId: currentUser.id }), getCategories()]);
    return { services, categories };
  }, [currentUser.id]);
  const { data, loading, error, refresh } = useRepositoryQuery(load);

  useEffect(() => {
    if (pathname.endsWith('/new')) {
      setForm(emptyForm);
      setDraft(false);
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
    setForm({
      ...service,
      duration: Number.parseInt(service.duration, 10),
      image: service.image || ''
    });
    setFormError('');
    setOpen(true);
  };
  const change = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));

  const handleImageFile = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      setForm(prev => ({ ...prev, image: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const save = async event => {
    event.preventDefault();
    if (busy) return;
    const category = data.categories.find(category => category.id === form.categoryId);
    const price = Number(form.price);
    const duration = Number(form.duration);
    const slotError = validateSlots(form.availableSlots, duration);
    if (!form.title.trim() || !form.description.trim() || !category) {
      setFormError('Enter a title, category, and description.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(duration) || duration <= 0 || duration > 1440) {
      setFormError('Enter a positive price and a duration between 1 and 1440 minutes.');
      return;
    }
    if (slotError) { setFormError(slotError); return; }
    if (!approved) { setFormError('An approved provider profile is required to manage listings.'); return; }
    setBusy(true);
    setFormError('');
    try {
      const finalImage = form.image?.trim() || DEFAULT_SERVICE_IMAGE;
      await saveService({
        ...(form.id ? { id: form.id } : {}),
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        duration: `${duration} mins`,
        categoryId: category.id,
        categoryName: category.name,
        policy: form.policy?.trim() || 'Standard 24-hour cancellation policy applies.',
        image: finalImage,
        inclusions: [],
        exclusions: [],
        providerId: currentUser.id,
        providerName: currentUser.businessName || currentUser.name,
        availableSlots: form.availableSlots,
        ...(!form.id ? { status: draft ? 'draft' : 'published' } : {})
      }, { role: 'provider', userId: currentUser.id });
      setOpen(false);
      if (pathname.endsWith('/new')) navigate('/provider/services', { replace: true });
      showToast(form.id ? 'Listing changes saved.' : draft ? 'Listing draft saved.' : 'Listing published.');
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
      await saveService({ id: service.id, status }, { role: 'provider', userId: currentUser.id });
      showToast(`Listing status saved as ${status}.`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteService = async (service) => {
    if (!window.confirm(`Are you sure you want to remove "${service.title}" from your listings?`)) return;
    if (busy || !approved) return;
    setBusy(true);
    try {
      await deleteService(service.id, { role: 'provider', userId: currentUser.id });
      showToast('Service removed from listing.');
      refresh();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="300px" borderRadius="12px" />;

  const categoryOptions = (data.categories || []).map(cat => ({ value: cat.id, label: cat.name }));
  if (!categoryOptions.some(opt => opt.label.toLowerCase() === 'others' || opt.label.toLowerCase() === 'other')) {
    categoryOptions.push({ value: 'cat-6', label: 'Other' });
  }

  return (
    <div className="provider-page">
      <div className="page-header provider-row provider-between">
        <div><h1 className="page-title">Service Listing Management</h1><p className="page-subtitle">Publish and manage your marketplace services</p></div>
        <Button icon={Plus} disabled={busy || !approved} onClick={() => navigate('/provider/services/new')}>Create New Listing</Button>
      </div>
      {!approved && <p className="provider-hint">An approved provider profile is required to manage listings.</p>}

      {data.services.length === 0 && <div className="card">No service listings yet.</div>}
      <div className="grid-cols-3">
        {data.services.map(service => (
          <div key={service.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={service.image || DEFAULT_SERVICE_IMAGE} alt={service.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            <div className="provider-stack" style={{ padding: '16px' }}>
              <div className="provider-row provider-between"><span className="provider-hint">{service.categoryName}</span><StatusBadge status={service.status} /></div>
              <h3>{service.title}</h3><strong>{money(service.price)} · {service.duration}</strong>
              <div className="provider-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => navigate(`/services/${service.id}`)}>Preview</Button>
                <Button variant="secondary" size="sm" disabled={busy || !approved} onClick={() => edit(service)}>Edit</Button>
                <Button variant="secondary" size="sm" disabled={busy || !approved} onClick={() => changeStatus(service, service.status === 'published' ? 'paused' : 'published')}>{service.status === 'published' ? 'Pause' : 'Publish'}</Button>
                <Button variant="danger" size="sm" disabled={busy || !approved} icon={Trash2} onClick={() => handleDeleteService(service)}>Delete</Button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                {form.id && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={busy || !approved}
                    onClick={() => {
                      const s = data.services.find(item => item.id === form.id);
                      if (s) {
                        close();
                        handleDeleteService(s);
                      }
                    }}
                  >
                    Delete Listing
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button>
                <Button type="submit" disabled={busy || !approved}>
                  {busy ? 'Saving…' : form.id ? 'Save Changes' : draft ? 'Save Draft' : 'Save & Publish'}
                </Button>
              </div>
            </div>
          )}
        >
          <div className="provider-stack">
            {!form.id && <label className="provider-row"><input type="checkbox" checked={draft} onChange={event => setDraft(event.target.checked)} disabled={busy} />Save as a draft</label>}
            <TextField name="title" label="Service Title" value={form.title} onChange={change} disabled={busy} required />
            <Select name="categoryId" label="Service Category" value={form.categoryId} onChange={change} disabled={busy} required options={categoryOptions} />
            <div className="grid-cols-2">
              <TextField name="price" label="Fixed Price (INR)" type="number" min="1" value={form.price} onChange={change} disabled={busy} required />
              <TextField name="duration" label="Duration (Minutes)" type="number" min="1" placeholder="e.g. 60" value={form.duration} onChange={change} disabled={busy} required />
            </div>
            <TextField name="description" label="Detailed Description" value={form.description} onChange={change} disabled={busy} multiline required />

            {/* Service Image Upload & Default Avatar fallback */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>Service Image</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '100px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-page-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {form.image ? (
                    <img src={form.image} alt="Service Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageIcon size={28} color="var(--color-muted)" />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    type="file"
                    id="serviceImageInput"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageFile}
                    disabled={busy}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Upload}
                    onClick={() => document.getElementById('serviceImageInput').click()}
                    disabled={busy}
                  >
                    Upload Service Image
                  </Button>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                    If no image is uploaded, a default service placeholder avatar will be used.
                  </span>
                </div>
              </div>
            </div>

            <SlotEditor slots={form.availableSlots} onChange={slots => setForm(value => ({ ...value, availableSlots: slots }))} disabled={busy} />
            {formError && <p role="alert" className="provider-error">{formError}</p>}
          </div>
        </Modal>
      </form>
    </div>
  );
}
