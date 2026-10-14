import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ArrowLeft, Upload, FileText, Scale, Check } from 'lucide-react';
import { submitArbitratorApplication } from '../../data/mockRepository';
import { TextField } from '../../design-system/primitives/TextField';
import { Button } from '../../design-system/primitives/Button';
import { useApp } from '../../app/context/AppContext';

export function ArbitratorSignupWizard({ onBackToRoleSelect }) {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Personal Information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [linkedin, setLinkedin] = useState('');
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Professional Background
  const [experience, setExperience] = useState('');
  const [expertise, setExpertise] = useState('');
  const [organization, setOrganization] = useState('');
  const [prevExperience, setPrevExperience] = useState('');

  // Step 3: Documents
  const [files, setFiles] = useState({
    resume: null,
    cert: null,
    license: null,
    extra: null
  });

  // Step 4: Final Confirmation
  const [confirmed, setConfirmed] = useState(false);

  const handleFileUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles(prev => ({
      ...prev,
      [field]: { name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` }
    }));
  };

  // Step 1 Validation & Next
  const handleNextStep1 = (e) => {
    if (e) e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!/^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/.test(trimmedName)) {
      setError('Please enter a valid full name using letters only.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    const rawPhone = phone.replace(/[\s\-()+]/g, '');
    if (!phone || !/^\d{10}$/.test(rawPhone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!country.trim()) {
      setError('Country / Jurisdiction is required.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStep(2);
  };

  // Step 2 Validation & Next
  const handleNextStep2 = (e) => {
    if (e) e.preventDefault();
    setError('');

    const expNum = Number(experience);
    if (experience === '' || isNaN(expNum) || expNum < 0 || expNum > 70) {
      setError('Please enter a valid number of years of experience (0-70).');
      return;
    }

    if (!expertise.trim() || expertise.trim().length < 3) {
      setError('Area of Expertise must be at least 3 characters.');
      return;
    }

    if (!organization.trim() || organization.trim().length < 2) {
      setError('Professional Organization is required.');
      return;
    }

    setStep(3);
  };

  // Step 3 Validation & Next
  const handleNextStep3 = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!files.resume || !files.license) {
      setError('Please upload the required documents marked with * (Resume and License).');
      return;
    }

    setStep(4);
  };

  // Step 4 Submit
  const handleFinalSubmit = async () => {
    if (!confirmed) {
      setError('Please confirm the information accuracy by checking the box.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      await submitArbitratorApplication({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/[\s\-()+]/g, ''),
        country: country.trim(),
        linkedin: linkedin.trim(),
        title: title.trim() || 'Arbitrator',
        password,
        experience: Number(experience),
        expertise: expertise.trim(),
        organization: organization.trim(),
        prevExperience: prevExperience.trim(),
        files: {
          resume: files.resume?.name || '',
          cert: files.cert?.name || '',
          license: files.license?.name || '',
          extra: files.extra?.name || ''
        }
      });

      setSubmitted(true);
      showToast('Arbitrator application submitted successfully.', 'success');
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please check storage permissions.');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="card" style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={36} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>
          Application Submitted
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-ink)', fontWeight: '600', maxWidth: '440px', lineHeight: 1.5 }}>
          “Your application is under review and the admin team will respond soon”
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', maxWidth: '400px' }}>
          The platform operations team reviews credentials within 24-48 hours. Once approved, you can log in to your Arbitrator Desk.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <Button variant="primary" onClick={() => navigate('/')}>
            Return to Home
          </Button>
          <Button variant="outline" onClick={() => navigate('/login?role=arbitrator')}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  const stepsList = [
    { num: 1, title: 'Personal Info' },
    { num: 2, title: 'Professional Background' },
    { num: 3, title: 'Documents' },
    { num: 4, title: 'Review' }
  ];

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <Scale size={20} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-ink)', margin: 0 }}>
              Arbitrator Application Form
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
            Complete the steps below to apply as a verified arbitrator.
          </p>
        </div>
        {onBackToRoleSelect && (
          <Button variant="ghost" size="sm" onClick={onBackToRoleSelect}>
            Change Role
          </Button>
        )}
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', margin: '8px 0 16px' }}>
        {stepsList.map((s, idx) => {
          const isDone = step > s.num;
          const isActive = step === s.num;
          return (
            <React.Fragment key={s.num}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isDone ? '#22c55e' : isActive ? 'var(--color-primary)' : 'var(--color-page-bg)',
                    color: isDone || isActive ? '#FFF' : 'var(--color-muted)',
                    border: isDone || isActive ? 'none' : '2px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isDone ? <Check size={18} /> : s.num}
                </div>
                <span style={{ fontSize: '11px', fontWeight: isActive ? '700' : '500', color: isActive ? 'var(--color-primary)' : 'var(--color-muted)', marginTop: '6px', textAlign: 'center' }}>
                  {s.title}
                </span>
              </div>
              {idx < stepsList.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '3px',
                    backgroundColor: step > idx + 1 ? '#22c55e' : 'var(--color-border)',
                    margin: '0 8px',
                    marginBottom: '20px',
                    transition: 'all 0.2s ease'
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div role="alert" style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Stage 1: Personal Information */}
      {step === 1 && (
        <form onSubmit={handleNextStep1} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField
              label="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Kabir Malhotra"
              required
            />
            <TextField
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. kabir@gmail.com"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField
              label="Phone Number (10 digits) *"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              required
            />
            <TextField
              label="Country / Jurisdiction *"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. India"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField
              label="LinkedIn Profile"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
            <TextField
              label="Professional Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Independent Arbitrator"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField
              label="Create Password (Min 8 chars) *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
            <TextField
              label="Confirm Password *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button type="submit" variant="primary" icon={ArrowRight}>
              Next: Professional Background →
            </Button>
          </div>
        </form>
      )}

      {/* Stage 2: Professional Background */}
      {step === 2 && (
        <form onSubmit={handleNextStep2} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField
              label="Years of Experience *"
              type="number"
              min="0"
              max="70"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="0"
              required
            />
            <TextField
              label="Area of Expertise *"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="e.g. Consumer Contracts & Service Disputes"
              required
            />
          </div>

          <TextField
            label="Professional Organization *"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="e.g. Indian Institute of Arbitration & Mediation (IIAM)"
            required
          />

          <TextField
            label="Previous Arbitration Experience"
            value={prevExperience}
            onChange={(e) => setPrevExperience(e.target.value)}
            placeholder="Summary of panels served, mediation background, or relevant case experience..."
            multiline
            rows={4}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <Button type="button" variant="secondary" icon={ArrowLeft} onClick={() => { setError(''); setStep(1); }}>
              ← Back
            </Button>
            <Button type="submit" variant="primary" icon={ArrowRight}>
              Next: Documents →
            </Button>
          </div>
        </form>
      )}

      {/* Stage 3: Documents */}
      {step === 3 && (
        <form onSubmit={handleNextStep3} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Resume Upload */}
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-control)', padding: '20px', textAlign: 'center', backgroundColor: files.resume ? 'rgba(34, 197, 94, 0.06)' : 'var(--color-page-bg)' }}>
              <label style={{ fontWeight: '800', display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--color-ink)' }}>
                Resume Upload *
              </label>
              <p style={{ fontSize: '12px', color: files.resume ? '#16a34a' : 'var(--color-muted)', margin: '0 0 10px 0' }}>
                {files.resume ? `Selected: ${files.resume.name}` : 'No file selected'}
              </p>
              <input
                type="file"
                id="resumeInput"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload('resume', e)}
              />
              <Button type="button" variant="outline" size="sm" icon={Upload} onClick={() => document.getElementById('resumeInput').click()}>
                Select Resume File
              </Button>
            </div>

            {/* Arbitration Certification */}
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-control)', padding: '20px', textAlign: 'center', backgroundColor: files.cert ? 'rgba(34, 197, 94, 0.06)' : 'var(--color-page-bg)' }}>
              <label style={{ fontWeight: '800', display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--color-ink)' }}>
                Arbitration Certification
              </label>
              <p style={{ fontSize: '12px', color: files.cert ? '#16a34a' : 'var(--color-muted)', margin: '0 0 10px 0' }}>
                {files.cert ? `Selected: ${files.cert.name}` : 'No file selected (Optional)'}
              </p>
              <input
                type="file"
                id="certInput"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload('cert', e)}
              />
              <Button type="button" variant="outline" size="sm" icon={Upload} onClick={() => document.getElementById('certInput').click()}>
                Select Cert File
              </Button>
            </div>

            {/* Professional License */}
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-control)', padding: '20px', textAlign: 'center', backgroundColor: files.license ? 'rgba(34, 197, 94, 0.06)' : 'var(--color-page-bg)' }}>
              <label style={{ fontWeight: '800', display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--color-ink)' }}>
                Professional License *
              </label>
              <p style={{ fontSize: '12px', color: files.license ? '#16a34a' : 'var(--color-muted)', margin: '0 0 10px 0' }}>
                {files.license ? `Selected: ${files.license.name}` : 'No file selected'}
              </p>
              <input
                type="file"
                id="licenseInput"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload('license', e)}
              />
              <Button type="button" variant="outline" size="sm" icon={Upload} onClick={() => document.getElementById('licenseInput').click()}>
                Select License File
              </Button>
            </div>

            {/* Additional Documents */}
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-control)', padding: '20px', textAlign: 'center', backgroundColor: files.extra ? 'rgba(34, 197, 94, 0.06)' : 'var(--color-page-bg)' }}>
              <label style={{ fontWeight: '800', display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--color-ink)' }}>
                Additional Documents
              </label>
              <p style={{ fontSize: '12px', color: files.extra ? '#16a34a' : 'var(--color-muted)', margin: '0 0 10px 0' }}>
                {files.extra ? `Selected: ${files.extra.name}` : 'No file selected (Optional)'}
              </p>
              <input
                type="file"
                id="extraInput"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload('extra', e)}
              />
              <Button type="button" variant="outline" size="sm" icon={Upload} onClick={() => document.getElementById('extraInput').click()}>
                Select Additional File
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <Button type="button" variant="secondary" icon={ArrowLeft} onClick={() => { setError(''); setStep(2); }}>
              ← Back
            </Button>
            <Button type="submit" variant="primary" icon={ArrowRight}>
              Next: Review & Confirm →
            </Button>
          </div>
        </form>
      )}

      {/* Stage 4: Review */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Full Name</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '2px' }}>{name}</div>
            </div>
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Email Address</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '2px' }}>{email}</div>
            </div>
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Phone Number</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '2px' }}>{phone}</div>
            </div>

            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Country / Jurisdiction</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '2px' }}>{country}</div>
            </div>
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>LinkedIn</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '2px' }}>{linkedin || 'N/A'}</div>
            </div>
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Professional Title</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '2px' }}>{title || 'Arbitrator'}</div>
            </div>

            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Experience (Yrs)</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '2px' }}>{experience} years</div>
            </div>
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Expertise</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '2px' }}>{expertise}</div>
            </div>
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Organization</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '2px' }}>{organization}</div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Previous Arbitration Experience</div>
            <div style={{ fontSize: '13px', color: 'var(--color-ink)', marginTop: '4px' }}>
              {prevExperience || 'No previous experience provided.'}
            </div>
          </div>

          {/* Document Verification Checks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: files.resume ? '#22c55e' : '#ef4444', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
              <span><strong>Resume:</strong> {files.resume?.name || 'Not Found'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: files.license ? '#22c55e' : '#ef4444', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
              <span><strong>License:</strong> {files.license?.name || 'Not Found'}</span>
            </div>
            {files.cert && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#22c55e', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={14} />
                </div>
                <span><strong>Certificate:</strong> {files.cert.name}</span>
              </div>
            )}
            {files.extra && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#22c55e', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={14} />
                </div>
                <span><strong>Extra Docs:</strong> {files.extra.name}</span>
              </div>
            )}
          </div>

          {/* Confirmation Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            I confirm the information provided is accurate.
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <Button type="button" variant="secondary" icon={ArrowLeft} disabled={busy} onClick={() => { setError(''); setStep(3); }}>
              ← Back
            </Button>
            <Button type="button" variant="primary" disabled={busy} onClick={handleFinalSubmit} style={{ minWidth: '160px' }}>
              {busy ? 'Submitting Application...' : 'SUBMIT APPLICATION'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
