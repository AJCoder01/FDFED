import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Eye, Archive, CheckCircle2 } from 'lucide-react';
import { getServices, saveService } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Modal } from '../../design-system/primitives/Modal';

export function ListingManagerPage() {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    categoryId: 'cat-5',
    categoryName: 'AC Maintenance',
    price: 899,
    duration: '60 mins',
    description: '',
    inclusions: 'Foam jet wash, drain flushing',
    exclusions: 'Gas refilling',
    policy: 'Free cancellation up to 2 hours before slot.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
  });

  const loadData = async () => {
    setLoading(true);
    const list = await getServices();
    setServices(list.filter(s => s.providerId === currentUser.id));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleOpenCreate = () => {
    setFormData({
      id: '',
      title: '',
      categoryId: 'cat-5',
      categoryName: 'AC Maintenance',
      price: 899,
      duration: '60 mins',
      description: '',
      inclusions: 'Foam jet wash, drain flushing',
      exclusions: 'Gas refilling',
      policy: 'Free cancellation up to 2 hours before slot.',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast('Please fill title and description.', 'warning');
      return;
    }

    await saveService({
      ...formData,
      providerId: currentUser.id,
      providerName: currentUser.businessName || currentUser.name,
      price: Number(formData.price),
      inclusions: typeof formData.inclusions === 'string' ? formData.inclusions.split(',') : formData.inclusions,
      exclusions: typeof formData.exclusions === 'string' ? formData.exclusions.split(',') : formData.exclusions,
      availableSlots: ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM']
    });

    setModalOpen(false);
    await loadData();
    showToast('Service listing saved and published!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Service Listing Management</h1>
          <p className="page-subtitle">Publish, edit, or pause your bookable marketplace services</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Create New Listing
        </Button>
      </div>

      <div className="grid-cols-3">
        {services.map((srv) => (
          <div key={srv.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <img src={srv.image} alt={srv.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)' }}>{srv.categoryName}</span>
                  <StatusBadge status={srv.status} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '4px' }}>{srv.title}</h3>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '8px' }}>₹{srv.price}</div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <Button variant="outline" size="sm" style={{ flex: 1 }} onClick={() => navigate(`/services/${srv.id}`)}>
                  Preview
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create / Edit Service Listing"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save & Publish</Button>
          </>
        )}
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="Service Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-2">
            <TextField
              label="Fixed Price (INR ₹)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <TextField
              label="Estimated Duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            />
          </div>

          <TextField
            label="Detailed Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            required
          />

          <TextField
            label="Inclusions (Comma separated)"
            value={formData.inclusions}
            onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
          />

          <TextField
            label="Exclusions (Comma separated)"
            value={formData.exclusions}
            onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
