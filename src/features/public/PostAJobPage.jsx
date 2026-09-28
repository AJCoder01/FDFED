import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle2, ArrowRight } from 'lucide-react';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { useApp } from '../../app/context/AppContext';

export function PostAJobPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [formData, setFormData] = useState({
    category: 'Home Cleaning',
    title: '',
    location: 'Bengaluru',
    description: '',
    preferredDate: '2026-08-25',
    budget: '2000',
    contactName: 'Aarav Sharma',
    contactPhone: '+91 98765 43210'
  });

  const [submittedRequest, setSubmittedRequest] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast('Please fill in the job title and detailed description.', 'warning');
      return;
    }

    const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedRequest({
      id: reqId,
      ...formData,
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
            value={formData.location}
            onChange={handleChange}
            required
          />
          <TextField
            label="Estimated Budget (INR ₹)"
            name="budget"
            type="number"
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
            value={formData.preferredDate}
            onChange={handleChange}
            required
          />
          <TextField
            label="Contact Phone Number"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth style={{ marginTop: '8px' }}>
          Submit Job Request
        </Button>
      </form>
    </div>
  );
}
