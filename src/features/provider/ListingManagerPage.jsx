import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  selectServices,
  selectCategories,
  selectMarketplaceLoading,
  selectMarketplaceError,
  fetchServicesThunk,
  fetchCategoriesThunk,
  saveServiceThunk,
  deleteServiceThunk,
} from '../../store/slices/marketplaceSlice';
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
import { money, validateSlots } from './providerUtils';

const emptyForm = {
  id: '', title: '', categoryId: '', price: '', duration: '', description: '',
  availableSlots: [], image: ''
};

export function ListingManagerPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const services = useSelector(selectServices);
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectMarketplaceLoading);
  const error = useSelector(selectMarketplaceError);
  const { showToast } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(pathname.endsWith('/new'));
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(false);
  const [formError, setFormError] = useState('');
  const approved = currentUser?.verificationStatus === 'approved';

  const refresh = useCallback(() => {
    if (currentUser?.id) {
      dispatch(fetchServicesThunk({ role: 'provider', userId: currentUser.id }));
      dispatch(fetchCategoriesThunk());
    }
  }, [currentUser?.id, dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
    const category = (categories || []).find(cat => cat.id === form.categoryId);
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
      await dispatch(saveServiceThunk({
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
      })).unwrap();
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
      await dispatch(saveServiceThunk({ id: service.id, status })).unwrap();
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
      await dispatch(deleteServiceThunk(service.id)).unwrap();
      showToast('Service removed from listing.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && services.length === 0) return <Skeleton height="300px" borderRadius="12px" />;

  const categoryOptions = (categories || []).map(cat => ({ value: cat.id, label: cat.name }));
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

      {services.length === 0 && <div className="card">No service listings yet.</div>}
      <div className="grid-cols-3">
        {services.map(service => (
          <div key={service.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: '140px', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={service.image || DEFAULT_SERVICE_IMAGE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={event => { event.currentTarget.src = DEFAULT_SERVICE_IMAGE; }} />
            </div>
            <div className="provider-stack" style={{ padding: '16px' }}>
              <div className="provider-row provider-between"><strong>{service.title}</strong><StatusBadge status={service.status} /></div>
              <p className="provider-hint">{service.description}</p>
              <div className="provider-row provider-between"><span>Price: {money(service.price)}</span><span>{service.duration}</span></div>
              <div className="provider-row" style={{ flexWrap: 'wrap', gap: '6px' }}>
                <Button size="sm" variant="secondary" onClick={() => edit(service)}>Edit</Button>
                {service.status === 'published' ? <Button size="sm" variant="outline" onClick={() => changeStatus(service, 'draft')}>Unpublish</Button> : <Button size="sm" variant="outline" onClick={() => changeStatus(service, 'published')}>Publish</Button>}
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDeleteService(service)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={open} onClose={close} title={form.id ? 'Edit Listing' : 'Create Listing'}
        footer={<><Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" form="service-form" disabled={busy}>{busy ? 'Saving…' : form.id ? 'Save Changes' : draft ? 'Save Draft' : 'Save & Publish'}</Button></>}>
        <form id="service-form" className="provider-stack" onSubmit={save}>
          <TextField name="title" label="Service Title" value={form.title} onChange={change} required />
          <Select name="categoryId" label="Service Category" value={form.categoryId} onChange={change} options={categoryOptions} required />
          <div className="provider-row">
            <TextField name="price" label="Fixed Price (INR)" type="number" min="1" value={form.price} onChange={change} required />
            <TextField name="duration" label="Duration (Minutes)" type="number" min="1" max="1440" value={form.duration} onChange={change} required />
          </div>
          <TextField name="description" label="Detailed Description" value={form.description} onChange={change} multiline required />
          <TextField name="policy" label="Cancellation Policy" value={form.policy || ''} onChange={change} />

          {/* Image Upload Control */}
          <div className="provider-stack" style={{ border: '1px dashed var(--color-border)', padding: '12px', borderRadius: 'var(--radius-control)' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={14} /> Service Cover Image
            </label>
            <div className="provider-row" style={{ alignItems: 'center', gap: '12px' }}>
              {form.image && (
                <img
                  src={form.image}
                  alt="Service preview"
                  style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                />
              )}
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleImageFile}
                  style={{ display: 'none' }}
                />
                <span className="btn btn-sm btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={14} /> Upload Custom Photo
                </span>
              </label>
            </div>
            <p className="provider-hint" style={{ margin: 0, fontSize: '11px' }}>
              Supports PNG, JPG, or WebP. Leave blank to use category default illustration.
            </p>
          </div>

          <SlotEditor slots={form.availableSlots} durationMinutes={Number(form.duration) || 60} onChange={availableSlots => setForm(value => ({ ...value, availableSlots }))} />
          {!form.id && <label className="provider-row"><input type="checkbox" checked={draft} onChange={event => setDraft(event.target.checked)} /> Save as draft (do not publish immediately)</label>}
          {formError && <p role="alert" className="provider-error">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
}
