import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, ArrowRight, Lock, UserPlus, LogIn } from 'lucide-react';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { useApp } from '../../app/context/AppContext';
import { getTodayDateInputValue } from '../../utils/date';

export function PostAJobPage() {
  const navigate = useNavigate();
  const { showToast, currentUser, currentRole } = useApp();
  const isCustomer = currentUser && currentRole === 'customer';

  const [formData, setFormData] = useState({
    category: 'Home Cleaning',
    title: '',
    location: currentUser?.addresses?.[0]?.city || '',
    description: '',
    preferredDate: getTodayDateInputValue(),
    budget: '',
    contactName: currentUser?.name || '',
    contactPhone: currentUser?.phone || ''
  });

  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isCustomer) {
      setAuthModalOpen(true);
      showToast('You must be logged in as a customer to post a custom job.', 'warning');
      return;
    }

    if (!formData.title || !formData.description) {
      showToast('Please fill in the job title and detailed description.', 'warning');
      return;
    }

    const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedRequest({
      id: reqId,
      ...formData,
      customerId: currentUser.id,
      createdAt: new Date().toLocaleDateString('en-GB')
    });
    showToast('Custom job request submitted successfully!', 'success');
  };

  if (submittedRequest) {
    return (
      <div className="app-container" style={{ padding: '64px 16px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
            <CheckCircle2 size={36} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>Custom Job Request Submitted</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Your request ID is <strong style={{ color: 'var(--color-primary)' }}>#{submittedRequest.id}</strong>.
          </p>

          <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-control)', width: '100%', textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><strong>Category:</strong> {submittedRequest.category}</div>
            <div><strong>Job Title:</strong> {submittedRequest.title}</div>
            <div><strong>Location:</strong> {submittedRequest.location}</div>
            <div><strong>Target Budget:</strong> ₹{submittedRequest.budget}</div>
            <div><strong>Preferred Date:</strong> {submittedRequest.preferredDate}</div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Local providers matching your criteria will review your request and contact you shortly.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setSubmittedRequest(null)}>
              Post Another Job
            </Button>
            <Button variant="primary" onClick={() => navigate('/services')}>
              Browse Catalog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ padding: '32px 16px', maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Post a Custom Job Request</h1>
        <p className="page-subtitle">Get quotes from verified professionals for custom home service needs</p>
      </div>

      {!isCustomer && (
        <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--color-warning)', padding: '16px', borderRadius: 'var(--radius-control)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={20} color="var(--color-warning)" />
            <span style={{ fontSize: '13px', color: 'var(--color-ink)', fontWeight: 600 }}>
              Customer Account Required: You must be signed in as a Customer to submit a custom job.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login?role=customer">
              <Button variant="outline" size="sm">Log In</Button>
            </Link>
            <Link to="/signup?role=customer">
              <Button variant="primary" size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Select
          label="Service Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          options={[
            { value: 'Home Cleaning', label: 'Home Cleaning' },
            { value: 'Plumbing', label: 'Plumbing' },
            { value: 'Electrical Repair', label: 'Electrical Repair' },
            { value: 'Appliance Repair', label: 'Appliance Repair' },
            { value: 'AC Maintenance', label: 'AC Maintenance' },
            { value: 'Others', label: 'Others' }
          ]}
        />

        <TextField
          label="Job Requirement Title"
          name="title"
          placeholder="e.g. Master bedroom wall socket replacement & fan wiring"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <TextField
          label="Detailed Description"
          name="description"
          placeholder="Describe the problem, materials needed, access requirements..."
          value={formData.description}
          onChange={handleChange}
          multiline
          rows={4}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-2">
          <TextField
            label="Service Location (City / Area)"
            name="location"
            placeholder="e.g. Bengaluru, HSR Layout"
            value={formData.location}
            onChange={handleChange}
            required
          />
          <TextField
            label="Estimated Budget (INR ₹)"
            name="budget"
            type="number"
            placeholder="e.g. 2000"
            value={formData.budget}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-2">
          <TextField
            label="Preferred Service Date"
            name="preferredDate"
            type="date"
            min={getTodayDateInputValue()}
            value={formData.preferredDate}
            onChange={handleChange}
            required
          />
          <TextField
            label="Contact Phone Number"
            name="contactPhone"
            placeholder="+91 98765 43210"
            value={formData.contactPhone}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth style={{ marginTop: '8px' }}>
          Submit Job Request
        </Button>
      </form>

      {/* Customer Login Required Modal */}
      <Modal
        title="Customer Sign In Required"
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-ink-secondary)', lineHeight: 1.5, margin: 0 }}>
            To ensure secure order dispatch and direct communication with verified service professionals, you must be signed in as a <strong>Customer</strong> to post a custom job request.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setAuthModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => navigate('/signup?role=customer')}>
              <UserPlus size={16} style={{ marginRight: '6px' }} /> Sign Up as Customer
            </Button>
            <Button variant="primary" onClick={() => navigate('/login?role=customer')}>
              <LogIn size={16} style={{ marginRight: '6px' }} /> Log In
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
